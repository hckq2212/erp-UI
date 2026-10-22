import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useChatStore } from "../../store/useChatStore";
import { useGetMeQuery } from "../../api/auth";
import { useGetUsersQuery } from "../../api/users";
import { ChatBubbleRoom } from "./ChatBubbleRoom";
import { RoomAvatar } from "./RoomAvatar";
import { ChatGroupModal } from "./ChatGroupModal";
import {
    ChevronDown,
    MessageCircle,
    Search,
    X,
    Users,
    Pin,
    BellOff
} from "lucide-react";
import { formatMessagePreview } from "../../utils/chatTokenHelper";

export function ChatBubbleWidget() {
    const location = useLocation();
    const isChatPage = location.pathname === "/chat";

    const [showGroupModal, setShowGroupModal] = useState(false);
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
        createGroup,
        isConnected,
        isBubbleOpen,
        setIsBubbleOpen
    } = useChatStore();

    // Query danh sách người dùng từ RTK Query (chuẩn hệ thống ERP)
    const { data: usersData } = useGetUsersQuery();
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
        const nextState = !isBubbleOpen;
        setIsBubbleOpen(nextState);
        if (nextState) {
            fetchRooms();
        }
    };

    const handleStartDM = async (recipientId) => {
        await createDM(recipientId);
        setShowUserList(false);
    };

    const getOtherParticipant = (room) => {
        if (!room) return null;
        const participant = room.participants?.find(p => p.userId !== currentUserId);
        if (participant?.user) return participant.user;
        if (participant?.userId) {
            return systemUsers.find(u => u.id === participant.userId) || null;
        }
        return null;
    };

    const getRoomName = (room) => {
        if (!room) return "";
        if (room.isGroup) return room.name || "Nhóm trò chuyện";
        const otherParticipant = room.participants?.find(p => p.userId !== currentUserId);
        if (otherParticipant?.user?.fullName) {
            return otherParticipant.user.fullName;
        }
        if (otherParticipant?.userId) {
            const foundUser = systemUsers.find(u => u.id === otherParticipant.userId);
            if (foundUser?.fullName) return foundUser.fullName;
        }
        return "Cuộc trò chuyện";
    };

    const isUserOnline = (room) => {
        if (!room || room.isGroup) return false;
        const otherParticipant = room.participants?.find(p => p.userId !== currentUserId);
        return onlineUsers.includes(otherParticipant?.userId);
    };

    const activeRoomsList = useMemo(() => {
        return rooms
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
                        selfUserId: currentUserId,
                        allUsers: systemUsers
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
    }, [rooms, currentUserId, systemUsers, onlineUsers]);

    const newContactsList = useMemo(() => {
        return systemUsers
            .filter(user => {
                if (user.id === currentUserId) return false;
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
            .sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }, [systemUsers, currentUserId, activeRoomsList, onlineUsers]);

    const unifiedList = useMemo(() => {
        return [...activeRoomsList, ...newContactsList].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });
    }, [activeRoomsList, newContactsList]);

    const filteredItems = useMemo(() => {
        const term = roomSearch.trim().toLowerCase();
        if (!term) return unifiedList;
        return unifiedList.filter(item =>
            item.name.toLowerCase().includes(term)
        );
    }, [unifiedList, roomSearch]);

    const handleItemClick = async (item) => {
        if (item.type === "room") {
            selectRoom(item.room);
        } else {
            const existingRoom = rooms.find(room =>
                !room.isGroup && room.participants?.some(p => p.userId === item.id)
            );
            if (existingRoom) {
                selectRoom(existingRoom);
            } else {
                await createDM(item.id);
            }
        }
    };

    const totalUnread = useMemo(() => {
        return Object.values(unreadCounts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    }, [unreadCounts]);

    const handleCreateGroup = async (name, userIds, avatarUrl) => {
        const newRoom = await createGroup(name, userIds, avatarUrl);
        setShowGroupModal(false);
        if (newRoom) {
            selectRoom(newRoom);
        }
    };

    // Không render widget khi chưa đăng nhập hoặc đang ở trang Chat toàn màn hình
    if (isChatPage || !currentUserId) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-[9990] font-sans flex flex-col items-end pointer-events-auto">
            {/* Chat Panel Box */}
            {isBubbleOpen && (
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
                        ) : (
                            <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
                                <span className="font-bold text-sm text-slate-800 tracking-wide">
                                    GETVINI Chat
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-1 text-slate-500">
                            {!activeRoom && (
                                <button
                                    type="button"
                                    onClick={() => setShowGroupModal(true)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-orange-50 hover:text-[#F38820] rounded-full transition-colors cursor-pointer"
                                    title="Tạo nhóm mới"
                                >
                                    <Users className="w-4.5 h-4.5" />
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
                                        placeholder="Tìm kiếm"
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

                            {/* Rooms & Contacts Unified List */}
                            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                                {filteredItems.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-400">
                                        Không tìm thấy cuộc trò chuyện nào
                                    </div>
                                ) : (
                                    filteredItems.map((item) => {
                                        const isRoom = item.type === "room";
                                        const unreadCount = isRoom ? Number(unreadCounts?.[item.id] || item.room?.unreadCount || 0) : 0;
                                        const hasUnread = unreadCount > 0;
                                        return (
                                            <button
                                                key={item.type + "-" + item.id}
                                                onClick={() => handleItemClick(item)}
                                                className={`w-full px-3.5 py-3 flex items-center gap-3 hover:bg-orange-50/40 text-left transition-colors cursor-pointer ${
                                                    hasUnread ? "bg-orange-50/20" : ""
                                                }`}
                                            >
                                                <div className="relative shrink-0">
                                                    <RoomAvatar
                                                        room={item.room}
                                                        user={item.user}
                                                        selfUserId={currentUserId}
                                                        allUsers={systemUsers}
                                                        size="sm"
                                                    />
                                                    {item.online && (
                                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full ring-1 ring-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col">
                                                    <div className="flex justify-between items-baseline gap-1.5">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className={`text-xs truncate ${hasUnread ? "font-bold text-slate-950" : "font-medium text-slate-800"}`}>
                                                                {item.name}
                                                            </span>
                                                            {item.isPinned && (
                                                                <Pin className="w-3 h-3 text-[#F38820] fill-current shrink-0" title="Đã ghim" />
                                                            )}
                                                            {item.isMuted && (
                                                                <BellOff className="w-3 h-3 text-gray-400 shrink-0" title="Đã tắt thông báo" />
                                                            )}
                                                        </div>
                                                        {hasUnread && (
                                                            <span className="min-w-4.5 h-4.5 px-1.5 rounded-full bg-[#F38820] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                {unreadCount > 99 ? "99+" : unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-[11px] truncate mt-0.5 ${hasUnread ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
                                                        {item.latestMessage}
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
                title={isBubbleOpen ? "Thu nhỏ tin nhắn" : "Mở tin nhắn"}
            >
                {totalUnread > 0 && !isBubbleOpen && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold border-2 border-white flex items-center justify-center shadow-sm animate-pulse">
                        {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                )}
                {isBubbleOpen ? (
                    <ChevronDown className="w-6 h-6 stroke-[2.5]" />
                ) : (
                    <MessageCircle className="w-6 h-6 stroke-[2.2]" />
                )}
            </button>

            {/* Modal tạo nhóm mới */}
            {showGroupModal && (
                <ChatGroupModal
                    isOpen={showGroupModal}
                    onClose={() => setShowGroupModal(false)}
                    systemUsers={systemUsers}
                    selfUserId={currentUserId}
                    onlineUsers={onlineUsers}
                    onCreateGroup={handleCreateGroup}
                />
            )}
        </div>
    );
}
