'use client';

import React, { useState } from 'react';
import { MessageCircle, Mail, X, Send } from 'lucide-react';
import { SUPPORT_CONTACTS } from '@/lib/utils/errorHandler';

interface ContactSupportProps {
  onClose?: () => void;
  error?: string;
}

export function ContactSupport({ onClose, error }: ContactSupportProps) {
  const [message, setMessage] = useState(error || '');
  const [selectedMethod, setSelectedMethod] = useState<'whatsapp' | 'email'>('whatsapp');

  const handleWhatsAppContact = (phoneNumber: string) => {
    const text = encodeURIComponent(
      `Hi EdBox Support! I need help with:\n\n${message}\n\nPlease assist me.`
    );
    window.open(`https://wa.me/${phoneNumber.replace(/\+/g, '')}?text=${text}`, '_blank');
  };

  const handleEmailContact = (email: string) => {
    const subject = encodeURIComponent('EdBox Support Request');
    const body = encodeURIComponent(
      `Hi EdBox Support Team,\n\nI need help with:\n\n${message}\n\nPlease assist me.\n\nThank you!`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Contact Support</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Describe your issue
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what happened..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Choose contact method
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedMethod('whatsapp')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-all ${
                selectedMethod === 'whatsapp'
                  ? 'bg-green-500 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </button>
            <button
              onClick={() => setSelectedMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-all ${
                selectedMethod === 'email'
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Mail className="w-5 h-5" />
              Email
            </button>
          </div>
        </div>

        {selectedMethod === 'whatsapp' && (
          <div className="space-y-2 mb-4">
            <p className="text-sm text-zinc-400 mb-3">Select a support number:</p>
            {SUPPORT_CONTACTS.whatsapp.map((phone, idx) => (
              <button
                key={idx}
                onClick={() => handleWhatsAppContact(phone)}
                disabled={!message.trim()}
                className="w-full flex items-center justify-between p-3 bg-zinc-800 hover:bg-green-500/20 border border-zinc-700 hover:border-green-500 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="text-zinc-300 group-hover:text-green-400">{phone}</span>
                <Send className="w-4 h-4 text-zinc-500 group-hover:text-green-400" />
              </button>
            ))}
          </div>
        )}

        {selectedMethod === 'email' && (
          <div className="space-y-2 mb-4">
            <p className="text-sm text-zinc-400 mb-3">Select a support email:</p>
            {SUPPORT_CONTACTS.emails.map((email, idx) => (
              <button
                key={idx}
                onClick={() => handleEmailContact(email)}
                disabled={!message.trim()}
                className="w-full flex items-center justify-between p-3 bg-zinc-800 hover:bg-blue-500/20 border border-zinc-700 hover:border-blue-500 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="text-zinc-300 group-hover:text-blue-400 text-sm">{email}</span>
                <Send className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-zinc-500 text-center">
          Our support team typically responds within 24 hours
        </p>
      </div>
    </div>
  );
}
