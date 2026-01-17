import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

interface Node {
    id: string;
    x: number;
    y: number;
    color: string;
    text?: string;
    audioUrl?: string;
    parentId?: string;
}

interface User {
    id: string;
    x: number;
    y: number;
}

interface AppState {
    nodes: Node[];
    users: User[];
    setNodes: (nodes: Node[]) => void;
    updateUser: (user: User) => void;
}

export const useAppState = create<AppState>((set) => ({
    nodes: [],
    users: [],
    setNodes: (nodes) => set({ nodes }),
    updateUser: (user) => set((state) => {
        const existing = state.users.find(u => u.id === user.id);
        if (existing) {
            return { users: state.users.map(u => u.id === user.id ? user : u) };
        }
        return { users: [...state.users, user] };
    })
}));

export const useSocket = (url: string) => {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimeout = useRef<number>();

    const connect = () => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            // For now just logging, later we parse
            console.log('Message from server:', event.data);
            try {
                // Here we would parse and update state
                // const data = JSON.parse(event.data);
                // if (data.type === 'nodes') useAppState.getState().setNodes(data.payload);
            } catch (e) {
                console.error("Failed to parse message", e);
            }
        };

        ws.current.onclose = () => {
            console.log('WebSocket Disconnected. Reconnecting...');
            setIsConnected(false);
            reconnectTimeout.current = window.setTimeout(connect, 3000); // Simple 3s retry
        };

        ws.current.onerror = (err) => {
            console.error('WebSocket Error:', err);
            ws.current?.close();
        };
    };

    useEffect(() => {
        // Prevent double connection in Strict Mode or re-mounts
        if (ws.current) return;

        connect();

        return () => {
            // Only close if component is unmounting
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [url]);

    const sendMessage = (msg: string) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(msg);
        }
    };

    return { isConnected, sendMessage };
};
