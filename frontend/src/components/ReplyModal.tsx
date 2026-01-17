import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Send, X, Loader2 } from 'lucide-react';

interface ReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeId: string;
    onReply: (audioUrl: string, summary: string) => void;
}

export const ReplyModal = ({ isOpen, onClose, nodeId, onReply }: ReplyModalProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Visualizer animation
    const [visualizerData, setVisualizerData] = useState<number[]>(new Array(20).fill(10));

    useEffect(() => {
        if (isRecording) {
            const interval = setInterval(() => {
                setVisualizerData(prev => prev.map(() => Math.random() * 50 + 10));
            }, 100);
            return () => clearInterval(interval);
        } else if (isProcessing) {
            // Pulsing animation while processing
            const interval = setInterval(() => {
                setVisualizerData(prev => prev.map((_, i) => 20 + Math.sin(Date.now() / 200 + i) * 15));
            }, 50);
            return () => clearInterval(interval);
        } else {
            setVisualizerData(new Array(20).fill(10));
        }
    }, [isRecording, isProcessing]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setAudioBlob(null);
            setError(null);
            setIsProcessing(false);
        }
    }, [isOpen]);

    // Keyboard hotkeys
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // R: Toggle recording (only when not processing and no blob yet)
            if (e.code === 'KeyR' && !isProcessing) {
                e.preventDefault();
                if (!audioBlob) {
                    if (isRecording) {
                        stopRecording();
                    } else {
                        startRecording();
                    }
                }
            }

            // Enter: Send when recording is done
            if (e.code === 'Enter' && audioBlob && !isProcessing) {
                e.preventDefault();
                handleSend();
            }

            // Escape: Close modal (if not processing)
            if (e.code === 'Escape' && !isProcessing) {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isRecording, audioBlob, isProcessing]);

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSend = async () => {
        if (!audioBlob) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Upload audio to backend for AI processing
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');

            const response = await fetch('http://localhost:8000/api/audio/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Create local URL for playback
                const audioUrl = URL.createObjectURL(audioBlob);
                // Use AI summary if available, otherwise use transcript or default
                const summary = data.summary || data.transcript || "Voice Reply";

                onReply(audioUrl, summary);
                onClose();
            } else {
                setError(data.error || "Failed to process audio");
                // Fallback: still allow sending without AI summary
                const audioUrl = URL.createObjectURL(audioBlob);
                onReply(audioUrl, "Voice Reply (processing failed)");
                onClose();
            }
        } catch (err) {
            console.error("Error uploading audio:", err);
            // Fallback: send without AI summary
            const audioUrl = URL.createObjectURL(audioBlob);
            onReply(audioUrl, "Voice Reply");
            onClose();
        } finally {
            setIsProcessing(false);
            setAudioBlob(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={!isProcessing ? onClose : undefined}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden"
                    >
                        {!isProcessing && (
                            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
                                <X size={24} />
                            </button>
                        )}

                        <h2 className="text-2xl font-bold text-center mb-2 text-white">
                            {isProcessing ? "Processing with AI..." : "Record Your Reply"}
                        </h2>
                        <p className="text-center text-white/50 text-sm mb-8">
                            {isProcessing ? "Transcribing and summarizing your voice" : `Replying to Node ${nodeId}`}
                        </p>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Visualizer */}
                        <div className="flex justify-center items-end gap-1 h-32 mb-8">
                            {visualizerData.map((height, i) => (
                                <motion.div
                                    key={i}
                                    className={`w-2 rounded-full ${isProcessing ? 'bg-purple-500' : 'bg-neon-blue'}`}
                                    animate={{ height }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                />
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center gap-4">
                            {isProcessing ? (
                                <div className="flex items-center gap-3 text-white/70">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span>AI is analyzing your voice...</span>
                                </div>
                            ) : !audioBlob ? (
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording
                                        ? 'bg-red-500 shadow-[0_0_30px_rgba(255,0,0,0.5)]'
                                        : 'bg-white text-black hover:bg-neon-blue hover:text-white'
                                        }`}
                                >
                                    {isRecording ? <Square fill="currentColor" size={24} /> : <Mic size={32} />}
                                </button>
                            ) : (
                                <div className="flex gap-4 w-full">
                                    <button
                                        onClick={() => setAudioBlob(null)}
                                        className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                                    >
                                        Rerecord
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        className="flex-1 py-3 rounded-xl bg-neon-blue hover:bg-neon-blue/80 text-black font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                                    >
                                        Send <Send size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Hotkey hints */}
                        <div className="flex justify-center gap-4 mt-4 text-[10px] text-white/40 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">R</kbd> Record
                            </span>
                            {audioBlob && (
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">Enter</kbd> Send
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">Esc</kbd> Close
                            </span>
                        </div>

                        {/* AI Info */}
                        <p className="text-center text-white/30 text-xs mt-4">
                            Powered by Gemini AI
                        </p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
