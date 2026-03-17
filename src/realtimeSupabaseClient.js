import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Missing Supabase environment variables for Realtime client.");
}

export const realtimeSupabase = createClient(SUPABASE_URL, ANON_KEY);

export default realtimeSupabase;

