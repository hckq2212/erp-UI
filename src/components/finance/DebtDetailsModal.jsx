import { useState, useEffect } from 'react';
import {
    CreditCard,
    Paperclip,
    Upload,
    X,
    ChevronRight,
    FileText,
    Image as ImageIcon,
    Loader2,
    Lock,
    Unlock,
    AlertTriangle
} from 'lucide-react';
import {
    useCreatePaymentMutation,
    useUnlockDebtMutation
} from '../../api/debts';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { toast } from 'react-toastify';
import { formatNumber, parseNumber } from '../../utils/format';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { PaymentDetailModal } from './PaymentDetailModal';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import { canUnlockDebt } from '../../utils/projectPause';

export const DebtDetailsModal = ({ isOpen, onClose, debt, allDebts = [] }) => {
    const [createPayment] = useCreatePaymentMutation();
    const [unlockDebt, { isLoading: isUnlocking }] = useUnlockDebtMutation();
    const currentUser = useSelector(selectCurrentUser);

    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentNote, setPaymentNote] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedPaymentForDetail, setSelectedPaymentForDetail] = useState(null);
    const [unlockReason, setUnlockReason] = useState('');
    const [showUnlockForm, setShowUnlockForm] = useState(false);

    const isLocked = debt?.status === 'LOCKED';
    const showUnlockButton = isLocked && canUnlockDebt(currentUser);

    const handleUnlock = async () => {
        if (!unlockReason.trim()) {
            toast.error('Vui lòng nhập lý do mở khóa công nợ');
            return;
        }
        try {
            await unlockDebt({ id: debt.id, reason: unlockReason.trim() }).unwrap();
            toast.success('Đã mở khóa công nợ');
            setUnlockReason('');
            setShowUnlockForm(false);
            onClose?.();
        } catch (err) {
            toast.error(err?.data?.message || 'Không thể mở khóa công nợ');
        }
    };

    // Update payment amount suggestion when debt changes or modal opens
    useEffect(() => {
        if (isOpen && debt) {
            const totalPaid = debt.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
            const remaining = Math.round(Number(debt.amount || 0) - totalPaid);
            setPaymentAmount(Math.max(0, remaining).toString());
            setPaymentNote('');
            setSelectedFile(null);
            setFileError(false);
            setIsUploading(false);
        }
    }, [isOpen, debt]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
        const isPdfOrImage = validTypes.includes(file.type) || file.name.match(/\.(pdf|png|jpe?g|webp)$/i);

        if (!isPdfOrImage) {
            toast.error('Chỉ chấp nhận tệp hình ảnh (JPG, PNG, WEBP) hoặc tệp PDF!');
            e.target.value = '';
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            toast.error('Dung lượng tệp không được vượt quá 20MB');
            e.target.value = '';
            return;
        }

        setSelectedFile(file);
        setFileError(false);
        e.target.value = '';
    };

    const handleCreatePayment = async (e) => {
        e.preventDefault();
        if (!debt) return;

        const currentTotalPaid = debt.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        const remaining = Math.round(Number(debt.amount || 0) - currentTotalPaid);
        const amount = Number(paymentAmount);

        if (!paymentAmount || isNaN(amount) || amount <= 0) {
            toast.error('Vui lòng nhập số tiền thanh toán hợp lệ (lớn hơn 0)');
            return;
        }

        if (amount > remaining) {
            toast.error(`Số tiền không được vượt quá số tiền còn lại (${formatNumber(remaining)} VNĐ)`);
            return;
        }

        if (!paymentDate) {
            toast.error('Vui lòng chọn ngày thanh toán');
            return;
        }

        if (!selectedFile) {
            setFileError(true);
            toast.error('Vui lòng đính kèm chứng từ thanh toán (Ảnh hoặc PDF)');
            return;
        }

        try {
            setIsUploading(true);
            let attachments = [];
            try {
                const uploaded = await uploadToCloudinary(selectedFile, 'GETVINI/ERP/debts/proofs');
                attachments.push({
                    name: selectedFile.name,
                    url: uploaded.url,
                    type: selectedFile.type.includes('pdf') || selectedFile.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMAGE',
                    size: selectedFile.size,
                    publicId: uploaded.publicId
                });
            } catch (uploadErr) {
                toast.error('Lỗi khi tải chứng từ lên: ' + (uploadErr.message || 'Thất bại'));
                setIsUploading(false);
                return;
            }
            setIsUploading(false);

            await createPayment({
                debtId: debt.id,
                amount: amount,
                paymentDate,
                note: paymentNote,
                attachments: attachments.length > 0 ? attachments : undefined
            }).unwrap();

            toast.success('Ghi nhận thanh toán thành công');
            setPaymentNote('');
            setSelectedFile(null);
            setFileError(false);

            // Suggest next remaining based on current list + new payment
            const nextRemaining = remaining - amount;
            setPaymentAmount(Math.max(0, nextRemaining).toString());

        } catch (err) {
            setIsUploading(false);
            toast.error(err?.data?.message || 'Không thể ghi nhận thanh toán');
        }
    };

    if (!debt) return null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={debt?.milestone?.name || 'Chi tiết công nợ'}
                size="lg"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cảnh báo + form mở khóa khi công nợ đã khóa (dự án đã đóng) */}
                    {isLocked && (
                        <div className="md:col-span-2 space-y-3">
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
                                <Lock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-amber-900 text-sm">
                                        Công nợ đã bị KHÓA do dự án đã đóng
                                    </p>
                                    <div className="mt-1 text-xs text-amber-800 font-medium space-y-0.5">
                                        <p>Không thể ghi nhận thanh toán hay xóa khoản nợ này.</p>
                                        {debt.lockReason && <p>Lý do khóa: <b>{debt.lockReason}</b></p>}
                                        {debt.lockedAt && (
                                            <p>Khóa lúc: {new Date(debt.lockedAt).toLocaleString('vi-VN')}</p>
                                        )}
                                        {debt.lockedBy?.fullName && <p>Người khóa: <b>{debt.lockedBy.fullName}</b></p>}
                                    </div>
                                </div>
                            </div>

                            {showUnlockButton && !showUnlockForm && (
                                <button
                                    type="button"
                                    onClick={() => setShowUnlockForm(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-amber-300 text-amber-700 text-sm font-bold rounded-xl hover:bg-amber-50 transition-all active:scale-95"
                                >
                                    <Unlock className="w-4 h-4" />
                                    Mở khóa công nợ
                                </button>
                            )}

                            {showUnlockButton && showUnlockForm && (
                                <div className="rounded-2xl border border-amber-200 bg-white p-4 space-y-3">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                        <p className="text-xs text-amber-800 font-medium">
                                            Mở khóa sẽ đưa khoản nợ về trạng thái thu tiền bình thường.
                                            Hành động này được ghi vết vào lịch sử.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                                            Lý do mở khóa <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-sm resize-none min-h-[60px]"
                                            value={unlockReason}
                                            onChange={(e) => setUnlockReason(e.target.value)}
                                            placeholder="Ví dụ: Đóng dự án nhầm, khách vẫn còn nợ cần thu..."
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setShowUnlockForm(false); setUnlockReason(''); }}
                                            className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-200"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleUnlock}
                                            disabled={isUnlocking || !unlockReason.trim()}
                                            className="flex-1 px-3 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 disabled:bg-amber-300"
                                        >
                                            {isUnlocking ? 'Đang xử lý...' : 'Xác nhận mở khóa'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Payment Form */}
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Ghi nhận thanh toán mới
                            </h4>
                            {isLocked && (
                                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] font-medium text-amber-800">
                                    Công nợ đã khóa — không thể ghi nhận thanh toán mới.
                                </div>
                            )}
                            <form onSubmit={handleCreatePayment} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                                        Số tiền <span className="text-red-500">*</span>
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
                                        Ngày thanh toán <span className="text-red-500">*</span>
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
                                        placeholder="Nhập ghi chú (không bắt buộc)..."
                                        value={paymentNote}
                                        onChange={(e) => setPaymentNote(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                                        Chứng từ thanh toán (Ảnh / PDF) <span className="text-red-500">*</span>
                                    </label>
                                    {!selectedFile ? (
                                        <div>
                                            <label className={`flex flex-col items-center justify-center p-3 border-2 border-dashed ${fileError ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-blue-400 bg-white hover:bg-blue-50/30'} rounded-xl cursor-pointer transition-all group`}>
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                    disabled={isUploading}
                                                />
                                                <div className={`flex items-center gap-2 text-xs font-medium ${fileError ? 'text-red-500' : 'text-gray-500 group-hover:text-blue-600'}`}>
                                                    <Upload className={`w-4 h-4 ${fileError ? 'text-red-400' : 'text-gray-400 group-hover:text-blue-500'}`} />
                                                    <span>Chọn tệp hoặc kéo thả</span>
                                                </div>
                                                <span className={`text-[10px] ${fileError ? 'text-red-400' : 'text-gray-400'} mt-0.5`}>
                                                    Chỉ nhận PDF, JPG, PNG, WEBP (Tối đa 20MB)
                                                </span>
                                            </label>
                                            {fileError && (
                                                <p className="mt-1 text-[11px] text-red-500 font-medium">
                                                    * Vui lòng đính kèm chứng từ thanh toán (Ảnh hoặc PDF)
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-2.5 bg-blue-50/50 border border-blue-200 rounded-xl">
                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                                                    {selectedFile.type.includes('pdf') || selectedFile.name.toLowerCase().endsWith('.pdf') ? (
                                                        <FileText className="w-4 h-4" />
                                                    ) : (
                                                        <ImageIcon className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-gray-800 truncate" title={selectedFile.name}>
                                                        {selectedFile.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedFile(null)}
                                                disabled={isUploading}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                title="Hủy chọn file"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isLocked || debt.paidAmount >= debt.amount || isUploading}
                                    className="w-full flex items-center justify-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Đang tải chứng từ & lưu...</span>
                                        </>
                                    ) : (
                                        'Xác nhận thanh toán'
                                    )}
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

                        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                            {debt?.payments?.map((payment) => (
                                <div
                                    key={payment.id}
                                    onClick={() => setSelectedPaymentForDetail(payment)}
                                    className="p-3 bg-white border border-gray-100 hover:border-blue-300 hover:shadow-xs rounded-xl flex items-center justify-between transition-all cursor-pointer group"
                                    title="Bấm để xem chi tiết thanh toán"
                                >
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-gray-900 truncate">
                                                {formatNumber(payment.amount)} <span className="text-[10px] font-normal text-gray-500">VNĐ</span>
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-medium truncate">
                                                {new Date(payment.paymentDate).toLocaleDateString('vi-VN')} {payment.note && `• ${payment.note}`}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {payment.attachments && payment.attachments.length > 0 && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                <Paperclip className="w-3 h-3" />
                                                {payment.attachments.length}
                                            </span>
                                        )}
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                    </div>
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

            {/* Popup xem chi tiết thanh toán */}
            <PaymentDetailModal
                isOpen={!!selectedPaymentForDetail}
                onClose={() => setSelectedPaymentForDetail(null)}
                payment={selectedPaymentForDetail}
            />
        </>
    );
};
