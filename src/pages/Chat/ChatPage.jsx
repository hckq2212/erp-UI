import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useGetMeQuery } from "../../api/auth";
import { ChatMessageItem } from "../../components/chat/ChatMessageItem";
import { ChatInputWithAutocomplete } from "../../components/chat/ChatInputWithAutocomplete";
import { 
    Phone, 
    Video, 
    Info, 
    Search, 
    SquarePen, 
    Users as UsersIcon, 
    Plus,
    X
} from "lucide-react";
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
            const users = response.data.data || response.data || [];
            setSystemUsers(users);
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
        <div className="flex h-[calc(100vh-64px)] bg-white font-sans text-slate-800 overflow-hidden select-none">
            {/* 1. LEFT SIDEBAR: Conversions & Actions */}
            <div className="w-90 border-r border-gray-200 flex flex-col bg-white flex-shrink-0">
                {/* Search & Actions Header */}
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center px-1">
                        <h1 className="text-2xl font-black text-[#050505]">Đoạn chat</h1>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSelectedUserIds([]);
                                    setGroupName("");
                                    setShowGroupModal(true);
                                }}
                                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-slate-800"
                                title="Tạo nhóm mới"
                            >
                                <SquarePen className="w-5 h-5" />
                            </button>
                        </div>
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

                {/* Rooms List */}
                <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                    {loadingRooms ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-mono">ĐANG TẢI...</div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">Không tìm thấy hội thoại</div>
                    ) : (
                        filteredRooms.map(room => {
                            const isActive = activeRoom?.id === room.id;
                            const otherUser = getOtherParticipant(room);
                            const isOnline = !room.isGroup && onlineUsers.includes(otherUser?.id);
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => selectRoom(room)}
                                    className={`w-full p-3 flex items-center gap-3 transition-colors text-left rounded-xl ${
                                        isActive 
                                            ? "bg-[#eaf4ff]/60" 
                                            : "hover:bg-gray-100"
                                    }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-12 h-12 rounded-full border border-gray-200/60 flex items-center justify-center font-bold text-base ${
                                            isActive ? "bg-[#0084ff] text-white" : "bg-gray-150 text-[#0084ff]"
                                        }`}>
                                            {room.isGroup ? <UsersIcon className="w-5 h-5" /> : getRoomName(room)[0].toUpperCase()}
                                        </div>
                                        {isOnline && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#31a24c] border-2 border-white rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <span className={`text-[14px] font-semibold truncate ${isActive ? "text-[#0084ff]" : "text-[#050505]"}`}>
                                            {getRoomName(room)}
                                        </span>
                                        <span className="text-[12px] text-gray-550 truncate mt-0.5">
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
                        <div className="px-6 py-3.5 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-sm text-[#0084ff]">
                                        {activeRoom.isGroup ? <UsersIcon className="w-4 h-4" /> : getRoomName(activeRoom)[0].toUpperCase()}
                                    </div>
                                    {(!activeRoom.isGroup && onlineUsers.includes(getOtherParticipant(activeRoom)?.id)) && (
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#31a24c] border border-white rounded-full" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[15px] font-bold text-[#050505]">{getRoomName(activeRoom)}</span>
                                    <span className="text-[11px] text-gray-500 font-medium">
                                        {activeRoom.isGroup 
                                            ? `${activeRoom.participants?.length || 0} thành viên`
                                            : onlineUsers.includes(getOtherParticipant(activeRoom)?.id) 
                                                ? "Đang hoạt động" 
                                                : "Ngoại tuyến"
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Messenger Top Header Action Tools */}
                            <div className="flex items-center gap-4">
                                <button className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1.5 rounded-full hover:bg-gray-100">
                                    <Phone className="w-5 h-5 fill-current" />
                                </button>
                                <button className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1.5 rounded-full hover:bg-gray-100">
                                    <Video className="w-5 h-5 fill-current" />
                                </button>
                                
                                {activeRoom.isGroup && (
                                    <button
                                        onClick={() => {
                                            setSelectedUserIds([]);
                                            setShowAddMembersModal(true);
                                        }}
                                        className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1.5 rounded-full hover:bg-gray-100"
                                        title="Thêm thành viên"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                )}
                                
                                <button className="text-[#0084ff] hover:text-[#0073de] transition-colors p-1.5 rounded-full hover:bg-gray-100">
                                    <Info className="w-5 h-5 fill-current" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col bg-white">
                            {loadingMessages ? (
                                <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-mono">
                                    ĐANG TẢI LỊCH SỬ...
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                                    Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                                    const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;

                                    const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;
                                    const showSenderName = !isConsecutive;
                                    const showAvatar = !nextMsg || nextMsg.senderId !== msg.senderId;

                                    return (
                                        <ChatMessageItem
                                            key={msg.id}
                                            message={msg}
                                            isMe={msg.senderId === selfUserId}
                                            isConsecutive={isConsecutive}
                                            showSenderName={showSenderName}
                                            showAvatar={showAvatar}
                                        />
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Typing indicators */}
                        {getTypingText() && (
                            <div className="px-6 py-1 text-[11px] text-gray-500 bg-white italic animate-pulse">
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
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
                        <div className="w-16 h-16 bg-[#eaf4ff] text-[#0084ff] flex items-center justify-center text-2xl mb-4 rounded-full shadow-sm">
                            💬
                        </div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Chọn cuộc trò chuyện</h3>
                        <p className="text-xs text-slate-450 mt-2 max-w-xs leading-relaxed">
                            Chọn một phòng chat ở thanh bên trái hoặc tìm kiếm nhân viên để mở cuộc đối thoại mới.
                        </p>
                    </div>
                )}
            </div>

            {/* 3. MODAL: Create Group Chat */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md flex flex-col shadow-2xl overflow-hidden rounded-2xl border border-gray-150">
                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <span className="text-sm font-bold text-slate-800">Tạo nhóm chat mới</span>
                            <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-slate-650">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-5 flex flex-col gap-4 overflow-hidden">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Tên nhóm</label>
                                <input
                                    type="text"
                                    placeholder="Nhập tên nhóm..."
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-xs px-3 py-2 outline-none focus:border-[#0084ff] text-slate-800 rounded-lg"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5 flex-1 min-h-[200px] max-h-[250px] overflow-hidden">
                                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Chọn thành viên</label>
                                <div className="flex-1 overflow-y-auto border border-gray-200 bg-gray-50 divide-y divide-gray-150 rounded-lg">
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
                                                <span className={`w-4 h-4 border flex items-center justify-center font-bold text-[8px] rounded-md ${
                                                    isSelected ? "border-[#0084ff] bg-[#0084ff] text-white" : "border-gray-300"
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
                                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-gray-100 transition-colors rounded-lg"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateGroupChat}
                                disabled={!groupName.trim() || selectedUserIds.length === 0}
                                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-lg ${
                                    groupName.trim() && selectedUserIds.length > 0
                                        ? "bg-[#0084ff] text-white hover:bg-[#0073de]"
                                        : "bg-gray-150 text-gray-400 cursor-not-allowed"
                                }`}
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
                    <div className="bg-white w-full max-w-md flex flex-col shadow-2xl overflow-hidden rounded-2xl border border-gray-150">
                        <div className="px-5 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
                            <span className="text-sm font-bold text-slate-600">Thêm thành viên vào nhóm</span>
                            <button onClick={() => setShowAddMembersModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-5 flex flex-col gap-4 overflow-hidden">
                            <div className="flex flex-col gap-1.5 flex-1 min-h-[200px] max-h-[250px] overflow-hidden">
                                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Chọn thành viên</label>
                                <div className="flex-1 overflow-y-auto border border-gray-200 bg-gray-50 divide-y divide-gray-150 rounded-lg">
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
                                                    <span className={`w-4 h-4 border flex items-center justify-center font-bold text-[8px] rounded-md ${
                                                        isSelected ? "border-[#0084ff] bg-[#0084ff] text-white" : "border-gray-350"
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
                                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-gray-100 transition-colors rounded-lg"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddGroupMembers}
                                disabled={selectedUserIds.length === 0}
                                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-lg ${
                                    selectedUserIds.length > 0
                                        ? "bg-[#0084ff] text-white hover:bg-[#0073de]"
                                        : "bg-gray-150 text-gray-400 cursor-not-allowed"
                                }`}
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
