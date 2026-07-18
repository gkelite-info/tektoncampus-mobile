import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

/**
 * Admin Supabase client that uses the service role key.
 * This bypasses RLS and should ONLY be used for operations
 * that require elevated privileges (e.g., storage uploads
 * to buckets with restrictive RLS policies).
 */
export const supabaseAdmin = createClient(
    supabaseUrl || "",
    serviceRoleKey || "",
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
