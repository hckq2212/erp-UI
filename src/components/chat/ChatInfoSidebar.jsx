import React, { useState, useMemo, useEffect, useRef } from "react";
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
    ChevronLeft,
    ChevronRight,
    Users as UsersIcon,
    UserPlus,
    Settings,
    Crown,
    Shield,
    Key,
    MoreVertical,
    MoreHorizontal,
    UserMinus,
    Download,
    ExternalLink,
    Camera,
    Pencil,
    Check,
    X,
    Loader2,
    Trash2,
    MessageSquare,
    BellOff
} from "lucide-react";
import { useGetUsersQuery } from "../../api/users";
import { useChatStore } from "../../store/useChatStore";
import { RoomAvatar } from "./RoomAvatar";
import { MemberProfileModal } from "./MemberProfileModal";
import { DocumentPreviewModal } from "../common/DocumentPreviewModal";
import { AvatarCropModal } from "../common/AvatarCropModal";
import { PinnedMessagesModal } from "./PinnedMessagesModal";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { validateChatFile } from "../../utils/chatFileValidation";
import { downloadFile } from "../../utils/fileDetector";
import { parseSafeChatDate } from "../../utils/chatTokenHelper";
import { toast } from "react-toastify";

export function ChatInfoSidebar({
    activeRoom,
    selfUserId,
    onlineUsers,
    getRoomName,
    onClose,
    onAddMembersClick
}) {
    const { data: usersData } = useGetUsersQuery();
    const allUsers = Array.isArray(usersData?.data) ? usersData.data : (Array.isArray(usersData) ? usersData : []);
    const { updateParticipantRole, removeParticipant, updateRoomInfo, updateRoomPreferences, messages, createDM } = useChatStore();

    const [sidebarView, setSidebarView] = useState("main");

    const avatarInputRef = useRef(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [groupNameInput, setGroupNameInput] = useState("");
    const [isSavingName, setIsSavingName] = useState(false);
    const isMuted = Boolean(activeRoom?.isMuted);
    const isPinned = Boolean(activeRoom?.isPinned);
    const [cropFile, setCropFile] = useState(null);
    const [showPinnedModal, setShowPinnedModal] = useState(false);

    useEffect(() => {
        if (activeRoom) {
            setGroupNameInput(activeRoom.name || "");
            setIsEditingName(false);
            setSidebarView("main");
            setCropFile(null);
        }
    }, [activeRoom?.id, activeRoom?.name]);

    const handleAddMembers = () => {
        if (onAddMembersClick) {
            onAddMembersClick();
        } else {
            window.dispatchEvent(new CustomEvent("chat:open_add_members"));
        }
    };

    const handleDirectChat = async (targetUserId) => {
        try {
            await createDM(targetUserId);
        } catch (err) {
            console.error("Lỗi khi mở cuộc trò chuyện trực tiếp:", err);
            toast.error("Không thể mở cuộc trò chuyện");
        }
    };

    const handleAvatarFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        e.target.value = "";

        const validation = validateChatFile(file, { requireImage: true });
        if (!validation.valid) {
            toast.error(validation.error || "Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP, GIF)");
            return;
        }

        if (validation.category !== "IMAGE") {
            toast.error("Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP, GIF)");
            return;
        }

        // Mở modal cắt ảnh tỷ lệ 1:1 chuyên nghiệp cho người dùng căn chỉnh
        setCropFile(file);
    };

    const handleCropComplete = async (croppedFile) => {
        setCropFile(null);
        setIsUploadingAvatar(true);
        try {
            const uploadRes = await uploadToCloudinary(croppedFile, "GETVINI/ERP/chat/group-avatars");
            const avatarUrl = uploadRes?.secure_url || uploadRes?.url;
            if (!avatarUrl) {
                throw new Error("Không lấy được đường dẫn ảnh sau khi tải lên");
            }

            const res = await updateRoomInfo(activeRoom.id, { avatarUrl });
            if (res.success) {
                toast.success("Cập nhật ảnh đại diện nhóm thành công!");
            } else {
                toast.error(res.error || "Không thể cập nhật ảnh đại diện nhóm");
            }
        } catch (error) {
            console.error("Lỗi khi tải ảnh đại diện nhóm:", error);
            toast.error(error.message || "Tải ảnh đại diện thất bại");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn gỡ ảnh đại diện của nhóm để quay về avatar mặc định?")) {
            return;
        }
        setIsUploadingAvatar(true);
        try {
            const res = await updateRoomInfo(activeRoom.id, { avatarUrl: null });
            if (res.success) {
                toast.success("Đã gỡ ảnh đại diện nhóm!");
            } else {
                toast.error(res.error || "Không thể gỡ ảnh đại diện nhóm");
            }
        } catch (error) {
            toast.error("Gỡ ảnh đại diện thất bại");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleSaveGroupName = async (e) => {
        e?.preventDefault?.();
        const trimmed = groupNameInput.trim();
        if (!trimmed) {
            toast.warning("Tên nhóm không được để trống");
            return;
        }
        if (trimmed === activeRoom.name) {
            setIsEditingName(false);
            return;
        }

        setIsSavingName(true);
        try {
            const res = await updateRoomInfo(activeRoom.id, { name: trimmed });
            if (res.success) {
                toast.success("Đổi tên nhóm thành công!");
                setIsEditingName(false);
            } else {
                toast.error(res.error || "Không thể đổi tên nhóm");
            }
        } catch (error) {
            toast.error("Đổi tên nhóm thất bại");
        } finally {
            setIsSavingName(false);
        }
    };

    const handleToggleMute = async () => {
        if (!activeRoom) return;
        const nextMuted = !isMuted;
        try {
            const res = await updateRoomPreferences(activeRoom.id, { isMuted: nextMuted });
            if (res.success) {
                toast.info(nextMuted ? "Đã tắt thông báo cho cuộc trò chuyện này" : "Đã bật lại thông báo");
            } else {
                toast.error(res.error || "Không thể cập nhật tùy chọn");
            }
        } catch {
            toast.error("Cập nhật tùy chọn thất bại");
        }
    };

    const handleTogglePin = async () => {
        if (!activeRoom) return;
        const nextPinned = !isPinned;
        try {
            const res = await updateRoomPreferences(activeRoom.id, { isPinned: nextPinned });
            if (res.success) {
                toast.info(nextPinned ? "Đã ghim cuộc trò chuyện lên đầu" : "Đã bỏ ghim cuộc trò chuyện");
            } else {
                toast.error(res.error || "Không thể cập nhật tùy chọn");
            }
        } catch {
            toast.error("Cập nhật tùy chọn thất bại");
        }
    };

    const [openSections, setOpenSections] = useState({
        chatInfo: true,
        members: true,
        customize: false,
        photos: true,
        files: true
    });
    const [previewDoc, setPreviewDoc] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);

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
            const d = parseSafeChatDate(dateStr);
            if (!d) return "";
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

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest("[data-member-menu]")) {
                setMenuTargetId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    if (sidebarView === "members" && activeRoom.isGroup) {
        return (
            <div className="w-80 border-l border-gray-200 flex flex-col h-full bg-white flex-shrink-0 select-none animate-fade-in">
                {/* 1. Header with Back button */}
                <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setSidebarView("main")}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-700 hover:text-[#F38820] transition-colors cursor-pointer"
                        title="Quay lại thông tin nhóm"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-bold text-slate-800 text-[15px]">Thành viên</h3>
                </div>

                {/* 2. Primary Action: Nút Thêm thành viên */}
                <div className="p-3 border-b border-gray-100">
                    <button
                        type="button"
                        onClick={handleAddMembers}
                        className="w-full py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F38820] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-orange-200/80 shadow-2xs hover:shadow-xs active:scale-99"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Thêm thành viên</span>
                    </button>
                </div>

                {/* 3. Section Title: Danh sách thành viên (N) + Options */}
                <div className="px-4 py-2.5 flex items-center justify-between text-xs text-gray-500 font-medium bg-gray-50/70 border-b border-gray-100">
                    <span className="font-semibold text-slate-700">
                        Danh sách thành viên ({sortedParticipants.length})
                    </span>
                    <button
                        type="button"
                        onClick={handleAddMembers}
                        className="p-1 rounded hover:bg-gray-200/60 text-gray-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Tùy chọn"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>

                {/* 4. Danh sách thành viên chi tiết */}
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
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
                                className="relative flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                            >
                                {/* Left: Avatar + Name + Role Subtitle */}
                                <div
                                    onClick={() => setSelectedProfileParticipant(p)}
                                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                                    title="Nhấn để xem thông tin nhân sự"
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-[#F38820] border border-orange-200/60 overflow-hidden flex items-center justify-center font-bold text-sm shadow-2xs">
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
                                                <span className="font-bold text-[#F38820]">
                                                    {memberName.toUpperCase()[0]}
                                                </span>
                                            )}
                                        </div>
                                        {isMemberOnline && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full z-10" />
                                        )}
                                        {role === "ADMIN" && (
                                            <span
                                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[9px] shadow-xs border border-white"
                                                title="Trưởng nhóm"
                                            >
                                                🔑
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[13px] font-semibold text-slate-850 truncate max-w-[125px] group-hover:text-[#F38820] transition-colors">
                                                {isSelf ? "Bạn" : memberName}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-gray-400 font-sans truncate leading-tight mt-0.5">
                                            {role === "ADMIN" ? (
                                                <span className="text-amber-700 font-medium">Trưởng nhóm</span>
                                            ) : role === "DEPUTY" ? (
                                                <span className="text-sky-700 font-medium">Phó nhóm</span>
                                            ) : (
                                                p.user?.username ? `@${p.user.username}` : "Thành viên"
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Action button ("Nhắn tin" / Menu quản lý) */}
                                <div className="flex items-center gap-1 shrink-0">
                                    {!isSelf && (
                                        <button
                                            type="button"
                                            onClick={() => handleDirectChat(targetUserId)}
                                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1"
                                            title={`Nhắn tin với ${memberName}`}
                                        >
                                            <MessageSquare className="w-3 h-3" />
                                            <span>Nhắn tin</span>
                                        </button>
                                    )}

                                    {canManage && (
                                        <div className="relative" data-member-menu>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuTargetId(menuTargetId === (p.id || targetUserId) ? null : (p.id || targetUserId));
                                                }}
                                                className="w-7 h-7 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                                                title="Tùy chọn quản lý"
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
                            </div>
                        );
                    })}
                </div>

                {/* Member Profile Modal */}
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
            </div>
        );
    }

    return (
        <div className="w-80 border-l border-gray-200 flex flex-col h-full bg-white overflow-y-auto flex-shrink-0 animate-fade-in select-none">
            {/* 1. Header Details */}
            <div className="flex flex-col items-center pt-8 pb-5 px-4 border-b border-gray-100 flex-shrink-0">
                <div className="relative mb-3 group/avatar">
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

                    {activeRoom.isGroup && (
                        <>
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={isUploadingAvatar}
                                title="Đổi ảnh đại diện nhóm"
                                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#F38820] hover:bg-[#d97312] text-white flex items-center justify-center shadow-md border-2 border-white transition-all cursor-pointer hover:scale-110 active:scale-95 z-20"
                            >
                                <Camera className="w-3.5 h-3.5" />
                            </button>

                            {isUploadingAvatar && (
                                <div className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center z-30 animate-fade-in backdrop-blur-2xs">
                                    <Loader2 className="w-6 h-6 text-white animate-spin mb-1" />
                                    <span className="text-[10px] text-white font-medium">Đang tải...</span>
                                </div>
                            )}

                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarFileSelect}
                            />
                        </>
                    )}
                </div>

                {/* Tùy chọn gỡ ảnh tùy chỉnh để về avatar mặc định */}
                {activeRoom.isGroup && activeRoom.avatarUrl && (
                    <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                        className="text-[11px] text-gray-400 hover:text-red-500 transition-colors mb-2 cursor-pointer flex items-center gap-1"
                        title="Gỡ ảnh tùy chỉnh để về avatar mặc định"
                    >
                        <Trash2 className="w-3 h-3" />
                        <span>Gỡ ảnh nhóm</span>
                    </button>
                )}

                {isEditingName ? (
                    <form onSubmit={handleSaveGroupName} className="flex items-center gap-1.5 w-full max-w-[240px] mt-1">
                        <input
                            type="text"
                            value={groupNameInput}
                            onChange={(e) => setGroupNameInput(e.target.value)}
                            autoFocus
                            placeholder="Nhập tên nhóm..."
                            className="flex-1 px-2.5 py-1 text-sm border border-[#F38820] rounded-md focus:outline-none focus:ring-1 focus:ring-[#F38820] text-slate-800"
                        />
                        <button
                            type="submit"
                            disabled={isSavingName}
                            className="w-7 h-7 rounded-md bg-[#F38820] hover:bg-[#d97312] text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Lưu"
                        >
                            {isSavingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setGroupNameInput(activeRoom.name || "");
                                setIsEditingName(false);
                            }}
                            className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Hủy"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </form>
                ) : (
                    <div className="flex items-center justify-center gap-1.5 max-w-full px-2 group/title">
                        <h2 className="text-base font-bold text-slate-800 text-center leading-tight truncate">
                            {getRoomName(activeRoom)}
                        </h2>
                        {activeRoom.isGroup && (
                            <button
                                type="button"
                                onClick={() => {
                                    setGroupNameInput(activeRoom.name || "");
                                    setIsEditingName(true);
                                }}
                                title="Đổi tên nhóm"
                                className="opacity-0 group-hover/title:opacity-100 p-1 text-gray-400 hover:text-[#F38820] rounded-full hover:bg-orange-50 transition-all cursor-pointer flex-shrink-0"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 1.5. Thanh 4 nút tiện ích (Tắt thông báo, Ghim, Thêm thành viên, Quản lý nhóm) */}
            <div className="grid grid-cols-4 gap-1.5 w-full px-3 py-3 border-b border-gray-100 bg-white">
                {/* 1. Tắt thông báo */}
                <button
                    type="button"
                    onClick={handleToggleMute}
                    className="flex flex-col items-center group cursor-pointer"
                    title={isMuted ? "Nhấn để bật lại thông báo" : "Nhấn để tắt thông báo cuộc trò chuyện"}
                >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-2xs ${
                        isMuted
                            ? "bg-orange-100 text-[#F38820]"
                            : "bg-gray-100 group-hover:bg-orange-50 text-slate-700 group-hover:text-[#F38820]"
                    }`}>
                        {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </div>
                    <span className="text-[10.5px] text-slate-600 group-hover:text-slate-900 mt-1 font-medium truncate max-w-[65px] text-center">
                        {isMuted ? "Bật t.báo" : "Tắt thông báo"}
                    </span>
                </button>

                {/* 2. Ghim hội thoại */}
                <button
                    type="button"
                    onClick={handleTogglePin}
                    className="flex flex-col items-center group cursor-pointer"
                    title={isPinned ? "Nhấn để bỏ ghim cuộc trò chuyện" : "Nhấn để ghim cuộc trò chuyện lên đầu"}
                >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-2xs ${
                        isPinned
                            ? "bg-orange-100 text-[#F38820]"
                            : "bg-gray-100 group-hover:bg-orange-50 text-slate-700 group-hover:text-[#F38820]"
                    }`}>
                        <Pin className={`w-4 h-4 ${isPinned ? "fill-current" : ""}`} />
                    </div>
                    <span className="text-[10.5px] text-slate-600 group-hover:text-slate-900 mt-1 font-medium truncate max-w-[65px] text-center">
                        {isPinned ? "Bỏ ghim" : "Ghim hội thoại"}
                    </span>
                </button>

                {/* 3. Thêm thành viên */}
                {activeRoom.isGroup && (
                    <button
                        type="button"
                        onClick={handleAddMembers}
                        className="flex flex-col items-center group cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-orange-50 text-slate-700 group-hover:text-[#F38820] flex items-center justify-center transition-all shadow-2xs">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <span className="text-[10.5px] text-slate-600 group-hover:text-slate-900 mt-1 font-medium truncate max-w-[65px] text-center">
                            Thêm thành viên
                        </span>
                    </button>
                )}

                {/* 4. Quản lý nhóm */}
                {activeRoom.isGroup && (
                    <button
                        type="button"
                        onClick={() => setSidebarView("members")}
                        className="flex flex-col items-center group cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-orange-50 text-slate-700 group-hover:text-[#F38820] flex items-center justify-center transition-all shadow-2xs">
                            <Settings className="w-4 h-4" />
                        </div>
                        <span className="text-[10.5px] text-slate-600 group-hover:text-slate-900 mt-1 font-medium truncate max-w-[65px] text-center">
                            Quản lý nhóm
                        </span>
                    </button>
                )}
            </div>

            {/* 2. Collapsible Sections */}
            <div className="flex-1 py-2">
                {/* A. Mục Thành viên nhóm (Tóm tắt, click vào chuyển sang màn hình danh sách thành viên) */}
                {activeRoom.isGroup && (
                    <div className="border-b border-gray-100 last:border-b-0">
                        <button
                            type="button"
                            onClick={() => setSidebarView("members")}
                            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors group cursor-pointer"
                            title="Xem toàn bộ danh sách và quản lý thành viên"
                        >
                            <div className="flex-1 min-w-0 pr-2">
                                <span className="text-[13px] font-bold text-slate-850 group-hover:text-[#F38820] transition-colors block">
                                    Thành viên nhóm
                                </span>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    <UsersIcon className="w-4 h-4 text-gray-400 group-hover:text-[#F38820] transition-colors" />
                                    <span className="font-medium text-slate-600">{activeRoom.participants?.length || 0} thành viên</span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#F38820] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </button>
                    </div>
                )}

                {/* B. Thông tin về đoạn chat */}
                <div className="border-b border-gray-100 last:border-b-0">
                    <button
                        onClick={() => toggleSection("chatInfo")}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
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
                            <button
                                type="button"
                                onClick={() => setShowPinnedModal(true)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 transition-colors text-[13px] text-slate-750 font-semibold active:scale-99 cursor-pointer"
                            >
                                <Pin className="w-4 h-4 text-slate-800" />
                                <span>Xem tin nhắn đã ghim</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Modal Xem tin nhắn đã ghim */}
                <PinnedMessagesModal
                    isOpen={showPinnedModal}
                    onClose={() => setShowPinnedModal(false)}
                    onJumpToMessage={(msgId) => {
                        window.dispatchEvent(
                            new CustomEvent("chat:jump_to_message", {
                                detail: { messageId: msgId }
                            })
                        );
                    }}
                />

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
                                        <div
                                            key={item.id}
                                            onClick={() => setPreviewDoc({ url: item.url, name: item.name })}
                                            title={`${item.name} • ${item.senderName}`}
                                            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200/60 shadow-2xs hover:opacity-90 transition-opacity block cursor-pointer"
                                        >
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            />
                                        </div>
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
                                        <div
                                            key={item.id}
                                            onClick={() => setPreviewDoc({ url: item.url, name: item.name })}
                                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-100/80 transition-colors group text-left cursor-pointer"
                                            title={`Xem trước: ${item.name}`}
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
                                            <button
                                                type="button"
                                                disabled={downloadingId === item.id}
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    setDownloadingId(item.id);
                                                    try {
                                                        await downloadFile(item.url, item.name);
                                                    } catch (err) {
                                                        console.error("Lỗi khi tải file:", err);
                                                        toast.error("Không thể tải tệp xuống máy tính");
                                                    } finally {
                                                        setDownloadingId(null);
                                                    }
                                                }}
                                                title="Tải xuống"
                                                className="p-1 rounded-md hover:bg-gray-200 text-gray-400 group-hover:text-[#F38820] transition-colors shrink-0 mr-1 cursor-pointer disabled:opacity-50"
                                            >
                                                {downloadingId === item.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F38820]" />
                                                ) : (
                                                    <Download className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Document Preview Modal */}
            {previewDoc && (
                <DocumentPreviewModal
                    isOpen={Boolean(previewDoc)}
                    onClose={() => setPreviewDoc(null)}
                    fileUrl={previewDoc.url}
                    fileName={previewDoc.name}
                />
            )}

            {/* Modal cắt ảnh đại diện nhóm (Avatar Crop Modal) */}
            {cropFile && (
                <AvatarCropModal
                    isOpen={Boolean(cropFile)}
                    imageFile={cropFile}
                    title="Cắt ảnh đại diện nhóm"
                    onClose={() => setCropFile(null)}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>
    );
}
