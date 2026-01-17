import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertTriangle, Loader2, Mic, Square } from 'lucide-react';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRoomCreated: (room: { id: string; title: string; topic: string; opening_question: string; audioUrl?: string }) => void;
}

export const CreateRoomModal = ({ isOpen, onClose, onRoomCreated }: CreateRoomModalProps) => {
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [visualizerData, setVisualizerData] = useState<number[]>(new Array(15).fill(10));

    // Visualizer animation
    useEffect(() => {
        if (isRecording) {
            const interval = setInterval(() => {
                setVisualizerData(prev => prev.map(() => Math.random() * 40 + 10));
            }, 100);
            return () => clearInterval(interval);
        } else {
            setVisualizerData(new Array(15).fill(10));
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
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            setError("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSubmit = async () => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/rooms/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, topic })
            });

            const data = await response.json();

            if (data.success) {
                // Create blob URL if we have a recording
                const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : undefined;

                onRoomCreated({
                    id: data.room_id,
                    title,
                    topic,
                    opening_question: data.opening_question,
                    audioUrl
                });
                // Reset form
                setTitle('');
                setTopic('');
                setAudioBlob(null);
                onClose();
            } else {
                setError(data.error || 'Failed to create room');
            }
        } catch (err) {
            setError('Could not connect to server. Please try again.');
        } finally {
            setIsLoading(false);
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
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
                            <X size={24} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                                <Plus size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Create Debate Room</h2>
                                <p className="text-white/50 text-sm">Start a new conversation topic</p>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                            >
                                <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
                                <p className="text-red-300 text-sm">{error}</p>
                            </motion.div>
                        )}

                        {/* Form */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-white/70 text-sm font-medium mb-2">
                                    Room Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Climate Action Debate"
                                    maxLength={50}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors"
                                />
                                <p className="text-white/30 text-xs mt-1">{title.length}/50 characters</p>
                            </div>

                            <div>
                                <label className="block text-white/70 text-sm font-medium mb-2">
                                    Opening Topic
                                </label>
                                <textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., Should governments mandate carbon taxes?"
                                    maxLength={200}
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-colors resize-none"
                                />
                                <p className="text-white/30 text-xs mt-1">{topic.length}/200 characters</p>
                            </div>

                            {/* Recording Section */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <label className="block text-white/70 text-sm font-medium mb-3">
                                    Opening Statement (Voice Recording)
                                </label>

                                {/* Visualizer */}
                                <div className="flex justify-center items-end gap-1 h-16 mb-4">
                                    {visualizerData.map((height, i) => (
                                        <motion.div
                                            key={i}
                                            className={`w-1.5 rounded-full ${isRecording ? 'bg-red-500' : audioBlob ? 'bg-emerald-500' : 'bg-white/20'}`}
                                            animate={{ height }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        />
                                    ))}
                                </div>

                                {/* Recording Controls */}
                                <div className="flex justify-center gap-4">
                                    {!audioBlob ? (
                                        <button
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording
                                                    ? 'bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)]'
                                                    : 'bg-white/10 hover:bg-white/20 border border-white/20'
                                                }`}
                                        >
                                            {isRecording ? <Square fill="currentColor" size={20} /> : <Mic size={24} />}
                                        </button>
                                    ) : (
                                        <div className="flex gap-3 w-full">
                                            <button
                                                onClick={() => setAudioBlob(null)}
                                                className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                                            >
                                                Re-record
                                            </button>
                                            <div className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium text-center border border-emerald-500/30">
                                                ✓ Recording Ready
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <p className="text-center text-white/30 text-xs mt-3">
                                    {isRecording ? 'Recording... Click to stop' : audioBlob ? 'Your voice will be the opening node' : 'Record your opening statement (optional)'}
                                </p>
                            </div>

                            {/* Content Policy Notice */}
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-white/50 text-xs leading-relaxed">
                                    <strong className="text-white/70">Content Policy:</strong> Topics promoting hate speech,
                                    violence, discrimination, or illegal activities will be automatically rejected.
                                </p>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || title.length < 3 || topic.length < 10}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={20} />
                                        Create Room
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
