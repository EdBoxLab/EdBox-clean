'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface GenieAssistantProps {
    skillTitle: string;
    currentContext?: string;
    onTranscript?: (text: string) => void;
}

export const GenieAssistant: React.FC<GenieAssistantProps> = ({
    skillTitle,
    currentContext,
    onTranscript
}) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [genieResponse, setGenieResponse] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        // Initialize speech recognition
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);

                if (event.results[current].isFinal) {
                    handleUserSpeech(transcriptText);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (synthRef.current) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
            setTranscript('');
        }
    };

    const handleUserSpeech = async (text: string) => {
        setIsProcessing(true);
        onTranscript?.(text);

        try {
            // Call Gemini for response
            const response = await fetch('/api/genie/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userMessage: text,
                    skillTitle,
                    context: currentContext,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setGenieResponse(data.response);
                speakResponse(data.response);
            }
        } catch (error) {
            console.error('Genie error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const speakResponse = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);

            synthRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleSpeaking = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else if (genieResponse) {
            speakResponse(genieResponse);
        }
    };

    if (isMinimized) {
        return (
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
            >
                <Sparkles className="w-8 h-8 text-white" />
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-50 w-80 md:w-96"
        >
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                            <Sparkles className="w-5 h-5 text-white" />
                        </motion.div>
                        <div>
                            <h3 className="font-bold text-white">Genie AI</h3>
                            <p className="text-xs text-white/80">Your learning companion</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="text-white/80 hover:text-white"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-64 overflow-y-auto">
                    {genieResponse && (
                        <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <div className="flex items-start gap-2">
                                <MessageCircle className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
                                <p className="text-sm text-gray-200">{genieResponse}</p>
                            </div>
                        </div>
                    )}

                    {transcript && (
                        <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <p className="text-sm text-gray-300">You: {transcript}</p>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="flex items-center gap-2 text-gray-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Genie is thinking...</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-4 border-t border-gray-700 flex items-center justify-center gap-4">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleListening}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isListening
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-purple-600 hover:bg-purple-500'
                            }`}
                    >
                        {isListening ? (
                            <MicOff className="w-6 h-6 text-white" />
                        ) : (
                            <Mic className="w-6 h-6 text-white" />
                        )}
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleSpeaking}
                        disabled={!genieResponse}
                        className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                        {isSpeaking ? (
                            <VolumeX className="w-6 h-6 text-white" />
                        ) : (
                            <Volume2 className="w-6 h-6 text-white" />
                        )}
                    </motion.button>
                </div>

                {/* Status */}
                <div className="px-4 pb-3 text-center">
                    <p className="text-xs text-gray-500">
                        {isListening ? '🎤 Listening...' : 'Click mic to ask Genie anything'}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
