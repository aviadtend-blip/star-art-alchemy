/**
 * Artwork Generation Client
 * Calls the generate-artwork Supabase edge function which uses Apiframe (Midjourney)
 * Supports reimagine feature by cycling through pre-generated variations
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Fetch with retry for 5xx errors (exponential backoff)
 */
async function fetchWithRetry(url, options, maxRetries = 1) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = 3000 * attempt;
      console.warn(`[replicateClient] Retry attempt ${attempt} after ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) return response;
      if (attempt < maxRetries) {
        console.warn(`[replicateClient] Server error ${response.status}, retrying...`);
        continue;
      }
      return response; // return the error response on final attempt
    } catch (err) {
      lastError = err;
      if (attempt >= maxRetries) throw err;
    }
  }
  throw lastError;
}

// Store generation results for reimagine feature
let currentGenerationCache = {
  allOutputs: [],
  currentIndex: 0,
  taskId: null,
  actions: [],
};

/**
 * Generate artwork via the Supabase edge function
 * Returns the primary image URL and caches all 4 variations
 */
export async function generateImage(prompt, sref, personalization, profileCode, userPhotoUrl = null, styleId = null) {
  console.log('Prompt preview:', prompt.substring(0, 100) + '...');
  console.log('Style ref:', sref);
  console.log('Portrait mode:', !!userPhotoUrl);

  // Step 1: Always use generate-artwork for Midjourney generation
  const response = await fetchWithRetry(
    `${SUPABASE_URL}/functions/v1/generate-artwork`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ prompt, sref, personalization, profileCode }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Generation failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data.output) {
    throw new Error('No image URL returned from generation');
  }

  let finalImageUrl = data.output;

  // Step 2: If portrait mode, run face swap — single attempt, no retries
  if (userPhotoUrl) {
    console.log('Starting face swap step (single attempt, up to 180s)...');
    try {
      const swapResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/face-swap`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            target_image_url: data.output,
            face_image_url: userPhotoUrl,
          }),
        }
      );

      if (!swapResponse.ok) {
        const swapError = await swapResponse.json().catch(() => ({}));
        throw new Error(swapError.error || `Face swap failed with status ${swapResponse.status}`);
      }

      const swapData = await swapResponse.json();
      if (!swapData.output) {
        throw new Error('No image URL returned from face swap');
      }
      finalImageUrl = swapData.output;
      console.log('Face swap complete:', finalImageUrl);
    } catch (swapErr) {
      console.error('Face swap failed (no retry):', swapErr.message);
      throw new Error(`Face swap failed: ${swapErr.message}. Please try again.`);
    }
  }

  // Cache all outputs for reimagine feature
  // For portrait mode, only the swapped image is usable (no grid variations)
  currentGenerationCache = {
    allOutputs: userPhotoUrl ? [finalImageUrl] : (data.all_outputs || [data.output]),
    currentIndex: 0,
    taskId: data.task_id || null,
    actions: data.actions || [],
  };

  console.log(`Generation complete: ${currentGenerationCache.allOutputs.length} variations cached`);

  return {
    imageUrl: finalImageUrl,
    hasMoreVariations: currentGenerationCache.allOutputs.length > 1,
    taskId: data.task_id || null,
  };
}

/**
 * Get next variation for reimagine feature
 * Cycles through the 4 pre-generated images before needing a new API call
 * Returns null if all variations exhausted (caller should trigger new generation)
 */
export function getNextVariation() {
  const { allOutputs, currentIndex } = currentGenerationCache;

  // Move to next image
  const nextIndex = currentIndex + 1;

  if (nextIndex >= allOutputs.length) {
    // All 4 variations exhausted
    console.log('All cached variations used, new generation needed');
    return null;
  }

  currentGenerationCache.currentIndex = nextIndex;
  const nextUrl = allOutputs[nextIndex];

  console.log(`Reimagine: showing variation ${nextIndex + 1}/${allOutputs.length}`);

  return {
    imageUrl: nextUrl,
    hasMoreVariations: nextIndex < allOutputs.length - 1,
    variationNumber: nextIndex + 1,
    totalVariations: allOutputs.length,
  };
}

/**
 * Get all cached image URLs (for preloading mockups)
 */
export function getAllCachedOutputs() {
  return currentGenerationCache.allOutputs;
}

/**
 * Get the current task ID (for potential upscaling)
 */
export function getCurrentTaskId() {
  return currentGenerationCache.taskId;
}

/**
 * Reset the generation cache (e.g., when starting a new chart)
 */
export function resetGenerationCache() {
  currentGenerationCache = {
    allOutputs: [],
    currentIndex: 0,
    taskId: null,
    actions: [],
  };
}
