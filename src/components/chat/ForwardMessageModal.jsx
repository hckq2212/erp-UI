import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, Check, Send, Share2, Users, User, Image, FileText, Loader2 } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";

export function ForwardMessageModal({ isOpen, onClose, message, messageToForward }) {
    const targetMessage = message || messageToForward;
    const { rooms, forwardMessage, selfUserId } = useChatStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRoomIds, setSelectedRoomIds] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSelectedRoomIds([]);
            setSearchTerm("");
            setIsSending(false);
            setSentSuccess(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const filteredRooms = useMemo(() => {
        if (!rooms || !Array.isArray(rooms)) return [];
        const term = searchTerm.toLowerCase().trim();
        return rooms.filter((r) => {
            if (!term) return true;
            const roomName = (r.name || "").toLowerCase();
            const otherUser = r.participants?.find((p) => String(p.userId) !== String(selfUserId))?.user;
            const otherName = (otherUser?.fullName || otherUser?.username || "").toLowerCase();
            return roomName.includes(term) || otherName.includes(term);
        });
    }, [rooms, searchTerm, selfUserId]);

    if (!isOpen || !targetMessage) return null;

    const toggleSelectRoom = (roomId) => {
        setSelectedRoomIds((prev) =>
            prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
        );
    };

    const handleSendForward = async () => {
        if (selectedRoomIds.length === 0 || isSending) return;
        setIsSending(true);
        try {
            await forwardMessage(targetMessage.roomId, targetMessage.id, selectedRoomIds);
            setSentSuccess(true);
            setTimeout(() => {
                onClose();
            }, 600);
        } catch (err) {
            console.error("Failed to forward message:", err);
            setIsSending(false);
        }
    };

    const hasAttachments = Boolean(targetMessage.attachments && targetMessage.attachments.length > 0);
    const firstAttachment = hasAttachments ? targetMessage.attachments[0] : null;
    const isImg = firstAttachment?.type === "image" || /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(firstAttachment?.url || "");

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
            onClick={onClose}
        >
            <div
                className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-gray-100 w-full max-w-[460px] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-50 text-[#F38820] flex items-center justify-center font-bold">
                            <Share2 className="w-4 h-4" />
                        </div>
                        <h3 className="text-[15px] font-bold text-slate-900 leading-tight">
                            Chuyển tiếp tin nhắn
                        </h3>
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

                {/* Preview Tin nhắn cần chuyển tiếp */}
                <div className="px-5 py-2.5 bg-orange-50/40 border-b border-orange-100/60 shrink-0">
                    <div className="text-[11px] font-semibold text-[#F38820] uppercase tracking-wider mb-1">
                        Nội dung chuyển tiếp
                    </div>
                    <div className="text-xs text-slate-700 font-sans line-clamp-2 bg-white px-2.5 py-1.5 rounded-lg border border-orange-200/50">
                        {targetMessage.content ? (
                            <span>{targetMessage.content}</span>
                        ) : hasAttachments ? (
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                                {isImg ? <Image className="w-3.5 h-3.5 text-blue-500" /> : <FileText className="w-3.5 h-3.5 text-orange-500" />}
                                {firstAttachment?.name || "Tệp đính kèm"}
                            </span>
                        ) : (
                            <span className="italic text-gray-400">Không có văn bản</span>
                        )}
                    </div>
                </div>

                {/* Ô tìm kiếm phòng nhận */}
                <div className="px-5 py-2.5 border-b border-gray-100 shrink-0">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm người nhận hoặc nhóm chat..."
                            className="w-full pl-9 pr-3 py-1.5 bg-gray-100/80 hover:bg-gray-100 focus:bg-white text-xs rounded-xl border border-transparent focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Danh sách phòng chat để chọn */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-[220px]">
                    {filteredRooms.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-xs text-gray-400">
                            Không tìm thấy cuộc trò chuyện nào
                        </div>
                    ) : (
                        filteredRooms.map((room) => {
                            const isSelected = selectedRoomIds.includes(room.id);
                            const otherUser = room.participants?.find((p) => String(p.userId) !== String(selfUserId))?.user;
                            const roomName = room.isGroup
                                ? (room.name || "Nhóm trò chuyện")
                                : (otherUser?.fullName || otherUser?.username || "Thành viên");

                            return (
                                <div
                                    key={room.id}
                                    onClick={() => toggleSelectRoom(room.id)}
                                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                                        isSelected
                                            ? "bg-orange-50/80 border border-orange-200/60"
                                            : "hover:bg-gray-100/70 border border-transparent"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="relative shrink-0">
                                            {room.avatarUrl ? (
                                                <img
                                                    src={room.avatarUrl}
                                                    alt={roomName}
                                                    className="w-8 h-8 rounded-full object-cover border border-gray-100"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#F38820] flex items-center justify-center text-xs font-bold">
                                                    {room.isGroup ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-slate-800 truncate">
                                                {roomName}
                                            </span>
                                            <span className="text-[11px] text-gray-400">
                                                {room.isGroup ? `${room.participants?.length || 0} thành viên` : "Trò chuyện trực tiếp"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Checkbox */}
                                    <div
                                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                            isSelected
                                                ? "bg-[#F38820] text-white"
                                                : "border-2 border-gray-300 hover:border-gray-400"
                                        }`}
                                    >
                                        {isSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer với nút Gửi */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <span className="text-xs text-slate-500 font-medium">
                        Đã chọn: <strong className="text-[#F38820]">{selectedRoomIds.length}</strong> cuộc trò chuyện
                    </span>

                    <button
                        type="button"
                        onClick={handleSendForward}
                        disabled={selectedRoomIds.length === 0 || isSending}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedRoomIds.length > 0 && !isSending
                                ? "bg-[#F38820] hover:bg-[#e07716] text-white shadow-sm active:scale-98"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Đang chuyển tiếp...</span>
                            </>
                        ) : sentSuccess ? (
                            <>
                                <Check className="w-4 h-4 text-white" />
                                <span>Đã gửi thành công!</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Gửi ngay</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
