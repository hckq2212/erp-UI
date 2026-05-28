import React from "react";
import { Phone, Video, Info, Users as UsersIcon, Plus } from "lucide-react";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInputWithAutocomplete } from "./ChatInputWithAutocomplete";

export function ChatWorkspace({
    activeRoom,
    selfUserId,
    messages,
    loadingMessages,
    onlineUsers,
    typingUsers,
    onSendMessage,
    onTyping,
    onAddMembersClick,
    getRoomName,
    messagesEndRef
}) {
    const getOtherParticipant = (room) => {
        return room.participants?.find(p => p.userId !== selfUserId)?.user;
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

    if (!activeRoom) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
                <div className="w-16 h-16 bg-[#eaf4ff] text-[#0084ff] flex items-center justify-center text-2xl mb-4 rounded-full shadow-sm">
                    💬
                </div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Chọn cuộc trò chuyện</h3>
                <p className="text-xs text-slate-450 mt-2 max-w-xs leading-relaxed">
                    Chọn một phòng chat ở thanh bên trái hoặc tìm kiếm nhân viên để mở cuộc đối thoại mới.
                </p>
            </div>
        );
    }

    const otherUser = getOtherParticipant(activeRoom);
    const isOnline = !activeRoom.isGroup && onlineUsers.includes(otherUser?.id);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Room Header */}
            <div className="px-6 py-3.5 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-sm text-[#0084ff]">
                            {activeRoom.isGroup ? <UsersIcon className="w-4 h-4" /> : getRoomName(activeRoom)[0].toUpperCase()}
                        </div>
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#31a24c] border border-white rounded-full" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-[#050505]">{getRoomName(activeRoom)}</span>
                        <span className="text-[11px] text-gray-500 font-medium">
                            {activeRoom.isGroup 
                                ? `${activeRoom.participants?.length || 0} thành viên`
                                : isOnline 
                                    ? "Đang hoạt động" 
                                    : "Ngoại tuyến"
                            }
                        </span>
                    </div>
                </div>

                {/* Messenger Top Header Action Tools */}
                <div className="flex items-center gap-4">
                    <button className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1.5 rounded-full hover:bg-gray-100">
                        <Phone className="w-5 h-5 fill-current" />
                    </button>
                    <button className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1.5 rounded-full hover:bg-gray-100">
                        <Video className="w-5 h-5 fill-current" />
                    </button>
                    
                    {activeRoom.isGroup && (
                        <button
                            onClick={onAddMembersClick}
                            className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1.5 rounded-full hover:bg-gray-100"
                            title="Thêm thành viên"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                    
                    <button className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1.5 rounded-full hover:bg-gray-100">
                        <Info className="w-5 h-5 fill-current" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col bg-white">
                {loadingMessages ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-mono animate-pulse">
                        ĐANG TẢI LỊCH SỬ...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                        Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const prevMsg = idx > 0 ? messages[idx - 1] : null;
                        const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;

                        const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;
                        const showSenderName = !isConsecutive;
                        const showAvatar = !nextMsg || nextMsg.senderId !== msg.senderId;

                        return (
                            <ChatMessageItem
                                key={msg.id}
                                message={msg}
                                isMe={msg.senderId === selfUserId}
                                isConsecutive={isConsecutive}
                                showSenderName={showSenderName}
                                showAvatar={showAvatar}
                            />
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Typing indicators */}
            {getTypingText() && (
                <div className="px-6 py-1 text-[11px] text-gray-500 bg-white italic animate-pulse flex-shrink-0">
                    {getTypingText()}
                </div>
            )}

            {/* Custom Input */}
            <div className="flex-shrink-0">
                <ChatInputWithAutocomplete
                    onSendMessage={onSendMessage}
                    onTyping={onTyping}
                />
            </div>
        </div>
    );
}
