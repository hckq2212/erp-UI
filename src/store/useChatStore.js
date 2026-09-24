import { create } from "zustand";
import { io } from "socket.io-client";
import axios from "axios";
import { API_ORIGIN, BASE_URL } from "./api";

const configuredSocketUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SOCKET_URL = configuredSocketUrl || API_ORIGIN;

const chatAxios = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

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

    applyReceivedMessage: (message) => {
        const { activeRoom, messages, rooms, selfUserId: currentSelfUserId, unreadRooms, unreadCounts } = get();

        if (activeRoom && String(activeRoom.id) === String(message.roomId)) {
            const exists = messages.some((item) => String(item.id) === String(message.id));
            if (!exists) {
                set({ messages: [...messages, message] });
            }
        }

        const roomExists = rooms.some(room => String(room.id) === String(message.roomId));
        if (!roomExists) {
            get().fetchRooms();
            return;
        }

        const updatedRooms = rooms.map(room => {
            if (String(room.id) === String(message.roomId)) {
                return {
                    ...room,
                    latestMessage: message,
                    updatedAt: new Date().toISOString()
                };
            }
            return room;
        });

        const getRoomTime = (room) => room.latestMessage?.createdAt || room.updatedAt || room.createdAt || 0;
        const sortedRooms = [...updatedRooms].sort((a, b) => new Date(getRoomTime(b)).getTime() - new Date(getRoomTime(a)).getTime());
        const isUnread = String(message.senderId) !== String(currentSelfUserId) && (!activeRoom || String(activeRoom.id) !== String(message.roomId));
        const newUnread = { ...unreadRooms };
        const newUnreadCounts = { ...unreadCounts };

        if (isUnread) {
            newUnread[message.roomId] = true;
            newUnreadCounts[message.roomId] = (newUnreadCounts[message.roomId] || 0) + 1;
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

        // Create socket connection with authentication credentials
        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 500,
            reconnectionDelayMax: 5000,
            timeout: 10000
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
        set({ loadingRooms: true });
        try {
            const response = await chatAxios.get("/chat-rooms");
            // Sort by newest updatedAt first
            const sortedRooms = (response.data || []).sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );

            // Initialize unreadRooms state from backend database
            const newUnread = {};
            const newUnreadCounts = {};
            sortedRooms.forEach(room => {
                const unreadCount = Number(room.unreadCount || 0);
                newUnread[room.id] = unreadCount > 0 || !!room.unread;
                newUnreadCounts[room.id] = unreadCount;
            });

            set({ rooms: sortedRooms, unreadRooms: newUnread, unreadCounts: newUnreadCounts, loadingRooms: false });
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
        const { socket, activeRoom, unreadRooms, unreadCounts } = get();

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

        set({
            activeRoom: room,
            messages: [],
            unreadRooms: newUnread,
            unreadCounts: newUnreadCounts,
            hasMoreMessages: true,
            loadingMoreMessages: false
        });

        if (room) {
            get().fetchMessages(room.id);
            if (socket) {
                socket.emit("join_room", room.id);
            }
        }
    },

    // Send a message via WebSockets
    sendMessage: async (content, attachments = []) => {
        const { socket, activeRoom } = get();
        const trimmed = content?.trim();
        if (!activeRoom || !trimmed) return;

        const sendViaRest = async () => {
            const response = await chatAxios.post(`/chat-rooms/${activeRoom.id}/messages`, {
                content: trimmed,
                attachments
            });
            if (response.data) {
                get().applyReceivedMessage(response.data);
            }
            return response.data;
        };

        if (!socket) {
            return sendViaRest();
        }

        if (!socket.connected) {
            socket.connect();
            await new Promise((resolve) => {
                const done = () => resolve(null);
                socket.once("connect", done);
                setTimeout(done, 1500);
            });
        }

        if (!socket.connected) {
            return sendViaRest();
        }

        return new Promise((resolve) => {
            socket.timeout(5000).emit("send_message", {
                roomId: activeRoom.id,
                content: trimmed,
                attachments
            }, async (error, response) => {
                if (error || !response?.ok) {
                    try {
                        const fallbackMessage = await sendViaRest();
                        resolve(fallbackMessage);
                    } catch (fallbackError) {
                        console.error("Error sending message:", fallbackError);
                        resolve(null);
                    }
                    return;
                }
                resolve(response.message);
            });
        });
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

            // Re-fetch rooms
            await get().fetchRooms();

            // Find and select the created room
            const createdRoom = response.data;
            get().selectRoom(createdRoom);
            return createdRoom;
        } catch (error) {
            console.error("Error creating DM:", error);
        }
    },

    // Create a new Group room
    createGroup: async (name, participantIds) => {
        try {
            const response = await chatAxios.post("/chat-rooms", {
                isGroup: true,
                name,
                participantIds
            });

            await get().fetchRooms();
            const createdRoom = response.data;
            get().selectRoom(createdRoom);
            return createdRoom;
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
    }
}));
