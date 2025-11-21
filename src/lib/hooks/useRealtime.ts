

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const useRealtime = (channel: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log(`Connected to channel: ${channel}`);
            newSocket.emit('join', channel);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from channel');
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [channel]);

    const subscribe = (event: string, callback: (data: any) => void) => {
        if (!socket) return;
        socket.on(event, callback);
        return () => socket.off(event, callback);
    };

    const emit = (event: string, data: any) => {
        if (!socket) return;
        socket.emit(event, data);
    };

    return { subscribe, emit, isConnected };
};