import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { grantAdCredit } from '@/lib/rate-limit';

/**
 * Grant ad credits after user watches ads
 * Client should call this after successful ad completion
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { adsWatched } = await req.json();
        const creditsToGrant = adsWatched || 1;

        // Grant credits (typically 2 ads = 2 credits = 1 bypass)
        await grantAdCredit(user.id, creditsToGrant);

        return NextResponse.json({
            success: true,
            creditsGranted: creditsToGrant,
            message: `You earned ${creditsToGrant} ad credit${creditsToGrant > 1 ? 's' : ''}!`
        });
    } catch (error) {
        console.error("[AD_REWARD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
