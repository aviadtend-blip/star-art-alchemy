/**
 * Artwork Generation Client
 * Calls the generate-artwork Supabase edge function which uses Apiframe (Midjourney)
 * Uses submit + poll pattern for real-time progress tracking
 */

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FUNCTIONS_URL = projectId
  ? `https://${projectId}.supabase.co/functions/v1`
  : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const GENERATION_CACHE_KEY = 'celestial_generation_cache';

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
      return response;
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

function persistGenerationCache() {
  try {
    sessionStorage.setItem(GENERATION_CACHE_KEY, JSON.stringify(currentGenerationCache));
  } catch {
    // Ignore storage failures in the browser session cache.
  }
}

function hydrateGenerationCache() {
  if (currentGenerationCache.allOutputs.length > 0 || typeof sessionStorage === 'undefined') {
    return;
  }

  try {
    const raw = sessionStorage.getItem(GENERATION_CACHE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.allOutputs)) return;

    currentGenerationCache = {
      allOutputs: parsed.allOutputs.filter((value) => typeof value === 'string' && value.trim()),
      currentIndex: Number.isInteger(parsed?.currentIndex) ? parsed.currentIndex : 0,
      taskId: typeof parsed?.taskId === 'string' ? parsed.taskId : null,
      actions: Array.isArray(parsed?.actions) ? parsed.actions : [],
    };
  } catch {
    // Ignore cache hydration failures and use the in-memory cache only.
  }
}

/**
 * Poll the generate-artwork edge function for task status
 * Calls onProgress with { pollCount, status, percentage } on each poll
 */
async function pollForCompletion(taskId, onProgress, maxPollSeconds = 180) {
  const pollInterval = 3000; // 3 seconds
  const maxPolls = Math.floor(maxPollSeconds / (pollInterval / 1000));
  let pollCount = 0;

  while (pollCount < maxPolls) {
    await new Promise((r) => setTimeout(r, pollInterval));
    pollCount++;

    const response = await fetch(`${FUNCTIONS_URL}/generate-artwork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Poll failed with status ${response.status}`);
    }

    const data = await response.json();

    // Report progress to caller
    onProgress?.({
      pollCount,
      status: data.status,
      percentage: data.percentage,
    });

    if (data.status === 'finished') {
      return data;
    }

    if (data.status === 'failed') {
      throw new Error(data.error || 'Image generation failed');
    }
  }

  throw new Error('Image generation timed out');
}

/**
 * Generate artwork via the Supabase edge function
 * Uses submit + poll for real-time progress tracking
 * onProgress callback receives { stage, pollCount, status, percentage }
 */
export async function generateImage(prompt, sref, personalization, profileCode, userPhotoUrl = null, styleId = null, onProgress = null) {
  console.log('Prompt preview:', prompt.substring(0, 100) + '...');
  console.log('Style ref:', sref);
  console.log('Portrait mode:', !!userPhotoUrl);

  // Step 1: Submit the generation task
  onProgress?.({ stage: 'submitting' });

  const response = await fetchWithRetry(
    `${FUNCTIONS_URL}/generate-artwork`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, sref, personalization, profileCode, face_image_url: userPhotoUrl }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Generation failed with status ${response.status}`);
  }

  const submitData = await response.json();

  if (!submitData.task_id) {
    throw new Error('No task_id returned from generation');
  }

  console.log(`Task submitted: ${submitData.task_id}`);
  onProgress?.({ stage: 'generating', pollCount: 0 });

  // Step 2: Poll for completion with progress callbacks
  const result = await pollForCompletion(submitData.task_id, (progressData) => {
    onProgress?.({ stage: 'generating', ...progressData });
  });

  if (!result.output) {
    throw new Error('No image URL returned from generation');
  }

  let finalImageUrl = result.output;

  // Cache all outputs for reimagine feature
  currentGenerationCache = {
    allOutputs: userPhotoUrl ? [finalImageUrl] : (result.all_outputs || [result.output]),
    currentIndex: 0,
    taskId: result.task_id || submitData.task_id,
    actions: result.actions || [],
  };
  persistGenerationCache();

  console.log(`Generation complete: ${currentGenerationCache.allOutputs.length} variations cached`);

  return {
    imageUrl: finalImageUrl,
    hasMoreVariations: currentGenerationCache.allOutputs.length > 1,
    taskId: result.task_id || submitData.task_id,
  };
}

/**
 * Get next variation for reimagine feature
 */
export function getNextVariation() {
  hydrateGenerationCache();

  const { allOutputs, currentIndex } = currentGenerationCache;
  const nextIndex = currentIndex + 1;

  if (nextIndex >= allOutputs.length) {
    console.log('All cached variations used, new generation needed');
    return null;
  }

  currentGenerationCache.currentIndex = nextIndex;
  persistGenerationCache();
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
  hydrateGenerationCache();
  return currentGenerationCache.allOutputs;
}

export function getAlternateVariation(currentImageUrl = null) {
  hydrateGenerationCache();

  const outputs = currentGenerationCache.allOutputs.filter(
    (value) => typeof value === 'string' && value.trim(),
  );

  if (outputs.length < 2) {
    return null;
  }

  const normalizedCurrent = typeof currentImageUrl === 'string' ? currentImageUrl.trim() : '';
  const currentIndex = outputs.findIndex((value) => value === normalizedCurrent);
  const alternateIndex = currentIndex >= 0 ? (currentIndex === 0 ? 1 : 0) : 1;
  const alternateUrl = outputs[alternateIndex] || outputs.find((value) => value !== normalizedCurrent);

  if (!alternateUrl) {
    return null;
  }

  return {
    imageUrl: alternateUrl,
    variationNumber: alternateIndex + 1,
    totalVariations: outputs.length,
  };
}

/**
 * Get the current task ID (for potential upscaling)
 */
export function getCurrentTaskId() {
  hydrateGenerationCache();
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
  persistGenerationCache();
}
