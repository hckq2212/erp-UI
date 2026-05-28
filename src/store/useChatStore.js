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

    // Initialize Socket.io connection
    initSocket: (token) => {
        const { socket } = get();
        if (socket) return;

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
            const { activeRoom, messages, rooms } = get();

            // If the message is for the active room, append it to messages
            if (activeRoom && activeRoom.id === message.roomId) {
                set({ messages: [...messages, message] });
            }

            // Update the room's latest message in the sidebar
            const updatedRooms = rooms.map(room => {
                if (room.id === message.roomId) {
                    return {
                        ...room,
                        latestMessage: message,
                        updatedAt: new Date().toISOString()
                    };
                }
                return room;
            });

            // Sort rooms by latest update
            set({ rooms: updatedRooms.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) });
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
            set({ rooms: response.data, loadingRooms: false });
        } catch (error) {
            console.error("Error fetching chat rooms:", error);
            set({ loadingRooms: false });
        }
    },

    // Fetch messages for a room
    fetchMessages: async (roomId) => {
        set({ loadingMessages: true });
        try {
            const response = await chatAxios.get(`/chat-rooms/${roomId}/messages`);
            set({ messages: response.data, loadingMessages: false });
        } catch (error) {
            console.error("Error fetching messages:", error);
            set({ loadingMessages: false });
        }
    },

    // Select active room and join socket room
    selectRoom: (room) => {
        const { socket, activeRoom } = get();
        
        if (activeRoom && socket) {
            socket.emit("leave_room", activeRoom.id);
        }

        set({ activeRoom: room, messages: [] });
        
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
