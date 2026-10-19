import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Pin, PinOff, ArrowUpRight, MessageSquare, Image, FileText } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { formatChatTime } from "../../utils/chatTokenHelper";

export function PinnedMessagesModal({ isOpen, onClose, onJumpToMessage }) {
    const { activeRoom, pinnedMessagesByRoom, pinMessage, fetchPinnedMessages, selfUserId } = useChatStore();

    useEffect(() => {
        if (isOpen && activeRoom?.id) {
            fetchPinnedMessages(activeRoom.id);
        }
    }, [isOpen, activeRoom?.id, fetchPinnedMessages]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !activeRoom) return null;

    const pinnedList = pinnedMessagesByRoom[activeRoom.id] || [];

    const handleUnpin = async (e, msgId) => {
        e.stopPropagation();
        await pinMessage(activeRoom.id, msgId, false);
    };

    const handleJump = (msgId) => {
        onClose();
        if (typeof onJumpToMessage === "function") {
            onJumpToMessage(msgId);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
            onClick={onClose}
        >
            <div
                className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-gray-100 w-full max-w-[500px] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-50 text-[#F38820] flex items-center justify-center font-bold">
                            <Pin className="w-4 h-4 fill-current" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-bold text-slate-900 leading-tight">
                                Tin nhắn đã ghim
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {pinnedList.length} tin nhắn được ghim trong hội thoại
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        title="Đóng (Esc)"
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Danh sách tin nhắn đã ghim */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 min-h-[220px]">
                    {pinnedList.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                            <div className="w-12 h-12 rounded-full bg-orange-50/70 text-orange-400 flex items-center justify-center mb-2.5">
                                <Pin className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">
                                Chưa có tin nhắn nào được ghim
                            </span>
                            <span className="text-xs text-slate-400 mt-1 max-w-[260px]">
                                Ghim các tin nhắn quan trọng để mọi thành viên có thể tìm lại dễ dàng.
                            </span>
                        </div>
                    ) : (
                        pinnedList.map((msg) => {
                            const senderName = msg.sender?.fullName || msg.sender?.username || "Thành viên";
                            const hasAttachments = Boolean(msg.attachments && msg.attachments.length > 0);
                            const firstAttachment = hasAttachments ? msg.attachments[0] : null;
                            const isImg = firstAttachment?.type === "image" || /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(firstAttachment?.url || "");

                            return (
                                <div
                                    key={msg.id}
                                    onClick={() => handleJump(msg.id)}
                                    className="p-3 rounded-xl border border-gray-100 hover:border-orange-200 bg-white hover:bg-orange-50/30 transition-all cursor-pointer group shadow-2xs relative"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {msg.sender?.avatarUrl ? (
                                                <img
                                                    src={msg.sender.avatarUrl}
                                                    alt={senderName}
                                                    className="w-7 h-7 rounded-full object-cover border border-gray-100 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-orange-100 text-[#F38820] flex items-center justify-center text-xs font-bold shrink-0">
                                                    {(senderName[0] || "T").toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-xs font-bold text-slate-800">
                                                {senderName}
                                            </span>
                                            <span className="text-[11px] text-gray-400">
                                                {formatChatTime(msg.pinnedAt || msg.createdAt)}
                                            </span>
                                        </div>

                                        {/* Actions: Bỏ ghim & Đi tới tin nhắn */}
                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={(e) => handleUnpin(e, msg.id)}
                                                title="Bỏ ghim tin nhắn này"
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                            >
                                                <PinOff className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleJump(msg.id);
                                                }}
                                                title="Đi tới vị trí tin nhắn này"
                                                className="p-1.5 rounded-lg text-gray-400 group-hover:text-[#F38820] hover:bg-orange-100/60 transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-medium"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preview Nội dung tin nhắn */}
                                    <div className="mt-2 text-[13px] text-slate-700 font-sans line-clamp-3 pl-9">
                                        {msg.content ? (
                                            <span>{msg.content}</span>
                                        ) : hasAttachments ? (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                {isImg ? (
                                                    <>
                                                        <Image className="w-3.5 h-3.5 text-blue-500" />
                                                        <span>[Hình ảnh] {firstAttachment?.name || ""}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileText className="w-3.5 h-3.5 text-orange-500" />
                                                        <span>[Tệp đính kèm] {firstAttachment?.name || ""}</span>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="italic text-gray-400">Không có nội dung văn bản</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
