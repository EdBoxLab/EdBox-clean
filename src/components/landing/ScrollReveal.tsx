'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type ScrollRevealProps = {
    children: ReactNode;
    className?: string;
    delayMs?: number;
};

export const ScrollReveal = ({ children, className = '', delayMs = 0 }: ScrollRevealProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={elementRef}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0px)' : 'translateY(18px)',
                transition: `opacity 650ms ease-out ${delayMs}ms, transform 650ms ease-out ${delayMs}ms`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </div>
    );
};
