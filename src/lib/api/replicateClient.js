// Image Generation Client
// Routes all API calls through the secure edge function (Apiframe/Midjourney)

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-artwork`;

/**
 * Generates an image using the Apiframe API via the secure edge function.
 * The edge function handles polling internally and returns the final image.
 * @param {string} prompt - The AI art generation prompt
 * @param {object} options - Optional generation settings (currently unused, kept for API compat)
 * @returns {Promise<string>} The generated image URL
 */
export async function generateImage(prompt, options = {}) {
  if (import.meta.env.DEV) {
    console.log('🎨 Starting image generation...');
    console.log('Prompt length:', prompt.length);
    console.log('Prompt preview:', prompt.substring(0, 100) + '...');
  }

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ Generation API error:', errorData);
    throw new Error(errorData.error || `Generation failed with status ${response.status}`);
  }

  const result = await response.json();

  if (result.output) {
    if (import.meta.env.DEV) {
      console.log('✅ Image generated successfully!');
      console.log('Image URL:', result.output);
      if (result.all_outputs) {
        console.log(`Total variations: ${result.all_outputs.length}`);
      }
    }
    return result.output;
  }

  throw new Error(result.error || 'Unexpected response from generation API');
}

/**
 * Tests the API connection via the edge function.
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function testConnection() {
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ prompt: 'test' }),
    });

    if (response.ok) {
      return { success: true, message: 'API connection successful' };
    } else {
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err.error || `API returned ${response.status}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}
