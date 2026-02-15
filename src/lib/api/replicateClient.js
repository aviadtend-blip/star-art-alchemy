// Replicate Image Generation Client
// Routes all API calls through the secure edge function (token never reaches the browser)

import { API_CONFIG } from '@/config/api';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-artwork`;

/**
 * Generates an image using the Replicate API via the secure edge function.
 * @param {string} prompt - The AI art generation prompt
 * @param {object} options - Optional generation settings
 * @param {number} options.width - Image width (default: 768)
 * @param {number} options.height - Image height (default: 1024)
 * @returns {Promise<string>} The generated image URL
 */
export async function generateImage(prompt, options = {}) {
  const width = options.width || 768;
  const height = options.height || 1024;

  console.log('🎨 Starting image generation...');
  console.log('Model:', API_CONFIG.loraModel);
  console.log('Trigger word:', API_CONFIG.triggerWord);
  console.log('Prompt length:', prompt.length);

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ prompt, width, height }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ Generation API error:', errorData);
    throw new Error(errorData.error || `Generation failed with status ${response.status}`);
  }

  const result = await response.json();
  console.log('📋 Generation result status:', result.status);

  if (result.status === 'succeeded' && result.imageUrl) {
    console.log('✅ Image generated successfully!');
    console.log('Image URL:', result.imageUrl);
    return result.imageUrl;
  }

  // If the edge function returned a predictionId (not yet complete), poll for it
  if (result.predictionId) {
    console.log('⏳ Prediction in progress, polling...', result.predictionId);
    return pollPrediction(result.predictionId);
  }

  throw new Error('Unexpected response from generation API');
}

/**
 * Polls the edge function for prediction completion.
 * @param {string} predictionId
 * @returns {Promise<string>} The generated image URL
 */
async function pollPrediction(predictionId) {
  const maxAttempts = 90; // 3 minutes max (2 second intervals)
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ predictionId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch prediction status: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`⏳ Prediction status: ${result.status} (attempt ${attempts + 1}/${maxAttempts})`);

    if (result.status === 'succeeded' && result.imageUrl) {
      console.log('✅ Image generated successfully!');
      console.log('Image URL:', result.imageUrl);
      return result.imageUrl;
    }

    if (result.status === 'failed') {
      console.error('❌ Prediction failed:', result.error);
      throw new Error(`Image generation failed: ${result.error || 'Unknown error'}`);
    }

    if (result.status === 'canceled') {
      throw new Error('Image generation was canceled');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error('Image generation timeout - took longer than 3 minutes');
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
      body: JSON.stringify({ prompt: 'test', width: 64, height: 64 }),
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
