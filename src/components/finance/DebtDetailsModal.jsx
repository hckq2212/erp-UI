import { useState, useEffect } from 'react';
import {
    CreditCard,
    Trash2,
} from 'lucide-react';
import {
    useCreatePaymentMutation,
    useDeletePaymentMutation
} from '../../api/debts';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { toast } from 'react-toastify';
import { formatNumber, parseNumber } from '../../utils/format';

export const DebtDetailsModal = ({ isOpen, onClose, debt, allDebts = [] }) => {
    const [createPayment] = useCreatePaymentMutation();
    const [deletePayment] = useDeletePaymentMutation();

    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentNote, setPaymentNote] = useState('');

    // Update payment amount suggestion when debt changes or modal opens
    useEffect(() => {
        if (isOpen && debt) {
            const totalPaid = debt.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
            const remaining = Math.round(Number(debt.amount || 0) - totalPaid);
            setPaymentAmount(Math.max(0, remaining).toString());
            setPaymentNote('');
        }
    }, [isOpen, debt]);

    const handleCreatePayment = async (e) => {
        e.preventDefault();
        if (!debt) return;

        const currentTotalPaid = debt.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        const remaining = Math.round(Number(debt.amount || 0) - currentTotalPaid);
        const amount = Number(paymentAmount);
        if (amount <= 0) {
            toast.error('Số tiền thanh toán phải lớn hơn 0');
            return;
        }

        if (amount > remaining) {
            toast.error(`Số tiền không được vượt quá số tiền còn lại (${formatNumber(remaining)} VNĐ)`);
            return;
        }

        try {
            await createPayment({
                debtId: debt.id,
                amount: amount,
                paymentDate,
                note: paymentNote
            }).unwrap();
            toast.success('Ghi nhận thanh toán thành công');
            setPaymentNote('');

            // Suggest next remaining based on current list + new payment
            const nextRemaining = remaining - amount;
            setPaymentAmount(Math.max(0, nextRemaining).toString());

        } catch (err) {
            toast.error(err?.data?.message || 'Không thể ghi nhận thanh toán');
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa lịch sử thanh toán này?')) return;
        try {
            await deletePayment(paymentId).unwrap();
            toast.success('Đã xóa ghi nhận thanh toán');
        } catch (err) {
            toast.error(err?.data?.message || 'Không thể xóa thanh toán');
        }
    };

    if (!debt) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={debt?.milestone?.name || 'Chi tiết công nợ'}
            size="lg"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Form */}
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ghi nhận thanh toán mới</h4>
                        <form onSubmit={handleCreatePayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                                    Số tiền
                                </label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={formatNumber(paymentAmount)}
                                        onChange={(e) => setPaymentAmount(parseNumber(e.target.value))}
                                        required
                                        className="pr-12 text-sm font-bold"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                                        VNĐ
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                                    Ngày thanh toán
                                </label>
                                <Input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    required
                                    className="text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                                    Ghi chú
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm min-h-[60px]"
                                    placeholder="Nhập ghi chú..."
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                onClick={handleCreatePayment}
                                disabled={debt.paidAmount >= debt.amount}
                            >
                                Xác nhận thanh toán
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Payment History */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lịch sử thanh toán</h4>
                        <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {debt?.payments?.length || 0} Đợt
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {debt?.payments?.map((payment) => (
                            <div key={payment.id} className="p-3 bg-white border border-gray-100 rounded-lg flex items-center justify-between hover:border-gray-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">
                                            {formatNumber(payment.amount)} <span className="text-[10px] font-normal text-gray-500">VNĐ</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-medium">
                                            {new Date(payment.paymentDate).toLocaleDateString('vi-VN')} {payment.note && `• ${payment.note}`}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeletePayment(payment.id)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        {(!debt?.payments || debt.payments.length === 0) && (
                            <div className="py-8 text-center text-xs text-gray-400 italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                Chưa có lịch sử thanh toán.
                            </div>
                        )}
                    </div>

                    {/* Modal Summary */}
                    <div className="pt-4 mt-auto border-t border-gray-100 flex justify-end">
                        <div className="text-right">
                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Tổng đã nộp</div>
                            <div className="text-lg font-bold text-green-600">
                                {formatNumber(debt?.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0)} <span className="text-xs font-normal text-gray-500">VNĐ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
