import { create } from "zustand";
import { io } from "socket.io-client";
import axios from "axios";
import { API_ORIGIN, BASE_URL } from "./api";
import { playMessageNotificationSound, showDesktopNotification } from "../utils/chatNotificationSound";

const SOCKET_URL = API_ORIGIN;

const chatAxios = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

const sortRoomsWithPin = (roomsList) => {
    return [...roomsList].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = a.latestMessage?.createdAt || a.updatedAt || a.createdAt || 0;
        const timeB = b.latestMessage?.createdAt || b.updatedAt || b.createdAt || 0;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
};

export const useChatStore = create((set, get) => ({
    socket: null,
    isConnected: false,
    rooms: [],
    activeRoom: null,
    messages: [],
    onlineUsers: [],
    typingUsers: {}, // roomId -> { userId: username }
    loadingRooms: false,
    loadingMessages: false,
    hasMoreMessages: true,
    loadingMoreMessages: false,

    selfUserId: null,
    unreadRooms: {}, // roomId -> boolean
    unreadCounts: {}, // roomId -> number
    pinnedMessagesByRoom: {}, // roomId -> array of pinned messages
    editingMessage: null, // message currently being edited
    replyingToMessage: null, // message currently being replied to
    setReplyingToMessage: (message) => set({ replyingToMessage: message, editingMessage: null }),

    isBubbleOpen: false,
    setIsBubbleOpen: (isOpen) => {
        const { activeRoom, unreadRooms, unreadCounts, rooms } = get();
        if (isOpen && activeRoom) {
            const newUnread = { ...unreadRooms };
            const newUnreadCounts = { ...unreadCounts };
            newUnread[activeRoom.id] = false;
            newUnreadCounts[activeRoom.id] = 0;

            chatAxios.post(`/chat-rooms/${activeRoom.id}/read`).catch(err => {
                console.error("Failed to mark room as read on server:", err);
            });

            const updatedRooms = rooms.map(r => {
                if (String(r.id) === String(activeRoom.id)) {
                    return { ...r, unread: false, unreadCount: 0 };
                }
                return r;
            });

            set({
                isBubbleOpen: isOpen,
                rooms: updatedRooms,
                unreadRooms: newUnread,
                unreadCounts: newUnreadCounts
            });
        } else {
            set({ isBubbleOpen: isOpen });
        }
    },

    applyReceivedMessage: (message, tempId = null) => {
        const { activeRoom, messages, rooms, selfUserId: currentSelfUserId, unreadRooms, unreadCounts } = get();

        if (activeRoom && String(activeRoom.id) === String(message.roomId)) {
            let nextMessages = [...messages];
            if (tempId) {
                const tempIndex = nextMessages.findIndex(m => m.id === tempId);
                if (tempIndex !== -1) {
                    nextMessages[tempIndex] = message;
                } else if (!nextMessages.some(m => String(m.id) === String(message.id))) {
                    nextMessages.push(message);
                }
            } else {
                const exists = nextMessages.some(m => String(m.id) === String(message.id));
                if (!exists) {
                    // Nếu là tin nhắn từ chính mình nhận lại qua WebSocket, thay thế tin nhắn optimistic
                    const tempMatchIdx = nextMessages.findIndex(
                        m => m.isOptimistic && String(m.senderId) === String(message.senderId) && m.content === message.content
                    );
                    if (tempMatchIdx !== -1) {
                        nextMessages[tempMatchIdx] = message;
                    } else {
                        nextMessages.push(message);
                    }
                }
            }
            set({ messages: nextMessages });
        }

        const roomExists = rooms.some(room => String(room.id) === String(message.roomId));
        if (!roomExists) {
            get().fetchRooms();
            return;
        }

        const isFromOther = String(message.senderId) !== String(currentSelfUserId);
        const isChatPage = typeof window !== "undefined" && window.location.pathname.startsWith("/chat");
        const { isBubbleOpen } = get();
        // Chỉ coi là đang trực tiếp xem phòng chat nếu:
        // 1. Đang ở trang /chat toàn màn hình VÀ activeRoom là phòng này
        // 2. HOẶC đang mở cửa sổ bong bóng (isBubbleOpen === true) VÀ activeRoom là phòng này
        const isViewingActiveRoom = (isChatPage || isBubbleOpen) && activeRoom && String(activeRoom.id) === String(message.roomId);
        const isUnread = isFromOther && !isViewingActiveRoom;
        const newUnread = { ...unreadRooms };
        const newUnreadCounts = { ...unreadCounts };

        if (isUnread) {
            newUnread[message.roomId] = true;
            newUnreadCounts[message.roomId] = (newUnreadCounts[message.roomId] || 0) + 1;
        }

        const updatedRooms = rooms.map(room => {
            if (String(room.id) === String(message.roomId)) {
                return {
                    ...room,
                    latestMessage: message,
                    updatedAt: message.createdAt || new Date().toISOString(),
                    unread: isUnread ? true : false,
                    unreadCount: isUnread ? (newUnreadCounts[message.roomId] || 1) : 0
                };
            }
            return room;
        });

        const sortedRooms = sortRoomsWithPin(updatedRooms);

        // Tìm thông tin phòng để kiểm tra trạng thái isMuted
        const targetRoom = rooms.find(r => String(r.id) === String(message.roomId));
        const isMuted = Boolean(targetRoom?.isMuted);

        // Phát âm thanh và thông báo Desktop nếu tin nhắn từ người khác và phòng không bị Mute
        if (isFromOther && !isMuted) {
            // 1. Âm thanh "Ting": Phát âm lượng chuẩn khi không ở phòng này hoặc tab ẩn, phát nhỏ hơn nếu đang ở trong phòng
            const volume = isViewingActiveRoom ? 0.12 : 0.25;
            playMessageNotificationSound(volume);

            // 2. Desktop Notification: Khi tab bị thu nhỏ hoặc không đang xem trực tiếp phòng chat
            const isTabHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
            if (isTabHidden || !isViewingActiveRoom) {
                const senderName = message.sender?.fullName || message.sender?.username || "Ai đó";
                const roomTitle = targetRoom?.isGroup ? targetRoom.name : senderName;
                const bodyText = targetRoom?.isGroup
                    ? `${senderName}: ${message.content || (message.attachments?.length ? "[Tệp đính kèm]" : "")}`
                    : (message.content || (message.attachments?.length ? "[Tệp đính kèm]" : "Đã gửi một tin nhắn"));

                showDesktopNotification({
                    title: roomTitle || "Tin nhắn mới",
                    body: bodyText,
                    icon: message.sender?.avatarUrl || targetRoom?.avatarUrl || "/favicon.ico",
                    onClick: () => {
                        if (targetRoom) {
                            get().selectRoom(targetRoom);
                        }
                    }
                });
            }
        }

        set({
            rooms: sortedRooms,
            unreadRooms: newUnread,
            unreadCounts: newUnreadCounts
        });
    },

    // Initialize Socket.io connection
    initSocket: (token, selfUserId) => {
        const { socket } = get();
        if (socket) {
            if (selfUserId) set({ selfUserId });
            return;
        }

        set({ selfUserId });

        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket","polling"],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000,
            timeout: 20000
        });

        newSocket.on("connect", () => {
            const { activeRoom } = get();
            set({ isConnected: true });
            if (activeRoom) {
                newSocket.emit("join_room", activeRoom.id);
            }
            get().fetchRooms();
            console.log("Socket connected successfully");
        });

        newSocket.on("disconnect", () => {
            set({ isConnected: false });
        });

        newSocket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
            set({ isConnected: false });
        });

        newSocket.on("receive_message", (message) => get().applyReceivedMessage(message));

        newSocket.on("message_reaction", ({ messageId, roomId, reactions }) => {
            const { activeRoom, messages } = get();
            if (activeRoom && String(activeRoom.id) === String(roomId)) {
                const updated = messages.map(m =>
                    String(m.id) === String(messageId) ? { ...m, reactions } : m
                );
                set({ messages: updated });
            }
        });

        // Listen for pinned messages
        newSocket.on("message_pinned", ({ messageId, roomId, isPinned, pinnedAt, pinnedById, message }) => {
            const { activeRoom, messages, pinnedMessagesByRoom } = get();
            if (activeRoom && String(activeRoom.id) === String(roomId)) {
                const updated = messages.map(m =>
                    String(m.id) === String(messageId)
                        ? { ...m, isPinned, pinnedAt, pinnedById, ...(message ? { ...message } : {}) }
                        : m
                );
                const currentPinned = pinnedMessagesByRoom[roomId] || [];
                let nextPinned = [...currentPinned];
                if (isPinned) {
                    const targetMsg = message || updated.find(m => String(m.id) === String(messageId));
                    if (targetMsg && !nextPinned.some(p => String(p.id) === String(messageId))) {
                        nextPinned = [targetMsg, ...nextPinned];
                    }
                } else {
                    nextPinned = nextPinned.filter(p => String(p.id) !== String(messageId));
                }
                set({
                    messages: updated,
                    pinnedMessagesByRoom: {
                        ...pinnedMessagesByRoom,
                        [roomId]: nextPinned
                    }
                });
            }
        });

        // Listen for recalled messages
        newSocket.on("message_recalled", ({ messageId, roomId, message }) => {
            const { activeRoom, messages, pinnedMessagesByRoom } = get();
            if (activeRoom && String(activeRoom.id) === String(roomId)) {
                const updated = messages.map(m =>
                    String(m.id) === String(messageId)
                        ? {
                            ...m,
                            isRecalled: true,
                            content: "[Tin nhắn đã được thu hồi]",
                            attachments: null,
                            reactions: null,
                            isPinned: false
                        }
                        : m
                );
                const currentPinned = (pinnedMessagesByRoom[roomId] || []).filter(
                    p => String(p.id) !== String(messageId)
                );
                set({
                    messages: updated,
                    pinnedMessagesByRoom: {
                        ...pinnedMessagesByRoom,
                        [roomId]: currentPinned
                    }
                });
            }
        });

        // Listen for edited messages
        newSocket.on("message_edited", ({ messageId, roomId, message }) => {
            const { activeRoom, messages } = get();
            if (activeRoom && String(activeRoom.id) === String(roomId)) {
                const updated = messages.map(m =>
                    String(m.id) === String(messageId)
                        ? {
                            ...m,
                            content: message.content,
                            isEdited: true,
                            editedAt: message.editedAt
                        }
                        : m
                );
                set({ messages: updated });
            }
        });

        // Listen for online users
        newSocket.on("online_users", (userIds) => {
            set({ onlineUsers: userIds });
        });

        // Listen for typing indicators
        newSocket.on("user_typing", ({ roomId, userId, username }) => {
            const currentTyping = get().typingUsers[roomId] || {};
            set({
                typingUsers: {
                    ...get().typingUsers,
                    [roomId]: {
                        ...currentTyping,
                        [userId]: username
                    }
                }
            });
        });

        newSocket.on("user_stop_typing", ({ roomId, userId }) => {
            const currentTyping = { ...(get().typingUsers[roomId] || {}) };
            delete currentTyping[userId];
            set({
                typingUsers: {
                    ...get().typingUsers,
                    [roomId]: currentTyping
                }
            });
        });

        newSocket.on("room_added", () => {
            get().fetchRooms();
        });

        newSocket.on("room_removed", ({ roomId } = {}) => {
            const { activeRoom } = get();
            if (activeRoom && String(activeRoom.id) === String(roomId)) {
                set({ activeRoom: null, messages: [] });
            }
            get().fetchRooms();
        });

        set({ socket: newSocket });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },

    // Fetch rooms from backend REST API
    fetchRooms: async () => {
        if (get().rooms.length === 0) {
            set({ loadingRooms: true });
        }
        try {
            const response = await chatAxios.get("/chat-rooms");
            // Sort by pinned first, then by newest updatedAt
            const sortedRooms = sortRoomsWithPin(response.data || []);

            // Initialize unreadRooms state from backend database, while preserving realtime unread counts
            const { activeRoom, unreadCounts: existingUnreadCounts, unreadRooms: existingUnreadRooms } = get();
            const newUnread = {};
            const newUnreadCounts = {};

            sortedRooms.forEach(room => {
                const isCurrentlyActive = activeRoom && String(activeRoom.id) === String(room.id);
                if (isCurrentlyActive) {
                    newUnread[room.id] = false;
                    newUnreadCounts[room.id] = 0;
                } else {
                    const backendCount = Number(room.unreadCount || 0);
                    const clientCount = Number(existingUnreadCounts?.[room.id] || 0);
                    const effectiveCount = Math.max(backendCount, clientCount);
                    newUnread[room.id] = effectiveCount > 0 || !!room.unread || Boolean(existingUnreadRooms?.[room.id]);
                    newUnreadCounts[room.id] = effectiveCount;
                }
            });

            // Đồng bộ unreadCount vào từng room object để UI nhất quán
            const enrichedSortedRooms = sortedRooms.map(room => ({
                ...room,
                unread: Boolean(newUnread[room.id]),
                unreadCount: Number(newUnreadCounts[room.id] || 0)
            }));

            set({ rooms: enrichedSortedRooms, unreadRooms: newUnread, unreadCounts: newUnreadCounts, loadingRooms: false });
        } catch (error) {
            console.error("Error fetching chat rooms:", error);
            set({ loadingRooms: false });
        }
    },

    // Fetch messages for a room
    fetchMessages: async (roomId) => {
        set({ loadingMessages: true, hasMoreMessages: true, loadingMoreMessages: false });
        try {
            const response = await chatAxios.get(`/chat-rooms/${roomId}/messages?limit=50`);
            const fetchedMessages = response.data || [];
            set({
                messages: fetchedMessages,
                loadingMessages: false,
                hasMoreMessages: fetchedMessages.length === 50
            });
        } catch (error) {
            console.error("Error fetching messages:", error);
            set({ loadingMessages: false });
        }
    },

    // Fetch older messages (pagination)
    fetchMoreMessages: async () => {
        const { activeRoom, messages, loadingMoreMessages, hasMoreMessages } = get();
        if (!activeRoom || loadingMoreMessages || !hasMoreMessages) return 0;
        if (messages.length === 0) return 0;

        set({ loadingMoreMessages: true });
        try {
            const oldestMessageId = messages[0].id;
            const response = await chatAxios.get(`/chat-rooms/${activeRoom.id}/messages?limit=50&cursor=${oldestMessageId}`);
            const newMessages = response.data || [];

            set({
                messages: [...newMessages, ...messages],
                loadingMoreMessages: false,
                hasMoreMessages: newMessages.length === 50
            });
            return newMessages.length;
        } catch (error) {
            console.error("Error fetching more messages:", error);
            set({ loadingMoreMessages: false });
            return 0;
        }
    },

    // Select active room and join socket room
    selectRoom: (room) => {
        const { socket, activeRoom, unreadRooms, unreadCounts, rooms } = get();

        if (activeRoom && socket) {
            socket.emit("leave_room", activeRoom.id);
        }

        const newUnread = { ...unreadRooms };
        const newUnreadCounts = { ...unreadCounts };
        if (room) {
            newUnread[room.id] = false;
            newUnreadCounts[room.id] = 0;

            // Call backend API to mark as read in database persistently
            chatAxios.post(`/chat-rooms/${room.id}/read`).catch(err => {
                console.error("Failed to mark room as read on server:", err);
            });
        }

        // Cập nhật lại thuộc tính unread/unreadCount trên danh sách rooms cho phòng được chọn
        const updatedRooms = rooms.map(r => {
            if (room && String(r.id) === String(room.id)) {
                return { ...r, unread: false, unreadCount: 0 };
            }
            return r;
        });

        set({
            activeRoom: room,
            rooms: updatedRooms,
            messages: [],
            unreadRooms: newUnread,
            unreadCounts: newUnreadCounts,
            hasMoreMessages: true,
            loadingMoreMessages: false,
            editingMessage: null,
            replyingToMessage: null
        });

        if (room) {
            get().fetchMessages(room.id);
            get().fetchPinnedMessages(room.id);
            if (socket) {
                socket.emit("join_room", room.id);
            }
        }
    },

    // Send a message via WebSockets with instant Optimistic Update (0ms delay)
    sendMessage: async (content, attachments = [], senderUser = null) => {
        const { socket, activeRoom, messages, selfUserId, replyingToMessage } = get();
        const trimmed = (content || "").trim();
        const hasAttachments = attachments && attachments.length > 0;
        if (!activeRoom || (!trimmed && !hasAttachments)) return;

        const replyToId = replyingToMessage?.id || null;
        const replyToSnapshot = replyingToMessage ? {
            id: replyingToMessage.id,
            content: replyingToMessage.content,
            attachments: replyingToMessage.attachments,
            senderId: replyingToMessage.senderId,
            sender: replyingToMessage.sender
        } : null;

        // 1. OPTIMISTIC UPDATE: Hiển thị ngay lập tức trên UI (0ms delay)
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const optimisticMessage = {
            id: tempId,
            roomId: activeRoom.id,
            senderId: selfUserId,
            sender: senderUser || (activeRoom.participants?.find(p => (p.userId || p.user?.id) === selfUserId)?.user) || { id: selfUserId },
            content: trimmed,
            attachments: attachments || [],
            createdAt: new Date().toISOString(),
            isOptimistic: true,
            replyToId,
            replyTo: replyToSnapshot
        };

        // Đẩy tin nhắn vào danh sách hiện tại
        set({ messages: [...messages, optimisticMessage] });

        // Cập nhật ngay preview tin nhắn gần nhất trên Sidebar
        const { rooms } = get();
        const updatedRooms = rooms.map(room => {
            if (String(room.id) === String(activeRoom.id)) {
                return {
                    ...room,
                    latestMessage: optimisticMessage,
                    updatedAt: optimisticMessage.createdAt
                };
            }
            return room;
        });
        const getRoomTime = (room) => room.latestMessage?.createdAt || room.updatedAt || room.createdAt || 0;
        const sortedRooms = [...updatedRooms].sort((a, b) => new Date(getRoomTime(b)).getTime() - new Date(getRoomTime(a)).getTime());
        set({ rooms: sortedRooms });

        // 2. GỬI TIN NHẮN (Ưu tiên WebSocket tức thời, nếu không thì gọi REST)
        const sendViaRest = async () => {
            try {
                const response = await chatAxios.post(`/chat-rooms/${activeRoom.id}/messages`, {
                    content: trimmed,
                    attachments,
                    replyToId
                });
                if (response.data) {
                    get().applyReceivedMessage(response.data, tempId);
                }
                return response.data;
            } catch (error) {
                console.error("Error sending message via REST:", error);
                set(state => ({
                    messages: state.messages.map(m => m.id === tempId ? { ...m, isError: true, isOptimistic: false } : m)
                }));
                return null;
            }
        };

        // Nếu socket đang kết nối, phát ngay lập tức
        if (socket && socket.connected) {
            return new Promise((resolve) => {
                socket.timeout(3000).emit("send_message", {
                    roomId: activeRoom.id,
                    content: trimmed,
                    attachments,
                    replyToId
                }, async (error, response) => {
                    if (error || !response?.ok) {
                        const fallbackMessage = await sendViaRest();
                        resolve(fallbackMessage);
                        return;
                    }
                    if (response?.message) {
                        get().applyReceivedMessage(response.message, tempId);
                    }
                    resolve(response?.message);
                });
            });
        }

        // Nếu socket chưa kết nối, gọi REST ngay lập tức mà không chờ timeout
        return sendViaRest();
    },

    // Emit typing events
    sendTyping: (isTyping) => {
        const { socket, activeRoom } = get();
        if (!socket || !activeRoom) return;

        if (isTyping) {
            socket.emit("typing", activeRoom.id);
        } else {
            socket.emit("stop_typing", activeRoom.id);
        }
    },

    // Create a new DM room
    createDM: async (recipientId) => {
        try {
            const response = await chatAxios.post("/chat-rooms", {
                isGroup: false,
                recipientId
            });

            // Re-fetch rooms to load fully enriched relations
            await get().fetchRooms();

            // Find and select the created room with full participants/users
            const createdRoomId = response.data?.id;
            const freshRoom = get().rooms.find(r => r.id === createdRoomId) || response.data;
            get().selectRoom(freshRoom);
            return freshRoom;
        } catch (error) {
            console.error("Error creating DM:", error);
        }
    },

    // Create a new Group room
    createGroup: async (name, participantIds, avatarUrl) => {
        try {
            const response = await chatAxios.post("/chat-rooms", {
                isGroup: true,
                name,
                participantIds,
                avatarUrl
            });

            await get().fetchRooms();
            const createdRoomId = response.data?.id;
            const freshRoom = get().rooms.find(r => r.id === createdRoomId) || response.data;
            get().selectRoom(freshRoom);
            return freshRoom;
        } catch (error) {
            console.error("Error creating group:", error);
        }
    },

    // Add members to an existing group
    addMembersToGroup: async (roomId, participantIds) => {
        try {
            const response = await chatAxios.post(`/chat-rooms/${roomId}/participants`, {
                participantIds
            });

            // Update active room's participants
            const { activeRoom } = get();
            if (activeRoom && activeRoom.id === roomId) {
                set({
                    activeRoom: {
                        ...activeRoom,
                        participants: response.data
                    }
                });
            }

            await get().fetchRooms();
        } catch (error) {
            console.error("Error adding members:", error);
        }
    },

    // Update participant role (ADMIN, DEPUTY, MEMBER)
    updateParticipantRole: async (roomId, targetUserId, role) => {
        try {
            const response = await chatAxios.patch(`/chat-rooms/${roomId}/participants/${targetUserId}/role`, {
                role
            });

            const { activeRoom } = get();
            if (activeRoom && activeRoom.id === roomId) {
                set({
                    activeRoom: {
                        ...activeRoom,
                        participants: response.data
                    }
                });
            }

            await get().fetchRooms();
            return { success: true };
        } catch (error) {
            console.error("Error updating participant role:", error);
            const msg = error.response?.data?.message || "Không thể cập nhật vai trò thành viên";
            alert(msg);
            return { success: false, error: msg };
        }
    },

    // Remove participant from group
    removeParticipant: async (roomId, targetUserId) => {
        try {
            const response = await chatAxios.delete(`/chat-rooms/${roomId}/participants/${targetUserId}`);

            const { activeRoom } = get();
            if (activeRoom && activeRoom.id === roomId) {
                set({
                    activeRoom: {
                        ...activeRoom,
                        participants: response.data
                    }
                });
            }

            await get().fetchRooms();
            return { success: true };
        } catch (error) {
            console.error("Error removing participant:", error);
            const msg = error.response?.data?.message || "Không thể xóa thành viên";
            alert(msg);
            return { success: false, error: msg };
        }
    },

    // Update room info (avatarUrl, name)
    updateRoomInfo: async (roomId, { name, avatarUrl }) => {
        try {
            const payload = {};
            if (name !== undefined) payload.name = name;
            if (avatarUrl !== undefined) payload.avatarUrl = avatarUrl;

            const response = await chatAxios.patch(`/chat-rooms/${roomId}`, payload);
            const updatedRoom = response.data;

            const { activeRoom, rooms } = get();
            if (activeRoom && activeRoom.id === roomId) {
                set({
                    activeRoom: {
                        ...activeRoom,
                        ...updatedRoom
                    }
                });
            }

            set({
                rooms: rooms.map(r => r.id === roomId ? { ...r, ...updatedRoom } : r)
            });

            await get().fetchRooms();

            return { success: true, data: updatedRoom };
        } catch (error) {
            console.error("Error updating room info:", error);
            const msg = error.response?.data?.message || "Không thể cập nhật thông tin nhóm";
            return { success: false, error: msg };
        }
    },

    // Update room user preferences (isPinned, isMuted) with optimistic UI update
    updateRoomPreferences: async (roomId, preferences) => {
        const { rooms, activeRoom } = get();
        const updatedRooms = rooms.map(room => {
            if (String(room.id) === String(roomId)) {
                return {
                    ...room,
                    ...(typeof preferences.isPinned === "boolean" ? { isPinned: preferences.isPinned } : {}),
                    ...(typeof preferences.isMuted === "boolean" ? { isMuted: preferences.isMuted } : {})
                };
            }
            return room;
        });

        const sortedRooms = sortRoomsWithPin(updatedRooms);
        const updatedActiveRoom = activeRoom && String(activeRoom.id) === String(roomId)
            ? {
                ...activeRoom,
                ...(typeof preferences.isPinned === "boolean" ? { isPinned: preferences.isPinned } : {}),
                ...(typeof preferences.isMuted === "boolean" ? { isMuted: preferences.isMuted } : {})
            }
            : activeRoom;

        set({ rooms: sortedRooms, activeRoom: updatedActiveRoom });

        try {
            await chatAxios.patch(`/chat-rooms/${roomId}/preferences`, preferences);
            return { success: true };
        } catch (error) {
            console.error("Error updating room preferences:", error);
            await get().fetchRooms();
            const msg = error.response?.data?.message || "Không thể cập nhật tùy chọn hội thoại";
            return { success: false, error: msg };
        }
    },

    // React to message with emoji (Optimistic update + Socket / HTTP)
    reactToMessage: async (messageId, emoji) => {
        const { activeRoom, messages, selfUserId, socket } = get();
        if (!activeRoom || !messageId) return;

        // Optimistic UI update
        const updatedMessages = messages.map(m => {
            if (String(m.id) === String(messageId)) {
                const currentReactions = Array.isArray(m.reactions) ? [...m.reactions] : [];
                const existingIdx = currentReactions.findIndex(r => String(r.userId) === String(selfUserId));
                if (existingIdx !== -1) {
                    if (currentReactions[existingIdx].emoji === emoji) {
                        currentReactions.splice(existingIdx, 1);
                    } else {
                        currentReactions[existingIdx] = {
                            ...currentReactions[existingIdx],
                            emoji
                        };
                    }
                } else {
                    currentReactions.push({
                        userId: selfUserId,
                        emoji,
                        createdAt: new Date().toISOString()
                    });
                }
                return { ...m, reactions: currentReactions };
            }
            return m;
        });

        set({ messages: updatedMessages });

        // Emit via socket if connected
        if (socket && socket.connected) {
            socket.emit("message_reaction", {
                roomId: activeRoom.id,
                messageId,
                emoji
            });
        } else {
            try {
                const res = await chatAxios.post(`/chat-rooms/${activeRoom.id}/messages/${messageId}/reaction`, { emoji });
                if (res.data?.reactions) {
                    const synced = get().messages.map(m =>
                        String(m.id) === String(messageId) ? { ...m, reactions: res.data.reactions } : m
                    );
                    set({ messages: synced });
                }
            } catch (err) {
                console.error("Error reacting to message:", err);
            }
        }
    },

    setEditingMessage: (message) => {
        set({ editingMessage: message });
    },

    fetchPinnedMessages: async (roomId) => {
        if (!roomId) return;
        try {
            const res = await chatAxios.get(`/chat-rooms/${roomId}/pinned-messages`);
            const pinnedList = Array.isArray(res.data) ? res.data : [];
            set({
                pinnedMessagesByRoom: {
                    ...get().pinnedMessagesByRoom,
                    [roomId]: pinnedList
                }
            });
            return pinnedList;
        } catch (err) {
            console.error("Error fetching pinned messages:", err);
            return [];
        }
    },

    pinMessage: async (roomId, messageId, isPinned = true) => {
        const { socket, messages, pinnedMessagesByRoom } = get();
        if (!roomId || !messageId) return;

        // Optimistic update
        const updated = messages.map(m =>
            String(m.id) === String(messageId)
                ? { ...m, isPinned, pinnedAt: isPinned ? new Date().toISOString() : null }
                : m
        );
        const currentPinned = pinnedMessagesByRoom[roomId] || [];
        let nextPinned = [...currentPinned];
        if (isPinned) {
            const targetMsg = updated.find(m => String(m.id) === String(messageId));
            if (targetMsg && !nextPinned.some(p => String(p.id) === String(messageId))) {
                nextPinned = [targetMsg, ...nextPinned];
            }
        } else {
            nextPinned = nextPinned.filter(p => String(p.id) !== String(messageId));
        }

        set({
            messages: updated,
            pinnedMessagesByRoom: {
                ...pinnedMessagesByRoom,
                [roomId]: nextPinned
            }
        });

        if (socket && socket.connected) {
            socket.emit("message_pin", { roomId, messageId, isPinned });
        } else {
            try {
                await chatAxios.post(`/chat-rooms/${roomId}/messages/${messageId}/pin`, { isPinned });
            } catch (err) {
                console.error("Error pinning message:", err);
                get().fetchPinnedMessages(roomId);
            }
        }
    },

    recallMessage: async (roomId, messageId) => {
        const { socket, messages, pinnedMessagesByRoom } = get();
        if (!roomId || !messageId) return;

        // Optimistic update
        const updated = messages.map(m =>
            String(m.id) === String(messageId)
                ? {
                    ...m,
                    isRecalled: true,
                    content: "[Tin nhắn đã được thu hồi]",
                    attachments: null,
                    reactions: null,
                    isPinned: false
                }
                : m
        );
        const nextPinned = (pinnedMessagesByRoom[roomId] || []).filter(
            p => String(p.id) !== String(messageId)
        );

        set({
            messages: updated,
            pinnedMessagesByRoom: {
                ...pinnedMessagesByRoom,
                [roomId]: nextPinned
            }
        });

        if (socket && socket.connected) {
            socket.emit("message_recall", { roomId, messageId });
        } else {
            try {
                await chatAxios.post(`/chat-rooms/${roomId}/messages/${messageId}/recall`);
            } catch (err) {
                console.error("Error recalling message:", err);
            }
        }
    },

    editMessage: async (roomId, messageId, newContent) => {
        const { socket, messages } = get();
        if (!roomId || !messageId || !newContent?.trim()) return;

        // Optimistic update
        const updated = messages.map(m =>
            String(m.id) === String(messageId)
                ? { ...m, content: newContent.trim(), isEdited: true, editedAt: new Date().toISOString() }
                : m
        );
        set({ messages: updated, editingMessage: null });

        if (socket && socket.connected) {
            socket.emit("message_edit", { roomId, messageId, content: newContent.trim() });
        } else {
            try {
                await chatAxios.put(`/chat-rooms/${roomId}/messages/${messageId}`, { content: newContent.trim() });
            } catch (err) {
                console.error("Error editing message:", err);
            }
        }
    },

    forwardMessage: async (roomId, messageId, targetRoomIds) => {
        if (!roomId || !messageId || !Array.isArray(targetRoomIds) || targetRoomIds.length === 0) return;
        try {
            const res = await chatAxios.post(`/chat-rooms/${roomId}/messages/${messageId}/forward`, { targetRoomIds });
            const createdMsgs = res.data?.messages || [];
            const { activeRoom, applyReceivedMessage, fetchRooms } = get();
            if (activeRoom && Array.isArray(createdMsgs)) {
                const currentRoomMsg = createdMsgs.find(m => String(m.roomId) === String(activeRoom.id));
                if (currentRoomMsg) {
                    applyReceivedMessage(currentRoomMsg);
                }
            }
            fetchRooms();
            return res.data;
        } catch (err) {
            console.error("Error forwarding message:", err);
            throw err;
        }
    }
}));

