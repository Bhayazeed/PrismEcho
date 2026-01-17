import { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSocket, useAppState } from '../hooks/useSocket';
import { useSpatialAudio } from '../hooks/useSpatialAudio';
import { BlurOverlay } from './BlurOverlay';
import { Howler } from 'howler';
import { ReplyModal } from './ReplyModal';
import { LogOut } from 'lucide-react';

interface SpatialCanvasProps {
    roomId: string;
    onExit: () => void;
}

export const SpatialCanvas = ({ roomId, onExit }: SpatialCanvasProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Reply Interaction State
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [focusTimer, setFocusTimer] = useState<number>(0);
    const [canReply, setCanReply] = useState(false);

    // Access state from store (hooked up to WebSocket in App or here)
    const { nodes, users } = useAppState();

    // For demo purposes, let's seed a node if empty
    useEffect(() => {
        if (nodes.length === 0) {
            useAppState.getState().setNodes([
                { id: '1', x: window.innerWidth / 2, y: window.innerHeight / 2, color: '#00f3ff', text: "Welcome to PrismEcho. Navigate here to reply." },
                { id: '2', x: window.innerWidth / 4, y: window.innerHeight / 3, color: '#bc13fe', text: "Another voice node." }
            ]);
        }
    }, []);

    // Local mouse tracking
    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
        // TODO: Send to WebSocket
    };

    const handleReply = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const newNodeId = (nodes.length + 1).toString();

        // Offset from Parent
        // If we are focused on a node, that is the parent. 
        // If not, we fall back to user position (shouldn't happen due to logic)
        const parentNode = nodes.find(n => n.id === focusedNodeId);
        const originX = parentNode ? parentNode.x : mousePos.x;
        const originY = parentNode ? parentNode.y : mousePos.y;

        // Spawn at a fixed distance (250px) at a random angle
        const angle = Math.random() * Math.PI * 2;
        const offset = 250;

        const newUserNode = {
            id: newNodeId,
            x: originX + Math.cos(angle) * offset,
            y: originY + Math.sin(angle) * offset,
            color: '#00ff88',
            text: "User Reply",
            audioUrl: url,
            parentId: focusedNodeId || undefined
        };

        useAppState.getState().setNodes([...nodes, newUserNode]);
    };

    // Audio Logic
    const audioSources = useMemo(() => {
        return nodes.map(n => {
            // If it's a user reply, use the stored URL
            // @ts-ignore - We are hacking the store type strictly for this demo
            if (n.audioUrl) return { id: n.id, x: n.x, y: n.y, src: n.audioUrl };

            // Hardcoded mapping for initial nodes
            if (n.id === '1') return { id: n.id, x: n.x, y: n.y, src: '/recording_5.m4a' };
            if (n.id === '2') return { id: n.id, x: n.x, y: n.y, src: '/recording_6.m4a' };

            return { id: n.id, x: n.x, y: n.y, src: '/white_noise.wav' };
        });
    }, [nodes]);

    const { distances } = useSpatialAudio(mousePos.x, mousePos.y, audioSources);

    // Calculate closest node for blur effect
    const minDistance = Object.values(distances).length > 0 ? Math.min(...Object.values(distances)) : 1000;

    // Focus / Reply Logic
    useEffect(() => {
        // Find if we are close enough to any node to "Focus"
        // Increased to 250 to allow reaching the button without losing focus
        const CLOSE_THRESHOLD = 250;
        const closestNodeId = Object.keys(distances).find(id => distances[id] < CLOSE_THRESHOLD);

        if (closestNodeId) {
            setFocusedNodeId(closestNodeId);
        } else {
            setFocusedNodeId(null);
            setFocusTimer(0);
            setCanReply(false);
        }
    }, [distances]);

    // Modal State
    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

    // Keyboard Interaction
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && canReply && focusedNodeId) {
                e.preventDefault();
                setIsReplyModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canReply, focusedNodeId]);

    // Mute Audio when Modal is Open
    useEffect(() => {
        Howler.mute(isReplyModalOpen);
        return () => {
            Howler.mute(false);
        };
    }, [isReplyModalOpen]);

    // Timer for unlocking reply
    useEffect(() => {
        let interval: number;
        if (focusedNodeId && !canReply) {
            interval = window.setInterval(() => {
                setFocusTimer(prev => {
                    if (prev >= 100) {
                        setCanReply(true);
                        return 100;
                    }
                    return prev + 1; // Approx 3 seconds to reach 100 if interval is 30ms
                });
            }, 30);
        }
        return () => clearInterval(interval);
    }, [focusedNodeId, canReply]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-slate-950 overflow-hidden cursor-crosshair selection:bg-neon-blue selection:text-black"
            onMouseMove={handleMouseMove}
        >
            <BlurOverlay minDistance={minDistance} maxDistance={300} />

            <ReplyModal
                isOpen={isReplyModalOpen}
                onClose={() => setIsReplyModalOpen(false)}
                nodeId={focusedNodeId || ''}
                onReply={handleReply}
            />

            {/* Edges Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {nodes.map(node => {
                    if (!node.parentId) return null;
                    const parent = nodes.find(n => n.id === node.parentId);
                    if (!parent) return null;

                    return (
                        <line
                            key={`edge-${node.id}`}
                            x1={parent.x}
                            y1={parent.y}
                            x2={node.x}
                            y2={node.y}
                            stroke="rgba(0, 243, 255, 0.2)"
                            strokeWidth="1"
                            strokeDasharray="5,5"
                        />
                    );
                })}
            </svg>

            {/* Render Nodes */}
            {nodes.map(node => (
                <motion.div
                    key={node.id}
                    className="absolute rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center group"
                    style={{
                        left: node.x,
                        top: node.y,
                        width: 60,
                        height: 60,
                        x: '-50%',
                        y: '-50%',
                        backgroundColor: node.color,
                        boxShadow: `0 0 20px ${node.color}, inset 0 0 20px rgba(255,255,255,0.5)`
                    }}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {/* Tooltip / Interaction Ring */}
                    {focusedNodeId === node.id && (
                        <>
                            {/* Progress Ring */}
                            <svg className="absolute w-24 h-24 pointer-events-none -rotate-90">
                                <circle
                                    cx="48" cy="48" r="40"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeOpacity="0.3"
                                />
                                <circle
                                    cx="48" cy="48" r="40"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeDasharray="251.2"
                                    strokeDashoffset={251.2 - (251.2 * focusTimer) / 100}
                                    className="transition-all duration-75"
                                />
                            </svg>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute top-24 w-80 p-6 rounded-2xl bg-glass-200 backdrop-blur-xl border border-glass-100/50 text-sm text-white z-50 pointer-events-auto shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                            >
                                <p className="font-semibold mb-2 text-neon-blue">Voice Summary</p>
                                <p className="mb-3">{node.text}</p>

                                {canReply ? (
                                    <button
                                        className="w-full py-2 bg-neon-blue/80 hover:bg-neon-blue text-black font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                                        onClick={() => setIsReplyModalOpen(true)}
                                    >
                                        REPLY NOW
                                    </button>
                                ) : (
                                    <p className="text-xs text-center opacity-50">Listening... {Math.round(focusTimer)}%</p>
                                )}
                                <div className="mt-2 text-[10px] text-center text-white/30 uppercase tracking-widest">
                                    {canReply ? 'Press Space to Reply' : 'Hold Position'}
                                </div>
                            </motion.div>
                        </>
                    )}
                </motion.div>
            ))}

            {/* Render Other Users (Cursors) */}
            {users.map(user => (
                <div
                    key={user.id}
                    className="absolute w-4 h-4 rounded-full border-2 border-white/50 pointer-events-none"
                    style={{
                        left: user.x,
                        top: user.y,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            ))}

            {/* HUD / Debug Info */}
            <div className="absolute bottom-4 left-4 text-xs text-white/30 font-mono pointer-events-none">
                POS: {mousePos.x}, {mousePos.y} | MIN_DIST: {Math.round(minDistance)} | FOCUS: {focusedNodeId || 'NONE'} | ROOM: {roomId}
            </div>

            {/* Exit Button */}
            <button
                onClick={onExit}
                className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all z-50 text-xs uppercase tracking-widest backdrop-blur-md"
            >
                <LogOut size={14} /> Exit Room
            </button>
        </div>
    );
};
