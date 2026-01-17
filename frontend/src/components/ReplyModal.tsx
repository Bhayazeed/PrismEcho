import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Send, X } from 'lucide-react';

interface ReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeId: string;
    onReply: (blob: Blob) => void;
}

export const ReplyModal = ({ isOpen, onClose, nodeId, onReply }: ReplyModalProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Fake visualizer bars
    const [visualizerData, setVisualizerData] = useState<number[]>(new Array(20).fill(10));

    useEffect(() => {
        if (isRecording) {
            const interval = setInterval(() => {
                setVisualizerData(prev => prev.map(() => Math.random() * 50 + 10));
            }, 100);
            return () => clearInterval(interval);
        } else {
            setVisualizerData(new Array(20).fill(10));
        }
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSend = () => {
        if (audioBlob) {
            onReply(audioBlob);
            onClose();
        }
        setAudioBlob(null);
    };

    // To properly fix this, I need to update the interface in a separate chunk or file update.
    // Let's abort this partial replace and do a full update effectively or smarter chunks.
    // Actually, I'll pass the blob to a new prop `onReply`.


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
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md p-8 rounded-3xl bg-glass-dark border border-white/10 shadow-2xl overflow-hidden"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-center mb-2 text-white">Record Your Reply</h2>
                        <p className="text-center text-white/50 text-sm mb-8">Replying to Node {nodeId}</p>

                        {/* Visualizer */}
                        <div className="flex justify-center items-end gap-1 h-32 mb-8">
                            {visualizerData.map((height, i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 bg-neon-blue rounded-full"
                                    animate={{ height }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                />
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center gap-4">
                            {!audioBlob ? (
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
