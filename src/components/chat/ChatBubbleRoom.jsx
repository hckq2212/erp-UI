import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { Pin, ChevronRight } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useGetMeQuery } from "../../api/auth";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInputWithAutocomplete } from "./ChatInputWithAutocomplete";
import { PinnedMessagesModal } from "./PinnedMessagesModal";

export function ChatBubbleRoom() {
    const { data: currentUser } = useGetMeQuery();
    const selfUserId = currentUser?.id;

    const {
        activeRoom,
        messages,
        sendMessage,
        sendTyping,
        typingUsers,
        loadingMessages,
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

    // Listen to custom jump event from reply quote or modals
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
                requestAnimationFrame(() => scrollToBottom("instant"));
                setTimeout(() => scrollToBottom("instant"), 100);
            }
        }
    }, [activeRoom?.id, loadingMessages, messages.length, scrollToBottom]);

    // Handle auto-scroll on new messages at the bottom
    useEffect(() => {
        if (!scrollContainerRef.current || messages.length === 0) return;
        const container = scrollContainerRef.current;
        const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 200;
        const lastMessage = messages[messages.length - 1];
        const isMyMessage = Boolean(selfUserId && (String(lastMessage?.senderId) === String(selfUserId) || String(lastMessage?.sender?.id) === String(selfUserId)));

        if (isMyMessage || isNearBottom || hasScrolledToBottomForRoomRef.current !== activeRoom?.id) {
            scrollToBottom("smooth");
            if (hasScrolledToBottomForRoomRef.current !== activeRoom?.id) {
                hasScrolledToBottomForRoomRef.current = activeRoom?.id;
            }
        }
    }, [messages, selfUserId, activeRoom?.id, scrollToBottom]);

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

    const handleSendMessage = (content, attachments = []) => {
        sendMessage(content, attachments);
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
        <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
            {/* Top Pinned Messages Banner */}
            {pinnedList.length > 0 && latestPinned && (
                <div
                    onClick={() => handleJumpToMessage(latestPinned.id)}
                    className="px-3 py-1.5 bg-orange-50/80 border-b border-orange-100 flex items-center justify-between gap-2 text-xs text-slate-800 cursor-pointer hover:bg-orange-100/80 transition-colors shrink-0 select-none shadow-2xs group"
                >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div className="w-4 h-4 rounded-full bg-orange-100 text-[#F38820] flex items-center justify-center shrink-0">
                            <Pin className="w-2.5 h-2.5 fill-current" />
                        </div>
                        <div className="flex items-center gap-1 min-w-0 flex-1 text-[11px]">
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

                    <div className="flex items-center gap-1.5 shrink-0">
                        {pinnedList.length > 1 && (
                            <span className="text-[10px] font-semibold text-[#F38820] bg-white px-1.5 py-0.5 rounded-full border border-orange-200">
                                {pinnedList.length}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowPinnedModal(true);
                            }}
                            className="text-[#F38820] hover:text-orange-700 font-medium flex items-center gap-0.5 text-[11px] hover:underline cursor-pointer"
                        >
                            <span>Xem</span>
                            <ChevronRight className="w-3 h-3" />
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

            {/* Messages Thread Pane */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 py-3 flex flex-col bg-white min-h-0"
            >
                {loadingMoreMessages && (
                    <div className="text-center py-1 text-[11px] text-slate-400 font-mono animate-pulse">
                        ĐANG TẢI TIN CŨ HƠN...
                    </div>
                )}
                {loadingMessages ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-mono">
                        ĐANG TẢI LỊCH SỬ...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-500 font-sans">
                        Hãy bắt đầu cuộc trò chuyện!
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
                <div ref={messagesEndRef} className="h-0 w-0 shrink-0" />
            </div>

            {/* Typing status bar */}
            {getTypingText() && (
                <div className="px-3 py-1 text-[10px] text-slate-500 font-sans bg-gray-50 border-t border-gray-100 italic animate-pulse shrink-0">
                    {getTypingText()}
                </div>
            )}

            {/* Input Form with Autocomplete */}
            <div className="shrink-0">
                <ChatInputWithAutocomplete
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                    room={activeRoom}
                />
            </div>
        </div>
    );
}
