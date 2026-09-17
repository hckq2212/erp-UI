import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Calendar, User, Percent, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { formatNumber, parseNumber, formatCurrency, formatDateISO } from '../../utils/format';

/**
 * Component hiển thị và quản lý Danh sách công việc con theo phong cách Lộ trình thanh toán (Payment Schedule style)
 * 
 * Props:
 * - isOpen: boolean - Trạng thái đóng/mở Modal
 * - onClose: func - Hàm đóng Modal
 * - task: object - Thông tin task chính và hạng mục gắn với task
 * - assignableMembers: array - Danh sách thành viên có thể phân công
 * - initialSubtasks: array - Danh sách subtask ban đầu
 * - onSave: func(subtasks) - Callback khi bấm Lưu danh sách
 * - isLoading: boolean - Trạng thái đang lưu API
 */
export const SubtaskRoadmapModal = ({
    isOpen = false,
    onClose,
    task,
    assignableMembers = [],
    initialSubtasks = [],
    onSave,
    isLoading = false,
}) => {
    const totalBudget = Number(task?.job?.vinicoin ?? task?.budget ?? 0);
    const [subtasks, setSubtasks] = useState([]);
    const [activeRowId, setActiveRowId] = useState(null);

    // Synchronize initial subtasks when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialSubtasks && initialSubtasks.length > 0) {
                setSubtasks(
                    initialSubtasks.map((st, idx) => ({
                        id: st.id || `temp-${Date.now()}-${idx}`,
                        name: st.name || `Công việc con ${idx + 1}`,
                        assigneeId: st.assigneeId || st.assignee?.id || '',
                        allocationPercent: st.allocationPercent ?? st.percent ?? 0,
                        amount: st.amount ?? (totalBudget * ((st.allocationPercent ?? 0) / 100)),
                        deadline: st.deadline ? formatDateISO(st.deadline) : '',
                        status: st.status || 'PENDING',
                        isNew: false,
                    }))
                );
            } else {
                // Mặc định 1 đợt mẫu nếu danh sách trống
                setSubtasks([
                    {
                        id: `temp-${Date.now()}-0`,
                        name: 'Công việc con đợt 1',
                        assigneeId: '',
                        allocationPercent: 100,
                        amount: totalBudget,
                        deadline: '',
                        status: 'PENDING',
                        isNew: true,
                    },
                ]);
            }
        }
    }, [isOpen, initialSubtasks, totalBudget]);

    // Thêm 1 đợt subtask mới
    const handleAddSubtaskRow = () => {
        const remainingPercent = Math.max(
            0,
            100 - subtasks.reduce((sum, item) => sum + (Number(item.allocationPercent) || 0), 0)
        );
        const newId = `temp-${Date.now()}-${subtasks.length}`;
        const newRow = {
            id: newId,
            name: `Công việc con đợt ${subtasks.length + 1}`,
            assigneeId: '',
            allocationPercent: remainingPercent,
            amount: totalBudget ? (totalBudget * remainingPercent) / 100 : 0,
            deadline: '',
            status: 'PENDING',
            isNew: true,
        };
        setSubtasks(prev => [...prev, newRow]);
        setActiveRowId(newId);
    };

    // Thay đổi giá trị trên từng dòng
    const handleRowChange = (id, field, value) => {
        setSubtasks(prev =>
            prev.map(row => {
                if (row.id !== id) return row;

                const updated = { ...row, [field]: value };

                // Tự động tính lại Số tiền nếu thay đổi Tỷ lệ %
                if (field === 'allocationPercent') {
                    const percentNum = Math.min(100, Math.max(0, Number(value) || 0));
                    updated.allocationPercent = percentNum;
                    if (totalBudget > 0) {
                        updated.amount = (totalBudget * percentNum) / 100;
                    }
                }

                // Tự động tính lại % nếu nhập Số tiền
                if (field === 'amount' && totalBudget > 0) {
                    const amountNum = parseNumber(value);
                    updated.amount = amountNum;
                    updated.allocationPercent = Number(((amountNum / totalBudget) * 100).toFixed(2));
                }

                return updated;
            })
        );
    };

    // Xóa đợt subtask
    const handleDeleteRow = id => {
        setSubtasks(prev => prev.filter(row => row.id !== id));
    };

    // Tổng % hiện tại
    const totalPercent = subtasks.reduce(
        (sum, item) => sum + (Number(item.allocationPercent) || 0),
        0
    );

    const handleSubmit = e => {
        e?.preventDefault();
        if (onSave) {
            onSave(subtasks);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Danh sách công việc con"
            className="max-w-4xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header danh sách + Button Thêm đợt */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">
                            DANH SÁCH CÔNG VIỆC CON ({subtasks.length})
                        </h3>
                        {totalBudget > 0 && (
                            <p className="mt-0.5 text-xs text-gray-400">
                                Ngân sách task chính: <span className="font-bold text-gray-700">{formatCurrency(totalBudget)}</span>
                            </p>
                        )}
                    </div>
                    <Button
                        type="button"
                        onClick={handleAddSubtaskRow}
                        className="bg-[#F38820] text-white hover:bg-[#D97010] focus:ring-orange-500"
                    >
                        <Plus className="mr-1.5 h-4 w-4" />
                        Thêm công việc
                    </Button>
                </div>

                {/* Cảnh báo % phân bổ */}
                {totalPercent > 100 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                        ⚠️ Tổng tỷ lệ phần trăm ({totalPercent.toLocaleString('vi-VN')}%) đang vượt quá 100%. Vui lòng điều chỉnh lại.
                    </div>
                )}

                {/* Danh sách các thẻ dòng (Row Cards) theo style Lộ trình thanh toán */}
                {subtasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center">
                        <p className="text-sm font-semibold text-gray-500">Chưa có công việc con nào</p>
                        <p className="mt-1 text-xs text-gray-400">Bấm nút "+ Thêm công việc" ở trên để tạo mới.</p>
                    </div>
                ) : (
                    <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                        {subtasks.map((row, index) => {
                            const isActive = activeRowId === row.id;

                            return (
                                <div
                                    key={row.id}
                                    onClick={() => setActiveRowId(row.id)}
                                    className={`relative rounded-2xl border bg-white p-4 transition-all duration-150 ${
                                        isActive
                                            ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
                                            : 'border-slate-200 hover:border-orange-300 shadow-xs'
                                    }`}
                                >
                                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-12 sm:items-center">
                                        {/* TÊN CÔNG VIỆC CON */}
                                        <div className="sm:col-span-4">
                                            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                TÊN CÔNG VIỆC CON
                                            </label>
                                            <input
                                                type="text"
                                                value={row.name}
                                                onChange={e => handleRowChange(row.id, 'name', e.target.value)}
                                                placeholder={`Công việc đợt ${index + 1}`}
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>

                                        {/* TỶ LỆ (%) */}
                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                TỶ LỆ (%)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    value={row.allocationPercent}
                                                    onChange={e => handleRowChange(row.id, 'allocationPercent', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-7 text-right text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                                    %
                                                </span>
                                            </div>
                                        </div>

                                        {/* SỐ TIỀN / GIÁ TRỊ (VNĐ) */}
                                        <div className="sm:col-span-3">
                                            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                {totalBudget > 0 ? 'SỐ TIỀN (VNĐ)' : 'NGƯỜI THỰC HIỆN'}
                                            </label>
                                            {totalBudget > 0 ? (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={formatNumber(row.amount)}
                                                        onChange={e => handleRowChange(row.id, 'amount', e.target.value)}
                                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-11 text-right text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">
                                                        VNĐ
                                                    </span>
                                                </div>
                                            ) : (
                                                <select
                                                    value={row.assigneeId}
                                                    onChange={e => handleRowChange(row.id, 'assigneeId', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                >
                                                    <option value="">Chọn người thực hiện</option>
                                                    {assignableMembers.map(m => (
                                                        <option key={m.id || m.user?.id} value={m.user?.id || m.id}>
                                                            {m.user?.fullName || m.fullName}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        {/* HẠN HOÀN THÀNH */}
                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                HẠN
                                            </label>
                                            <input
                                                type="date"
                                                value={row.deadline}
                                                onChange={e => handleRowChange(row.id, 'deadline', e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>

                                        {/* THAO TÁC XÓA */}
                                        <div className="flex items-center justify-end sm:col-span-1 sm:pt-4">
                                            <button
                                                type="button"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleDeleteRow(row.id);
                                                }}
                                                title="Xóa công việc con"
                                                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={totalPercent > 100}
                        className="rounded-xl bg-[#F38820] text-white hover:bg-[#D97010] focus:ring-orange-500"
                    >
                        <Save className="mr-1.5 h-4 w-4" />
                        Lưu danh sách
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
