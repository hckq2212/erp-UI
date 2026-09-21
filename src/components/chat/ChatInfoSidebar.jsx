import React, { useState } from "react";
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
    Users as UsersIcon
} from "lucide-react";

export function ChatInfoSidebar({
    activeRoom,
    selfUserId,
    onlineUsers,
    getRoomName,
    onClose // in case they want a close button, or toggle
}) {
    const [openSections, setOpenSections] = useState({
        chatInfo: true,
        members: false,
        customize: false,
        media: false
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (!activeRoom) return null;

    const getOtherParticipant = (room) => {
        return room.participants?.find(p => p.userId !== selfUserId)?.user;
    };

    const otherUser = getOtherParticipant(activeRoom);
    const isOnline = !activeRoom.isGroup && onlineUsers.includes(otherUser?.id);

    return (
        <div className="w-80 border-l border-gray-200 flex flex-col h-full bg-white overflow-y-auto flex-shrink-0 animate-fade-in select-none">
            {/* 1. Header Details */}
            <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-gray-100 flex-shrink-0">
                <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-full bg-gray-150 border border-gray-200/60 flex items-center justify-center font-bold text-3xl text-[#F38820]">
                        {activeRoom.isGroup ? (
                            <UsersIcon className="w-9 h-9" />
                        ) : (
                            getRoomName(activeRoom)[0].toUpperCase()
                        )}
                    </div>
                    {isOnline && (
                        <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-[#F38820] border-2 border-white rounded-full" />
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
                            <div className="px-4 pb-3 max-h-60 overflow-y-auto space-y-2.5 animate-slide-down">
                                {activeRoom.participants?.map((p) => {
                                    const isMemberOnline = onlineUsers.includes(p.user?.id);
                                    const isSelf = p.user?.id === selfUserId;
                                    return (
                                        <div key={p.id} className="flex items-center gap-2.5">
                                            <div className="relative flex-shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-[#F38820]">
                                                    {(p.user?.fullName || "M").toUpperCase()[0]}
                                                </div>
                                                {isMemberOnline && (
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#F38820] border-2 border-white rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[13px] font-semibold text-slate-800 truncate">
                                                    {p.user?.fullName || "Thành viên"}
                                                    {isSelf && <span className="text-[11px] text-gray-500 font-normal ml-1">(Bạn)</span>}
                                                </div>
                                                {p.user?.username && (
                                                    <div className="text-[10px] text-gray-400 font-mono truncate leading-none">
                                                        @{p.user.username}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}


                {/* D. File phương tiện và file */}
                <div className="border-b border-gray-100 last:border-b-0">
                    <button
                        onClick={() => toggleSection("media")}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-[13px] font-bold text-slate-850">File phương tiện và file</span>
                        {openSections.media ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                    </button>
                    {openSections.media && (
                        <div className="px-2 pb-2 space-y-0.5 animate-slide-down">
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 transition-colors text-[13px] text-slate-750 font-semibold active:scale-99">
                                <ImageIcon className="w-4 h-4 text-slate-800" />
                                <span>File phương tiện</span>
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 transition-colors text-[13px] text-slate-750 font-semibold active:scale-99">
                                <FileText className="w-4 h-4 text-slate-800" />
                                <span>File</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
