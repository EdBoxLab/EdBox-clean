'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Loader2, MessageCircle, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { GenieIcon } from './GenieIcon';

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
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            // Use FormData for multi-modal support
            const formData = new FormData();
            formData.append('userMessage', text);
            formData.append('skillTitle', skillTitle);
            if (currentContext) formData.append('context', currentContext);

            attachedFiles.forEach(file => {
                formData.append('files', file);
            });

            // Call Genie for response
            const response = await fetch('/api/genie/respond', {
                method: 'POST',
                body: formData, // Fetch handles boundary automatically for FormData
            });

            const data = await response.json();

            if (data.success) {
                setGenieResponse(data.response);
                speakResponse(data.response);
                setAttachedFiles([]); // Clear files after successful response
            }
        } catch (error) {
            console.error('Genie error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setAttachedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
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
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
            >
                <GenieIcon className="w-8 h-8" />
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-50 w-80 md:w-96"
        >
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-zinc-900 p-4 flex items-center justify-between border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <GenieIcon className="w-5 h-5" />
                        <div>
                            <h3 className="font-bold text-white">Genie AI</h3>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Neural Engine</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="text-zinc-500 hover:text-white"
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
                            {attachedFiles.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {attachedFiles.map((file, i) => (
                                        <div key={i} className="px-2 py-1 bg-gray-800 rounded text-[10px] text-gray-400 flex items-center gap-1">
                                            {file.type.startsWith('image/') ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                            <span className="truncate max-w-[80px]">{file.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {attachedFiles.length > 0 && !transcript && (
                        <div className="mb-4 p-2 flex flex-wrap gap-2 border-b border-gray-700 pb-4">
                            {attachedFiles.map((file, i) => (
                                <div key={i} className="relative group">
                                    <div className="px-2 py-1 bg-gray-800 rounded text-[10px] text-gray-400 flex items-center gap-1 border border-gray-700">
                                        {file.type.startsWith('image/') ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                        <span className="truncate max-w-[80px]">{file.name}</span>
                                        <button
                                            onClick={() => removeFile(i)}
                                            className="ml-1 hover:text-red-400"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
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
                <div className="p-4 border-t border-gray-700 flex flex-col gap-4">
                    <div className="flex items-center justify-center gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            multiple
                            accept=".pdf,.pptx,.jpg,.jpeg,.png,.webp,.txt"
                        />
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                            title="Attach files"
                        >
                            <Paperclip className="w-5 h-5 text-gray-300" />
                        </motion.button>

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
                            className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                            {isSpeaking ? (
                                <VolumeX className="w-5 h-5 text-white" />
                            ) : (
                                <Volume2 className="w-5 h-5 text-white" />
                            )}
                        </motion.button>
                    </div>
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
