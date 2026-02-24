import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const authError = searchParams.get('error');
    const authErrorDescription = searchParams.get('error_description');

    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard';

    // Handle standard OAuth errors immediately
    if (authError) {
        console.error('Supabase Auth Callback OAuth Error:', authError, authErrorDescription);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(authError)}&details=${encodeURIComponent(authErrorDescription || '')}`);
    }

    if (code) {
        const supabase = await createSupabaseServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development';

            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        } else {
            console.error('Supabase Auth Callback exchangeCodeForSession Error:', error);
            // Append the error to the redirect so it shows up on the client
            return NextResponse.redirect(`${origin}/login?error=auth_code_error&details=${encodeURIComponent(error.message)}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}
