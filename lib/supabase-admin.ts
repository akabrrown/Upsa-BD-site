import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Provide a safe export for build-time static analysis
// We only initialize the real client if the keys are present.
// If they are missing during an actual call, we want a runtime error, not a build error.
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : new Proxy({} as any, {
        get() {
            throw new Error('Supabase Admin Client tried to be used but environment variables are missing. Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment.')
        }
    })
