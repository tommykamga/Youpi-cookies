import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Polyfill for Node 22/25 experimental localStorage
if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    if (typeof globalThis.localStorage.getItem !== 'function') {
        (globalThis.localStorage as any).getItem = () => null;
        (globalThis.localStorage as any).setItem = () => { };
        (globalThis.localStorage as any).removeItem = () => { };
    }
}

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                storage: {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                }
            },
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
