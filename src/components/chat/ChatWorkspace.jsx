import React, { useRef, useEffect, useLayoutEffect } from "react";
import { Phone, Video, Info, Users as UsersIcon, Plus } from "lucide-react";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInputWithAutocomplete } from "./ChatInputWithAutocomplete";
import { useChatStore } from "../../store/useChatStore";

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
    showInfo = false,
    onToggleInfo
}) {
    const { fetchMoreMessages, loadingMoreMessages, hasMoreMessages } = useChatStore();
    const scrollContainerRef = useRef(null);
    const prevScrollHeightRef = useRef(0);
    const prevMessagesLengthRef = useRef(0);
    const hasScrolledToBottomForRoomRef = useRef(null);

    // Initial load: scroll to bottom when room messages finish loading
    useEffect(() => {
        if (activeRoom && !loadingMessages) {
            if (hasScrolledToBottomForRoomRef.current !== activeRoom.id) {
                if (scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    container.scrollTop = container.scrollHeight;
                    hasScrolledToBottomForRoomRef.current = activeRoom.id;
                    prevMessagesLengthRef.current = messages.length;
                    prevScrollHeightRef.current = container.scrollHeight;
                }
            }
        }
    }, [activeRoom, loadingMessages, messages.length]);

    // Handle auto-scroll on new messages at the bottom
    useEffect(() => {
        if (!scrollContainerRef.current || messages.length === 0) return;
        const container = scrollContainerRef.current;
        const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 150;
        const lastMessage = messages[messages.length - 1];
        const isMyMessage = lastMessage?.senderId === selfUserId;

        if (isMyMessage || isNearBottom) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages, selfUserId]);

    // Scroll Anchoring: adjust scrollTop when older messages are prepended
    useLayoutEffect(() => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const prevLength = prevMessagesLengthRef.current;
        const currentLength = messages.length;

        if (currentLength > prevLength && prevLength > 0) {
            const firstOldMessage = messages[currentLength - prevLength];
            const firstNewMessage = messages[0];

            if (firstNewMessage?.id !== firstOldMessage?.id) {
                const deltaHeight = container.scrollHeight - prevScrollHeightRef.current;
                container.scrollTop = container.scrollTop + deltaHeight;
            }
        }

        prevScrollHeightRef.current = container.scrollHeight;
        prevMessagesLengthRef.current = currentLength;
    }, [messages]);

    // Infinite scroll triggering
    const handleScroll = async () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;

        if (container.scrollTop <= 5 && hasMoreMessages && !loadingMoreMessages && messages.length > 0) {
            prevScrollHeightRef.current = container.scrollHeight;
            await fetchMoreMessages();
        }
    };
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
            <div className="px-6 py-3.5 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm flex-shrink-0">
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
                    {/* <button className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1.5 rounded-full hover:bg-gray-100">
                        <Phone className="w-5 h-5 fill-current" />
                    </button>
                    <button className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1.5 rounded-full hover:bg-gray-100">
                        <Video className="w-5 h-5 fill-current" />
                    </button> */}

                    {activeRoom.isGroup && (
                        <button
                            onClick={onAddMembersClick}
                            className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1.5 rounded-full hover:bg-gray-100"
                            title="Thêm thành viên"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}

                    <button
                        onClick={onToggleInfo}
                        className={`transition-colors p-1.5 rounded-full ${showInfo
                            ? "bg-[#eaf4ff] text-[#0084ff]"
                            : "text-[#0084ff] hover:text-[#0073de] hover:bg-gray-100"
                            }`}
                        title="Thông tin về cuộc trò chuyện"
                    >
                        <Info className={`w-5 h-5`} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-6 py-4 flex flex-col bg-white"
            >
                {loadingMoreMessages && (
                    <div className="text-center py-2 text-xs text-slate-400 font-mono animate-pulse">
                        ĐANG TẢI TIN NHẮN CŨ HƠN...
                    </div>
                )}
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
