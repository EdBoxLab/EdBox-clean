'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Certificate } from '@/components/Certificate';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CertificatePage() {
    const params = useParams();
    const certificateId = params.id as string;

    const [certificate, setCertificate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCertificate();
    }, [certificateId]);

    const fetchCertificate = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/certificate/${certificateId}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Certificate not found');

            setCertificate(data.certificate);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Loader2 className="w-12 h-12 text-indigo-500" />
                </motion.div>
            </div>
        );
    }

    if (error || !certificate) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Certificate Not Found</h1>
                    <p className="text-gray-400">{error || 'This certificate does not exist or has been revoked'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-4 sm:p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                <Certificate certificate={certificate} />
            </div>
        </div>
    );
}
