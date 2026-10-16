import React, { useRef, useEffect, useLayoutEffect, useCallback, useState } from "react";
import { Phone, Video, Info, Users as UsersIcon, Plus, Pin, ChevronRight } from "lucide-react";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInputWithAutocomplete } from "./ChatInputWithAutocomplete";
import { RoomAvatar } from "./RoomAvatar";
import { PinnedMessagesModal } from "./PinnedMessagesModal";
import { useChatStore } from "../../store/useChatStore";
import { useGetUsersQuery } from "../../api/users";

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
    const {
        fetchMoreMessages,
        loadingMoreMessages,
        hasMoreMessages,
        pinnedMessagesByRoom
    } = useChatStore();

    const [showPinnedModal, setShowPinnedModal] = useState(false);
    const scrollContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const prevScrollHeightRef = useRef(0);
    const prevMessagesLengthRef = useRef(0);
    const hasScrolledToBottomForRoomRef = useRef(null);

    const pinnedList = (activeRoom?.id && pinnedMessagesByRoom[activeRoom.id]) || [];
    const latestPinned = pinnedList.length > 0 ? pinnedList[pinnedList.length - 1] : null;

    const handleJumpToMessage = useCallback((messageId) => {
        if (!messageId) return;
        const element = document.getElementById(`chat-msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            const bubbleTarget = element.querySelector('[data-chat-bubble="true"]') || element;
            bubbleTarget.classList.add("ring-2", "ring-[#F38820]", "ring-offset-2", "scale-[1.02]", "transition-all", "duration-200");
            setTimeout(() => {
                bubbleTarget.classList.remove("ring-2", "ring-[#F38820]", "ring-offset-2", "scale-[1.02]");
            }, 2000);
        }
    }, []);

    // Listen to custom jump event from ChatInfoSidebar or other modals
    useEffect(() => {
        const handleCustomJump = (e) => {
            if (e.detail?.messageId) {
                handleJumpToMessage(e.detail.messageId);
            }
        };
        window.addEventListener("chat:jump_to_message", handleCustomJump);
        return () => window.removeEventListener("chat:jump_to_message", handleCustomJump);
    }, [handleJumpToMessage]);

    const scrollToBottom = useCallback((behavior = "auto") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
        } else if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, []);

    // Reset scroll tracker when active room changes
    useEffect(() => {
        hasScrolledToBottomForRoomRef.current = null;
    }, [activeRoom?.id]);

    // Initial load: scroll to bottom when room messages finish loading
    useEffect(() => {
        if (!activeRoom || loadingMessages) return;

        if (hasScrolledToBottomForRoomRef.current !== activeRoom.id) {
            if (messages.length > 0 || !loadingMessages) {
                scrollToBottom("instant");
                hasScrolledToBottomForRoomRef.current = activeRoom.id;
                prevMessagesLengthRef.current = messages.length;
                if (scrollContainerRef.current) {
                    prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
                }
                // Double-check after render paint
                requestAnimationFrame(() => scrollToBottom("instant"));
                setTimeout(() => scrollToBottom("instant"), 80);
                setTimeout(() => scrollToBottom("instant"), 250);
            }
        }
    }, [activeRoom?.id, loadingMessages, messages.length, scrollToBottom]);

    // Handle auto-scroll on new messages at the bottom
    useEffect(() => {
        if (!scrollContainerRef.current || messages.length === 0) return;
        const container = scrollContainerRef.current;
        const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 250;
        const lastMessage = messages[messages.length - 1];
        const isMyMessage = Boolean(selfUserId && (String(lastMessage?.senderId) === String(selfUserId) || String(lastMessage?.sender?.id) === String(selfUserId)));

        if (isMyMessage || isNearBottom || hasScrolledToBottomForRoomRef.current !== activeRoom?.id) {
            scrollToBottom("smooth");
            if (hasScrolledToBottomForRoomRef.current !== activeRoom?.id) {
                hasScrolledToBottomForRoomRef.current = activeRoom?.id;
            }
        }
    }, [messages, selfUserId, activeRoom?.id, scrollToBottom]);

    // Image/Media load event: if images finish loading and user was at bottom, stay at bottom!
    const handleMediaLoad = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 350;
        if (isNearBottom || hasScrolledToBottomForRoomRef.current !== activeRoom?.id) {
            container.scrollTop = container.scrollHeight;
        }
    }, [activeRoom?.id]);

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
    const { data: usersData } = useGetUsersQuery();
    const allUsers = Array.isArray(usersData?.data) ? usersData.data : (Array.isArray(usersData) ? usersData : []);

    const getOtherParticipant = (room) => {
        if (!room) return null;
        const participant = room.participants?.find(p => p.userId !== selfUserId);
        if (participant?.user) return participant.user;
        if (participant?.userId) {
            return allUsers.find(u => u.id === participant.userId) || null;
        }
        return null;
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
                <div className="w-16 h-16 bg-orange-50 text-[#F38820] flex items-center justify-center text-2xl mb-4 rounded-full shadow-sm">
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
                        <RoomAvatar
                            room={activeRoom}
                            user={otherUser}
                            selfUserId={selfUserId}
                            allUsers={allUsers}
                            size="md"
                        />
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white rounded-full z-20" />
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
                    {/* <button className="text-[#F38820] hover:text-[#d97616] transition-colors p-1.5 rounded-full hover:bg-gray-100">
                        <Phone className="w-5 h-5" />
                    </button>
                    <button className="text-[#F38820] hover:text-[#d97616] transition-colors p-1.5 rounded-full hover:bg-gray-100">
                        <Video className="w-5 h-5" />
                    </button> */}

                    {activeRoom.isGroup && (
                        <button
                            onClick={onAddMembersClick}
                            className="text-[#F38820] hover:text-[#d97616] transition-colors p-1.5 rounded-full hover:bg-gray-100"
                            title="Thêm thành viên"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}

                    <button
                        onClick={onToggleInfo}
                        className={`transition-colors p-1.5 rounded-full ${showInfo
                            ? "bg-orange-50 text-[#F38820]"
                            : "text-[#F38820] hover:text-[#d97616] hover:bg-gray-100"
                            }`}
                        title="Thông tin về cuộc trò chuyện"
                    >
                        <Info className={`w-5 h-5`} />
                    </button>
                </div>
            </div>

            {/* Top Pinned Messages Banner */}
            {pinnedList.length > 0 && latestPinned && (
                <div
                    onClick={() => handleJumpToMessage(latestPinned.id)}
                    className="px-6 py-2 bg-orange-50/70 border-b border-orange-100/90 flex items-center justify-between gap-3 text-xs text-slate-800 cursor-pointer hover:bg-orange-100/70 transition-colors shrink-0 select-none shadow-2xs group"
                >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded-full bg-orange-100 text-[#F38820] flex items-center justify-center shrink-0">
                            <Pin className="w-3 h-3 fill-current" />
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="font-bold text-slate-900 shrink-0">
                                {latestPinned.sender?.fullName || latestPinned.sender?.username || "Thành viên"}:
                            </span>
                            <span className="truncate text-slate-600">
                                {latestPinned.isRecalled
                                    ? "[Tin nhắn đã được thu hồi]"
                                    : (latestPinned.content || (latestPinned.attachments?.length > 0 ? "[Tệp đính kèm]" : ""))}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {pinnedList.length > 1 && (
                            <span className="text-[11px] font-semibold text-[#F38820] bg-white px-2 py-0.5 rounded-full border border-orange-200">
                                {pinnedList.length} tin đã ghim
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowPinnedModal(true);
                            }}
                            className="text-[#F38820] hover:text-orange-700 font-medium flex items-center gap-0.5 text-xs hover:underline cursor-pointer"
                        >
                            <span>Xem tất cả</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Pinned Messages Modal */}
            <PinnedMessagesModal
                isOpen={showPinnedModal}
                onClose={() => setShowPinnedModal(false)}
                onJumpToMessage={handleJumpToMessage}
            />

            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                onLoadCapture={handleMediaLoad}
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

                        const isConsecutive = prevMsg && String(prevMsg.senderId) === String(msg.senderId);
                        const showSenderName = !isConsecutive;
                        const showAvatar = !nextMsg || String(nextMsg.senderId) !== String(msg.senderId);
                        const isMe = Boolean(selfUserId && (String(msg.senderId) === String(selfUserId) || String(msg.sender?.id) === String(selfUserId)));

                        return (
                            <ChatMessageItem
                                key={msg.id}
                                message={msg}
                                isMe={isMe}
                                selfUserId={selfUserId}
                                isConsecutive={isConsecutive}
                                showSenderName={showSenderName}
                                showAvatar={showAvatar}
                            />
                        );
                    })
                )}
                {/* Cuộn tới điểm cuối cùng */}
                <div ref={messagesEndRef} className="h-0 w-0 shrink-0" />
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
                    room={activeRoom}
                />
            </div>
        </div>
    );
}
