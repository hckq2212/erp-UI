import { create } from "zustand";
import { io } from "socket.io-client";
import axios from "axios";

// Configure axios base URL and credentials
const API_URL = "http://localhost:3000/api";
const SOCKET_URL = "http://localhost:3000";

const chatAxios = axios.create({
    baseURL: API_URL,
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
            transports: ["websocket"],
            withCredentials: true
        });

        newSocket.on("connect", () => {
            set({ isConnected: true });
            console.log("Socket connected successfully");
        });

        newSocket.on("disconnect", () => {
            set({ isConnected: false });
        });

        // Listen for new messages
        newSocket.on("receive_message", (message) => {
            const { activeRoom, messages, rooms, selfUserId: currentSelfUserId, unreadRooms } = get();

            // If the message is for the active room, append it to messages
            if (activeRoom && String(activeRoom.id) === String(message.roomId)) {
                set({ messages: [...messages, message] });
            }

            // If the room doesn't exist in our state yet (e.g. newly created DM from another user), re-fetch
            const roomExists = rooms.some(room => String(room.id) === String(message.roomId));
            if (!roomExists) {
                get().fetchRooms();
                return;
            }

            // Update the room's latest message in the sidebar
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

            // Sort rooms by newest message or update first!
            const getRoomTime = (room) => {
                return room.latestMessage?.createdAt || room.updatedAt || room.createdAt || 0;
            };
            const sortedRooms = [...updatedRooms].sort((a, b) => new Date(getRoomTime(b)).getTime() - new Date(getRoomTime(a)).getTime());

            // Track unread if the message is from someone else and it's NOT the active room
            const isUnread = String(message.senderId) !== String(currentSelfUserId) && (!activeRoom || String(activeRoom.id) !== String(message.roomId));
            const newUnread = { ...unreadRooms };
            if (isUnread) {
                newUnread[message.roomId] = true;
            }

            set({
                rooms: sortedRooms,
                unreadRooms: newUnread
            });
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
            sortedRooms.forEach(room => {
                newUnread[room.id] = !!room.unread;
            });

            set({ rooms: sortedRooms, unreadRooms: newUnread, loadingRooms: false });
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
        const { socket, activeRoom, unreadRooms } = get();

        if (activeRoom && socket) {
            socket.emit("leave_room", activeRoom.id);
        }

        const newUnread = { ...unreadRooms };
        if (room) {
            newUnread[room.id] = false;

            // Call backend API to mark as read in database persistently
            chatAxios.post(`/chat-rooms/${room.id}/read`).catch(err => {
                console.error("Failed to mark room as read on server:", err);
            });
        }

        set({
            activeRoom: room,
            messages: [],
            unreadRooms: newUnread,
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
    sendMessage: (content, attachments = []) => {
        const { socket, activeRoom } = get();
        if (!socket || !activeRoom) return;

        socket.emit("send_message", {
            roomId: activeRoom.id,
            content,
            attachments
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
