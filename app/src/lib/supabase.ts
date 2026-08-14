import { createClient } from "@supabase/supabase-js";

// Use fallback dummy values during Docker build time when env vars aren't injected
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️ Missing Supabase environment variables (Safe if this is build time)");
}

// We use the Service Role key to bypass Row Level Security since there are no users right now.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});
