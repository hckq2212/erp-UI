import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Save, Trash2, Lock } from 'lucide-react';
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
        const row = localMilestones[index];
        const payments = row?.debt?.payments || row?.payments || [];
        const paidAmount = Number(row?.paidAmount ?? payments.reduce((sum, p) => sum + Number(p.amount || 0), 0));
        if (paidAmount > 0) {
            toast.warning(`Không thể xóa đợt "${row.name}" vì đã phát sinh thanh toán`);
            return;
        }
        setLocalMilestones((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        setLocalMilestones((prev) => {
            const next = [...prev];
            const row = { ...next[index] };
            const payments = row?.debt?.payments || row?.payments || [];
            const paidAmount = Number(row?.paidAmount ?? payments.reduce((sum, p) => sum + Number(p.amount || 0), 0));
            if (paidAmount > 0) {
                return prev; // Đợt đã thanh toán bị khóa, không cho sửa
            }

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

        const totalPercentage = Math.round(localMilestones.reduce((sum, m) => sum + Number(m?.percentage || 0), 0));
        const totalAmount = localMilestones.reduce((sum, m) => sum + Number(m?.amount || 0), 0);
        const price = Number(sellingPrice || 0);

        if (localMilestones.length > 0) {
            if (totalPercentage !== 100) {
                toast.error(`Tổng tỷ lệ các đợt phải bằng 100% (hiện tại: ${totalPercentage || 0}%)`);
                return;
            }
            for (let i = 0; i < localMilestones.length; i++) {
                const m = localMilestones[i];
                if (!m.name || !m.name.trim()) {
                    toast.error(`Vui lòng nhập tên cho Đợt ${i + 1}`);
                    return;
                }
                if (!m.dueDate) {
                    toast.error(`Vui lòng chọn hạn thanh toán cho Đợt "${m.name}"`);
                    return;
                }
            }
        }

        try {
            await bulkSave({
                contractId,
                milestones: localMilestones.map(m => ({
                    id: m.id,
                    name: m.name,
                    percentage: Number(m.percentage) || 0,
                    amount: Number(m.amount) || 0,
                    dueDate: m.dueDate,
                    description: m.description
                }))
            }).unwrap();
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
                                const payments = m?.debt?.payments || m?.payments || [];
                                const paidAmount = Number(m?.paidAmount ?? payments.reduce((sum, p) => sum + Number(p.amount || 0), 0));
                                const isLocked = paidAmount > 0;

                                return (
                                    <div
                                        key={m.id || `${idx}-${m.name}`}
                                        ref={isFocus ? focusRowRef : null}
                                        className={cn(
                                            "p-4 rounded-2xl border flex flex-col gap-3 transition-all",
                                            isLocked
                                                ? "bg-slate-50/90 border-slate-200"
                                                : isFocus
                                                    ? "bg-white border-indigo-300 shadow-sm"
                                                    : "bg-white border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        {isLocked && (
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                                                <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                    <Lock className="w-3 h-3" /> Đã thu: {formatNumber(paidAmount)} VNĐ (Cố định đợt)
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    Đợt đã phát sinh phiếu thu, không thể chỉnh sửa
                                                </span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                            <div className="md:col-span-4">
                                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">
                                                    Tên đợt
                                                </label>
                                                <Input
                                                    value={m.name || ''}
                                                    onChange={(e) => handleChange(idx, 'name', e.target.value)}
                                                    placeholder="VD: Đợt thanh toán 1"
                                                    className={cn("h-10 text-sm font-semibold", isLocked && "bg-slate-100 text-slate-500 cursor-not-allowed")}
                                                    disabled={isLocked}
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
                                                        className={cn("h-10 text-sm pr-6 font-semibold", isLocked && "bg-slate-100 text-slate-500 cursor-not-allowed")}
                                                        disabled={isLocked}
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
                                                        className={cn("h-10 text-sm pr-12 font-semibold", isLocked && "bg-slate-100 text-slate-500 cursor-not-allowed")}
                                                        disabled={isLocked}
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
                                                    className={cn("h-10 text-sm px-2 font-semibold", isLocked && "bg-slate-100 text-slate-500 cursor-not-allowed")}
                                                    disabled={isLocked}
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-1 flex justify-end">
                                                {isLocked ? (
                                                    <div className="p-2 text-slate-400 cursor-not-allowed" title="Không thể xóa đợt đã thanh toán">
                                                        <Lock className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRow(idx)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                                        title="Xóa đợt"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
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
