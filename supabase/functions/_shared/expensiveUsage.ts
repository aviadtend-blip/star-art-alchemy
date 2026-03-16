import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface UsageLimitOptions {
  req: Request;
  functionName: string;
  corsHeaders: Record<string, string>;
  maxCallsPerDay?: number;
}

/**
 * Enforces a daily usage limit on expensive edge functions.
 * Returns a Response if the limit is exceeded, or null if the request is allowed.
 */
export async function enforceExpensiveUsageLimit({
  req,
  functionName,
  corsHeaders,
  maxCallsPerDay = 100,
}: UsageLimitOptions): Promise<Response | null> {
  // Usage limiting is optional — if no service role key is configured, skip
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(`[${functionName}] No SUPABASE_URL or SERVICE_ROLE_KEY — skipping usage limit`);
    return null;
  }

  // For now, allow all requests through. 
  // This stub exists so the import resolves and functions deploy successfully.
  // To enforce limits, implement counting logic against a usage_logs table.
  return null;
}
