import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Smile } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";

function getInitials(name) {
    if (!name || typeof name !== "string") return "?";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name) {
    const colors = [
        "#10b981", // green
        "#3b82f6", // blue
        "#8b5cf6", // purple
        "#f59e0b", // amber
        "#ec4899", // pink
        "#06b6d4", // cyan
        "#ef4444", // red
        "#6366f1", // indigo
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export function MessageReactionsModal({ isOpen, onClose, reactions = [], selfUserId }) {
    const { activeRoom } = useChatStore();
    const [activeTab, setActiveTab] = useState("all");

    // Đóng modal khi nhấn Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Map participants để bổ sung info và xác định admin/trưởng nhóm
    const { participantsMap, adminSet } = useMemo(() => {
        const pMap = {};
        const aSet = new Set();
        if (activeRoom?.participants && Array.isArray(activeRoom.participants)) {
            activeRoom.participants.forEach((p) => {
                const uid = String(p.userId || p.user?.id || "");
                if (!uid) return;
                pMap[uid] = p.user || p;
                if (p.role === "ADMIN" || (activeRoom.creatorId && uid === String(activeRoom.creatorId))) {
                    aSet.add(uid);
                }
            });
            // Nếu là nhóm chưa có admin rõ ràng, người đầu tiên là admin
            if (activeRoom.isGroup && aSet.size === 0 && activeRoom.participants.length > 0) {
                const firstUid = String(activeRoom.participants[0].userId || activeRoom.participants[0].user?.id || "");
                if (firstUid) aSet.add(firstUid);
            }
        } else if (activeRoom?.creatorId) {
            aSet.add(String(activeRoom.creatorId));
        }
        return { participantsMap: pMap, adminSet: aSet };
    }, [activeRoom]);

    // Thống kê theo emoji và tổng cộng
    const { tabItems, userReactionsList, totalCount } = useMemo(() => {
        if (!reactions || !Array.isArray(reactions) || reactions.length === 0) {
            return { tabItems: [], userReactionsList: [], totalCount: 0 };
        }

        const emojiStats = {};
        const aggregatedUsers = {};

        reactions.forEach((r) => {
            if (!r || !r.emoji) return;
            const emoji = r.emoji;
            const uid = String(r.userId || "");
            const count = Number(r.count) || 1;

            if (!emojiStats[emoji]) {
                emojiStats[emoji] = 0;
            }
            emojiStats[emoji] += count;

            const key = `${uid}_${emoji}`;
            if (!aggregatedUsers[key]) {
                const fallbackUser = participantsMap[uid] || {};
                const name = (String(selfUserId) === uid)
                    ? (r.user?.fullName || fallbackUser.fullName || "Bạn")
                    : (r.user?.fullName || r.user?.username || fallbackUser.fullName || fallbackUser.username || "Thành viên");

                const avatarUrl = r.user?.avatarUrl || fallbackUser.avatarUrl || null;
                const isAdmin = adminSet.has(uid);

                aggregatedUsers[key] = {
                    key,
                    userId: uid,
                    emoji,
                    count: 0,
                    name,
                    avatarUrl,
                    isAdmin,
                    isSelf: String(selfUserId) === uid,
                    initials: getInitials(name),
                    avatarColor: getAvatarColor(name)
                };
            }
            aggregatedUsers[key].count += count;
        });

        const emojiList = Object.entries(emojiStats)
            .map(([emoji, count]) => ({ emoji, count }))
            .sort((a, b) => b.count - a.count);

        const total = emojiList.reduce((sum, item) => sum + item.count, 0);

        const users = Object.values(aggregatedUsers).sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            if (a.isSelf && !b.isSelf) return -1;
            if (!a.isSelf && b.isSelf) return 1;
            if (a.isAdmin && !b.isAdmin) return -1;
            if (!a.isAdmin && b.isAdmin) return 1;
            return 0;
        });

        return {
            tabItems: emojiList,
            userReactionsList: users,
            totalCount: total
        };
    }, [reactions, selfUserId, participantsMap, adminSet]);

    const filteredUsers = useMemo(() => {
        if (activeTab === "all") return userReactionsList;
        return userReactionsList.filter((item) => item.emoji === activeTab);
    }, [userReactionsList, activeTab]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-gray-100 w-full max-w-[420px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 select-none"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Đồng bộ chuẩn ERP Getvini */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-50 text-[#F38820] flex items-center justify-center font-bold text-xs">
                            <Smile className="w-4 h-4 text-[#F38820]" />
                        </div>
                        <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                            Biểu cảm
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        title="Đóng (Esc)"
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* 2 Cột: Tabs bên trái (Light), Danh sách người thả biểu cảm bên phải (Light) */}
                <div className="flex h-[360px] sm:h-[390px]">
                    {/* Cột trái: Tabs */}
                    <div className="w-[120px] shrink-0 border-r border-gray-100 py-2.5 flex flex-col gap-1.5 bg-slate-50/70 select-none overflow-y-auto">
                        {/* Tab Tất cả */}
                        <button
                            type="button"
                            onClick={() => setActiveTab("all")}
                            className={`flex items-center justify-between mx-2 px-3 py-2 text-[13px] rounded-xl transition-all cursor-pointer ${
                                activeTab === "all"
                                    ? "bg-[#F38820] text-white font-bold shadow-sm"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-gray-200/60"
                            }`}
                        >
                            <span>Tất cả</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                activeTab === "all"
                                    ? "bg-white/25 text-white"
                                    : "text-gray-500 bg-gray-200/70"
                            }`}>
                                {totalCount}
                            </span>
                        </button>

                        {/* Từng biểu cảm */}
                        {tabItems.map((tab) => {
                            const isActive = activeTab === tab.emoji;
                            return (
                                <button
                                    key={tab.emoji}
                                    type="button"
                                    onClick={() => setActiveTab(tab.emoji)}
                                    className={`flex items-center justify-between mx-2 px-3 py-2 text-[13px] rounded-xl transition-all cursor-pointer ${
                                        isActive
                                            ? "bg-[#F38820] text-white font-bold shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-gray-200/60"
                                    }`}
                                >
                                    <span className="text-[16px] leading-none">
                                        {tab.emoji}
                                    </span>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                        isActive
                                            ? "bg-white/25 text-white"
                                            : "text-gray-500 bg-gray-200/70"
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Cột phải: Danh sách người phản ứng */}
                    <div className="flex-1 overflow-y-auto p-2.5 space-y-1 bg-white">
                        {filteredUsers.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                                Không có phản ứng nào
                            </div>
                        ) : (
                            filteredUsers.map((item) => (
                                <div
                                    key={item.key}
                                    className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-orange-50/40 transition-colors"
                                >
                                    {/* Left: Avatar + Name */}
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="relative shrink-0 w-10 h-10">
                                            {item.avatarUrl ? (
                                                <img
                                                    src={item.avatarUrl}
                                                    alt={item.name}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-2xs"
                                                />
                                            ) : (
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-[13px] select-none shadow-2xs"
                                                    style={{ backgroundColor: item.avatarColor }}
                                                >
                                                    {item.initials}
                                                </div>
                                            )}

                                            {/* Huy hiệu vương miện cho Trưởng nhóm / Admin */}
                                            {item.isAdmin && (
                                                <div
                                                    title="Trưởng nhóm"
                                                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center text-[9px] shadow-xs border-1.5 border-white leading-none"
                                                >
                                                    👑
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-slate-800 text-[14px] font-semibold truncate max-w-[150px] sm:max-w-[180px]">
                                                {item.name}
                                            </span>
                                            {item.isSelf && (
                                                <span className="text-[10px] font-bold text-[#F38820] bg-orange-100/90 px-1.5 py-0.5 rounded-md shrink-0">
                                                    Bạn
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Emoji + Count */}
                                    <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-full shadow-2xs">
                                        <span className="text-[16px] leading-none">
                                            {item.emoji}
                                        </span>
                                        <span className="text-slate-700 text-xs font-bold">
                                            {item.count}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
