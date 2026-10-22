import React, { useState, useEffect } from "react";
import { X, Pencil } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";

export function ChatRenameGroupModal({ isOpen, onClose, activeRoom }) {
    const { updateRoomInfo } = useChatStore();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && activeRoom) {
            setName(activeRoom.name || "");
            setError("");
        }
    }, [isOpen, activeRoom]);

    if (!isOpen || !activeRoom) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError("Tên nhóm không được để trống");
            return;
        }
        if (trimmed === activeRoom.name) {
            onClose();
            return;
        }

        try {
            setLoading(true);
            setError("");
            const res = await updateRoomInfo(activeRoom.id, { name: trimmed });
            if (res && res.success !== false) {
                onClose();
            } else {
                setError(res?.error || "Không thể đổi tên nhóm");
            }
        } catch (err) {
            setError(err.message || "Lỗi khi đổi tên nhóm");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
                        <Pencil className="w-4 h-4 text-[#F38820]" />
                        <span>Đổi tên đoạn chat</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                    <p className="text-xs text-gray-500">
                        Mọi người trong đoạn chat đều sẽ thấy tên này.
                    </p>

                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError("");
                            }}
                            placeholder="Nhập tên nhóm..."
                            autoFocus
                            maxLength={80}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#F38820] focus:ring-2 focus:ring-[#F38820]/20 bg-gray-50 text-slate-800 transition-all"
                        />
                        {error && (
                            <p className="text-xs text-rose-500 mt-1.5 font-medium">{error}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="px-4 py-2 text-xs font-semibold text-white bg-[#F38820] hover:bg-[#e07714] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                            {loading ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
