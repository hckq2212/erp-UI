import React from "react";
import {
    X,
    MessageSquare,
    AtSign,
    Mail,
    Phone,
    Shield,
    Crown,
    UserMinus
} from "lucide-react";
import { useChatStore } from "../../store/useChatStore";

export function MemberProfileModal({
    isOpen,
    onClose,
    participant,
    activeRoom,
    selfUserId,
    onlineUsers = [],
    role = "MEMBER",
    allUsers = [],
    onSetRole,
    onRemoveMember
}) {
    const { rooms, selectRoom, createDM } = useChatStore();

    if (!isOpen || !participant) return null;

    const targetUserId = participant.userId || participant.user?.id;
    const isSelf = targetUserId === selfUserId;

    // Tìm thông tin chi tiết đầy đủ của nhân sự từ allUsers nếu có
    const fullUser = allUsers.find(u => u.id === targetUserId) || participant.user || {};
    const displayName = fullUser.fullName || fullUser.username || "Thành viên";
    const username = fullUser.username || "";
    const email = fullUser.email || "";
    const phone = fullUser.phone || fullUser.phoneNumber || "";
    const avatarUrl = fullUser.avatarUrl || participant.user?.avatarUrl;
    const systemRole = fullUser.role || fullUser.account?.role;
    const isOnline = onlineUsers.includes(targetUserId);

    // Xử lý: Nhắn tin riêng (1-1)
    const handleDirectMessage = async () => {
        onClose();
        if (isSelf) return;

        // Tìm xem đã có phòng chat 1-1 với người này chưa
        const existingDM = rooms.find(
            room => !room.isGroup && room.participants?.some(p => (p.userId || p.user?.id) === targetUserId)
        );

        if (existingDM) {
            selectRoom(existingDM);
        } else {
            await createDM(targetUserId);
        }
    };

    // Xử lý: Nhắc tên (@Mention) vào khung chat
    const handleMention = () => {
        onClose();
        window.dispatchEvent(
            new CustomEvent("chat:mention_user", {
                detail: {
                    id: targetUserId,
                    fullName: displayName,
                    username: username
                }
            })
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] animate-fade-in">
            {/* Modal Card */}
            <div
                className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 1. Header Banner */}
                <div className="relative bg-gradient-to-b from-orange-100/70 via-orange-50/40 to-white pt-8 pb-3 px-6 flex flex-col items-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-gray-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                        title="Đóng (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Avatar lớn chuẩn Header */}
                    <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-full overflow-hidden shadow-md border-3 border-white bg-orange-100 flex items-center justify-center text-[#F38820]">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            ) : (
                                <span className="font-black text-2xl text-[#F38820]">
                                    {(displayName[0] || "U").toUpperCase()}
                                </span>
                            )}
                        </div>

                        {/* Online Indicator */}
                        <span
                            className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                                isOnline ? "bg-green-500" : "bg-gray-300"
                            }`}
                            title={isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                        />
                    </div>

                    {/* Họ tên & Username */}
                    <h3 className="text-base font-bold text-slate-850 text-center leading-snug">
                        {displayName}
                        {isSelf && <span className="text-xs text-gray-400 font-normal ml-1">(Bạn)</span>}
                    </h3>
                    {username && (
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                            @{username}
                        </p>
                    )}

                    {/* Role Badges */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
                        {role === "ADMIN" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                                👑 Trưởng nhóm
                            </span>
                        )}
                        {role === "DEPUTY" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-100 border border-sky-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                                🛡️ Phó nhóm
                            </span>
                        )}
                        {role === "MEMBER" && (
                            <span className="inline-flex items-center text-[11px] font-medium text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                                Thành viên
                            </span>
                        )}
                        {systemRole && (
                            <span className="inline-flex items-center text-[10px] font-black uppercase text-[#F38820] bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full">
                                {systemRole}
                            </span>
                        )}
                    </div>
                </div>

                {/* 2. Contact Details Info */}
                <div className="px-6 py-3 space-y-2 text-xs">
                    {email && (
                        <div className="flex items-center gap-2.5 text-gray-600 p-2 rounded-xl bg-gray-50/80 border border-gray-100">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <a
                                href={`mailto:${email}`}
                                className="truncate hover:text-[#F38820] transition-colors font-sans"
                                title={email}
                            >
                                {email}
                            </a>
                        </div>
                    )}
                    {phone && (
                        <div className="flex items-center gap-2.5 text-gray-600 p-2 rounded-xl bg-gray-50/80 border border-gray-100">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <a
                                href={`tel:${phone}`}
                                className="truncate hover:text-[#F38820] transition-colors font-mono"
                            >
                                {phone}
                            </a>
                        </div>
                    )}
                </div>

                {/* 3. Action Buttons */}
                <div className="p-6 pt-2 space-y-2">
                    {/* Nhắn tin riêng 1-1 (ẩn nếu là chính mình) */}
                    {!isSelf && (
                        <button
                            type="button"
                            onClick={handleDirectMessage}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#F38820] hover:bg-[#d97616] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span>Nhắn tin riêng</span>
                        </button>
                    )}

                    {/* Nhắc tên vào khung chat (@mention) */}
                    <button
                        type="button"
                        onClick={handleMention}
                        className="w-full py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100/90 text-[#F38820] border border-orange-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                        title="Tag người này vào tin nhắn"
                    >
                        <AtSign className="w-3.5 h-3.5" />
                        <span>Nhắc tên</span>
                    </button>

                    {/* 4. Tùy chọn Quản trị nhóm (nếu có quyền) */}
                    {(onSetRole || onRemoveMember) && !isSelf && (
                        <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-gray-400 font-medium">Tùy chọn quyền:</span>
                            <div className="flex items-center gap-2">
                                {onSetRole && role === "MEMBER" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            onSetRole(targetUserId, displayName, "DEPUTY");
                                        }}
                                        className="text-sky-600 hover:text-sky-700 hover:underline font-semibold cursor-pointer text-[11px]"
                                    >
                                        Bổ nhiệm Phó nhóm
                                    </button>
                                )}
                                {onSetRole && role === "DEPUTY" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            onSetRole(targetUserId, displayName, "MEMBER");
                                        }}
                                        className="text-gray-500 hover:text-gray-700 hover:underline font-semibold cursor-pointer text-[11px]"
                                    >
                                        Hủy Phó nhóm
                                    </button>
                                )}
                                {onRemoveMember && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            onRemoveMember(targetUserId, displayName);
                                        }}
                                        className="text-red-500 hover:text-red-700 hover:underline font-semibold cursor-pointer text-[11px]"
                                    >
                                        Xóa khỏi nhóm
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
