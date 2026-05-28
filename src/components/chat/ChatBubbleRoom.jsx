import React, { useEffect, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useGetMeQuery } from "../../api/auth";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInputWithAutocomplete } from "./ChatInputWithAutocomplete";

export function ChatBubbleRoom() {
    const { data: currentUser } = useGetMeQuery();
    const selfUserId = currentUser?.id;

    const {
        activeRoom,
        messages,
        sendMessage,
        sendTyping,
        typingUsers,
        loadingMessages
    } = useChatStore();

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    const handleSendMessage = (content) => {
        sendMessage(content);
    };

    const handleTyping = (isTyping) => {
        sendTyping(isTyping);
    };

    const getTypingText = () => {
        if (!activeRoom) return "";
        const roomTyping = typingUsers[activeRoom.id] || {};
        
        const otherTypers = Object.entries(roomTyping)
            .filter(([uid]) => uid !== selfUserId)
            .map(([, username]) => username);

        if (otherTypers.length === 0) return "";
        if (otherTypers.length === 1) return `${otherTypers[0]} đang soạn tin...`;
        return "Nhiều người đang soạn tin...";
    };

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Messages Thread Pane */}
            <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col">
                {loadingMessages ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-mono">
                        ĐANG TẢI LỊCH SỬ...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-500 font-sans">
                        Hãy bắt đầu cuộc trò chuyện!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <ChatMessageItem
                            key={msg.id}
                            message={msg}
                            isMe={msg.senderId === selfUserId}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Typing status bar */}
            {getTypingText() && (
                <div className="px-4 py-1 text-[10px] text-slate-500 font-sans bg-gray-50 border-t border-gray-100 italic animate-pulse">
                    {getTypingText()}
                </div>
            )}

            {/* Input Form with Autocomplete */}
            <ChatInputWithAutocomplete
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
            />
        </div>
    );
}
