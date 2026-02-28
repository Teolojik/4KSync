'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatMessage {
    id: string;
    senderId: string;
    senderNickname?: string;
    text: string;
    timestamp: Date;
}

interface ChatBoxProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    currentUserId: string;
}

export function ChatBox({ messages, onSendMessage, currentUserId }: ChatBoxProps) {
    const [text, setText] = useState('');

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSendMessage(text);
        setText('');
    };

    return (
        <div className="w-full h-full bg-transparent flex flex-col overflow-hidden relative">
            <div className="bg-[#09090b]/50 p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#a1a1aa] tracking-wide">Oda Sohbeti</h2>
                <div className="w-2 h-2 rounded-full bg-[#bb86fc]"></div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div key={msg.id} className={`max-w-[85%] px-4 py-3 text-[13px] ${isMe ? 'bg-[#ff5555] text-white self-end rounded-2xl rounded-tr-sm shadow-[0_4px_12px_rgba(255,85,85,0.2)]' : 'bg-[#2A2A2F] border border-white/5 text-white/90 self-start rounded-2xl rounded-tl-sm'}`}>
                            <div className={`text-[10px] mb-1 font-semibold tracking-wide ${isMe ? 'text-white/60' : 'text-[#bb86fc]'}`}>
                                {isMe ? 'Sen' : (msg.senderNickname || msg.senderId.substring(0, 8))}
                            </div>
                            {msg.text}
                        </div>
                    );
                })}
                {messages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
                        Odaya merhaba de!
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="p-4 bg-[#09090b]/50 border-t border-white/5 flex gap-3 items-center">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Bir mesaj yazın..."
                    className="flex-1 bg-black/20 border border-white/5 rounded-full px-5 py-2.5 text-sm text-white focus:outline-none focus:border-[#bb86fc]/50 transition-colors placeholder:text-[#a1a1aa]"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="btn-primary !p-0 disabled:opacity-20 flex items-center justify-center h-10 w-10 flex-shrink-0 active:scale-90"
                >
                    <Send size={16} className="-ml-0.5" />
                </button>
            </form>
        </div>
    );
}
