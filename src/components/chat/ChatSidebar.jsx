import React, { useState } from "react";
import { Search, Plus, Pin, BellOff } from "lucide-react";
import { useGetUsersQuery } from "../../api/users";
import { useChatStore } from "../../store/useChatStore";
import { RoomAvatar } from "./RoomAvatar";
import { formatMessagePreview } from "../../utils/chatTokenHelper";

export function ChatSidebar({
    rooms,
    activeRoom,
    onlineUsers,
    selfUserId,
    selectRoom,
    onCreateGroupClick,
    loadingRooms,
    getRoomName
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const { createDM, unreadRooms, unreadCounts } = useChatStore();

    // Fetch system users to initiate new DMs
    const { data: usersData } = useGetUsersQuery();
    const allUsers = Array.isArray(usersData?.data) ? usersData.data : (Array.isArray(usersData) ? usersData : []);

    const getOtherParticipant = (room) => {
        if (!room) return null;
        const participant = room.participants?.find(p => p.userId !== selfUserId);
        if (participant?.user) return participant.user;
        if (participant?.userId) {
            return allUsers.find(u => u.id === participant.userId) || null;
        }
        return null;
    };

    const handleUserClick = async (userId) => {
        // Double check if a DM room already exists with this user
        const existingRoom = rooms.find(room =>
            !room.isGroup && room.participants?.some(p => p.userId === userId)
        );
        if (existingRoom) {
            selectRoom(existingRoom);
        } else {
            await createDM(userId);
        }
        setSearchTerm("");
    };

    // 1. Gather all active conversation rooms (Group chats, or DM rooms that have messages OR are pinned)
    const activeRoomsList = rooms
        .filter(room => {
            if (room.isGroup) return true;
            return Boolean(room.latestMessage || room.isPinned);
        })
        .map(room => {
            const otherUser = getOtherParticipant(room);
            return {
                type: "room",
                id: room.id,
                room: room,
                name: getRoomName(room),
                avatarUrl: !room.isGroup ? otherUser?.avatarUrl : (room.avatarUrl || null),
                latestMessage: formatMessagePreview(room.latestMessage, {
                    isGroup: room.isGroup,
                    selfUserId,
                    allUsers
                }),
                latestMessageTime: room.latestMessage?.createdAt || room.updatedAt || room.createdAt || 0,
                isGroup: room.isGroup,
                isPinned: Boolean(room.isPinned),
                isMuted: Boolean(room.isMuted),
                online: !room.isGroup && onlineUsers.includes(otherUser?.id)
            };
        })
        .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.latestMessageTime).getTime() - new Date(a.latestMessageTime).getTime();
        });

    // 2. Gather other system users that do NOT have active conversations with messages/pinned status yet
    const newContactsList = allUsers
        .filter(user => {
            if (user.id === selfUserId) return false;

            // Filter out if already in activeRoomsList (including pinned rooms without messages)
            const hasActiveConversation = activeRoomsList.some(item =>
                !item.isGroup && item.room?.participants?.some(p => p.userId === user.id)
            );
            return !hasActiveConversation;
        })
        .map(user => ({
            type: "user",
            id: user.id,
            user: user,
            name: user.fullName || "Thành viên",
            avatarUrl: user.avatarUrl,
            latestMessage: "Chưa có tin nhắn",
            isGroup: false,
            online: onlineUsers.includes(user.id)
        }))
        // Sort A-Z by name
        .sort((a, b) => a.name.localeCompare(b.name, "vi"));

    // 3. Merge them into a single, unified list with pinned rooms strictly on top
    const unifiedList = [...activeRoomsList, ...newContactsList].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    // 4. Apply search filtering across the entire unified list
    const filteredItems = unifiedList.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-90 border-r border-gray-200 flex flex-col bg-white flex-shrink-0">
            {/* Search & Actions Header */}
            <div className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                    <h1 className="text-2xl font-black text-[#050505]">Đoạn chat</h1>
                    <button
                        onClick={onCreateGroupClick}
                        className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-slate-800"
                        title="Tạo nhóm mới"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Search bar style messenger */}
                <div className="relative bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2 border border-transparent focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#F38820]/20 transition-all">
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="no-focus-ring bg-transparent !border-0 !outline-none text-sm text-slate-800 placeholder-gray-500 w-full !shadow-none"
                    />
                </div>
            </div>

            {/* Unified Chats & Contacts list */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {loadingRooms && rooms.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-mono animate-pulse">ĐANG TẢI...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">Không tìm thấy kết quả</div>
                ) : (
                    filteredItems.map(item => {
                        const isActive = item.type === "room"
                            ? activeRoom?.id === item.room.id
                            : activeRoom?.participants?.some(p => p.userId === item.id) && !activeRoom.isGroup;

                        const unreadCount = item.type === "room" ? Number(unreadCounts?.[item.id] ?? item.room?.unreadCount ?? 0) : 0;
                        const isUnread = unreadCount > 0 || (item.type === "room" && (Boolean(unreadRooms?.[item.id]) || Boolean(item.room?.unread)));

                        return (
                            <button
                                key={item.type + "-" + item.id}
                                onClick={() => item.type === "room" ? selectRoom(item.room) : handleUserClick(item.id)}
                                className={`w-full p-3 flex items-center gap-3 transition-colors text-left rounded-xl ${isActive
                                    ? "bg-orange-50/80"
                                    : "hover:bg-gray-100"
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <RoomAvatar
                                        room={item.room}
                                        user={item.user}
                                        selfUserId={selfUserId}
                                        allUsers={allUsers}
                                        size="lg"
                                    />
                                    {item.online && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-20" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-row items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className={`text-[14px] truncate ${isActive
                                                ? "text-[#F38820] font-bold"
                                                : isUnread
                                                    ? "text-[#050505] font-black"
                                                    : "text-[#050505] font-semibold"
                                                }`}>
                                                {item.name}
                                            </span>
                                            {item.isPinned && (
                                                <Pin className="w-3.5 h-3.5 text-[#F38820] fill-current shrink-0" title="Đã ghim" />
                                            )}
                                            {item.isMuted && (
                                                <BellOff className="w-3.5 h-3.5 text-gray-400 shrink-0" title="Đã tắt thông báo" />
                                            )}
                                        </div>
                                        <span className={`text-[12px] truncate mt-0.5 ${isUnread
                                            ? "text-slate-950 font-bold"
                                            : "text-gray-550"
                                            }`}>
                                            {item.latestMessage}
                                        </span>
                                    </div>

                                    {unreadCount > 0 ? (
                                        <span className="min-w-[18px] h-4.5 px-1.5 flex items-center justify-center text-[10px] font-black text-white bg-red-500 rounded-full shadow-xs shrink-0 animate-in zoom-in-75">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    ) : isUnread ? (
                                        <span className="w-2.5 h-2.5 bg-[#F38820] rounded-full flex-shrink-0" />
                                    ) : null}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
