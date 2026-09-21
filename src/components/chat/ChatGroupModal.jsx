import React, { useState } from "react";
import { X } from "lucide-react";

export function ChatGroupModal({
    isOpen,
    onClose,
    systemUsers,
    selfUserId,
    onCreateGroup
}) {
    const [groupName, setGroupName] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!groupName.trim() || selectedUserIds.length === 0) return;
        onCreateGroup(groupName.trim(), selectedUserIds);
        setGroupName("");
        setSelectedUserIds([]);
    };

    const toggleSelectUser = (uid) => {
        if (selectedUserIds.includes(uid)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== uid));
        } else {
            setSelectedUserIds([...selectedUserIds, uid]);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md flex flex-col shadow-2xl overflow-hidden rounded-2xl border border-gray-150">
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <span className="text-sm font-bold text-slate-800">Tạo nhóm chat mới</span>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-650">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-5 flex flex-col gap-4 overflow-hidden">
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Tên nhóm</label>
                        <input
                            type="text"
                            placeholder="Nhập tên nhóm..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-xs px-3 py-2 outline-none focus:border-[#0084ff] text-slate-800 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 flex-1 min-h-[200px] max-h-[250px] overflow-hidden">
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Chọn thành viên</label>
                        <div className="flex-1 overflow-y-auto border border-gray-200 bg-gray-50 divide-y divide-gray-150 rounded-lg">
                            {systemUsers.filter(u => u.id !== selfUserId).map(user => {
                                const isSelected = selectedUserIds.includes(user.id);
                                return (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => toggleSelectUser(user.id)}
                                        className={`w-full px-4 py-2.5 text-xs flex items-center justify-between text-left transition-colors ${
                                            isSelected ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-gray-100"
                                        }`}
                                    >
                                        <span>{user.fullName}</span>
                                        <span className={`w-4 h-4 border flex items-center justify-center font-bold text-[8px] rounded-md ${
                                            isSelected ? "border-[#0084ff] bg-[#0084ff] text-white" : "border-gray-300"
                                        }`}>
                                            {isSelected ? "✓" : ""}
                                        </span>
                                    </button>
                                );
                            })}
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
                        disabled={!groupName.trim() || selectedUserIds.length === 0}
                        className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-lg ${
                            groupName.trim() && selectedUserIds.length > 0
                                ? "bg-[#0084ff] text-white hover:bg-[#0073de]"
                                : "bg-gray-150 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
}
