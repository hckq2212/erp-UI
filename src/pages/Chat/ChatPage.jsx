import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useGetMeQuery } from "../../api/auth";
import { ChatSidebar } from "../../components/chat/ChatSidebar";
import { ChatWorkspace } from "../../components/chat/ChatWorkspace";
import { ChatGroupModal } from "../../components/chat/ChatGroupModal";
import { ChatAddMembersModal } from "../../components/chat/ChatAddMembersModal";
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
    const [systemUsers, setSystemUsers] = useState([]);

    useEffect(() => {
        if (selfUserId) {
            initSocket(null, selfUserId);
        }
    }, [selfUserId]);

    useEffect(() => {
        fetchRooms();
        loadSystemUsers();

        return () => {
            disconnectSocket();
        };
    }, []);

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

    const handleCreateGroupChat = async (name, userIds) => {
        await createGroup(name, userIds);
        setShowGroupModal(false);
    };

    const handleAddGroupMembers = async (userIds) => {
        if (!activeRoom) return;
        await addMembersToGroup(activeRoom.id, userIds);
        setShowAddMembersModal(false);
    };

    const getRoomName = (room) => {
        if (room.isGroup) return room.name;
        const otherParticipant = room.participants?.find(p => p.userId !== selfUserId);
        return otherParticipant?.user?.fullName || "Cuộc trò chuyện";
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-white font-sans text-slate-800 overflow-hidden select-none">
            {/* 1. LEFT SIDEBAR: Conversions & Search */}
            <ChatSidebar
                rooms={rooms}
                activeRoom={activeRoom}
                onlineUsers={onlineUsers}
                selfUserId={selfUserId}
                selectRoom={selectRoom}
                onCreateGroupClick={() => setShowGroupModal(true)}
                loadingRooms={loadingRooms}
                getRoomName={getRoomName}
            />

            {/* 2. CHAT CONVERSATION WORKSPACE */}
            <ChatWorkspace
                activeRoom={activeRoom}
                selfUserId={selfUserId}
                messages={messages}
                loadingMessages={loadingMessages}
                onlineUsers={onlineUsers}
                typingUsers={typingUsers}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                onAddMembersClick={() => setShowAddMembersModal(true)}
                getRoomName={getRoomName}
            />

            {/* 3. MODAL: Create Group Chat */}
            <ChatGroupModal
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                systemUsers={systemUsers}
                selfUserId={selfUserId}
                onCreateGroup={handleCreateGroupChat}
            />

            {/* 4. MODAL: Add Members to Existing Group */}
            <ChatAddMembersModal
                isOpen={showAddMembersModal}
                onClose={() => setShowAddMembersModal(false)}
                activeRoom={activeRoom}
                systemUsers={systemUsers}
                selfUserId={selfUserId}
                onAddMembers={handleAddGroupMembers}
            />
        </div>
    );
}
