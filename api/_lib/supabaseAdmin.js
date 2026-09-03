import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
    process.env.VITE_SUPABASE_URL;

const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error(
        "VITE_SUPABASE_URL não configurada no servidor."
    );
}

if (!serviceRoleKey) {
    throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor."
    );
}

export const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    }
);
