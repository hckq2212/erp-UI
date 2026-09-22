import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGetPaymentMilestonesByContractQuery, useBulkSavePaymentMilestonesMutation } from '../../api/paymentMilestones';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';
import { formatNumber, parseNumber } from '../../utils/format';

const toDateOnly = (value) => (typeof value === 'string' ? value.split('T')[0] : '');

export const MilestoneModal = ({
    isOpen,
    onClose,
    contractId,
    sellingPrice,
    initialFocusMilestoneId,
    milestones: providedMilestones
}) => {
    const shouldFetch = Boolean(contractId && isOpen && !providedMilestones);
    const { data: fetchedMilestones, isLoading: loadingMilestones } = useGetPaymentMilestonesByContractQuery(contractId, {
        skip: !shouldFetch
    });
    const [bulkSave, { isLoading: saving }] = useBulkSavePaymentMilestonesMutation();

    const [localMilestones, setLocalMilestones] = useState([]);
    const focusRowRef = useRef(null);
    const focusInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const source = Array.isArray(providedMilestones) ? providedMilestones : fetchedMilestones;
        setLocalMilestones((source || []).map((m) => ({ ...m })));
    }, [isOpen, providedMilestones, fetchedMilestones]);

    useEffect(() => {
        if (!isOpen) return;
        if (!initialFocusMilestoneId) return;
        const timer = setTimeout(() => {
            if (focusRowRef.current) focusRowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
            if (focusInputRef.current) focusInputRef.current.focus();
        }, 0);
        return () => clearTimeout(timer);
    }, [isOpen, initialFocusMilestoneId, localMilestones.length]);

    const calculateAmount = (percentage) => {
        const price = Number(sellingPrice || 0);
        return Math.round((Number(percentage || 0) / 100) * price);
    };

    const calculatePercentage = (amount) => {
        const price = Number(sellingPrice || 0);
        if (!price) return 0;
        return Math.round((Number(amount || 0) / price) * 100);
    };

    const currentTotalPercent = useMemo(
        () => localMilestones.reduce((sum, m) => sum + Number(m?.percentage || 0), 0),
        [localMilestones]
    );
    const currentTotalAmount = useMemo(
        () => localMilestones.reduce((sum, m) => sum + Number(m?.amount || 0), 0),
        [localMilestones]
    );

    const handleAddRow = () => {
        const remaining = Math.max(0, 100 - currentTotalPercent);
        const nextPercent = remaining;
        const nextAmount = calculateAmount(nextPercent);
        setLocalMilestones((prev) => [
            ...prev,
            {
                name: `Đợt ${prev.length + 1}`,
                percentage: nextPercent,
                amount: nextAmount,
                dueDate: '',
                contractId
            }
        ]);
    };

    const handleRemoveRow = (index) => {
        setLocalMilestones((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        setLocalMilestones((prev) => {
            const next = [...prev];
            const row = { ...next[index] };

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

            next[index] = row;
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const totalPercentage = localMilestones.reduce((sum, m) => sum + Number(m?.percentage || 0), 0);
        const totalAmount = localMilestones.reduce((sum, m) => sum + Number(m?.amount || 0), 0);
        const price = Number(sellingPrice || 0);

        if (localMilestones.length > 0) {
            if (totalPercentage !== 100) {
                toast.error(`Tổng tỷ lệ các đợt phải bằng 100% (hiện tại: ${totalPercentage || 0}%)`);
                return;
            }
            if (totalAmount !== price) {
                toast.error(`Tổng số tiền (${formatNumber(totalAmount)}) phải bằng giá trị hợp đồng (${formatNumber(price)})`);
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

    const isValidTotals = Number(currentTotalPercent) === 100 && Number(currentTotalAmount) === Number(sellingPrice || 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Quản lý kế hoạch thanh toán"
            className="max-w-4xl"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá trị hợp đồng</p>
                        <p className="text-lg font-black text-slate-900">{formatNumber(Number(sellingPrice || 0))} VNĐ</p>
                    </div>
                    {/* <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng tiền đã chia</p>
                        <p className={cn("text-lg font-black", isValidTotals ? "text-emerald-700" : "text-rose-600")}>
                            {formatNumber(currentTotalAmount)} VNĐ
                        </p>
                    </div> */}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Lộ trình thanh toán
                        </div>
                        <button
                            type="button"
                            onClick={handleAddRow}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-black flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" /> Thêm đợt
                        </button>
                    </div>

                    {loadingMilestones && (
                        <div className="animate-pulse h-24 bg-slate-50 rounded-2xl border border-slate-100" />
                    )}

                    {!loadingMilestones && (
                        <div className="space-y-3">
                            {localMilestones.map((m, idx) => {
                                const isFocus = String(m?.id) === String(initialFocusMilestoneId);
                                return (
                                    <div
                                        key={m.id || `${idx}-${m.name}`}
                                        ref={isFocus ? focusRowRef : null}
                                        className={cn(
                                            "p-4 rounded-2xl border bg-white flex flex-col gap-3",
                                            isFocus ? "border-indigo-300 shadow-sm" : "border-slate-100"
                                        )}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                            <div className="md:col-span-4">
                                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">
                                                    Tên đợt
                                                </label>
                                                <Input
                                                    value={m.name || ''}
                                                    onChange={(e) => handleChange(idx, 'name', e.target.value)}
                                                    placeholder="VD: Đợt thanh toán 1"
                                                    className="h-10 text-sm font-semibold"
                                                    required
                                                    ref={isFocus ? focusInputRef : null}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">
                                                    Tỷ lệ (%)
                                                </label>
                                                <div className="relative">
                                                    <Input
                                                        type="text"
                                                        value={formatNumber(m.percentage)}
                                                        onChange={(e) => handleChange(idx, 'percentage', e.target.value)}
                                                        className="h-10 text-sm pr-6 font-semibold"
                                                        required
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                                                </div>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">
                                                    Số tiền (VNĐ)
                                                </label>
                                                <div className="relative">
                                                    <Input
                                                        type="text"
                                                        value={formatNumber(m.amount)}
                                                        onChange={(e) => handleChange(idx, 'amount', e.target.value)}
                                                        className="h-10 text-sm pr-12 font-semibold"
                                                        required
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">VNĐ</span>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">
                                                    Hạn
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={toDateOnly(m.dueDate)}
                                                    onChange={(e) => handleChange(idx, 'dueDate', e.target.value)}
                                                    className="h-10 text-sm px-2 font-semibold"
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-1 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveRow(idx)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {localMilestones.length === 0 && (
                                <div className="text-center py-10 text-sm text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                                    Chưa có đợt thanh toán nào. Nhấn “Thêm đợt” để bắt đầu.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" isLoading={saving} className="flex items-center gap-2" disabled={!contractId}>
                        <Save className="w-4 h-4" /> Lưu kế hoạch
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
