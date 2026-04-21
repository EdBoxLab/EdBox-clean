import Link from 'next/link';

export const LandingCtaStrip = () => {
    return (
        <section className="px-6 pb-20 md:pb-24">
            <div className="mx-auto w-full max-w-6xl rounded-2xl border border-[#8B5CF6]/35 bg-[#8B5CF6]/10 p-7 md:p-10">
                <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                    <h2 className="max-w-2xl text-3xl tracking-[-1.7px] text-white font-black md:text-4xl">
                        Replace scattered tools with one smart system built to raise your grades.
                    </h2>
                    <Link
                        href="/signup"
                        className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                    >
                        Start free
                    </Link>
                </div>
            </div>
        </section>
    );
};
