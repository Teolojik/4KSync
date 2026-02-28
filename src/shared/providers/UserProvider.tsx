'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PreJoinLobby } from '@/features/webrtc/ui/PreJoinLobby';

interface UserContextType {
    userId: string;
    nickname: string;
    hasJoined: boolean;
    setNickname: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [userId, setUserId] = useState<string>('');
    const [nickname, setNickname] = useState<string>('');
    const [hasJoined, setHasJoined] = useState(false);

    useEffect(() => {
        let storedId = localStorage.getItem('4ksync_user_id');
        if (!storedId) {
            storedId = self.crypto.randomUUID();
            localStorage.setItem('4ksync_user_id', storedId);
        }
        setUserId(storedId);

        const storedNick = localStorage.getItem('4ksync_nickname');
        if (storedNick) {
            setNickname(storedNick);
            setHasJoined(true);
        } else {
            // Suggest Teolojik by default for the setup
            setNickname('Teolojik');
        }
    }, []);

    const handleJoin = (name: string) => {
        setNickname(name);
        setHasJoined(true);
        localStorage.setItem('4ksync_nickname', name);
    };

    const updateNickname = (name: string) => {
        setNickname(name);
        localStorage.setItem('4ksync_nickname', name);
    };

    if (!userId) return null; // Wait for ID setup

    if (!hasJoined) {
        // We can pass a dummy roomId or "the server" here. 
        // For Discord-lite, it's just the global server entrance.
        return <PreJoinLobby roomId="4K Sync Server" onJoin={handleJoin} />;
    }

    return (
        <UserContext.Provider value={{ userId, nickname, hasJoined, setNickname: updateNickname }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
