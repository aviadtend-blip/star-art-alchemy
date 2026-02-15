// Client for calling the generate-artwork edge function
// The Replicate API token is stored securely server-side

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-artwork`;

/**
 * Calls the generate-artwork edge function with the given prompt.
 * @param {string} prompt - The AI art generation prompt
 * @param {{ width?: number, height?: number }} options - Image dimensions
 * @returns {Promise<{ imageUrl?: string, predictionId?: string, status: string }>}
 */
export async function generateArtwork(prompt, { width = 768, height = 1024 } = {}) {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ prompt, width, height }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Generation failed with status ${response.status}`);
  }

  return response.json();
}
