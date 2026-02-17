'use client';

import React from 'react';
import Script from 'next/script';
import App from './App';
import './pulse.css';

export default function PulsePage() {
    return (
        <div className="pulse-body pulse-scrollbar">
            {/* KaTeX CSS */}
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
                integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
                crossOrigin="anonymous"
            />

            {/* Babel for runtime JSX compilation of dynamic widgets */}
            <Script
                src="https://unpkg.com/@babel/standalone/babel.min.js"
                strategy="beforeInteractive"
            />

            <App />
        </div>
    );
}
