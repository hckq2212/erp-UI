import React, { useState, useMemo, useEffect } from "react";
import {
    User,
    Bell,
    Search,
    ShieldCheck,
    Pin,
    Palette,
    Heart,
    Type,
    Image as ImageIcon,
    FileText,
    ChevronDown,
    ChevronUp,
    Users as UsersIcon,
    Crown,
    Shield,
    MoreVertical,
    UserMinus,
    Download,
    ExternalLink
} from "lucide-react";
import { useGetUsersQuery } from "../../api/users";
import { useChatStore } from "../../store/useChatStore";
import { RoomAvatar } from "./RoomAvatar";
import { MemberProfileModal } from "./MemberProfileModal";

export function ChatInfoSidebar({
    activeRoom,
    selfUserId,
    onlineUsers,
    getRoomName,
    onClose // in case they want a close button, or toggle
}) {
    const { data: usersData } = useGetUsersQuery();
    const allUsers = Array.isArray(usersData?.data) ? usersData.data : (Array.isArray(usersData) ? usersData : []);
    const { updateParticipantRole, removeParticipant, messages } = useChatStore();

    const [openSections, setOpenSections] = useState({
        chatInfo: true,
        members: true,
        customize: false,
        photos: true,
        files: true
    });

    const [menuTargetId, setMenuTargetId] = useState(null);
    const [selectedProfileParticipant, setSelectedProfileParticipant] = useState(null);

    // Trích xuất toàn bộ hình ảnh và tài liệu từ lịch sử tin nhắn phòng chat
    const { mediaItems, docItems } = useMemo(() => {
        const media = [];
        const docs = [];

        (messages || []).forEach(msg => {
            if (!msg.attachments || !Array.isArray(msg.attachments)) return;
            msg.attachments.forEach((att, idx) => {
                const isImg = att.type === "image" || /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(att.url || "");
                const isAudio = att.type === "audio" || /\.(webm|mp3|wav|ogg|m4a)($|\?)/i.test(att.url || "");

                if (isImg) {
                    media.push({
                        id: `${msg.id}-${idx}`,
                        url: att.url,
                        name: att.name || "Hình ảnh",
                        createdAt: msg.createdAt,
                        senderName: msg.sender?.fullName || msg.sender?.username || "Thành viên"
                    });
                } else if (!isAudio) {
                    docs.push({
                        id: `${msg.id}-${idx}`,
                        url: att.url,
                        name: att.name || "Tài liệu",
                        size: att.size,
                        type: att.type,
                        createdAt: msg.createdAt,
                        senderName: msg.sender?.fullName || msg.sender?.username || "Thành viên"
                    });
                }
            });
        });

        return {
            mediaItems: media.reverse(),
            docItems: docs.reverse()
        };
    }, [messages]);

    const formatFileSize = (bytes) => {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (dateStr) => {
        try {
            const d = new Date(dateStr);
            return `${d.getDate()}/${d.getMonth() + 1}`;
        } catch {
            return "";
        }
    };

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Đóng menu quản lý thành viên khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest("[data-member-menu]")) {
                setMenuTargetId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Tính toán vai trò thực tế: đảm bảo nhóm luôn có 1 Trưởng nhóm hiển thị rõ ràng
    const participantRoles = useMemo(() => {
        if (!activeRoom?.participants) return {};
        const roles = {};
        let adminFound = false;

        activeRoom.participants.forEach((p) => {
            const uid = p.userId || p.user?.id;
            if (!uid) return;
            if (p.role === "ADMIN" || (activeRoom.creatorId && uid === activeRoom.creatorId)) {
                roles[uid] = "ADMIN";
                adminFound = true;
            } else if (p.role === "DEPUTY") {
                roles[uid] = "DEPUTY";
            }
        });

        // Nếu là phòng nhóm mà chưa có ai mang ADMIN (nhóm cũ tạo trước khi có cột role),
        // tự động gán thành viên đầu tiên làm Trưởng nhóm hiển thị
        if (activeRoom.isGroup && !adminFound && activeRoom.participants.length > 0) {
            const first = activeRoom.participants[0];
            const firstUid = first.userId || first.user?.id;
            if (firstUid) {
                roles[firstUid] = "ADMIN";
            }
        }

        return roles;
    }, [activeRoom?.participants, activeRoom?.creatorId, activeRoom?.isGroup]);

    const getEffectiveRole = (p) => {
        const uid = p.userId || p.user?.id;
        if (uid && participantRoles[uid]) return participantRoles[uid];
        return p.role || "MEMBER";
    };

    const myParticipant = activeRoom?.participants?.find(p => (p.userId || p.user?.id) === selfUserId);
    const myRole = myParticipant ? getEffectiveRole(myParticipant) : "MEMBER";

    // Sắp xếp: Trưởng nhóm -> Phó nhóm -> Thành viên -> Bạn
    const sortedParticipants = useMemo(() => {
        if (!activeRoom?.participants) return [];
        return [...activeRoom.participants].sort((a, b) => {
            const roleOrder = { ADMIN: 1, DEPUTY: 2, MEMBER: 3 };
            const roleA = roleOrder[getEffectiveRole(a)] || 3;
            const roleB = roleOrder[getEffectiveRole(b)] || 3;
            if (roleA !== roleB) return roleA - roleB;
            const nameA = a.user?.fullName || a.user?.username || "";
            const nameB = b.user?.fullName || b.user?.username || "";
            return nameA.localeCompare(nameB, "vi");
        });
    }, [activeRoom?.participants, participantRoles]);

    const handleSetRole = async (targetUserId, targetName, newRole) => {
        setMenuTargetId(null);
        let confirmMsg = "";
        if (newRole === "ADMIN") {
            confirmMsg = `Bạn có chắc chắn muốn chuyển quyền Trưởng nhóm cho "${targetName}" không? Bạn sẽ trở thành Phó nhóm.`;
        } else if (newRole === "DEPUTY") {
            confirmMsg = `Bổ nhiệm "${targetName}" làm Phó nhóm?`;
        } else {
            confirmMsg = `Hủy quyền Phó nhóm của "${targetName}"?`;
        }

        if (window.confirm(confirmMsg)) {
            await updateParticipantRole(activeRoom.id, targetUserId, newRole);
        }
    };

    const handleRemoveMember = async (targetUserId, targetName) => {
        setMenuTargetId(null);
        if (window.confirm(`Bạn có chắc chắn muốn xóa "${targetName}" khỏi nhóm chat này không?`)) {
            await removeParticipant(activeRoom.id, targetUserId);
        }
    };

    if (!activeRoom) return null;

    const getOtherParticipant = (room) => {
        if (!room) return null;
        const participant = room.participants?.find(p => p.userId !== selfUserId);
        if (participant?.user) return participant.user;
        if (participant?.userId) {
            return allUsers.find(u => u.id === participant.userId) || null;
        }
        return null;
    };

    const otherUser = getOtherParticipant(activeRoom);
    const isOnline = !activeRoom.isGroup && onlineUsers.includes(otherUser?.id);

    return (
        <div className="w-80 border-l border-gray-200 flex flex-col h-full bg-white overflow-y-auto flex-shrink-0 animate-fade-in select-none">
            {/* 1. Header Details */}
            <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-gray-100 flex-shrink-0">
                <div className="relative mb-3">
                    <RoomAvatar
                        room={activeRoom}
                        user={otherUser}
                        selfUserId={selfUserId}
                        allUsers={allUsers}
                        size="xl"
                    />
                    {isOnline && (
                        <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-20" />
                    )}
                </div>

                <h2 className="text-base font-bold text-slate-800 text-center leading-tight">
                    {getRoomName(activeRoom)}
                </h2>
            </div>

            {/* 2. Collapsible Sections */}
            <div className="flex-1 py-2">
                {/* A. Thông tin về đoạn chat */}
                <div className="border-b border-gray-100 last:border-b-0">
                    <button
                        onClick={() => toggleSection("chatInfo")}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-[13px] font-bold text-slate-850">Thông tin về đoạn chat</span>
                        {openSections.chatInfo ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                    </button>
                    {openSections.chatInfo && (
                        <div className="px-2 pb-2 animate-slide-down">
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 transition-colors text-[13px] text-slate-750 font-semibold active:scale-99">
                                <Pin className="w-4 h-4 text-slate-800" />
                                <span>Xem tin nhắn đã ghim</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* B. Danh sách thành viên (Chỉ hiển thị nếu là Group Chat) */}
                {activeRoom.isGroup && (
                    <div className="border-b border-gray-100 last:border-b-0">
                        <button
                            onClick={() => toggleSection("members")}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-[13px] font-bold text-slate-850">
                                Thành viên nhóm ({activeRoom.participants?.length || 0})
                            </span>
                            {openSections.members ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                        </button>
                        {openSections.members && (
                            <div className="px-3 pb-3 max-h-72 overflow-y-auto space-y-1.5 animate-slide-down">
                                {sortedParticipants.map((p) => {
                                    const targetUserId = p.userId || p.user?.id;
                                    const isMemberOnline = onlineUsers.includes(p.user?.id);
                                    const isSelf = targetUserId === selfUserId;
                                    const role = getEffectiveRole(p);
                                    const memberName = p.user?.fullName || p.user?.username || "Thành viên";
                                    const canManage = (myRole === "ADMIN" && !isSelf) || (myRole === "DEPUTY" && role === "MEMBER" && !isSelf);

                                    return (
                                        <div
                                            key={p.id || targetUserId}
                                            onClick={() => setSelectedProfileParticipant(p)}
                                            className="relative flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-orange-50/50 transition-colors cursor-pointer group"
                                            title="Nhấn để xem thông tin nhân sự & tùy chọn"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-[#F38820] border border-orange-200/60 overflow-hidden flex items-center justify-center font-black text-xs shadow-2xs">
                                                        {p.user?.avatarUrl ? (
                                                            <img
                                                                src={p.user.avatarUrl}
                                                                alt={memberName}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = "none";
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="font-black text-[#F38820]">
                                                                {memberName.toUpperCase()[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isMemberOnline && (
                                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full z-10" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[13px] font-semibold text-slate-850 truncate max-w-[125px] group-hover:text-[#F38820] transition-colors">
                                                            {memberName}
                                                        </span>
                                                        {isSelf && (
                                                            <span className="text-[11px] text-gray-500 font-normal">
                                                                (Bạn)
                                                            </span>
                                                        )}
                                                        {role === "ADMIN" && (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                                                                👑 Trưởng nhóm
                                                            </span>
                                                        )}
                                                        {role === "DEPUTY" && (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-800 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                                                                🛡️ Phó nhóm
                                                            </span>
                                                        )}
                                                    </div>
                                                    {p.user?.username && (
                                                        <div className="text-[10px] text-gray-400 font-mono truncate leading-none mt-0.5">
                                                            @{p.user.username}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Menu (Bổ nhiệm phó nhóm / Chuyển trưởng nhóm / Xóa khỏi nhóm) */}
                                            {canManage && (
                                                <div className="relative shrink-0" data-member-menu>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMenuTargetId(menuTargetId === (p.id || targetUserId) ? null : (p.id || targetUserId));
                                                        }}
                                                        className="w-7 h-7 rounded-lg hover:bg-gray-200/70 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                                                        title="Tùy chọn thành viên"
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5" />
                                                    </button>

                                                    {menuTargetId === (p.id || targetUserId) && (
                                                        <div
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 animate-fade-in text-xs font-sans"
                                                        >
                                                            {myRole === "ADMIN" && role === "MEMBER" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetRole(targetUserId, memberName, "DEPUTY")}
                                                                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-orange-50 hover:text-[#F38820] text-slate-700 transition-colors cursor-pointer"
                                                                >
                                                                    <Shield className="w-3.5 h-3.5 text-sky-600" />
                                                                    <span>Bổ nhiệm Phó nhóm</span>
                                                                </button>
                                                            )}

                                                            {myRole === "ADMIN" && role === "DEPUTY" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetRole(targetUserId, memberName, "MEMBER")}
                                                                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-orange-50 hover:text-[#F38820] text-slate-700 transition-colors cursor-pointer"
                                                                >
                                                                    <Shield className="w-3.5 h-3.5 text-gray-400" />
                                                                    <span>Hủy quyền Phó nhóm</span>
                                                                </button>
                                                            )}

                                                            {myRole === "ADMIN" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetRole(targetUserId, memberName, "ADMIN")}
                                                                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-amber-50 hover:text-amber-700 text-slate-700 transition-colors cursor-pointer"
                                                                >
                                                                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                                                                    <span>Chuyển quyền Trưởng nhóm</span>
                                                                </button>
                                                            )}

                                                            <div className="my-1 border-t border-gray-100" />

                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveMember(targetUserId, memberName)}
                                                                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                                                            >
                                                                <UserMinus className="w-3.5 h-3.5 text-red-500" />
                                                                <span>Xóa khỏi nhóm</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Member Profile & Actions Modal */}
                {selectedProfileParticipant && (
                    <MemberProfileModal
                        isOpen={Boolean(selectedProfileParticipant)}
                        onClose={() => setSelectedProfileParticipant(null)}
                        participant={selectedProfileParticipant}
                        activeRoom={activeRoom}
                        selfUserId={selfUserId}
                        onlineUsers={onlineUsers}
                        role={getEffectiveRole(selectedProfileParticipant)}
                        allUsers={allUsers}
                        onSetRole={myRole === "ADMIN" ? handleSetRole : null}
                        onRemoveMember={(myRole === "ADMIN" || myRole === "DEPUTY") ? handleRemoveMember : null}
                    />
                )}


                {/* D. Ảnh/Video */}
                <div className="border-b border-gray-100 last:border-b-0">
                    <button
                        type="button"
                        onClick={() => toggleSection("photos")}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <span className="text-[13px] font-bold text-slate-850">
                            Ảnh/Video
                        </span>
                        {openSections.photos ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                    </button>

                    {openSections.photos && (
                        <div className="px-4 pb-4 animate-slide-down">
                            {mediaItems.length === 0 ? (
                                <div className="py-4 px-2 text-center text-xs text-gray-400 font-normal leading-relaxed">
                                    Chưa có Ảnh/Video được chia sẻ trong hội thoại này
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto pr-0.5">
                                    {mediaItems.map(item => (
                                        <a
                                            key={item.id}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={`${item.name} • ${item.senderName}`}
                                            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200/60 shadow-2xs hover:opacity-90 transition-opacity block"
                                        >
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* E. File */}
                <div className="border-b border-gray-100 last:border-b-0">
                    <button
                        type="button"
                        onClick={() => toggleSection("files")}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <span className="text-[13px] font-bold text-slate-850">
                            File
                        </span>
                        {openSections.files ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                    </button>

                    {openSections.files && (
                        <div className="px-4 pb-4 animate-slide-down">
                            {docItems.length === 0 ? (
                                <div className="py-4 px-2 text-center text-xs text-gray-400 font-normal leading-relaxed">
                                    Chưa có File được chia sẻ trong hội thoại này
                                </div>
                            ) : (
                                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                                    {docItems.map(item => (
                                        <a
                                            key={item.id}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={item.name}
                                            className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-150 hover:bg-orange-50/40 hover:border-orange-200 transition-all group text-left block"
                                            title={`Tải xuống: ${item.name}`}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#F38820] flex items-center justify-center shrink-0">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-850 truncate group-hover:text-[#F38820] transition-colors">
                                                    {item.name}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5 font-mono">
                                                    {item.size ? <span>{formatFileSize(item.size)}</span> : null}
                                                    <span>{formatDate(item.createdAt)}</span>
                                                    <span className="truncate">• {item.senderName}</span>
                                                </div>
                                            </div>
                                            <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#F38820] transition-colors shrink-0 mr-1" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
