import React, { useState } from "react";
import { Search, Plus, Users as UsersIcon } from "lucide-react";
import { useGetUsersQuery } from "../../api/users";
import { useChatStore } from "../../store/useChatStore";

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
    const { createDM, unreadRooms } = useChatStore();

    // Fetch system users to initiate new DMs
    const { data: usersData } = useGetUsersQuery();

    const getOtherParticipant = (room) => {
        return room.participants?.find(p => p.userId !== selfUserId)?.user;
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

    // 1. Gather all active conversation rooms
    const activeRoomsList = rooms
        .map(room => {
            const otherUser = getOtherParticipant(room);
            return {
                type: "room",
                id: room.id,
                room: room,
                name: getRoomName(room),
                latestMessage: room.latestMessage ? room.latestMessage.content : "Chưa có tin nhắn",
                latestMessageTime: room.latestMessage?.createdAt || room.updatedAt || room.createdAt || 0,
                isGroup: room.isGroup,
                online: !room.isGroup && onlineUsers.includes(otherUser?.id)
            };
        })
        .sort((a, b) => new Date(b.latestMessageTime).getTime() - new Date(a.latestMessageTime).getTime());

    // 2. Gather other system users that we do NOT have active conversations with yet
    const allUsers = usersData?.data || usersData || [];
    const newContactsList = allUsers
        .filter(user => {
            if (user.id === selfUserId) return false;

            const hasExistingDM = rooms.some(room =>
                !room.isGroup && room.participants?.some(p => p.userId === user.id)
            );
            return !hasExistingDM;
        })
        .map(user => ({
            type: "user",
            id: user.id,
            user: user,
            name: user.fullName || "Thành viên",
            latestMessage: "Chưa có tin nhắn",
            isGroup: false,
            online: onlineUsers.includes(user.id)
        }))
        // Sort A-Z by name
        .sort((a, b) => a.name.localeCompare(b.name, "vi"));

    // 3. Merge them into a single, unified list
    const unifiedList = [...activeRoomsList, ...newContactsList];

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
                <div className="relative bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm trên Messenger"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-0 outline-none text-sm text-slate-800 placeholder-gray-500 w-full"
                    />
                </div>
            </div>

            {/* Unified Chats & Contacts list */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {loadingRooms ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-mono animate-pulse">ĐANG TẢI...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">Không tìm thấy kết quả</div>
                ) : (
                    filteredItems.map(item => {
                        const isActive = item.type === "room"
                            ? activeRoom?.id === item.room.id
                            : activeRoom?.participants?.some(p => p.userId === item.id) && !activeRoom.isGroup;

                        const isUnread = item.type === "room" && unreadRooms[item.id];

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
                                    <div className={`w-12 h-12 rounded-full border border-gray-200/60 flex items-center justify-center font-bold text-base ${isActive ? "bg-[#F38820] text-white" : "bg-gray-150 text-[#F38820]"
                                        }`}>
                                        {item.isGroup ? <UsersIcon className="w-5 h-5" /> : item.name[0].toUpperCase()}
                                    </div>
                                    {item.online && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-row items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <span className={`text-[14px] truncate ${isActive
                                            ? "text-[#F38820] font-bold"
                                            : isUnread
                                                ? "text-[#050505] font-black"
                                                : "text-[#050505] font-semibold"
                                            }`}>
                                            {item.name}
                                        </span>
                                        <span className={`text-[12px] truncate mt-0.5 ${isUnread
                                            ? "text-slate-950 font-bold"
                                            : "text-gray-550"
                                            }`}>
                                            {item.latestMessage}
                                        </span>
                                    </div>

                                    {isUnread && (
                                        <span className="w-2.5 h-2.5 bg-[#F38820] rounded-full flex-shrink-0" />
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
