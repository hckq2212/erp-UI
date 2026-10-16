import React, { useState, useMemo, useRef } from "react";
import { X, Search, Check, Users as UsersIcon, Camera, Loader2 } from "lucide-react";
import { uploadToCloudinary } from "../../utils/cloudinary";

export function ChatGroupModal({
    isOpen,
    onClose,
    systemUsers = [],
    selfUserId,
    onlineUsers = [],
    onCreateGroup
}) {
    const [groupName, setGroupName] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef(null);

    const eligibleUsers = useMemo(() => {
        return (systemUsers || []).filter(u => u.id !== selfUserId);
    }, [systemUsers, selfUserId]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return eligibleUsers;
        const term = searchTerm.toLowerCase().trim();
        return eligibleUsers.filter(u =>
            (u.fullName || "").toLowerCase().includes(term) ||
            (u.email || "").toLowerCase().includes(term) ||
            (u.phone || "").toLowerCase().includes(term) ||
            (u.username || "").toLowerCase().includes(term)
        );
    }, [eligibleUsers, searchTerm]);

    // Gom nhóm danh sách nhân sự theo chữ cái đầu (A-Z) chuẩn danh bạ
    const groupedUsers = useMemo(() => {
        const sorted = [...filteredUsers].sort((a, b) =>
            (a.fullName || "").localeCompare(b.fullName || "", "vi")
        );
        const groups = {};
        sorted.forEach(u => {
            const letter = (u.fullName || "Khác").trim().charAt(0).toUpperCase();
            if (!groups[letter]) groups[letter] = [];
            groups[letter].push(u);
        });
        return groups;
    }, [filteredUsers]);

    const selectedUsers = useMemo(() => {
        return eligibleUsers.filter(u => selectedUserIds.includes(u.id));
    }, [eligibleUsers, selectedUserIds]);

    if (!isOpen) return null;

    const handleAvatarSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        e.target.value = null;
    };

    const handleRemoveAvatar = (e) => {
        e.stopPropagation();
        setAvatarFile(null);
        setAvatarPreview(null);
    };

    const handleConfirm = async () => {
        if (!groupName.trim() || selectedUserIds.length === 0 || isUploading) return;
        setIsUploading(true);
        let avatarUrl = null;
        try {
            if (avatarFile) {
                const uploadRes = await uploadToCloudinary(avatarFile, "GETVINI/ERP/chat/group-avatars");
                avatarUrl = uploadRes?.url || uploadRes?.secure_url || null;
            }
        } catch (err) {
            console.error("Lỗi khi tải ảnh đại diện nhóm:", err);
        } finally {
            setIsUploading(false);
        }

        onCreateGroup(groupName.trim(), selectedUserIds, avatarUrl);
        handleClose();
    };

    const handleClose = () => {
        setGroupName("");
        setSelectedUserIds([]);
        setSearchTerm("");
        setAvatarFile(null);
        setAvatarPreview(null);
        setIsUploading(false);
        onClose();
    };

    const toggleSelectUser = (uid) => {
        if (selectedUserIds.includes(uid)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== uid));
        } else {
            setSelectedUserIds([...selectedUserIds, uid]);
        }
    };

    const removeSelectedUser = (uid) => {
        setSelectedUserIds(selectedUserIds.filter(id => id !== uid));
    };

    const canSubmit = groupName.trim().length > 0 && selectedUserIds.length > 0 && !isUploading;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fade-in select-none">
            <div className="bg-white w-full max-w-[740px] h-[600px] max-h-[90vh] flex flex-col shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
                {/* 1. Header */}
                <div className="px-6 py-3.5 border-b border-gray-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-50 text-[#F38820] flex items-center justify-center">
                            <UsersIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 leading-snug">Tạo nhóm chat mới</h2>
                            <p className="text-[11px] text-gray-500">Thêm thành viên để bắt đầu cuộc trò chuyện nhóm</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center cursor-pointer"
                        title="Đóng (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* 2. Top Group Setup Bar */}
                <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 shrink-0 bg-white">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarSelect}
                    />

                    {/* Camera avatar picker */}
                    <div className="relative shrink-0 group">
                        {avatarPreview ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#F38820] cursor-pointer shadow-xs relative"
                                title="Đổi ảnh đại diện nhóm"
                            >
                                <img
                                    src={avatarPreview}
                                    alt="Ảnh nhóm"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-10 h-10 rounded-full bg-orange-100/70 border border-orange-200 flex items-center justify-center text-[#F38820] shrink-0 cursor-pointer hover:bg-orange-200/70 transition-colors shadow-2xs"
                                title="Nhấp để chọn ảnh đại diện nhóm"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        )}

                        {avatarPreview && (
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors shadow-xs cursor-pointer"
                                title="Xóa ảnh đại diện"
                            >
                                <X className="w-2.5 h-2.5 stroke-[3]" />
                            </button>
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="Đặt tên nhóm chat..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 focus:border-[#F38820] focus:ring-2 focus:ring-[#F38820]/15 rounded-xl text-sm font-medium text-slate-900 placeholder-gray-400 outline-none transition-all"
                        autoFocus
                    />
                </div>

                {/* 3. Two-Column Body Layout (Zalo / Messenger Desktop Style) */}
                <div className="flex-1 flex overflow-hidden min-h-0 divide-x divide-gray-100">
                    {/* CỘT TRÁI (~60%): Danh sách nhân sự kèm Checkbox & Search */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white">
                        {/* Search Input Bar */}
                        <div className="p-3 border-b border-gray-100">
                            <div className="relative bg-gray-100 rounded-xl px-3 py-2 flex items-center gap-2 border border-transparent focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#F38820]/20 transition-all">
                                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên, email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="no-focus-ring bg-transparent !border-0 !outline-none text-xs text-slate-900 placeholder-gray-500 w-full !shadow-none"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm("")}
                                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Danh sách cuộn nhân sự phân nhóm A-Z */}
                        <div className="flex-1 overflow-y-auto px-3 py-2">
                            {Object.keys(groupedUsers).length === 0 ? (
                                <div className="py-16 text-center text-xs text-gray-400">
                                    Không tìm thấy thành viên phù hợp
                                </div>
                            ) : (
                                Object.entries(groupedUsers).map(([letter, users]) => (
                                    <div key={letter} className="mb-3">
                                        <div className="text-[11px] font-bold text-gray-400 px-3 py-1 uppercase tracking-wider">
                                            {letter}
                                        </div>
                                        <div className="space-y-0.5">
                                            {users.map(user => {
                                                const isSelected = selectedUserIds.includes(user.id);
                                                const isOnline = onlineUsers.includes(user.id);
                                                const displayName = user.fullName || user.username || "Thành viên";
                                                const initial = displayName[0]?.toUpperCase() || "U";

                                                return (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() => toggleSelectUser(user.id)}
                                                        className={`w-full px-3 py-2 rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer group ${
                                                            isSelected
                                                                ? "bg-orange-50/70 hover:bg-orange-50"
                                                                : "hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        {/* Checkbox tròn bên trái (Chuẩn ảnh mẫu) */}
                                                        <div className="shrink-0">
                                                            {isSelected ? (
                                                                <div className="w-5 h-5 rounded-full bg-[#F38820] border-2 border-[#F38820] flex items-center justify-center text-white shadow-xs">
                                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400 transition-colors" />
                                                            )}
                                                        </div>

                                                        {/* Avatar & Online Dot */}
                                                        <div className="relative shrink-0">
                                                            <div className="w-9 h-9 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center font-bold text-xs text-[#F38820]">
                                                                {user.avatarUrl ? (
                                                                    <img
                                                                        src={user.avatarUrl}
                                                                        alt={displayName}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                                    />
                                                                ) : (
                                                                    initial
                                                                )}
                                                            </div>
                                                            {isOnline && (
                                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                                                            )}
                                                        </div>

                                                        {/* Họ tên */}
                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            <span className="text-xs font-semibold text-slate-800 group-hover:text-black truncate">
                                                                {displayName}
                                                            </span>
                                                            {user.email && (
                                                                <span className="text-[10px] text-gray-400 truncate">
                                                                    {user.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI (~40%): Danh sách Đã chọn cố định */}
                    <div className="w-[280px] flex flex-col min-w-0 bg-gray-50/60 shrink-0">
                        {/* Header Đã chọn */}
                        <div className="p-3.5 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                                Đã chọn
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#F38820]">
                                {selectedUserIds.length} / {eligibleUsers.length}
                            </span>
                        </div>

                        {/* Danh sách thẻ thành viên đã chọn */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {selectedUsers.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-400">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                                        👥
                                    </div>
                                    <p className="text-xs font-medium">Chưa chọn thành viên nào</p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Tích chọn ở danh sách bên trái
                                    </p>
                                </div>
                            ) : (
                                selectedUsers.map(user => {
                                    const displayName = user.fullName || user.username || "Thành viên";
                                    const initial = displayName[0]?.toUpperCase() || "U";

                                    return (
                                        <div
                                            key={`selected-${user.id}`}
                                            className="flex items-center justify-between p-1.5 pl-2 pr-2.5 bg-white border border-gray-200/70 hover:border-orange-200 rounded-full shadow-2xs transition-all group"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-6 h-6 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center text-[10px] font-bold text-[#F38820] shrink-0">
                                                    {user.avatarUrl ? (
                                                        <img
                                                            src={user.avatarUrl}
                                                            alt={displayName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                        />
                                                    ) : (
                                                        initial
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium text-slate-800 truncate max-w-[150px]">
                                                    {displayName}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeSelectedUser(user.id)}
                                                className="w-5 h-5 rounded-full text-gray-400 hover:text-white hover:bg-red-500 transition-colors flex items-center justify-center shrink-0 cursor-pointer ml-1"
                                                title="Bỏ chọn"
                                            >
                                                <X className="w-3 h-3 stroke-[2.5]" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Footer */}
                <div className="px-6 py-3.5 border-t border-gray-200 flex items-center justify-between bg-white shrink-0">
                    <span className="text-xs text-gray-500">
                        {selectedUserIds.length > 0 ? (
                            <>Đã chọn <strong className="text-[#F38820] font-bold">{selectedUserIds.length}</strong> thành viên</>
                        ) : (
                            "Vui lòng chọn ít nhất 1 thành viên"
                        )}
                    </span>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!canSubmit}
                            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                                canSubmit
                                    ? "bg-[#F38820] hover:bg-[#d97616] text-white active:scale-95"
                                    : "bg-gray-150 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{isUploading ? "Đang tải ảnh..." : "Tạo nhóm"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
