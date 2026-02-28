import { useEffect, useState, RefObject } from 'react';
import { supabase } from '../../../shared/lib/supabase';

// For MVP, we pass userId and check if they are the host by looking at DB
export const useMediaSync = (roomId: string, userId: string) => {
    const [isHost, setIsHost] = useState(false);
    const [hostId, setHostId] = useState<string | null>(null);
    const [isSetup, setIsSetup] = useState(false);

    useEffect(() => {
        if (!userId || !roomId) return;

        const setupRoom = async () => {
            // Check if room exists
            const { data: room, error } = await supabase
                .from('rooms')
                .select('host_id')
                .eq('id', roomId)
                .single();

            if (error && error.code === 'PGRST116') {
                // Room doesn't exist, I am the host! Create it.
                await supabase.from('rooms').insert({ id: roomId, host_id: userId });
                await supabase.from('room_media_state').insert({ room_id: roomId, is_playing: false, current_time: 0 });
                setIsHost(true);
                setHostId(userId);
            } else if (room) {
                // Room exists
                setIsHost(room.host_id === userId);
                setHostId(room.host_id);
            }
            setIsSetup(true);
        };

        setupRoom();
    }, [roomId, userId]);

    // Ekstra senkronizasyon (play/pause) kodları kaldırıldı.
    // WebRTC ekran paylaşımı canlı bir stream olduğu için manuel olarak 
    // video elementini yönetmeye gerek yoktur, gönderici tarafında zaten yönetilir.

    return { isHost, isSetup, hostId };
};
