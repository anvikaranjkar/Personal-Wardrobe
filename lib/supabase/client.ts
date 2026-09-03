import { createBrowserClient } from "@supabase/ssr";

// Supabase publishable keys are designed to be used in browser applications.
// Environment variables still take precedence, making project rotation simple.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lqfkkjdwrzucvqxhfkar.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_lUS36BDVXAHjJ-p9bsEraA_sGo-3jJ_";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export function createClient() {
  if (!isSupabaseConfigured) return null;

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
