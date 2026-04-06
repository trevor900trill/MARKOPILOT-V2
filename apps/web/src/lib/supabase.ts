import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase public credentials missing. Some features may not work.");
}

// Initializing the client with the public anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Utility to get an authenticated Supabase client using a JWT from NextAuth.
 * This is useful for RLS policies on the frontend.
 */
export const getAuthenticatedClient = (accessToken: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};
