import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useGetMeQuery } from "../../api/auth";
import { useGetUsersQuery } from "../../api/users";
import { ChatSidebar } from "../../components/chat/ChatSidebar";
import { ChatWorkspace } from "../../components/chat/ChatWorkspace";
import { ChatInfoSidebar } from "../../components/chat/ChatInfoSidebar";
import { ChatGroupModal } from "../../components/chat/ChatGroupModal";
import { ChatAddMembersModal } from "../../components/chat/ChatAddMembersModal";
import { MemberProfileModal } from "../../components/chat/MemberProfileModal";
import axios from "axios";
import { BASE_URL } from "../../store/api";

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
        updateParticipantRole,
        removeParticipant,
        loadingRooms,
        loadingMessages
    } = useChatStore();

    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);
    const [systemUsers, setSystemUsers] = useState([]);
    const [showInfoSidebar, setShowInfoSidebar] = useState(false);
    const [profileModalParticipant, setProfileModalParticipant] = useState(null);

    // Reset Info Sidebar to closed when changing room
    useEffect(() => {
        setShowInfoSidebar(false);
    }, [activeRoom?.id]);

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
            const response = await axios.get(`${BASE_URL}/users`, {
                withCredentials: true
            });
            const users = response.data.data || response.data || [];
            setSystemUsers(users);
        } catch (error) {
            console.error("Error loading system users:", error);
        }
    };

    const handleSendMessage = (content, attachments = []) => {
        sendMessage(content, attachments, currentUser);
    };

    const handleTyping = (isTyping) => {
        sendTyping(isTyping);
    };

    const handleCreateGroupChat = async (name, userIds, avatarUrl) => {
        await createGroup(name, userIds, avatarUrl);
        setShowGroupModal(false);
    };

    const handleAddGroupMembers = async (userIds) => {
        if (!activeRoom) return;
        await addMembersToGroup(activeRoom.id, userIds);
        setShowAddMembersModal(false);
    };

    const { data: usersData } = useGetUsersQuery();
    const allUsers = Array.isArray(usersData?.data) ? usersData.data : (Array.isArray(usersData) ? usersData : []);

    const getRoomName = (room) => {
        if (!room) return "";
        if (room.isGroup) return room.name || "Nhóm trò chuyện";
        const otherParticipant = room.participants?.find(p => p.userId !== selfUserId);
        if (otherParticipant?.user?.fullName) {
            return otherParticipant.user.fullName;
        }
        if (otherParticipant?.userId) {
            const foundUser = allUsers.find(u => u.id === otherParticipant.userId);
            if (foundUser?.fullName) return foundUser.fullName;
        }
        return "Cuộc trò chuyện";
    };

    // Lắng nghe sự kiện mở modal thông tin nhân sự (khi click tag @ hoặc avatar/tên)
    useEffect(() => {
        const handleOpenProfile = (e) => {
            const { userId, userName } = e.detail || {};
            if (!userId) return;

            // 1. Tìm trong danh sách thành viên của phòng đang hoạt động nếu có
            const inRoomParticipant = activeRoom?.participants?.find(
                p => (p.userId || p.user?.id) === userId
            );

            if (inRoomParticipant) {
                setProfileModalParticipant(inRoomParticipant);
                return;
            }

            // 2. Tìm trong danh sách toàn bộ người dùng hệ thống
            const userList = allUsers.length > 0 ? allUsers : systemUsers;
            const foundUser = userList.find(u => u.id === userId);

            setProfileModalParticipant({
                id: `temp-${userId}`,
                userId,
                role: "MEMBER",
                user: foundUser || { id: userId, fullName: userName, username: userName }
            });
        };

        window.addEventListener("chat:open_user_profile", handleOpenProfile);
        return () => window.removeEventListener("chat:open_user_profile", handleOpenProfile);
    }, [activeRoom?.participants, allUsers, systemUsers]);

    // Quyền của chính người dùng hiện tại trong activeRoom
    const myParticipant = activeRoom?.participants?.find(p => (p.userId || p.user?.id) === selfUserId);
    const myRole = myParticipant?.role || (
        (activeRoom?.creatorId && (myParticipant?.userId === activeRoom.creatorId || myParticipant?.user?.id === activeRoom.creatorId))
            ? "ADMIN"
            : "MEMBER"
    );

    const effectiveProfileRole = profileModalParticipant?.role || (
        (activeRoom?.creatorId && (profileModalParticipant?.userId === activeRoom.creatorId || profileModalParticipant?.user?.id === activeRoom.creatorId))
            ? "ADMIN"
            : "MEMBER"
    );

    const handleSetRole = async (targetUserId, targetName, newRole) => {
        let confirmMsg = "";
        if (newRole === "ADMIN") {
            confirmMsg = `Bạn có chắc chắn muốn chuyển quyền Trưởng nhóm cho "${targetName}" không? Bạn sẽ trở thành Phó nhóm.`;
        } else if (newRole === "DEPUTY") {
            confirmMsg = `Bổ nhiệm "${targetName}" làm Phó nhóm?`;
        } else {
            confirmMsg = `Hủy quyền Phó nhóm của "${targetName}"?`;
        }

        if (window.confirm(confirmMsg)) {
            await updateParticipantRole(activeRoom.id, targetUserId, newRole);
            setProfileModalParticipant(null);
        }
    };

    const handleRemoveMember = async (targetUserId, targetName) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa "${targetName}" khỏi nhóm chat này không?`)) {
            await removeParticipant(activeRoom.id, targetUserId);
            setProfileModalParticipant(null);
        }
    };

    return (
        <div className="flex h-full w-full bg-white font-sans text-slate-800 overflow-hidden select-none">
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
                showInfo={showInfoSidebar}
                onToggleInfo={() => setShowInfoSidebar(!showInfoSidebar)}
            />

            {/* 2.5. CHAT INFO SIDEBAR */}
            {showInfoSidebar && activeRoom && (
                <ChatInfoSidebar
                    activeRoom={activeRoom}
                    selfUserId={selfUserId}
                    onlineUsers={onlineUsers}
                    getRoomName={getRoomName}
                    onClose={() => setShowInfoSidebar(false)}
                />
            )}

            {/* 3. MODAL: Create Group Chat */}
            <ChatGroupModal
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                systemUsers={allUsers.length > 0 ? allUsers : systemUsers}
                selfUserId={selfUserId}
                onlineUsers={onlineUsers}
                onCreateGroup={handleCreateGroupChat}
            />

            {/* 4. MODAL: Add Members to Existing Group */}
            <ChatAddMembersModal
                isOpen={showAddMembersModal}
                onClose={() => setShowAddMembersModal(false)}
                activeRoom={activeRoom}
                systemUsers={allUsers.length > 0 ? allUsers : systemUsers}
                selfUserId={selfUserId}
                onlineUsers={onlineUsers}
                onAddMembers={handleAddGroupMembers}
            />

            {/* 5. MODAL: Member Profile Details */}
            {profileModalParticipant && (
                <MemberProfileModal
                    isOpen={Boolean(profileModalParticipant)}
                    onClose={() => setProfileModalParticipant(null)}
                    participant={profileModalParticipant}
                    activeRoom={activeRoom}
                    selfUserId={selfUserId}
                    onlineUsers={onlineUsers}
                    role={effectiveProfileRole}
                    allUsers={allUsers.length > 0 ? allUsers : systemUsers}
                    onSetRole={activeRoom?.isGroup && myRole === "ADMIN" ? handleSetRole : null}
                    onRemoveMember={activeRoom?.isGroup && (myRole === "ADMIN" || myRole === "DEPUTY") ? handleRemoveMember : null}
                />
            )}
        </div>
    );
}
