import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { SocialProof } from '@/components/landing/SocialProof';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function LandingPage() {
    return (
        <main className="bg-[#0A0A0A] min-h-screen text-white overflow-hidden selection:bg-[#8B5CF6]/30">
            <LandingHeader />
            <HeroSection />
            <ProductShowcase />
            <SocialProof />
            <LandingFooter />
        </main>
    );
}
