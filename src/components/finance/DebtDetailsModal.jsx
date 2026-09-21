import { useState, useEffect } from 'react';
import {
    CreditCard,
    Paperclip,
    Upload,
    X,
    ChevronRight,
    FileText,
    Image as ImageIcon,
    Loader2
} from 'lucide-react';
import {
    useCreatePaymentMutation
} from '../../api/debts';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { toast } from 'react-toastify';
import { formatNumber, parseNumber } from '../../utils/format';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { PaymentDetailModal } from './PaymentDetailModal';

export const DebtDetailsModal = ({ isOpen, onClose, debt, allDebts = [] }) => {
    const [createPayment] = useCreatePaymentMutation();

    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentNote, setPaymentNote] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedPaymentForDetail, setSelectedPaymentForDetail] = useState(null);

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
                    {/* Payment Form */}
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ghi nhận thanh toán mới</h4>
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
                                    disabled={debt.paidAmount >= debt.amount || isUploading}
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
