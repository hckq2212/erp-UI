import { useState, useRef } from 'react';
import {
    Landmark, Wallet, Check, AlertCircle, Loader2, Upload,
    Trash2, Image as ImageIcon, File as FileIcon, ExternalLink,
    Printer, Info, History, ArrowRight
} from 'lucide-react';
import {
    useRecordPaymentRequestMutation,
    useUploadPaymentRequestInvoiceFileMutation
} from '../../api/paymentRequests';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';
import { formatDateToDDMMYYYY } from '../../utils/format';
import { ModalShell, ModalHeader, AmountInput } from './PaymentRequestParts';
import { CashVoucherModal } from './CashVoucherModal';
import { inputCls, labelCls, btnPrimary, btnSecondary } from './paymentRequestConfig';

const MAX_FILE_MB = 15;
const ACCEPTED_TYPES = [
    'image/',
    'application/pdf',
];

export const PaymentDisbursementModal = ({ request, onClose, onSuccess }) => {
    const totalAmount = Math.round(Number(request?.amount || 0));
    const paidAmount = Math.round(Number(request?.paidAmount || 0));
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    const paidPercent = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

    const [payMode, setPayMode] = useState('FULL'); // 'FULL' | 'PARTIAL'
    const [paidAmountThisTime, setPaidAmountThisTime] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(request?.paymentMethod || 'BANK_TRANSFER');
    const [cashVoucherInfo, setCashVoucherInfo] = useState(request?.cashVoucherInfo || null);
    const [isCashVoucherOpen, setIsCashVoucherOpen] = useState(false);
    const [note, setNote] = useState('');
    const [proofFiles, setProofFiles] = useState([]);
    const [error, setError] = useState('');

    const fileInputRef = useRef(null);

    const [recordPayment, { isLoading: isRecording }] = useRecordPaymentRequestMutation();
    const [uploadInvoiceFile] = useUploadPaymentRequestInvoiceFileMutation();

    const isUploadingProofs = proofFiles.some((f) => f.uploading);

    const effectivePayAmount = payMode === 'FULL'
        ? remainingAmount
        : (Number(paidAmountThisTime) || 0);

    const handleFileSelected = async (fileList) => {
        const files = Array.from(fileList || []);
        for (const file of files) {
            const isAccepted = ACCEPTED_TYPES.some((t) => file.type.startsWith(t)) || file.name.match(/\.(jpe?g|png|webp|gif|pdf)$/i);
            if (!isAccepted) {
                setError(`File "${file.name}" không hợp lệ (hỗ trợ Ảnh hoặc PDF)`);
                continue;
            }
            if (file.size > MAX_FILE_MB * 1024 * 1024) {
                setError(`File "${file.name}" vượt quá ${MAX_FILE_MB}MB`);
                continue;
            }
            const tempId = `${file.name}-${Date.now()}`;
            setProofFiles((prev) => [...prev, { name: file.name, size: file.size, uploading: true, tempId }]);
            try {
                const uploaded = await uploadInvoiceFile(file).unwrap();
                setProofFiles((prev) => prev.map((f) => (f.tempId === tempId ? { ...uploaded, uploading: false } : f)));
                setError('');
            } catch (err) {
                setProofFiles((prev) => prev.filter((f) => f.tempId !== tempId));
                setError(err?.data?.message || `Tải file "${file.name}" thất bại`);
            }
        }
    };

    const handleRemoveFile = (target) => {
        setProofFiles((prev) => prev.filter((f) => (f.publicId || f.url || f.tempId) !== (target.publicId || target.url || target.tempId)));
    };

    const handleSaveCashVoucher = (voucherData) => {
        setCashVoucherInfo(voucherData);
        setIsCashVoucherOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (remainingAmount <= 0) {
            setError('Yêu cầu này đã được chi đủ số tiền.');
            return;
        }

        if (payMode === 'PARTIAL') {
            const num = Number(paidAmountThisTime);
            if (!paidAmountThisTime || isNaN(num) || num <= 0) {
                setError('Vui lòng nhập số tiền chi đợt này lớn hơn 0 VNĐ');
                return;
            }
            if (num > remainingAmount) {
                setError(`Số tiền chi đợt này (${formatNumber(num)} đ) không được vượt quá số còn lại (${formatNumber(remainingAmount)} đ)`);
                return;
            }
        }

        if (paymentMethod === 'CASH' && !cashVoucherInfo) {
            setError('Vui lòng lập Phiếu chi tiền mặt (Mẫu 02-TT) trước khi xác nhận chi');
            return;
        }

        if (isUploadingProofs) {
            setError('Vui lòng đợi file minh chứng tải lên hoàn tất');
            return;
        }

        const readyProofs = proofFiles.filter((f) => !f.uploading);
        if (readyProofs.length === 0) {
            setError('Bắt buộc tải lên ít nhất 1 file minh chứng đã chi tiền (Ủy nhiệm chi hoặc Phiếu chi đã ký)');
            return;
        }

        try {
            await recordPayment({
                id: request.id,
                paidAmountThisTime: payMode === 'PARTIAL' ? Number(paidAmountThisTime) : remainingAmount,
                paymentMethod,
                cashVoucherInfo: paymentMethod === 'CASH' ? cashVoucherInfo : undefined,
                paymentProofs: readyProofs,
                note: note.trim() || undefined
            }).unwrap();

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err?.data?.message || 'Có lỗi xảy ra khi ghi nhận chi tiền');
        }
    };

    const transactions = Array.isArray(request?.paymentTransactions) ? request.paymentTransactions : [];

    return (
        <ModalShell onClose={onClose} maxWidth='max-w-2xl'>
            <ModalHeader
                icon={Landmark}
                title='Chi tiền thanh toán (Theo đợt)'
                subtitle={`Phiếu #${request?.code || request?.id?.slice(0, 8)} · ${request?.content || ''}`}
                onClose={onClose}
            />

            <form onSubmit={handleSubmit} className='flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6'>
                {/* 1. Thanh tiến độ giải ngân */}
                <div className='rounded-xl border border-gray-200 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/30 p-4 space-y-3'>
                    <div className='grid grid-cols-3 gap-2 text-center'>
                        <div className='rounded-lg bg-white p-2.5 shadow-2xs border border-stone-100'>
                            <span className='block text-[11px] text-stone-500'>Tổng duyệt chi</span>
                            <span className='text-sm font-bold text-stone-900'>{formatNumber(totalAmount)} đ</span>
                        </div>
                        <div className='rounded-lg bg-white p-2.5 shadow-2xs border border-stone-100'>
                            <span className='block text-[11px] text-stone-500'>Đã giải ngân</span>
                            <span className='text-sm font-bold text-emerald-600'>
                                {formatNumber(paidAmount)} đ <span className='text-[10px] text-stone-400 font-normal'>({paidPercent}%)</span>
                            </span>
                        </div>
                        <div className='rounded-lg bg-white p-2.5 shadow-2xs border border-gray-200 bg-orange-50/30'>
                            <span className='block text-[11px] text-orange-700 font-medium'>Còn lại cần chi</span>
                            <span className='text-sm font-bold text-orange-700'>{formatNumber(remainingAmount)} đ</span>
                        </div>
                    </div>

                    {/* Progress track */}
                    <div className='space-y-1'>
                        <div className='flex justify-between text-[11px] text-stone-500'>
                            <span>Tiến độ thanh toán:</span>
                            <span className='font-semibold'>{paidPercent}%</span>
                        </div>
                        <div className='h-2.5 w-full rounded-full bg-stone-100 overflow-hidden'>
                            <div
                                className='h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300'
                                style={{ width: `${paidPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Chọn hình thức chi đợt này */}
                <div className='space-y-2'>
                    <label className={labelCls}>
                        Số tiền chi đợt này <span className='text-red-500'>*</span>
                    </label>
                    <div className='grid grid-cols-2 gap-2'>
                        <button
                            type='button'
                            onClick={() => { setPayMode('FULL'); setPaidAmountThisTime(''); setError(''); }}
                            className={cn(
                                'rounded-xl border p-3 text-left transition',
                                payMode === 'FULL'
                                    ? 'border-gray-500 bg-orange-50/60 ring-2 ring-orange-400 text-orange-950 font-medium'
                                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                            )}
                        >
                            <span className='block text-xs font-bold'>Chi toàn bộ còn lại</span>
                            <span className='text-sm font-extrabold text-orange-600 mt-0.5 block'>
                                {formatNumber(remainingAmount)} đ
                            </span>
                            <span className='text-[10px] text-stone-400 block mt-0.5'>Hoàn tất 100% yêu cầu</span>
                        </button>

                        <button
                            type='button'
                            onClick={() => { setPayMode('PARTIAL'); setError(''); }}
                            className={cn(
                                'rounded-xl border p-3 text-left transition',
                                payMode === 'PARTIAL'
                                    ? 'border-gray-500 bg-orange-50/60 ring-2 ring-orange-400 text-orange-950 font-medium'
                                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                            )}
                        >
                            <span className='block text-xs font-bold'>Chi một phần đợt này</span>
                            <span className='text-[11px] text-stone-500 mt-1 block leading-tight'>
                                Tùy chỉnh số tiền thanh toán từng đợt
                            </span>
                        </button>
                    </div>

                    {payMode === 'PARTIAL' && (
                        <div className='rounded-xl border border-gray-100 bg-orange-50/30 p-3 space-y-2 animate-in fade-in'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-stone-700'>Nhập số tiền đợt này:</span>
                                <button
                                    type='button'
                                    onClick={() => setPaidAmountThisTime(String(remainingAmount))}
                                    className='text-[11px] text-orange-600 hover:underline font-medium'
                                >
                                    Chi hết số còn lại ({formatNumber(remainingAmount)} đ)
                                </button>
                            </div>
                            <AmountInput
                                value={paidAmountThisTime}
                                onChange={(val) => { setPaidAmountThisTime(val); setError(''); }}
                                placeholder={`Tối đa ${formatNumber(remainingAmount)}`}
                            />
                            {Number(paidAmountThisTime) > remainingAmount && (
                                <p className='text-xs text-red-600 font-medium'>
                                    ⚠️ Vượt quá số tiền còn lại ({formatNumber(remainingAmount)} đ)
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Phương thức thanh toán */}
                <div className='space-y-2'>
                    <label className={labelCls}>
                        Hình thức thanh toán <span className='text-red-500'>*</span>
                    </label>
                    <div className='grid grid-cols-2 gap-2'>
                        <label className={cn(
                            'flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition',
                            paymentMethod === 'BANK_TRANSFER'
                                ? 'border-gray-500 bg-orange-50 text-orange-700 ring-1 ring-orange-400'
                                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        )}>
                            <input
                                type='radio'
                                name='paymentMethod'
                                value='BANK_TRANSFER'
                                checked={paymentMethod === 'BANK_TRANSFER'}
                                onChange={() => setPaymentMethod('BANK_TRANSFER')}
                                className='hidden'
                            />
                            💳 Chuyển khoản (UNC)
                        </label>
                        <label className={cn(
                            'flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition',
                            paymentMethod === 'CASH'
                                ? 'border-gray-500 bg-orange-50 text-orange-700 ring-1 ring-orange-400'
                                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        )}>
                            <input
                                type='radio'
                                name='paymentMethod'
                                value='CASH'
                                checked={paymentMethod === 'CASH'}
                                onChange={() => setPaymentMethod('CASH')}
                                className='hidden'
                            />
                            💵 Tiền mặt (Phiếu chi)
                        </label>
                    </div>

                    {paymentMethod === 'CASH' && (
                        <div className='rounded-xl border border-gray-200 bg-orange-50/50 p-3 space-y-2'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-xs font-semibold text-orange-900'>Phiếu chi tiền mặt (Mẫu 02-TT)</p>
                                    {cashVoucherInfo ? (
                                        <p className='text-xs text-stone-600 mt-0.5'>
                                            Số phiếu: <strong className='text-orange-700'>{cashVoucherInfo.voucherNo}</strong> · TK Nợ <strong>{cashVoucherInfo.debitAccount}</strong> / Có <strong>{cashVoucherInfo.creditAccount}</strong>
                                        </p>
                                    ) : (
                                        <p className='text-xs text-stone-500 mt-0.5'>Chưa lập phiếu chi tiền mặt. Vui lòng lập phiếu chi và in ra ký nhận.</p>
                                    )}
                                </div>
                                <button
                                    type='button'
                                    onClick={() => setIsCashVoucherOpen(true)}
                                    className='inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-orange-600'
                                >
                                    <Printer size={13} />
                                    {cashVoucherInfo ? 'Xem / Sửa phiếu chi' : 'Lập & In phiếu chi'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Tải lên minh chứng đã chi tiền */}
                <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                        <label className={labelCls}>
                            Chứng từ / Minh chứng đã chi <span className='text-red-500'>*</span>
                        </label>
                        <span className='text-[11px] text-stone-400'>
                            {paymentMethod === 'CASH' ? 'Scan/ảnh Phiếu chi đã ký' : 'Ủy nhiệm chi ngân hàng (UNC)'}
                        </span>
                    </div>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className='flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 bg-white p-4 text-center cursor-pointer hover:border-gray-400 hover:bg-orange-50/50 transition'
                    >
                        <Upload size={20} className='text-orange-500' />
                        <p className='text-xs text-stone-600'>
                            <span className='font-semibold text-orange-600'>Bấm để chọn</span> hoặc kéo thả file minh chứng (Ảnh, PDF tối đa 15MB)
                        </p>
                        <input
                            ref={fileInputRef}
                            type='file'
                            accept='image/*,application/pdf'
                            multiple
                            onChange={(e) => { handleFileSelected(e.target.files); e.target.value = ''; }}
                            className='hidden'
                        />
                    </div>

                    {proofFiles.length > 0 && (
                        <div className='space-y-1.5'>
                            {proofFiles.map((f) => (
                                <div key={f.publicId || f.url || f.tempId} className='flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs'>
                                    <div className={cn(
                                        'flex h-6 w-6 items-center justify-center rounded-md shrink-0',
                                        f.fileType === 'PDF' || f.name?.endsWith('.pdf') ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                    )}>
                                        {f.fileType === 'PDF' || f.name?.endsWith('.pdf') ? <FileIcon size={13} /> : <ImageIcon size={13} />}
                                    </div>
                                    <span className='min-w-0 flex-1 truncate font-medium text-stone-700'>{f.name}</span>
                                    {f.uploading ? (
                                        <Loader2 size={13} className='animate-spin text-stone-400 shrink-0' />
                                    ) : (
                                        <button
                                            type='button'
                                            onClick={() => handleRemoveFile(f)}
                                            className='text-stone-400 hover:text-red-600 shrink-0'
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 5. Ghi chú đợt chi */}
                <div>
                    <label className={labelCls}>
                        Ghi chú đợt chi <span className='text-stone-400 font-normal'>(tùy chọn)</span>
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder='Ví dụ: Chi đợt 1 (50%) cọc bối cảnh qua VCB...'
                        className={inputCls}
                    />
                </div>

                {/* 6. Bảng lịch sử các đợt chi trước đó */}
                {transactions.length > 0 && (
                    <div className='rounded-xl border border-stone-200 bg-stone-50/60 p-3 space-y-2'>
                        <div className='flex items-center gap-1.5 text-xs font-bold text-stone-700'>
                            <History size={14} className='text-orange-500' />
                            <span>Lịch sử các đợt chi tiền ({transactions.length} đợt)</span>
                        </div>
                        <div className='space-y-1.5'>
                            {transactions.map((tx, idx) => (
                                <div key={tx.id || idx} className='rounded-lg bg-white p-2.5 border border-stone-200/80 text-xs flex items-center justify-between'>
                                    <div>
                                        <div className='flex items-center gap-1.5'>
                                            <span className='font-bold text-stone-800'>Đợt {idx + 1}: {formatNumber(tx.amount)} đ</span>
                                            <span className='text-[10px] text-stone-400'>({tx.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'})</span>
                                        </div>
                                        <p className='text-[11px] text-stone-500 mt-0.5'>
                                            {tx.payerName ? `Người chi: ${tx.payerName} · ` : ''}
                                            {tx.paidAt ? formatDateToDDMMYYYY(tx.paidAt) : ''}
                                            {tx.note ? ` · ${tx.note}` : ''}
                                        </p>
                                    </div>
                                    {Array.isArray(tx.proofFiles) && tx.proofFiles.length > 0 && (
                                        <div className='flex items-center gap-1'>
                                            {tx.proofFiles.map((pf, pIdx) => (
                                                <a
                                                    key={pf.url || pIdx}
                                                    href={pf.url}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                    className='text-[11px] text-orange-600 hover:underline flex items-center gap-0.5 bg-orange-50 px-2 py-0.5 rounded'
                                                >
                                                    UNC {pIdx + 1} <ExternalLink size={10} />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <p className='flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600'>
                        <AlertCircle size={14} className='shrink-0' /> {error}
                    </p>
                )}
            </form>

            <div className='flex shrink-0 justify-end gap-3 border-t border-stone-100 bg-stone-50/60 px-5 py-3 sm:px-6'>
                <button type='button' onClick={onClose} className={btnSecondary}>
                    Hủy
                </button>
                <button
                    type='button'
                    disabled={isRecording || isUploadingProofs}
                    onClick={handleSubmit}
                    className={btnPrimary}
                >
                    {(isRecording || isUploadingProofs) && <Loader2 size={14} className='animate-spin' />}
                    Xác nhận chi {formatNumber(effectivePayAmount)} đ
                </button>
            </div>

            {isCashVoucherOpen && (
                <CashVoucherModal
                    request={{ ...request, amount: effectivePayAmount }}
                    initialVoucherInfo={cashVoucherInfo}
                    onSave={handleSaveCashVoucher}
                    onClose={() => setIsCashVoucherOpen(false)}
                />
            )}
        </ModalShell>
    );
};
