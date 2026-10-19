import React from "react";
import { UserPlus, Pencil } from "lucide-react";

export function GroupHeaderCard({ activeRoom, selfUserId, onAddMembersClick, onRenameClick }) {
    if (!activeRoom || !activeRoom.isGroup) return null;

    const creatorId = activeRoom.creatorId;
    const isMeCreator = selfUserId && String(creatorId) === String(selfUserId);
    const creatorParticipant = activeRoom.participants?.find(p => String(p.userId) === String(creatorId));
    const creatorName = isMeCreator
        ? "Bạn"
        : (creatorParticipant?.user?.fullName || creatorParticipant?.user?.username || activeRoom.creator?.fullName || "Ai đó");

    return (
        <div className="flex flex-col items-center justify-center pt-5 pb-3 px-4 select-none">
            {/* Header Text */}
            <div className="text-[14px] font-semibold text-slate-800 text-center mb-3.5">
                {creatorName} đã tạo nhóm này
            </div>

            {/* Action Buttons: Thêm & Tên */}
            <div className="flex items-center justify-center gap-7">
                {/* Nút Thêm */}
                <button
                    type="button"
                    onClick={onAddMembersClick}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    title="Thêm thành viên vào nhóm"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-100 hover:bg-orange-50 active:bg-orange-100 flex items-center justify-center text-slate-700 group-hover:text-[#F38820] border border-slate-200/80 transition-all shadow-2xs group-hover:scale-105">
                        <UserPlus className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span className="text-xs font-medium text-slate-600 group-hover:text-[#F38820] transition-colors">
                        Thêm
                    </span>
                </button>

                {/* Nút Tên */}
                <button
                    type="button"
                    onClick={onRenameClick}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    title="Đổi tên nhóm"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-100 hover:bg-orange-50 active:bg-orange-100 flex items-center justify-center text-slate-700 group-hover:text-[#F38820] border border-slate-200/80 transition-all shadow-2xs group-hover:scale-105">
                        <Pencil className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span className="text-xs font-medium text-slate-600 group-hover:text-[#F38820] transition-colors">
                        Tên
                    </span>
                </button>
            </div>
        </div>
    );
}
