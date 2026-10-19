import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useChatStore } from "../../store/useChatStore";
import { useGetMeQuery } from "../../api/auth";
import { useGetUsersQuery } from "../../api/users";
import { ChatBubbleRoom } from "./ChatBubbleRoom";
import { RoomAvatar } from "./RoomAvatar";
import {
    ChevronDown,
    MessageCircle,
    Search,
    X,
    UserPlus,
    ArrowLeft
} from "lucide-react";

export function ChatBubbleWidget() {
    const location = useLocation();
    const isChatPage = location.pathname === "/chat";

    const [isOpen, setIsOpen] = useState(false);
    const [showUserList, setShowUserList] = useState(false);
    const [roomSearch, setRoomSearch] = useState("");

    const { data: currentUser } = useGetMeQuery();
    const currentUserId = currentUser?.id;

    const {
        rooms = [],
        activeRoom,
        selectRoom,
        onlineUsers = [],
        unreadCounts = {},
        fetchRooms,
        createDM,
        isConnected
    } = useChatStore();

    // Query danh sách người dùng từ RTK Query (chuẩn hệ thống ERP)
    const { data: usersData, isLoading: loadingUsers } = useGetUsersQuery();
    const systemUsers = useMemo(() => {
        return Array.isArray(usersData?.data) ? usersData.data : (Array.isArray(usersData) ? usersData : []);
    }, [usersData]);

    // Giữ kết nối socket và cập nhật rooms ngay cả khi ở các trang khác ngoài /chat
    useEffect(() => {
        if (isChatPage || !currentUserId) return;

        const { initSocket, fetchRooms } = useChatStore.getState();
        initSocket(null, currentUserId);
        fetchRooms();
    }, [isChatPage, currentUserId]);

    const handleToggleWidget = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        if (nextState) {
            fetchRooms();
        }
    };

    const handleStartDM = async (recipientId) => {
        await createDM(recipientId);
        setShowUserList(false);
    };

    const getRoomName = (room) => {
        if (!room) return "";
        if (room.isGroup) return room.name || "Nhóm";
        const otherParticipant = room.participants?.find(p => p.userId !== currentUserId);
        return otherParticipant?.user?.fullName || otherParticipant?.user?.username || "Cuộc trò chuyện";
    };

    const isUserOnline = (room) => {
        if (!room || room.isGroup) return false;
        const otherParticipant = room.participants?.find(p => p.userId !== currentUserId);
        return onlineUsers.includes(otherParticipant?.userId);
    };

    const filteredRooms = useMemo(() => {
        const term = roomSearch.trim().toLowerCase();
        if (!term) return rooms;
        return rooms.filter((room) =>
            getRoomName(room).toLowerCase().includes(term)
        );
    }, [rooms, roomSearch, currentUserId]);

    const filteredUsers = useMemo(() => {
        const term = roomSearch.trim().toLowerCase();
        return systemUsers.filter((u) => {
            if (u.id === currentUserId) return false;
            if (!term) return true;
            return (
                (u.fullName || "").toLowerCase().includes(term) ||
                (u.username || "").toLowerCase().includes(term) ||
                (u.phoneNumber || "").includes(term)
            );
        });
    }, [systemUsers, currentUserId, roomSearch]);

    const totalUnread = useMemo(() => {
        return Object.values(unreadCounts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    }, [unreadCounts]);

    // Không render widget khi đang ở trang Chat toàn màn hình
    if (isChatPage) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-[9990] font-sans flex flex-col items-end pointer-events-auto">
            {/* Chat Panel Box */}
            {isOpen && (
                <div className="w-[calc(100vw-32px)] max-w-[420px] h-[580px] max-h-[calc(100vh-100px)] bg-white border border-slate-200 shadow-2xl flex flex-col mb-3 overflow-hidden rounded-2xl animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="h-[60px] bg-white border-b border-slate-100 px-3.5 py-2 flex items-center justify-between shadow-xs z-10 shrink-0">
                        {activeRoom ? (
                            <div className="flex items-center min-w-0 gap-2.5">
                                <button
                                    onClick={() => selectRoom(null)}
                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-[#F38820] hover:bg-orange-50 rounded-full transition-colors cursor-pointer"
                                    title="Quay lại"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="relative shrink-0">
                                    <RoomAvatar room={activeRoom} selfUserId={currentUserId} size="sm" />
                                    {isUserOnline(activeRoom) && (
                                        <span className="absolute -right-0.5 bottom-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white ring-1 ring-white" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <span className="block font-bold text-[14px] leading-tight text-slate-900 truncate">
                                        {getRoomName(activeRoom)}
                                    </span>
                                    <span className="block text-[11px] leading-tight text-slate-500 truncate mt-0.5">
                                        {isUserOnline(activeRoom) ? (
                                            <span className="text-green-600 font-medium">Đang hoạt động</span>
                                        ) : (
                                            "Tin nhắn"
                                        )}
                                    </span>
                                </div>
                            </div>
                        ) : showUserList ? (
                            <div className="flex items-center gap-2 min-w-0">
                                <button
                                    onClick={() => setShowUserList(false)}
                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-[#F38820] hover:bg-orange-50 rounded-full transition-colors cursor-pointer"
                                    title="Quay lại"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <span className="font-bold text-sm text-slate-800">
                                    Tin nhắn mới
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
                                <span className="font-bold text-sm text-slate-800 tracking-wide">
                                    GETVINI Chat
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-1 text-slate-500">
                            {!activeRoom && !showUserList && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUserList(true);
                                        setRoomSearch("");
                                    }}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-orange-50 hover:text-[#F38820] rounded-full transition-colors cursor-pointer"
                                    title="Tin nhắn mới"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={handleToggleWidget}
                                className="w-8 h-8 flex items-center justify-center hover:bg-orange-50 hover:text-[#F38820] rounded-full transition-colors cursor-pointer"
                                title="Đóng"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Active Conversation Room Pane */}
                    {activeRoom ? (
                        <ChatBubbleRoom />
                    ) : showUserList ? (
                        /* User Directory for DMs */
                        <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
                            {/* Search bar */}
                            <div className="p-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
                                <div className="h-9 rounded-full bg-white border border-gray-200 px-3 flex items-center gap-2 shadow-2xs">
                                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                                    <input
                                        value={roomSearch}
                                        onChange={(e) => setRoomSearch(e.target.value)}
                                        placeholder="Tìm nhân viên để nhắn tin..."
                                        className="min-w-0 flex-1 bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400"
                                    />
                                    {roomSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setRoomSearch("")}
                                            className="text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                                {loadingUsers ? (
                                    <div className="p-6 text-center text-xs text-slate-400">
                                        Đang tải danh sách nhân sự...
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-slate-400">
                                        Không tìm thấy nhân sự phù hợp
                                    </div>
                                ) : (
                                    filteredUsers.map((user) => {
                                        const isOnline = onlineUsers.includes(user.id);
                                        return (
                                            <button
                                                key={user.id}
                                                onClick={() => handleStartDM(user.id)}
                                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-orange-50/40 text-left transition-colors cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="relative shrink-0">
                                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-[#F38820] flex items-center justify-center font-bold text-xs border border-orange-200/60">
                                                            {user.fullName ? user.fullName[0].toUpperCase() : "U"}
                                                        </div>
                                                        {isOnline && (
                                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-semibold text-slate-800 group-hover:text-[#F38820] truncate transition-colors">
                                                            {user.fullName}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 truncate">
                                                            {user.phoneNumber || user.email || "Nhân viên"}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isOnline && (
                                                    <span className="text-[10px] text-green-600 font-medium shrink-0 ml-2">
                                                        Online
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Rooms Sidebar List */
                        <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
                            {/* Toolbar Search */}
                            <div className="px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/60 space-y-2 shrink-0">
                                <div className="h-9 rounded-full bg-white border border-gray-200 px-3 flex items-center gap-2 shadow-2xs">
                                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                                    <input
                                        value={roomSearch}
                                        onChange={(event) => setRoomSearch(event.target.value)}
                                        placeholder="Tìm cuộc trò chuyện..."
                                        className="min-w-0 flex-1 bg-transparent outline-none text-xs text-slate-800 placeholder-slate-400"
                                    />
                                    {roomSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setRoomSearch("")}
                                            className="text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Rooms List */}
                            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                                {filteredRooms.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-400">
                                        Không tìm thấy cuộc trò chuyện nào
                                    </div>
                                ) : (
                                    filteredRooms.map((room) => {
                                        const unreadCount = Number(unreadCounts?.[room.id] || 0);
                                        const hasUnread = unreadCount > 0;
                                        return (
                                            <button
                                                key={room.id}
                                                onClick={() => selectRoom(room)}
                                                className={`w-full px-3.5 py-3 flex items-center gap-3 hover:bg-orange-50/40 text-left transition-colors cursor-pointer ${
                                                    hasUnread ? "bg-orange-50/20" : ""
                                                }`}
                                            >
                                                <div className="relative shrink-0">
                                                    <RoomAvatar room={room} selfUserId={currentUserId} size="sm" />
                                                    {isUserOnline(room) && (
                                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full ring-1 ring-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col">
                                                    <div className="flex justify-between items-baseline gap-1.5">
                                                        <span className={`text-xs truncate ${hasUnread ? "font-bold text-slate-950" : "font-medium text-slate-800"}`}>
                                                            {getRoomName(room)}
                                                        </span>
                                                        {hasUnread && (
                                                            <span className="min-w-4.5 h-4.5 px-1.5 rounded-full bg-[#F38820] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                {unreadCount > 99 ? "99+" : unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-[11px] truncate mt-0.5 ${hasUnread ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
                                                        {room.latestMessage?.isRecalled
                                                            ? "[Tin nhắn đã được thu hồi]"
                                                            : (room.latestMessage?.content || (room.latestMessage?.attachments?.length ? "[Tệp đính kèm]" : "Chưa có tin nhắn"))}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Action Button (FAB) */}
            <button
                onClick={handleToggleWidget}
                className="relative w-12 h-12 bg-[#F38820] text-white hover:bg-[#d97616] shadow-xl hover:shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 select-none rounded-full cursor-pointer"
                title={isOpen ? "Thu nhỏ tin nhắn" : "Mở tin nhắn"}
            >
                {totalUnread > 0 && !isOpen && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold border-2 border-white flex items-center justify-center shadow-sm animate-pulse">
                        {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                )}
                {isOpen ? (
                    <ChevronDown className="w-6 h-6 stroke-[2.5]" />
                ) : (
                    <MessageCircle className="w-6 h-6 stroke-[2.2]" />
                )}
            </button>
        </div>
    );
}
