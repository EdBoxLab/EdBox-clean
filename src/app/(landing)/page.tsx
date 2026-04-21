import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LandingCtaStrip } from '@/components/landing/LandingCtaStrip';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function LandingPage() {
    return (
        <main className="min-h-screen overflow-hidden bg-[#0A0A0A] text-white selection:bg-[#8B5CF6]/30">
            <LandingHeader />
            <HeroSection />
            <FeaturesGrid />
            <HowItWorks />
            <LandingCtaStrip />
            <LandingFooter />
        </main>
    );
}
