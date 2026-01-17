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

    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [visualizerData, setVisualizerData] = useState<number[]>(new Array(12).fill(10));

    useEffect(() => {
        if (isRecording) {
            const interval = setInterval(() => {
                setVisualizerData(prev => prev.map(() => Math.random() * 50 + 10));
            }, 100);
            return () => clearInterval(interval);
        } else {
            setVisualizerData(new Array(12).fill(10));
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
                const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : undefined;

                onRoomCreated({
                    id: data.room_id,
                    title,
                    topic,
                    opening_question: data.opening_question,
                    audioUrl
                });
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
                        className="absolute inset-0 bg-brutal-black/80"
                        onClick={onClose}
                    />

                    {/* Modal - Neo Brutalist */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg p-8 bg-brutal-white border-brutal-thick shadow-brutal-xl max-h-[90vh] overflow-y-auto"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-10 h-10 bg-brutal-pink border-brutal flex items-center justify-center hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
                        >
                            <X size={20} strokeWidth={3} />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-brutal-green border-brutal flex items-center justify-center">
                                <Plus size={28} strokeWidth={3} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-brutal-black uppercase">Create Room</h2>
                                <p className="text-brutal-black/60 text-sm font-medium">Start a new debate topic</p>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-brutal-pink border-brutal flex items-start gap-3"
                            >
                                <AlertTriangle className="text-brutal-black shrink-0 mt-0.5" size={20} strokeWidth={3} />
                                <p className="text-brutal-black text-sm font-bold">{error}</p>
                            </motion.div>
                        )}

                        {/* Form */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-brutal-black text-sm font-bold mb-2 uppercase">
                                    Room Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Climate Action Debate"
                                    maxLength={50}
                                    className="w-full px-4 py-3 bg-brutal-white border-brutal shadow-brutal-sm text-brutal-black placeholder-brutal-black/40 focus:outline-none focus:shadow-brutal-blue font-medium"
                                />
                                <p className="text-brutal-black/40 text-xs mt-1 font-bold">{title.length}/50</p>
                            </div>

                            <div>
                                <label className="block text-brutal-black text-sm font-bold mb-2 uppercase">
                                    Opening Topic
                                </label>
                                <textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., Should governments mandate carbon taxes?"
                                    maxLength={200}
                                    rows={2}
                                    className="w-full px-4 py-3 bg-brutal-white border-brutal shadow-brutal-sm text-brutal-black placeholder-brutal-black/40 focus:outline-none focus:shadow-brutal-blue font-medium resize-none"
                                />
                                <p className="text-brutal-black/40 text-xs mt-1 font-bold">{topic.length}/200</p>
                            </div>

                            {/* Recording Section */}
                            <div className="p-4 bg-brutal-cream border-brutal">
                                <label className="block text-brutal-black text-sm font-bold mb-3 uppercase">
                                    Voice Recording (Optional)
                                </label>

                                {/* Visualizer */}
                                <div className="flex justify-center items-end gap-1 h-16 mb-4 bg-brutal-black p-3 border-brutal">
                                    {visualizerData.map((height, i) => (
                                        <motion.div
                                            key={i}
                                            className={`w-2 ${isRecording ? 'bg-brutal-pink' : audioBlob ? 'bg-brutal-green' : 'bg-brutal-gray'}`}
                                            animate={{ height }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        />
                                    ))}
                                </div>

                                {/* Recording Controls */}
                                <div className="flex justify-center gap-3">
                                    {!audioBlob ? (
                                        <button
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={`px-6 py-3 border-brutal shadow-brutal flex items-center gap-2 font-bold uppercase hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm transition-all ${isRecording ? 'bg-brutal-pink' : 'bg-brutal-yellow'
                                                }`}
                                        >
                                            {isRecording ? (
                                                <>
                                                    <Square fill="currentColor" size={18} />
                                                    Stop
                                                </>
                                            ) : (
                                                <>
                                                    <Mic size={18} strokeWidth={3} />
                                                    Record
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setAudioBlob(null)}
                                                className="px-6 py-3 bg-brutal-gray border-brutal shadow-brutal-sm font-bold uppercase hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                                            >
                                                Re-record
                                            </button>
                                            <div className="px-6 py-3 bg-brutal-green border-brutal font-bold uppercase flex items-center gap-2">
                                                ✓ Recorded
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content Policy Notice */}
                            <div className="p-3 bg-brutal-yellow border-brutal text-brutal-black text-xs font-bold">
                                ⚠️ AI MODERATION: Hate speech, violence, and discrimination will be blocked.
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={!title.trim() || !topic.trim() || isLoading}
                                className="w-full py-4 bg-brutal-blue border-brutal shadow-brutal text-brutal-white font-bold uppercase flex items-center justify-center gap-2 hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Creating Room...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={20} strokeWidth={3} />
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
