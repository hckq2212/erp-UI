import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGetMeQuery } from "../api/auth";
import { ChatMessageItem } from "../components/chat/ChatMessageItem";
import { ChatInputWithAutocomplete } from "../components/chat/ChatInputWithAutocomplete";
import axios from "axios";

export function ChatPage() {
    const { data: currentUser } = useGetMeQuery();
    const selfUserId = currentUser?.id;

    const {
        initSocket,
        disconnectSocket,
        rooms,
        activeRoom,
        messages,
        fetchRooms,
        selectRoom,
        sendMessage,
        sendTyping,
        typingUsers,
        onlineUsers,
        createGroup,
        addMembersToGroup,
        loadingRooms,
        loadingMessages
    } = useChatStore();

    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [systemUsers, setSystemUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const messagesEndRef = useRef(null);

    useEffect(() => {
        initSocket();
        fetchRooms();
        loadSystemUsers();

        return () => {
            disconnectSocket();
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingUsers]);

    const loadSystemUsers = async () => {
        try {
            const response = await axios.get("http://localhost:3000/api/users", {
                withCredentials: true
            });
            setSystemUsers(response.data || []);
        } catch (error) {
            console.error("Error loading system users:", error);
        }
    };

    const handleSendMessage = (content) => {
        sendMessage(content);
    };

    const handleTyping = (isTyping) => {
        sendTyping(isTyping);
    };

    const handleCreateGroupChat = async () => {
        if (!groupName.trim() || selectedUserIds.length === 0) return;
        await createGroup(groupName.trim(), selectedUserIds);
        setGroupName("");
        setSelectedUserIds([]);
        setShowGroupModal(false);
    };

    const handleAddGroupMembers = async () => {
        if (!activeRoom || selectedUserIds.length === 0) return;
        await addMembersToGroup(activeRoom.id, selectedUserIds);
        setSelectedUserIds([]);
        setShowAddMembersModal(false);
    };

    const toggleSelectUser = (uid) => {
        if (selectedUserIds.includes(uid)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== uid));
        } else {
            setSelectedUserIds([...selectedUserIds, uid]);
        }
    };

    const getRoomName = (room) => {
        if (room.isGroup) return room.name;
        const otherParticipant = room.participants?.find(p => p.userId !== selfUserId);
        return otherParticipant?.user?.fullName || "Cuộc trò chuyện";
    };

    const getOtherParticipant = (room) => {
        return room.participants?.find(p => p.userId !== selfUserId)?.user;
    };

    const getTypingText = () => {
        if (!activeRoom) return "";
        const roomTyping = typingUsers[activeRoom.id] || {};
        const otherTypers = Object.entries(roomTyping)
            .filter(([uid]) => uid !== selfUserId)
            .map(([, username]) => username);

        if (otherTypers.length === 0) return "";
        if (otherTypers.length === 1) return `${otherTypers[0]} đang soạn tin...`;
        return "Nhiều người đang soạn tin...";
    };

    const filteredRooms = rooms.filter(room => 
        getRoomName(room).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50 font-sans text-slate-800 overflow-hidden select-none">
            {/* 1. LEFT SIDEBAR: Conversions & Actions */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
                {/* Search & Actions Header */}
                <div className="p-4 border-b border-gray-150 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <h1 className="text-sm font-bold uppercase tracking-widest text-slate-500">Tin nhắn</h1>
                        <button
                            onClick={() => {
                                setSelectedUserIds([]);
                                setGroupName("");
                                setShowGroupModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-55 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest transition-colors border border-emerald-200"
                            style={{ borderRadius: "0px" }}
                        >
                            Tạo nhóm
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Tìm hội thoại..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs px-3 py-2 outline-none focus:border-gray-300 placeholder-gray-400 text-slate-700"
                        style={{ borderRadius: "0px" }}
                    />
                </div>

                {/* Rooms List */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {loadingRooms ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-mono">ĐANG TẢI...</div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">Không tìm thấy hội thoại</div>
                    ) : (
                        filteredRooms.map(room => {
                            const isActive = activeRoom?.id === room.id;
                            const isOnline = !room.isGroup && onlineUsers.includes(getOtherParticipant(room)?.id);
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => selectRoom(room)}
                                    className={`w-full p-4 flex items-center gap-3 transition-colors text-left border-l-2 ${
                                        isActive 
                                            ? "bg-indigo-50/50 border-emerald-500" 
                                            : "border-transparent hover:bg-gray-50"
                                    }`}
                                >
                                    <div className="relative">
                                        <div className="w-9 h-9 bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-emerald-600">
                                            {room.isGroup ? "GP" : getRoomName(room)[0].toUpperCase()}
                                        </div>
                                        {isOnline && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <span className="text-xs font-semibold text-slate-800 truncate">{getRoomName(room)}</span>
                                        <span className="text-[10px] text-slate-500 truncate mt-1">
                                            {room.latestMessage ? room.latestMessage.content : "Chưa có tin nhắn"}
                                        </span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 2. CHAT CONVERSATION WORKSPACE */}
            <div className="flex-1 flex flex-col bg-white">
                {activeRoom ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Room Header */}
                        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-800">{getRoomName(activeRoom)}</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                    {activeRoom.isGroup 
                                        ? `${activeRoom.participants?.length || 0} thành viên`
                                        : onlineUsers.includes(getOtherParticipant(activeRoom)?.id) 
                                            ? "Đang hoạt động" 
                                            : "Ngoại tuyến"
                                    }
                                </span>
                            </div>

                            {activeRoom.isGroup && (
                                <button
                                    onClick={() => {
                                        setSelectedUserIds([]);
                                        setShowAddMembersModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 transition-all"
                                    style={{ borderRadius: "0px" }}
                                >
                                    + Thêm người
                                </button>
                            )}
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col bg-gray-50/30">
                            {loadingMessages ? (
                                <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-mono">
                                    ĐANG TẢI LỊCH SỬ...
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-xs text-slate-550">
                                    Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <ChatMessageItem
                                        key={msg.id}
                                        message={msg}
                                        isMe={msg.senderId === selfUserId}
                                    />
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Typing indicators */}
                        {getTypingText() && (
                            <div className="px-6 py-1 text-[10px] text-slate-500 bg-gray-50 italic animate-pulse">
                                {getTypingText()}
                            </div>
                        )}

                        {/* Custom Input */}
                        <ChatInputWithAutocomplete
                            onSendMessage={handleSendMessage}
                            onTyping={handleTyping}
                        />
                    </div>
                ) : (
                    /* Fallback Screen */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
                        <div className="w-12 h-12 bg-white border border-gray-200 text-slate-400 flex items-center justify-center text-lg mb-4 shadow-sm">
                            💬
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Chọn cuộc trò chuyện</h3>
                        <p className="text-xs text-slate-455 mt-2 max-w-xs leading-relaxed">
                            Chọn một phòng chat ở thanh bên trái hoặc tìm kiếm nhân viên để mở cuộc đối thoại mới.
                        </p>
                    </div>
                )}
            </div>

            {/* 3. MODAL: Create Group Chat */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 w-full max-w-md flex flex-col shadow-2xl overflow-hidden" style={{ borderRadius: "0px" }}>
                        <div className="px-5 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Tạo nhóm chat mới</span>
                            <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        
                        <div className="p-5 flex flex-col gap-4 overflow-hidden">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Tên nhóm</label>
                                <input
                                    type="text"
                                    placeholder="Nhập tên nhóm..."
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-xs px-3 py-2 outline-none focus:border-gray-300 text-slate-800"
                                    style={{ borderRadius: "0px" }}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5 flex-1 min-h-[200px] max-h-[250px] overflow-hidden">
                                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Chọn thành viên</label>
                                <div className="flex-1 overflow-y-auto border border-gray-200 bg-gray-50 divide-y divide-gray-150">
                                    {systemUsers.filter(u => u.id !== selfUserId).map(user => {
                                        const isSelected = selectedUserIds.includes(user.id);
                                        return (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => toggleSelectUser(user.id)}
                                                className={`w-full px-4 py-2.5 text-xs flex items-center justify-between text-left transition-colors ${
                                                    isSelected ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-gray-100"
                                                }`}
                                            >
                                                <span>{user.fullName}</span>
                                                <span className={`w-3.5 h-3.5 border flex items-center justify-center font-bold text-[8px] ${
                                                    isSelected ? "border-emerald-500 text-emerald-600" : "border-gray-300"
                                                }`}>
                                                    {isSelected ? "✓" : ""}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-4 border-t border-gray-150 flex justify-end gap-3">
                            <button
                                onClick={() => setShowGroupModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-gray-100 transition-colors"
                                style={{ borderRadius: "0px" }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateGroupChat}
                                disabled={!groupName.trim() || selectedUserIds.length === 0}
                                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                                    groupName.trim() && selectedUserIds.length > 0
                                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                        : "bg-gray-150 text-gray-400 cursor-not-allowed"
                                }`}
                                style={{ borderRadius: "0px" }}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. MODAL: Add Members to Existing Group */}
            {showAddMembersModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 w-full max-w-md flex flex-col shadow-2xl overflow-hidden" style={{ borderRadius: "0px" }}>
                        <div className="px-5 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Thêm thành viên vào nhóm</span>
                            <button onClick={() => setShowAddMembersModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        
                        <div className="p-5 flex flex-col gap-4 overflow-hidden">
                            <div className="flex flex-col gap-1.5 flex-1 min-h-[200px] max-h-[250px] overflow-hidden">
                                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Chọn thành viên</label>
                                <div className="flex-1 overflow-y-auto border border-gray-200 bg-gray-50 divide-y divide-gray-150">
                                    {systemUsers
                                        .filter(u => u.id !== selfUserId && !activeRoom.participants?.some(p => p.userId === u.id))
                                        .map(user => {
                                            const isSelected = selectedUserIds.includes(user.id);
                                            return (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => toggleSelectUser(user.id)}
                                                    className={`w-full px-4 py-2.5 text-xs flex items-center justify-between text-left transition-colors ${
                                                        isSelected ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-gray-100"
                                                    }`}
                                                >
                                                    <span>{user.fullName}</span>
                                                    <span className={`w-3.5 h-3.5 border flex items-center justify-center font-bold text-[8px] ${
                                                        isSelected ? "border-emerald-500 text-emerald-600" : "border-gray-300"
                                                    }`}>
                                                        {isSelected ? "✓" : ""}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-4 border-t border-gray-150 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddMembersModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-gray-100 transition-colors"
                                style={{ borderRadius: "0px" }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddGroupMembers}
                                disabled={selectedUserIds.length === 0}
                                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                                    selectedUserIds.length > 0
                                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                        : "bg-gray-150 text-gray-400 cursor-not-allowed"
                                }`}
                                style={{ borderRadius: "0px" }}
                            >
                                Thêm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
