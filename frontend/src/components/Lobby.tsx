import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mic, ArrowRight, Plus } from 'lucide-react';
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
    onJoin: (roomId: string, roomData?: Room) => void;
}

export const Lobby = ({ onJoin }: LobbyProps) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [customRooms, setCustomRooms] = useState<Room[]>([]);

    // Preset rooms
    const presetRooms: Room[] = [
        {
            id: 'room-a',
            title: 'Philosophical Debate',
            topic: 'Is AI capable of true creativity?',
            participants: 12,
            color: 'from-blue-500 to-cyan-400'
        },
        {
            id: 'room-b',
            title: 'Policy Summit',
            topic: 'Universal Basic Income vs. Guaranteed Jobs',
            participants: 8,
            color: 'from-purple-500 to-pink-400'
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
            color: 'from-emerald-500 to-teal-400'
        };
        setCustomRooms(prev => [...prev, newRoom]);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,243,255,0.1),transparent_70%)] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="z-10 text-center mb-12"
            >
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-purple-400 mb-4 tracking-tight drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]">
                    PrismEcho
                </h1>
                <p className="text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
                    Spatial Negotiation Interface. <br />
                    <span className="text-white/80">Listen deeper before you reply.</span>
                </p>
            </motion.div>

            {/* Create Room Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="mb-8 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold flex items-center gap-2 hover:opacity-90 transition-opacity z-10 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            >
                <Plus size={20} />
                Create New Room
            </motion.button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 w-full max-w-4xl">
                {allRooms.map((room, idx) => (
                    <motion.button
                        key={room.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => onJoin(room.id, room)}
                        className="group relative h-64 rounded-3xl p-1 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/10 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(0,0,0,0.5)] text-left"
                    >
                        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${room.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`} />

                        <div className="h-full flex flex-col justify-between p-7 relative z-20">
                            <div>
                                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 bg-gradient-to-r ${room.color} bg-clip-text text-transparent`}>
                                    <Mic size={14} className="text-white/50" />
                                    {room.id.startsWith('custom-') ? 'Custom Room' : 'Live Session'}
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2 leading-tight group-hover:text-neon-blue transition-colors">
                                    {room.title}
                                </h3>
                                <p className="text-slate-400 group-hover:text-slate-300 transition-colors">
                                    {room.topic}
                                </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
                                <div className="flex items-center gap-2 text-white/50 text-sm">
                                    <Users size={16} />
                                    <span>{room.participants} listeners</span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-blue group-hover:text-black transition-all">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Create Room Modal */}
            <CreateRoomModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onRoomCreated={handleRoomCreated}
            />
        </div>
    );
};
