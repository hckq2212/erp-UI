import React, { useState } from "react";
import { Users as UsersIcon } from "lucide-react";

/**
 * SingleAvatarItem: Avatar đơn lẻ
 * - Nếu có ảnh hợp lệ: Hiển thị <img> bo tròn.
 * - Nếu chưa có ảnh: Hiển thị NỀN CAM NHẠT (bg-orange-100) VÀ CHỮ CAM ĐẬM (#F38820) ĐỒNG BỘ VỚI HEADER.
 */
function SingleAvatarItem({
    src,
    name,
    className = "",
    textClassName = "",
    bgClassName = "bg-orange-100 text-[#F38820] border border-orange-200/60"
}) {
    const [hasError, setHasError] = useState(false);
    const initial = (name ? name.trim()[0] : "U")?.toUpperCase() || "U";

    if (src && !hasError) {
        return (
            <img
                src={src}
                alt={name || "Avatar"}
                onError={() => setHasError(true)}
                className={`w-full h-full object-cover rounded-full ${className}`}
            />
        );
    }

    return (
        <div
            className={`w-full h-full rounded-full flex items-center justify-center font-black select-none shadow-2xs ${bgClassName} ${textClassName} ${className}`}
        >
            {initial}
        </div>
    );
}

const SIZE_CONFIGS = {
    sm: {
        container: "w-8 h-8",
        mini: "w-[21px] h-[21px]",
        miniText: "text-[10px]",
        border: "border-[1.5px] border-white shadow-2xs",
        icon: "w-4 h-4",
        singleText: "text-xs"
    },
    md: {
        container: "w-10 h-10",
        mini: "w-[27px] h-[27px]",
        miniText: "text-[11px]",
        border: "border-2 border-white shadow-xs",
        icon: "w-5 h-5",
        singleText: "text-sm"
    },
    lg: {
        container: "w-12 h-12",
        mini: "w-[32px] h-[32px]",
        miniText: "text-xs",
        border: "border-2 border-white shadow-xs",
        icon: "w-6 h-6",
        singleText: "text-base"
    },
    xl: {
        container: "w-20 h-20",
        mini: "w-[54px] h-[54px]",
        miniText: "text-lg",
        border: "border-[3px] border-white shadow-sm",
        icon: "w-9 h-9",
        singleText: "text-2xl"
    }
};

/**
 * RoomAvatar: Component hiển thị Avatar phòng chat chuẩn Getvini Orange & Facebook Messenger
 * - Nếu là Chat 1-1: Hiển thị avatar đối phương trên nền cam #F38820
 * - Nếu là Nhóm có avatar riêng: Hiển thị ảnh đại diện nhóm
 * - Nếu là Nhóm KHÔNG có avatar riêng:
 *   -> Hiển thị 2 avatar lồng nhau chuẩn Messenger trên NỀN MÀU CAM với chữ trắng và viền trắng nổi
 */
