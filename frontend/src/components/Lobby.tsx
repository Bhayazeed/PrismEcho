import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mic, ArrowRight, Plus, User, HelpCircle, X } from 'lucide-react';
import { CreateRoomModal } from './CreateRoomModal';

interface Room {
    id: string;
    title: string;
    topic: string;
    opening_question?: string;
    audioUrl?: string;
    participants: number;
    color: string;
}

interface LobbyProps {
    onJoin: (roomId: string, roomData?: Room, username?: string) => void;
}

export const Lobby = ({ onJoin }: LobbyProps) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [customRooms, setCustomRooms] = useState<Room[]>([]);
    const [username, setUsername] = useState('');
    const [showTutorial, setShowTutorial] = useState(true);

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('prismecho_tutorial_seen');
        if (hasSeenTutorial) {
            setShowTutorial(false);
        }
    }, []);

    const dismissTutorial = () => {
        setShowTutorial(false);
        localStorage.setItem('prismecho_tutorial_seen', 'true');
    };

    const presetRooms: Room[] = [
        {
            id: 'room-a',
            title: 'Philosophical Debate',
            topic: 'Is AI capable of true creativity?',
            participants: 12,
            color: 'bg-brutal-blue'
        },
        {
            id: 'room-b',
            title: 'Policy Summit',
            topic: 'Universal Basic Income vs. Guaranteed Jobs',
            participants: 8,
            color: 'bg-brutal-purple'
        }
    ];

    const allRooms = [...presetRooms, ...customRooms];

    const handleRoomCreated = (room: { id: string; title: string; topic: string; opening_question: string; audioUrl?: string }) => {
        const newRoom: Room = {
            id: room.id,
            title: room.title,
            topic: room.topic,
            opening_question: room.opening_question,
            audioUrl: room.audioUrl,
            participants: 0,
            color: 'bg-brutal-green'
        };
        setCustomRooms(prev => [...prev, newRoom]);
    };

    const handleJoinRoom = (room: Room) => {
        const displayName = username.trim() || `Guest_${Math.random().toString(36).slice(2, 6)}`;
        onJoin(room.id, room, displayName);
    };

    // Color mapping for cards
    const cardColors = ['bg-brutal-yellow', 'bg-brutal-pink', 'bg-brutal-cyan', 'bg-brutal-orange'];

    return (
        <div className="min-h-screen bg-brutal-cream flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* How to Use Tutorial - Neo-brutalist style */}
            <AnimatePresence>
                {showTutorial && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
                    >
                        <div className="bg-brutal-yellow border-brutal shadow-brutal-lg p-6 relative">
                            <button
                                onClick={dismissTutorial}
                                className="absolute top-3 right-3 w-8 h-8 bg-brutal-white border-2 border-brutal-black flex items-center justify-center hover:bg-brutal-pink transition-colors"
                            >
                                <X size={16} />
                            </button>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-brutal-white border-brutal flex items-center justify-center shrink-0">
                                    <HelpCircle className="text-brutal-black" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-brutal-black mb-3 uppercase">How to Use SpeakBox</h3>
                                    <div className="text-brutal-black text-sm space-y-2 font-medium">
                                        <p>🎧 <strong>Move cursor</strong> → Navigate the audio space</p>
                                        <p>⏱️ <strong>Stay near a node</strong> → Unlock reply after 3 seconds</p>
                                        <p>🎤 <strong>Press R</strong> → Record your voice reply</p>
                                        <p>🔗 <strong>Your reply</strong> → Connects to the parent node</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Title */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="z-10 text-center mb-8"
            >
                <h1 className="text-7xl font-bold text-brutal-black mb-4 uppercase tracking-tight">
                    Speak<span className="bg-brutal-blue text-brutal-white px-2">Box</span>
                </h1>
                <p className="text-xl text-brutal-black max-w-lg mx-auto font-medium">
                    Spatial Debate Platform<br />
                    <span className="bg-brutal-yellow px-2 py-1 inline-block mt-2 border-2 border-brutal-black">Listen deeper before you reply.</span>
                </p>
            </motion.div>

            {/* Username Input */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="z-10 mb-8 w-full max-w-sm"
            >
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brutal-black" size={20} />
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your name"
                        maxLength={20}
                        className="w-full pl-12 pr-4 py-3 bg-brutal-white border-brutal shadow-brutal text-brutal-black placeholder-brutal-black/50 focus:outline-none focus:shadow-brutal-blue font-medium text-center"
                    />
                </div>
            </motion.div>

            {/* Create Room Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="mb-8 px-8 py-4 bg-brutal-green border-brutal shadow-brutal text-brutal-black font-bold uppercase flex items-center gap-2 hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal-sm transition-all z-10"
            >
                <Plus size={20} strokeWidth={3} />
                Create New Room
            </motion.button>

            {/* Room Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 w-full max-w-4xl">
                {allRooms.map((room, idx) => (
                    <motion.button
                        key={room.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleJoinRoom(room)}
                        className={`group relative h-64 p-6 ${cardColors[idx % cardColors.length]} border-brutal-thick shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal transition-all text-left`}
                    >
                        <div className="h-full flex flex-col justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 bg-brutal-black text-brutal-white border-2 border-brutal-black px-2 py-1">
                                    <Mic size={12} />
                                    {room.id.startsWith('custom-') ? 'Custom' : 'Live'}
                                </div>
                                <h3 className="text-3xl font-bold text-brutal-black mb-2 uppercase leading-tight">
                                    {room.title}
                                </h3>
                                <p className="text-brutal-black/80 font-medium">
                                    {room.topic}
                                </p>
                            </div>

                            <div className="flex items-center justify-between border-t-3 border-brutal-black pt-4 mt-4">
                                <div className="flex items-center gap-2 text-brutal-black font-bold text-sm">
                                    <Users size={16} strokeWidth={3} />
                                    <span>{room.participants} listeners</span>
                                </div>
                                <div className="w-12 h-12 bg-brutal-black border-brutal flex items-center justify-center text-brutal-white">
                                    <ArrowRight size={24} strokeWidth={3} />
                                </div>
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Footer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-brutal-black/50 text-sm mt-12 z-10 font-bold uppercase tracking-widest"
            >
                Powered by <span className="bg-brutal-black text-brutal-white px-2 py-0.5">Gemini AI</span>
            </motion.p>

            {/* Create Room Modal */}
            <CreateRoomModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onRoomCreated={handleRoomCreated}
            />
        </div>
    );
};
