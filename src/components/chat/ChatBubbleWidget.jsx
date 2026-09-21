import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useChatStore } from "../../store/useChatStore";
import { useGetMeQuery } from "../../api/auth";
import { ChatBubbleRoom } from "./ChatBubbleRoom";
import axios from "axios";
import { BASE_URL } from "../../store/api";

export function ChatBubbleWidget() {
    const location = useLocation();
    const isChatPage = location.pathname === "/chat";
    const [isOpen, setIsOpen] = useState(false);
    const [showUserList, setShowUserList] = useState(false);
    const [systemUsers, setSystemUsers] = useState([]);

    const { data: currentUser } = useGetMeQuery();
    const currentUserId = currentUser?.id;

    const {
        initSocket,
        disconnectSocket,
        rooms,
        activeRoom,
        fetchRooms,
        selectRoom,
        createDM,
        onlineUsers
    } = useChatStore();

    useEffect(() => {
        if (isChatPage) return;

        initSocket();
        fetchRooms();
        
        return () => {
            disconnectSocket();
        };
    }, [isChatPage]);

    const handleToggleWidget = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchRooms();
        }
    };

    const handleStartDM = async (recipientId) => {
        await createDM(recipientId);
        setShowUserList(false);
    };

    const loadSystemUsers = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/users`, {
                withCredentials: true
            });
            setSystemUsers(response.data?.data || response.data || []);
            setShowUserList(true);
        } catch (error) {
            console.error("Error loading system users:", error);
        }
    };

    const getRoomName = (room) => {
        if (room.isGroup) return room.name;
        const otherParticipant = room.participants?.find(p => p.userId !== currentUserId);
        return otherParticipant?.user?.fullName || "Cuộc trò chuyện";
    };

    const isUserOnline = (room) => {
        if (room.isGroup) return false;
        const otherParticipant = room.participants?.find(p => p.userId !== currentUserId);
        return onlineUsers.includes(otherParticipant?.userId);
    };

    if (isChatPage) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans flex flex-col items-end">
            {/* Chat Panel Box */}
            {isOpen && (
                <div 
                    className="w-80 h-[450px] bg-white border border-gray-200 shadow-2xl flex flex-col mb-4 overflow-hidden"
                    style={{ borderRadius: "0px" }} // Net sharp geometry
                >
                    {/* Header */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="font-bold text-xs text-slate-800 tracking-wider uppercase">
                                GETVINI Chat
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {activeRoom && (
                                <button
                                    onClick={() => selectRoom(null)}
                                    className="text-[10px] text-slate-500 hover:text-slate-800 font-bold"
                                >
                                    Quay lại
                                </button>
                            )}
                            <button 
                                onClick={handleToggleWidget}
                                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Active Conversation Room Pane */}
                    {activeRoom ? (
                        <ChatBubbleRoom />
                    ) : showUserList ? (
                        /* User Directory for DMs */
                        <div className="flex-1 flex flex-col bg-white overflow-hidden">
                            <div className="p-3 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Bắt đầu trò chuyện
                                </span>
                                <button
                                    onClick={() => setShowUserList(false)}
                                    className="text-[10px] text-emerald-600 hover:underline font-semibold"
                                >
                                    Đóng
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                                {systemUsers.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-400">
                                        Không tìm thấy nhân sự nào
                                    </div>
                                ) : (
                                    systemUsers.filter(u => u.id !== currentUserId).map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleStartDM(user.id)}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-slate-500">
                                                    {user.fullName ? user.fullName[0].toUpperCase() : "U"}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-slate-800">{user.fullName}</span>
                                                    <span className="text-[9px] text-slate-450">{user.phoneNumber || "Nhân viên"}</span>
                                                </div>
                                            </div>
                                            {onlineUsers.includes(user.id) && (
                                                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Rooms Sidebar List */
                        <div className="flex-1 flex flex-col bg-white overflow-hidden">
                            {/* Toolbar */}
                            <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center bg-gray-50/60">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Hộp thư ({rooms.length})
                                </span>
                                <button
                                    onClick={loadSystemUsers}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
                                >
                                    + Nhắn tin mới
                                </button>
                            </div>

                            {/* Rooms List */}
                            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                                {rooms.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-400">
                                        Không có cuộc hội thoại nào
                                    </div>
                                ) : (
                                    rooms.map(room => (
                                        <button
                                            key={room.id}
                                            onClick={() => selectRoom(room)}
                                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left transition-colors"
                                        >
                                            <div className="relative">
                                                <div className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-emerald-600">
                                                    {room.isGroup ? "G" : getRoomName(room)[0].toUpperCase()}
                                                </div>
                                                {isUserOnline(room) && (
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-xs font-semibold text-slate-800 truncate">
                                                        {getRoomName(room)}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 truncate mt-0.5">
                                                    {room.latestMessage ? room.latestMessage.content : "Chưa có tin nhắn"}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Action Button (FAB) */}
            <button
                onClick={handleToggleWidget}
                className="w-12 h-12 bg-emerald-600 text-white hover:bg-emerald-500 shadow-2xl flex items-center justify-center transition-all hover:scale-105 select-none"
                style={{ borderRadius: "0px" }} // Net sharp geometry
            >
                {isOpen ? (
                    <span className="text-xl font-bold font-mono">↓</span>
                ) : (
                    <svg 
                        className="w-5 h-5 fill-current" 
                        viewBox="0 0 24 24"
                    >
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                    </svg>
                )}
            </button>
        </div>
    );
}
