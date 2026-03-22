import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useBulkSavePaymentMilestonesMutation } from '../../../api/paymentMilestones';
import { toast } from 'react-toastify';
import { formatCurrency, formatNumber, parseNumber } from '../../../utils/format';

export const MilestoneModal = ({ isOpen, onClose, milestones, contractId, sellingPrice }) => {
    const [localMilestones, setLocalMilestones] = useState([]);
    const [bulkSave, { isLoading }] = useBulkSavePaymentMilestonesMutation();

    useEffect(() => {
        if (isOpen && milestones) {
            setLocalMilestones(milestones.map(m => ({ ...m })));
        }
    }, [isOpen, milestones]);

    const calculateAmount = (percentage) => {
        return Math.round((percentage / 100) * sellingPrice);
    };

    const calculatePercentage = (amount) => {
        if (sellingPrice === 0) return 0;
        return Math.round((amount / sellingPrice) * 100);
    };

    const handleAddRow = () => {
        const totalPercentage = localMilestones.reduce((sum, m) => sum + Number(m.percentage || 0), 0);
        const remaining = Math.max(0, 100 - totalPercentage);

        setLocalMilestones([
            ...localMilestones,
            {
                name: `Đợt ${localMilestones.length + 1}`,
                percentage: remaining,
                amount: calculateAmount(remaining),
                contractId
            }
        ]);
    };

    const handleRemoveRow = (index) => {
        setLocalMilestones(localMilestones.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const updated = [...localMilestones];
        const row = { ...updated[index] };

        if (field === 'percentage') {
            const numValue = parseNumber(value);
            row.percentage = numValue;
            row.amount = calculateAmount(numValue);
        } else if (field === 'amount') {
            const numValue = parseNumber(value);
            row.amount = numValue;
            row.percentage = calculatePercentage(numValue);
        } else {
            row[field] = value;
        }

        updated[index] = row;
        setLocalMilestones(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const totalPercentage = localMilestones.reduce((sum, m) => sum + Number(m.percentage || 0), 0);
        const totalAmount = localMilestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);

        if (localMilestones.length > 0) {
            if (totalPercentage !== 100) {
                toast.error(`Tổng tỷ lệ các đợt phải bằng 100% (hiện tại: ${totalPercentage || 0}%)`);
                return;
            }
            if (totalAmount !== sellingPrice) {
                toast.error(`Tổng số tiền (${formatNumber(totalAmount)}) phải bằng giá trị hợp đồng (${formatNumber(sellingPrice)})`);
                return;
            }
        }

        try {
            await bulkSave({ contractId, milestones: localMilestones }).unwrap();
            toast.success('Cập nhật kế hoạch thanh toán thành công');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Không thể cập nhật kế hoạch thanh toán');
        }
    };

    const currentTotalPercent = localMilestones.reduce((sum, m) => sum + Number(m.percentage || 0), 0);
    const currentTotalAmount = localMilestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Quản lý kế hoạch thanh toán" className="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Giá trị hợp đồng</p>
                        <p className="text-lg font-black text-blue-700">{formatNumber(sellingPrice)} VNĐ</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Tổng tiền đã chia</p>
                        <p className={cn(
                            "text-lg font-black",
                            currentTotalAmount === sellingPrice ? "text-green-600" : "text-red-500"
                        )}>
                            {formatNumber(currentTotalAmount)} VNĐ
                        </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-blue-100/50 flex justify-between items-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Trạng thái tỷ lệ</p>
                        <p className={cn(
                            "text-sm font-black",
                            currentTotalPercent === 100 ? "text-green-600" : "text-orange-500"
                        )}>
                            {currentTotalPercent}% / 100%
                        </p>
                    </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {localMilestones.map((m, idx) => (
                        <div key={idx} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-200 relative group">
                            <div className="flex-[2]">
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tên đợt thanh toán</label>
                                <Input
                                    value={m.name}
                                    onChange={(e) => handleChange(idx, 'name', e.target.value)}
                                    placeholder="VD: Đợt thanh toán 1"
                                    className="h-9 text-sm"
                                    required
                                />
                            </div>
                            <div className="flex-1 ">
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tỷ lệ (%)</label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={formatNumber(m.percentage)}
                                        onChange={(e) => handleChange(idx, 'percentage', e.target.value)}
                                        className="h-9 text-sm pr-6"
                                        required
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                                </div>
                            </div>
                            <div className="flex-[2]">
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Số tiền (VNĐ)</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        // value={formatCurrency(m.amount)}
                                        value={m.amount}
                                        onChange={(e) => handleChange(idx, 'amount', e.target.value)}
                                        className="h-9 text-sm pr-6"
                                    // required
                                    />

                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">VNĐ</span>
                                </div>
                            </div>
                            <div className="flex-[1.5]">
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Hạn thanh toán</label>
                                <Input
                                    type="date"
                                    value={m.dueDate ? m.dueDate.split('T')[0] : ''}
                                    onChange={(e) => handleChange(idx, 'dueDate', e.target.value)}
                                    className="h-9 text-sm px-2"
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveRow(idx)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {localMilestones.length === 0 && (
                        <div className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
                            Chưa có đợt thanh toán nào. Nhấn "Thêm đợt" để bắt đầu.
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleAddRow}
                        className="text-sm text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" /> Thêm đợt thanh toán
                    </button>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" isLoading={isLoading} className="flex items-center gap-2">
                            <Save className="w-4 h-4" /> Lưu kế hoạch
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

// Helper function for conditional classes
function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
