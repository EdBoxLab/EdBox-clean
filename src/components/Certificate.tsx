'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Share2, CheckCircle } from 'lucide-react';

interface CertificateProps {
  certificate: {
    id: string;
    userName: string;
    courseName: string;
    masteredSkills: number;
    totalSkills: number;
    overallMastery: number;
    issuedAt: string;
    verificationUrl: string;
  };
}

export const Certificate: React.FC<CertificateProps> = ({ certificate }) => {
  const handleDownload = () => {
    // In production, generate PDF
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${certificate.userName}'s Certificate`,
        text: `I earned a certificate for ${certificate.courseName}!`,
        url: certificate.verificationUrl,
      });
    } else {
      navigator.clipboard.writeText(certificate.verificationUrl);
      alert('Verification link copied to clipboard!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      {/* Certificate Card */}
      <div className="relative bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden print:shadow-none">
        {/* Decorative Border */}
        <div className="absolute inset-0 border-8 border-double border-amber-600 rounded-2xl pointer-events-none" />
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Content */}
        <div className="relative p-12 md:p-16">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-amber-100 rounded-full mb-4">
              <Award className="w-16 h-16 text-amber-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-2">
              Certificate of Competency
            </h1>
            <p className="text-gray-600">EdBox Learning Platform</p>
          </div>

          {/* Recipient */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 mb-2">This certifies that</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              {certificate.userName}
            </h2>
            <p className="text-lg text-gray-600 mb-2">has successfully demonstrated mastery in</p>
            <h3 className="text-2xl md:text-3xl font-bold text-amber-600">
              {certificate.courseName}
            </h3>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{certificate.masteredSkills}/{certificate.totalSkills}</div>
              <div className="text-sm text-gray-600">Skills Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{Math.round(certificate.overallMastery * 100)}%</div>
              <div className="text-sm text-gray-600">Overall Mastery</div>
            </div>
          </div>

          {/* Verification */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Verified Certificate</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">Issued on {new Date(certificate.issuedAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p className="font-mono text-xs text-gray-400">ID: {certificate.id}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 mt-8 print:hidden">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
        >
          <Download className="w-5 h-5" />
          Download PDF
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
        >
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>
    </motion.div>
  );
};
