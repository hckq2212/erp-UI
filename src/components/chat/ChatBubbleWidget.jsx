import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useChatStore } from "../../store/useChatStore";
import { useGetMeQuery } from "../../api/auth";
import { ChatBubbleRoom } from "./ChatBubbleRoom";
import axios from "axios";
import { BASE_URL } from "../../store/api";
import { ChevronDown, MessageCircle, Minus, Phone, Search, Video, X } from "lucide-react";

export function ChatBubbleWidget() {
    const location = useLocation();
    const isChatPage = location.pathname === "/chat";
    const [isOpen, setIsOpen] = useState(false);
    const [showUserList, setShowUserList] = useState(false);
    const [systemUsers, setSystemUsers] = useState([]);
    const [roomSearch, setRoomSearch] = useState("");

    const { data: currentUser } = useGetMeQuery();
    const currentUserId = currentUser?.id;

    // Chỉ kết nối socket và fetch rooms khi widget thực sự được người dùng bấm mở
    useEffect(() => {
        if (isChatPage || !isOpen) return;

        const { initSocket, disconnectSocket, fetchRooms } = useChatStore.getState();
        initSocket();
        fetchRooms();

        return () => {
            disconnectSocket();
        };
    }, [isChatPage, isOpen]);

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

    const getRoomInitial = (room) => {
        const name = getRoomName(room);
        return room?.isGroup ? "G" : (name?.[0]?.toUpperCase() || "C");
    };

    const filteredRooms = rooms.filter((room) =>
        getRoomName(room).toLowerCase().includes(roomSearch.trim().toLowerCase())
    );

    const totalUnread = Object.values(unreadCounts || {}).reduce((sum, value) => sum + Number(value || 0), 0);

    if (isChatPage) {
        return null;
    }

    return (
        // <div className="fixed bottom-6 right-6 z-[9999] font-sans flex flex-col items-end">
        //     {/* Chat Panel Box */}
        //     {isOpen && (
        //         <div
        //             className="w-[calc(100vw-24px)] max-w-[410px] h-[560px] bg-white border border-slate-200 shadow-2xl flex flex-col mb-4 overflow-hidden rounded-lg"
        //         >
        //             {/* Header */}
        //             <div className="h-[60px] bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between shadow-sm z-10">
        //                 {activeRoom ? (
        //                     <div className="flex items-center min-w-0 gap-2">
        //                         <button
        //                             onClick={() => selectRoom(null)}
        //                             className="w-7 h-7 flex items-center justify-center text-[#F38820] hover:text-[#d97616] transition-colors"
        //                             title="Quay lại"
        //                         >
        //                             <ChevronDown className="w-5 h-5 rotate-90" />
        //                         </button>
        //                         <div className="relative w-10 h-10 rounded-full bg-orange-50 border border-white shadow-sm flex items-center justify-center text-sm font-black text-[#F38820] shrink-0">
        //                             {getRoomInitial(activeRoom)}
        //                             {isUserOnline(activeRoom) && (
        //                                 <span className="absolute -right-0.5 bottom-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
        //                             )}
        //                         </div>
        //                         <div className="min-w-0">
        //                             <div className="flex items-center gap-1.5">
        //                                 <span className="font-bold text-[15px] leading-4 text-slate-900 truncate">
        //                                     {getRoomName(activeRoom)}
        //                                 </span>
        //                                 {/* <ChevronDown className="w-4 h-4 text-[#F38820] shrink-0" /> */}
        //                             </div>
        //                             <span className="block text-[12px] leading-4 text-slate-500 truncate">
        //                                 {isUserOnline(activeRoom) ? "Đang hoạt động" : "Tin nhắn"}
        //                             </span>
        //                         </div>
        //                     </div>
        //                 ) : (
        //                     <div className="flex items-center gap-2 min-w-0">
        //                         <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
        //                         <span className="font-bold text-xs text-slate-800 tracking-wider uppercase truncate">
        //                             GETVINI Chat
        //                         </span>
        //                     </div>
        //                 )}

        //                 <div className="flex items-center gap-1 text-[#F38820]">
        //                     {/* {activeRoom && (
        //                         <>
        //                             <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-orange-50 rounded-full transition-colors" title="Gọi thoại">
        //                                 <Phone className="w-5 h-5" />
        //                             </button>
        //                             <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-orange-50 rounded-full transition-colors" title="Gọi video">
        //                                 <Video className="w-5 h-5" />
        //                             </button>
        //                             <button type="button" className="w-8 h-8 flex items-center justify-center hover:bg-orange-50 rounded-full transition-colors" title="Thu nhỏ">
        //                                 <Minus className="w-5 h-5" />
        //                             </button>
        //                         </>
        //                     )} */}
        //                     <button
        //                         onClick={handleToggleWidget}
        //                         className="w-8 h-8 flex items-center justify-center hover:bg-orange-50 rounded-full transition-colors"
        //                         title="Đóng"
        //                     >
        //                         <X className="w-6 h-6" />
        //                     </button>
        //                 </div>
        //             </div>

        //             {/* Active Conversation Room Pane */}
        //             {activeRoom ? (
        //                 <ChatBubbleRoom />
        //             ) : showUserList ? (
        //                 /* User Directory for DMs */
        //                 <div className="flex-1 flex flex-col bg-white overflow-hidden">
        //                     <div className="p-3 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
        //                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        //                             Bắt đầu trò chuyện
        //                         </span>
        //                         <button
        //                             onClick={() => setShowUserList(false)}
        //                             className="text-[10px] text-[#F38820] hover:underline font-semibold"
        //                         >
        //                             Đóng
        //                         </button>
        //                     </div>
        //                     <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        //                         {systemUsers.length === 0 ? (
        //                             <div className="p-4 text-center text-xs text-slate-400">
        //                                 Không tìm thấy nhân sự nào
        //                             </div>
        //                         ) : (
        //                             systemUsers.filter(u => u.id !== currentUserId).map(user => (
        //                                 <button
        //                                     key={user.id}
        //                                     onClick={() => handleStartDM(user.id)}
        //                                     className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left transition-colors"
        //                                 >
        //                                     <div className="flex items-center gap-3">
        //                                         <div className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-slate-500">
        //                                             {user.fullName ? user.fullName[0].toUpperCase() : "U"}
        //                                         </div>
        //                                         <div className="flex flex-col">
        //                                             <span className="text-xs font-semibold text-slate-800">{user.fullName}</span>
        //                                             <span className="text-[9px] text-slate-450">{user.phoneNumber || "Nhân viên"}</span>
        //                                         </div>
        //                                     </div>
        //                                     {onlineUsers.includes(user.id) && (
        //                                         <span className="w-2 h-2 bg-green-500 rounded-full" />
        //                                     )}
        //                                 </button>
        //                             ))
        //                         )}
        //                     </div>
        //                 </div>
        //             ) : (
        //                 /* Rooms Sidebar List */
        //                 <div className="flex-1 flex flex-col bg-white overflow-hidden">
        //                     {/* Toolbar */}
        //                     <div className="px-4 py-2 border-b border-gray-200 bg-gray-50/60 space-y-2">
        //                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        //                             Hộp thư ({filteredRooms.length})
        //                         </span>
        //                         <div className="h-9 rounded-full bg-white border border-gray-200 px-3 flex items-center gap-2">
        //                             <Search className="w-4 h-4 text-slate-400" />
        //                             <input
        //                                 value={roomSearch}
        //                                 onChange={(event) => setRoomSearch(event.target.value)}
        //                                 placeholder="Tìm tên..."
        //                                 className="min-w-0 flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400"
        //                             />
        //                         </div>
        //                     </div>

        //                     {/* Rooms List */}
        //                     <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        //                         {filteredRooms.length === 0 ? (
        //                             <div className="p-8 text-center text-xs text-slate-400">
        //                                 Không tìm thấy cuộc hội thoại nào
        //                             </div>
        //                         ) : (
        //                             filteredRooms.map(room => {
        //                                 const unreadCount = Number(unreadCounts?.[room.id] || 0);
        //                                 return (
        //                                     <button
        //                                         key={room.id}
        //                                         onClick={() => selectRoom(room)}
        //                                         className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left transition-colors"
        //                                     >
        //                                         <div className="relative">
        //                                             <div className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-[#F38820]">
        //                                                 {room.isGroup ? "G" : getRoomName(room)[0].toUpperCase()}
        //                                             </div>
        //                                             {isUserOnline(room) && (
        //                                                 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
        //                                             )}
        //                                         </div>
        //                                         <div className="flex-1 min-w-0 flex flex-col">
        //                                             <div className="flex justify-between items-baseline">
        //                                                 <span className={`text-xs truncate ${unreadCount > 0 ? "font-black text-slate-950" : "font-semibold text-slate-800"}`}>
        //                                                     {getRoomName(room)}
        //                                                 </span>
        //                                                 {unreadCount > 0 && (
        //                                                     <span className="ml-2 min-w-5 h-5 px-1.5 rounded-full bg-[#F38820] text-white text-[10px] font-black flex items-center justify-center">
        //                                                         {unreadCount > 99 ? "99+" : unreadCount}
        //                                                     </span>
        //                                                 )}
        //                                             </div>
        //                                             <span className={`text-[10px] truncate mt-0.5 ${unreadCount > 0 ? "text-slate-900 font-bold" : "text-slate-500"}`}>
        //                                                 {room.latestMessage ? room.latestMessage.content : "Chưa có tin nhắn"}
        //                                             </span>
        //                                         </div>
        //                                     </button>
        //                                 )
        //                             })
        //                         )}
        //                     </div>
        //                 </div>
        //             )}
        //         </div>
        //     )}

        //     {/* Floating Action Button (FAB) */}
        //     <button
        //         onClick={handleToggleWidget}
        //         className="relative w-12 h-12 bg-[#F38820] text-white hover:bg-[#d97616] shadow-2xl flex items-center justify-center transition-all hover:scale-105 select-none rounded-md"
        //     >
        //         {totalUnread > 0 && !isOpen && (
        //             <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[10px] font-black border-2 border-white flex items-center justify-center">
        //                 {totalUnread > 99 ? "99+" : totalUnread}
        //             </span>
        //         )}
        //         {isOpen ? (
        //             <ChevronDown className="w-6 h-6 stroke-[2.6]" />
        //         ) : (
        //             <MessageCircle className="w-6 h-6 stroke-[2.4]" />
        //         )}
        //     </button>
        // </div>
        <></>
    );
}
