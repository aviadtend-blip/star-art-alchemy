/**
 * Artwork Generation Client
 * Calls the generate-artwork Supabase edge function which uses Apiframe (Midjourney)
 * Supports reimagine feature by cycling through pre-generated variations
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
export async function generateImage(prompt) {
  console.log('Prompt preview:', prompt.substring(0, 100) + '...');

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-artwork`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ prompt }),
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

  // Cache all outputs for reimagine feature
  currentGenerationCache = {
    allOutputs: data.all_outputs || [data.output],
    currentIndex: 0,
    taskId: data.task_id || null,
    actions: data.actions || [],
  };

  console.log(`Generation complete: ${currentGenerationCache.allOutputs.length} variations cached`);

  return {
    imageUrl: data.output,
    hasMoreVariations: currentGenerationCache.allOutputs.length > 1,
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
