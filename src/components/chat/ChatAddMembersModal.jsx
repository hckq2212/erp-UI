import React, { useState } from "react";
import { X } from "lucide-react";

export function ChatAddMembersModal({
    isOpen,
    onClose,
    activeRoom,
    systemUsers,
    selfUserId,
    onAddMembers
}) {
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    if (!isOpen || !activeRoom) return null;

    const handleConfirm = () => {
        if (selectedUserIds.length === 0) return;
        onAddMembers(selectedUserIds);
        setSelectedUserIds([]);
    };

    const toggleSelectUser = (uid) => {
        if (selectedUserIds.includes(uid)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== uid));
        } else {
            setSelectedUserIds([...selectedUserIds, uid]);
        }
    };

    const eligibleUsers = systemUsers.filter(
        u => u.id !== selfUserId && !activeRoom.participants?.some(p => p.userId === u.id)
    );

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md flex flex-col shadow-2xl overflow-hidden rounded-2xl border border-gray-150">
                <div className="px-5 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
                    <span className="text-sm font-bold text-slate-650">Thêm thành viên vào nhóm</span>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-5 flex flex-col gap-4 overflow-hidden">
                    <div className="flex flex-col gap-1.5 flex-1 min-h-[200px] max-h-[250px] overflow-hidden">
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Chọn thành viên</label>
                        <div className="flex-1 overflow-y-auto border border-gray-200 bg-gray-50 divide-y divide-gray-150 rounded-lg">
                            {eligibleUsers.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    Mọi nhân sự đều đã tham gia nhóm này
                                </div>
                            ) : (
                                eligibleUsers.map(user => {
                                    const isSelected = selectedUserIds.includes(user.id);
                                    return (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => toggleSelectUser(user.id)}
                                            className={`w-full px-4 py-2.5 text-xs flex items-center justify-between text-left transition-colors ${
                                                isSelected ? "bg-orange-50 text-[#F38820]" : "text-slate-600 hover:bg-gray-100"
                                            }`}
                                        >
                                            <span>{user.fullName}</span>
                                            <span className={`w-4 h-4 border flex items-center justify-center font-bold text-[8px] rounded-md ${
                                                isSelected ? "border-[#F38820] bg-[#F38820] text-white" : "border-gray-350"
                                            }`}>
                                                {isSelected ? "✓" : ""}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-5 py-4 border-t border-gray-150 flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-gray-100 transition-colors rounded-lg"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedUserIds.length === 0}
                        className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-lg ${
                            selectedUserIds.length > 0
                                ? "bg-[#F38820] text-white hover:bg-[#d97616]"
                                : "bg-gray-150 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        Thêm
                    </button>
                </div>
            </div>
        </div>
    );
}
