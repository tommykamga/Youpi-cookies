import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Polyfill for Node 22/25 experimental localStorage
if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    if (typeof globalThis.localStorage.getItem !== 'function') {
        (globalThis.localStorage as any).getItem = () => null;
        (globalThis.localStorage as any).setItem = () => { };
        (globalThis.localStorage as any).removeItem = () => { };
    }
}

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
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
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // If no user and trying to access a protected route
    if (!user && !request.nextUrl.pathname.startsWith("/login") && !request.nextUrl.pathname.startsWith("/auth")) {
        if (request.nextUrl.pathname.startsWith("/api")) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // If user exists, check if their account is active
    if (user && !request.nextUrl.pathname.startsWith("/login") && !request.nextUrl.pathname.startsWith("/auth")) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('active')
            .eq('id', user.id)
            .single();

        if (profile?.active === false) {
            // Clear auth cookies to force sign out
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            url.searchParams.set("deactivated", "1");

            const redirectResponse = NextResponse.redirect(url);

            // Delete all Supabase auth cookies
            request.cookies.getAll().forEach(cookie => {
                if (cookie.name.startsWith('sb-')) {
                    redirectResponse.cookies.delete(cookie.name);
                }
            });

            return redirectResponse;
        }
    }

    // If user is logged in and trying to access login page
    if (user && request.nextUrl.pathname.startsWith("/login")) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
