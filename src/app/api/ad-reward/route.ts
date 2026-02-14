import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}

/**
 * Grant ad credits after user watches ads
 * Client should call this after successful ad completion
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
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

