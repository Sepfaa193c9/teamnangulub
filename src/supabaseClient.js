import { createClient } from "@supabase/supabase-js";

// Replace these with your actual Supabase project URL and public API key
const SUPABASE_URL = "https://dclqqyqxotyjfgjolagy.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_SaZ2h7VMHVtTrsJv6l7uXQ_82ryK24S";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
