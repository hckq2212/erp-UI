import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useBulkSavePaymentMilestonesMutation } from '../../../api/paymentMilestones';
import { toast } from 'react-toastify';

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
            row.percentage = Number(value);
            row.amount = calculateAmount(Number(value));
        } else if (field === 'amount') {
            row.amount = Number(value);
            row.percentage = calculatePercentage(Number(value));
        } else {
            row[field] = value;
        }

        updated[index] = row;
        setLocalMilestones(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const totalPercentage = localMilestones.reduce((sum, m) => sum + Number(m.percentage || 0), 0);

        if (totalPercentage !== 100 && localMilestones.length > 0) {
            toast.error(`Tổng tỷ lệ các đợt phải bằng 100% (hiện tại: ${totalPercentage || 0}%)`);
            return;
        }

        try {
            await bulkSave({ contractId, milestones: localMilestones }).unwrap();
            toast.success('Cập nhật kế hoạch thanh toán thành công');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Không thể cập nhật kế hoạch thanh toán');
        }
    };

    const currentTotal = localMilestones.reduce((sum, m) => sum + Number(m.percentage || 0), 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Quản lý kế hoạch thanh toán" className="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tổng giá trị hợp đồng</p>
                        <p className="text-lg font-bold text-blue-700">{sellingPrice.toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tổng tỷ lệ đã chia</p>
                        <p className={cn(
                            "text-xl font-bold",
                            currentTotal === 100 ? "text-green-600" : "text-orange-600"
                        )}>
                            {currentTotal}%
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
                            <div className="flex-1">
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tỷ lệ (%)</label>
                                <Input
                                    type="number"
                                    value={m.percentage}
                                    onChange={(e) => handleChange(idx, 'percentage', e.target.value)}
                                    className="h-9 text-sm"
                                    required
                                    min="0"
                                    max="100"
                                />
                            </div>
                            <div className="flex-[2]">
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Số tiền (VNĐ)</label>
                                <Input
                                    type="number"
                                    value={m.amount}
                                    onChange={(e) => handleChange(idx, 'amount', e.target.value)}
                                    className="h-9 text-sm"
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
