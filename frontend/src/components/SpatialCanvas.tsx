import { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSocket, useAppState } from '../hooks/useSocket';
import { useSpatialAudio } from '../hooks/useSpatialAudio';
import { BlurOverlay } from './BlurOverlay';
import { Howler } from 'howler';
import { ReplyModal } from './ReplyModal';
import { LogOut } from 'lucide-react';

interface RoomData {
    id: string;
    title: string;
    topic: string;
    opening_question?: string;
    audioUrl?: string;
    color?: string;
}

interface SpatialCanvasProps {
    roomId: string;
    roomData?: RoomData | null;
    onExit: () => void;
}

export const SpatialCanvas = ({ roomId, roomData, onExit }: SpatialCanvasProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Reply Interaction State
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [focusTimer, setFocusTimer] = useState<number>(0);
    const [canReply, setCanReply] = useState(false);

    // Access state from store (hooked up to WebSocket in App or here)
    const { nodes, users } = useAppState();

    // Seed nodes based on room - RESET when entering a new room
    useEffect(() => {
        // Custom room - use opening question from roomData
        if (roomData && roomId.startsWith('custom-')) {
            const hue = Math.floor(Math.random() * 360);
            useAppState.getState().setNodes([
                {
                    id: '1',
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                    color: `hsl(${hue}, 80%, 60%)`,
                    text: roomData.opening_question || roomData.topic,
                    audioUrl: roomData.audioUrl // Pass the recorded audio!
                }
            ]);
        } else if (roomId === 'room-a') {
            useAppState.getState().setNodes([
                { id: '1', x: window.innerWidth / 2, y: window.innerHeight / 2, color: '#00f3ff', text: "Is free will an illusion? Share your perspective." }
            ]);
        } else if (roomId === 'room-b') {
            useAppState.getState().setNodes([
                { id: '2', x: window.innerWidth / 2, y: window.innerHeight / 2, color: '#bc13fe', text: "Should AI be regulated? Debate the policy." }
            ]);
        }
    }, [roomId, roomData]);

    // Local mouse tracking
    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
        // TODO: Send to WebSocket
    };
    // Handle reply from ReplyModal - now receives AI-processed audioUrl and summary
    const handleReply = (audioUrl: string, summary: string) => {
        const newNodeId = `reply-${Date.now()}`; // Unique ID

        // Find the parent node we're replying to
        const parentNode = nodes.find(n => n.id === focusedNodeId);
        const originX = parentNode ? parentNode.x : mousePos.x;
        const originY = parentNode ? parentNode.y : mousePos.y;

        // Spawn at a fixed distance (400px) at a random angle
        const angle = Math.random() * Math.PI * 2;
        const offset = 400;

        // Generate Random Neon Color
        const hue = Math.floor(Math.random() * 360);
        const randomColor = `hsl(${hue}, 100%, 60%)`;

        const newUserNode = {
            id: newNodeId,
            x: originX + Math.cos(angle) * offset,
            y: originY + Math.sin(angle) * offset,
            color: randomColor,
            text: summary, // AI-generated summary from backend
            audioUrl: audioUrl,
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

    // Focus / Reply Logic with Momentum Lock
    useEffect(() => {
        const CLOSE_THRESHOLD = 250;
        const ABANDON_THRESHOLD = 400; // Must move this far to break momentum lock
        const MOMENTUM_LOCK_PERCENT = 20; // Lock in after 20% progress (faster lock)

        // Get all nodes within close threshold and find the closest
        const nodesWithinRange = Object.entries(distances)
            .filter(([_, dist]) => dist < CLOSE_THRESHOLD)
            .sort((a, b) => a[1] - b[1]);

        const closestNodeId = nodesWithinRange.length > 0 ? nodesWithinRange[0][0] : null;

        // If we have momentum lock (timer > 50%), only break focus if we move very far away
        const currentFocusDistance = focusedNodeId ? distances[focusedNodeId] : Infinity;
        const hasMomentumLock = focusTimer >= MOMENTUM_LOCK_PERCENT;

        if (hasMomentumLock && focusedNodeId) {
            // Only break lock if we move beyond the abandon threshold
            if (currentFocusDistance > ABANDON_THRESHOLD) {
                setFocusedNodeId(null);
                setFocusTimer(0);
                setCanReply(false);
            }
            // Otherwise, keep the current focus (momentum lock active)
        } else {
            // Normal behavior: focus on closest node
            if (closestNodeId) {
                if (closestNodeId !== focusedNodeId) {
                    setFocusTimer(0); // Reset timer when switching
                    setCanReply(false);
                }
                setFocusedNodeId(closestNodeId);
            } else {
                setFocusedNodeId(null);
                setFocusTimer(0);
                setCanReply(false);
            }
        }
    }, [distances, focusTimer, focusedNodeId]);

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
                            stroke={node.color}
                            strokeWidth="3"
                            strokeOpacity="0.6"
                            strokeDasharray="8,8"
                        />
                    );
                })}
            </svg>

            {/* Render Nodes */}
            {nodes.map(node => (
                <motion.div
                    key={node.id}
                    className="absolute rounded-full shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center group"
                    style={{
                        left: node.x,
                        top: node.y,
                        width: 80, // Increased from 60
                        height: 80, // Increased from 60
                        x: '-50%',
                        y: '-50%',
                        backgroundColor: node.color,
                        boxShadow: `0 0 40px ${node.color}, inset 0 0 20px rgba(255,255,255,0.8)`
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
