const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const functionsBaseUrl = projectId
  ? `https://${projectId}.supabase.co/functions/v1`
  : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export async function invokeProjectFunction(functionName, body) {
  const response = await fetch(`${functionsBaseUrl}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(publishableKey ? { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload?.error || payload?.message || `Edge function ${functionName} failed`;

    throw new Error(message);
  }

  return payload;
}