export function RoomAvatar({
    room,
    user,
    selfUserId,
    allUsers = [],
    size = "lg",
    className = ""
}) {
    const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.lg;

    // 1. Trường hợp là User liên hệ trực tiếp (khi tìm kiếm danh bạ)
    if (user && !room) {
        return (
            <div className={`relative flex-shrink-0 rounded-full overflow-hidden ${config.container} ${className}`}>
                <SingleAvatarItem
                    src={user.avatarUrl}
                    name={user.fullName || user.username}
                    textClassName={config.singleText}
                    bgClassName="bg-orange-100 text-[#F38820] border border-orange-200/60"
                />
            </div>
        );
    }

    if (!room) {
        return (
            <div className={`relative flex-shrink-0 rounded-full bg-orange-100 text-[#F38820] border border-orange-200/60 flex items-center justify-center ${config.container} ${className}`}>
                <UsersIcon className={config.icon} />
            </div>
        );
    }

    // 2. Chat 1-1 (Direct Message)
    if (!room.isGroup) {
        let otherUser = user;
        if (!otherUser) {
            const participant = room.participants?.find(p => p.userId !== selfUserId);
            otherUser = participant?.user || (allUsers?.length && participant?.userId ? allUsers.find(u => u.id === participant.userId) : null);
        }

        const name = otherUser?.fullName || otherUser?.username || room.name || "Chat";
        return (
            <div className={`relative flex-shrink-0 rounded-full overflow-hidden border border-orange-200/40 ${config.container} ${className}`}>
                <SingleAvatarItem
                    src={otherUser?.avatarUrl}
                    name={name}
                    textClassName={config.singleText}
                    bgClassName="bg-orange-100 text-[#F38820] border border-orange-200/60"
                />
            </div>
        );
    }

    // 3. Nhóm chat CÓ ảnh đại diện tùy chỉnh (room.avatarUrl)
    if (room.avatarUrl) {
        return (
            <div className={`relative flex-shrink-0 rounded-full overflow-hidden border border-orange-200/40 ${config.container} ${className}`}>
                <SingleAvatarItem
                    src={room.avatarUrl}
                    name={room.name || "Nhóm"}
                    textClassName={config.singleText}
                    bgClassName="bg-orange-100 text-[#F38820] border border-orange-200/60"
                />
            </div>
        );
    }

    // 4. Nhóm chat KHÔNG chọn avatar -> MẶC ĐỊNH CHUẨN FACEBOOK MESSENGER TRÊN TONE CAM NHẠT (bg-orange-100 / #F38820) ĐỒNG BỘ HEADER:
    const participants = room.participants || [];
    let memberList = participants
        .filter(p => p.userId !== selfUserId)
        .map(p => p.user || allUsers.find(u => u.id === p.userId) || { id: p.userId, fullName: "Thành viên" });

    // Nếu nhóm chỉ có bản thân hoặc không tìm thấy người khác
    if (memberList.length === 0) {
        memberList = participants.map(p => p.user || allUsers.find(u => u.id === p.userId) || { id: p.userId, fullName: "Thành viên" });
    }

    // Nếu không có thành viên nào
    if (memberList.length === 0) {
        return (
            <div className={`relative flex-shrink-0 rounded-full bg-orange-100 text-[#F38820] border border-orange-200/60 flex items-center justify-center shadow-2xs ${config.container} ${className}`}>
                <UsersIcon className={config.icon} />
            </div>
        );
    }

    // Nếu chỉ có 1 thành viên
    if (memberList.length === 1) {
        const singleMember = memberList[0];
        return (
            <div className={`relative flex-shrink-0 rounded-full overflow-hidden border border-orange-200/40 ${config.container} ${className}`}>
                <SingleAvatarItem
                    src={singleMember.avatarUrl}
                    name={singleMember.fullName || singleMember.username}
                    textClassName={config.singleText}
                    bgClassName="bg-orange-100 text-[#F38820] border border-orange-200/60"
                />
            </div>
        );
    }

    // Từ 2 thành viên trở lên: Hiển thị 2 avatar lồng nhau kiểu Facebook Messenger với phong cách nền cam nhạt, chữ cam như Header
    const member1 = memberList[0]; // Thành viên thứ 1 (góc trên - phải)
    const member2 = memberList[1]; // Thành viên thứ 2 (góc dưới - trái, có viền trắng nổi)

    return (
        <div className={`relative flex-shrink-0 ${config.container} ${className}`}>
            {/* Thành viên 1: Nằm ở phía trên - bên phải */}
            <div className={`absolute top-0 right-0 ${config.mini} rounded-full overflow-hidden shadow-2xs z-0`}>
                <SingleAvatarItem
                    src={member1?.avatarUrl}
                    name={member1?.fullName || member1?.username}
                    textClassName={config.miniText}
                    bgClassName="bg-orange-100/90 text-[#F38820] border border-orange-200/60"
                />
            </div>

            {/* Thành viên 2: Nằm ở phía dưới - bên trái, đè lên với viền trắng nổi */}
            <div className={`absolute bottom-0 left-0 ${config.mini} rounded-full overflow-hidden ${config.border} z-10`}>
                <SingleAvatarItem
                    src={member2?.avatarUrl}
                    name={member2?.fullName || member2?.username}
                    textClassName={config.miniText}
                    bgClassName="bg-orange-100 text-[#F38820] border border-orange-200/60"
                />
            </div>
        </div>
    );
}
