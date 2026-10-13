import { useState } from 'react';
import {
    ShieldCheck, AlertTriangle, AlertCircle, Check, Loader2,
    FileText, ExternalLink, Upload, Trash2, Image as ImageIcon,
    File as FileIcon, ArrowRight, CornerDownLeft
} from 'lucide-react';
import {
    useApproveSettlementPaymentRequestMutation,
    useRejectSettlementPaymentRequestMutation,
    useUploadPaymentRequestInvoiceFileMutation
} from '../../api/paymentRequests';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';
import { ModalShell, ModalHeader } from './PaymentRequestParts';
import { inputCls, labelCls, btnPrimary, btnSecondary, btnDanger } from './paymentRequestConfig';

const MAX_FILE_MB = 15;
const ACCEPTED_TYPES = ['image/', 'application/pdf'];

let reviewProofSeq = 0;
const createProofTempId = (name, idx) => `proof_${++reviewProofSeq}_${idx}_${name.replace(/[^a-zA-Z0-9]/g, '')}`;

export const PaymentSettlementReviewModal = ({ request, onClose, onSuccess }) => {
    const paidAmount = Math.round(Number(request?.paidAmount || request?.amount || 0));
    const settledAmount = Math.round(Number(request?.settledAmount || 0));
    const diff = settledAmount - paidAmount;

    const [refundConfirmed, setRefundConfirmed] = useState(false);
    const [refundPaymentMethod, setRefundPaymentMethod] = useState('BANK_TRANSFER');
    const [refundProofFiles, setRefundProofFiles] = useState([]);
    const [reviewNote, setReviewNote] = useState('');

    const [isRejectMode, setIsRejectMode] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [error, setError] = useState('');

    const [approveSettlement, { isLoading: isApproving }] = useApproveSettlementPaymentRequestMutation();
    const [rejectSettlement, { isLoading: isRejecting }] = useRejectSettlementPaymentRequestMutation();
    const [uploadInvoiceFile] = useUploadPaymentRequestInvoiceFileMutation();

    const isUploadingProofs = refundProofFiles.some((f) => f.uploading);

    const handleUploadRefundProof = async (fileList) => {
        const files = Array.from(fileList || []);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const isAccepted = ACCEPTED_TYPES.some((t) => file.type.startsWith(t)) || file.name.match(/\.(jpe?g|png|webp|gif|pdf)$/i);
            if (!isAccepted) {
                setError(`File "${file.name}" không hợp lệ (hỗ trợ Ảnh hoặc PDF)`);
                continue;
            }
            if (file.size > MAX_FILE_MB * 1024 * 1024) {
                setError(`File "${file.name}" vượt quá ${MAX_FILE_MB}MB`);
                continue;
            }

            const tempId = createProofTempId(file.name, i);
            setRefundProofFiles((prev) => [...prev, { name: file.name, size: file.size, uploading: true, tempId }]);

            try {
                const uploaded = await uploadInvoiceFile(file).unwrap();
                setRefundProofFiles((prev) => prev.map((f) => (f.tempId === tempId ? { ...uploaded, uploading: false } : f)));
                setError('');
            } catch (err) {
                setRefundProofFiles((prev) => prev.filter((f) => f.tempId !== tempId));
                setError(err?.data?.message || `Tải file "${file.name}" thất bại`);
            }
        }
    };

    const handleRemoveProof = (target) => {
        setRefundProofFiles((prev) =>
            prev.filter((f) => (f.publicId || f.url || f.tempId) !== (target.publicId || target.url || target.tempId))
        );
    };

    const handleApprove = async () => {
        setError('');

        if (diff !== 0 && !refundConfirmed) {
            const msg = diff > 0
                ? `Vui lòng xác nhận Kế toán đã chi bù đủ ${formatNumber(diff)} đ trước khi duyệt`
                : `Vui lòng xác nhận Kế toán đã thu đủ ${formatNumber(Math.abs(diff))} đ tiền thừa về quỹ trước khi duyệt`;
            setError(msg);
            return;
        }

        if (diff > 0) {
            if (isUploadingProofs) {
                setError('Vui lòng đợi file chứng từ chi bù tải lên hoàn tất');
                return;
            }
            const readyProofs = refundProofFiles.filter((f) => !f.uploading);
            if (readyProofs.length === 0) {
                setError('Bắt buộc tải lên ít nhất 1 chứng từ chi bù (Ủy nhiệm chi hoặc Phiếu chi đã ký)');
                return;
            }
        }

        try {
            await approveSettlement({
                id: request.id,
                refundConfirmed: Boolean(refundConfirmed),
                refundPaymentMethod: diff > 0 ? refundPaymentMethod : undefined,
                refundProofFiles: diff > 0 ? refundProofFiles.filter((f) => !f.uploading) : undefined,
                note: reviewNote.trim() || undefined
            }).unwrap();

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err?.data?.message || 'Có lỗi xảy ra khi duyệt quyết toán');
        }
    };

    const handleReject = async () => {
        setError('');
        if (!rejectReason.trim()) {
            setError('Vui lòng nhập lý do yêu cầu làm lại hồ sơ quyết toán');
            return;
        }

        try {
            await rejectSettlement({
                id: request.id,
                reason: rejectReason.trim()
            }).unwrap();

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err?.data?.message || 'Có lỗi xảy ra khi từ chối quyết toán');
        }
    };

    const settlementFiles = Array.isArray(request?.settlementFiles) ? request.settlementFiles : [];

    return (
        <ModalShell onClose={onClose} maxWidth='max-w-2xl'>
            <ModalHeader
                icon={ShieldCheck}
                title='Xét duyệt quyết toán hoàn ứng'
                subtitle={`Phiếu #${request?.code || request?.id?.slice(0, 8)} · Người nộp: ${request?.requester?.fullName || 'Nhân sự'}`}
                onClose={onClose}
            />

            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6'>
                {/* 1. Đối soát tiền tạm ứng vs thực chi */}
                <div className='rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-4 space-y-3'>
                    <div className='grid grid-cols-3 gap-2 text-center'>
                        <div className='rounded-lg bg-white p-2.5 border border-stone-100 shadow-2xs'>
                            <span className='block text-[11px] text-stone-500'>Đã tạm ứng</span>
                            <span className='text-sm font-bold text-stone-900'>{formatNumber(paidAmount)} đ</span>
                        </div>
                        <div className='rounded-lg bg-white p-2.5 border border-stone-100 shadow-2xs'>
                            <span className='block text-[11px] text-stone-500'>Thực chi quyết toán</span>
                            <span className='text-sm font-bold text-stone-900'>{formatNumber(settledAmount)} đ</span>
                        </div>
                        <div className={cn(
                            'rounded-lg p-2.5 border shadow-2xs',
                            diff === 0 && 'bg-emerald-50/70 border-emerald-200 text-emerald-800',
                            diff > 0 && 'bg-amber-50/70 border-amber-200 text-amber-900',
                            diff < 0 && 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                        )}>
                            <span className='block text-[11px] font-medium'>
                                {diff === 0 ? 'Khớp 100%' : diff > 0 ? 'Chi bù' : 'Thu hồi quỹ'}
                            </span>
                            <span className='text-sm font-extrabold'>
                                {diff === 0 ? '0 đ' : diff > 0 ? `+${formatNumber(diff)} đ` : `-${formatNumber(Math.abs(diff))} đ`}
                            </span>
                        </div>
                    </div>

                    {/* Giải thích trạng thái sổ quỹ */}
                    <div className='text-xs text-stone-600 bg-stone-100/70 rounded-lg p-2.5 leading-relaxed'>
                        {diff === 0 && (
                            <p>✓ Khoản chi hoàn ứng khớp 100% với số tiền đã tạm ứng ban đầu. Sổ quỹ công ty tự động cân đối.</p>
                        )}
                        {diff > 0 && (
                            <p>⚠️ Nhân sự thực chi vượt tạm ứng <strong>{formatNumber(diff)} đ</strong>. Duyệt phiếu sẽ tự động ghi nhận một đợt chi bù vào sổ quỹ, bắt buộc có UNC/Phiếu chi bù.</p>
                        )}
                        {diff < 0 && (
                            <p>ℹ️ Nhân sự thực chi ít hơn tạm ứng, còn thừa <strong>{formatNumber(Math.abs(diff))} đ</strong>. Kế toán cần xác nhận đã thu hồi số tiền này về quỹ.</p>
                        )}
                    </div>
                </div>

                {/* 2. Hồ sơ chứng từ nhân sự đã nộp */}
                <div className='rounded-xl border border-stone-200 bg-white p-3.5 space-y-2.5'>
                    <div className='flex items-center justify-between'>
                        <span className='text-xs font-bold text-stone-800 flex items-center gap-1.5'>
                            <FileText size={14} className='text-orange-500' />
                            Hồ sơ chứng từ quyết toán do nhân sự nộp ({settlementFiles.length} file)
                        </span>
                    </div>

                    {settlementFiles.length === 0 ? (
                        <p className='text-xs text-stone-400 italic py-1'>Nhân sự chưa đính kèm file chứng từ nào.</p>
                    ) : (
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                            {settlementFiles.map((file, idx) => (
                                <a
                                    key={file.url || idx}
                                    href={file.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='flex items-center gap-2 rounded-lg border border-stone-200 p-2 text-xs hover:border-gray-300 hover:bg-orange-50/30 transition'
                                >
                                    <div className={cn(
                                        'flex h-7 w-7 items-center justify-center rounded shrink-0',
                                        file.fileType === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                    )}>
                                        {file.fileType === 'PDF' ? <FileIcon size={14} /> : <ImageIcon size={14} />}
                                    </div>
                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate font-medium text-stone-800' title={file.name}>{file.name}</p>
                                        <span className='text-[10px] text-stone-400'>{file.docType || 'Chứng từ'}</span>
                                    </div>
                                    <ExternalLink size={12} className='text-stone-400 shrink-0' />
                                </a>
                            ))}
                        </div>
                    )}

                    {request?.settlementNote && (
                        <div className='rounded-lg bg-stone-50 p-2.5 text-xs text-stone-700 border border-stone-200'>
                            <span className='font-semibold text-stone-500 block mb-0.5'>Ghi chú của nhân sự:</span>
                            {request.settlementNote}
                        </div>
                    )}
                </div>

                {/* 3. Xử lý Chênh lệch nghiệp vụ Kế toán (nếu diff !== 0) */}
                {!isRejectMode && diff !== 0 && (
                    <div className='rounded-xl border border-gray-200 bg-orange-50/40 p-4 space-y-3'>
                        <span className='text-xs font-bold text-stone-800 block'>
                            Xử lý chênh lệch quỹ ({diff > 0 ? `Chi bù ${formatNumber(diff)} đ` : `Thu hồi ${formatNumber(Math.abs(diff))} đ`})
                        </span>

                        {diff > 0 && (
                            <div className='space-y-3'>
                                <div>
                                    <label className={labelCls}>Hình thức chi bù <span className='text-red-500'>*</span></label>
                                    <div className='grid grid-cols-2 gap-2 mt-1'>
                                        <label className={cn(
                                            'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold',
                                            refundPaymentMethod === 'BANK_TRANSFER' ? 'border-gray-500 bg-orange-50 text-orange-700' : 'border-stone-200 bg-white text-stone-600'
                                        )}>
                                            <input
                                                type='radio'
                                                name='refundPaymentMethod'
                                                value='BANK_TRANSFER'
                                                checked={refundPaymentMethod === 'BANK_TRANSFER'}
                                                onChange={() => setRefundPaymentMethod('BANK_TRANSFER')}
                                                className='hidden'
                                            />
                                            💳 Chuyển khoản (UNC)
                                        </label>
                                        <label className={cn(
                                            'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold',
                                            refundPaymentMethod === 'CASH' ? 'border-gray-500 bg-orange-50 text-orange-700' : 'border-stone-200 bg-white text-stone-600'
                                        )}>
                                            <input
                                                type='radio'
                                                name='refundPaymentMethod'
                                                value='CASH'
                                                checked={refundPaymentMethod === 'CASH'}
                                                onChange={() => setRefundPaymentMethod('CASH')}
                                                className='hidden'
                                            />
                                            💵 Tiền mặt (Phiếu chi)
                                        </label>
                                    </div>
                                </div>

                                {/* Upload chứng từ chi bù */}
                                <div>
                                    <label className={labelCls}>Chứng từ chi bù ({formatNumber(diff)} đ) <span className='text-red-500'>*</span></label>
                                    <label className='flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 bg-white p-3 cursor-pointer hover:bg-orange-50/50 transition'>
                                        <Upload size={16} className='text-orange-500' />
                                        <span className='text-xs text-stone-600'>Bấm chọn file UNC / Phiếu chi bù</span>
                                        <input
                                            type='file'
                                            accept='image/*,application/pdf'
                                            multiple
                                            onChange={(e) => { handleUploadRefundProof(e.target.files); e.target.value = ''; }}
                                            className='hidden'
                                        />
                                    </label>
                                    {refundProofFiles.length > 0 && (
                                        <div className='mt-2 space-y-1.5'>
                                            {refundProofFiles.map((f) => (
                                                <div key={f.publicId || f.url || f.tempId} className='flex items-center justify-between rounded-lg border bg-white px-2.5 py-1.5 text-xs'>
                                                    <span className='truncate font-medium text-stone-700'>{f.name}</span>
                                                    {f.uploading ? <Loader2 size={13} className='animate-spin text-stone-400' /> : (
                                                        <button type='button' onClick={() => handleRemoveProof(f)} className='text-stone-400 hover:text-red-600'>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Checkbox xác nhận */}
                        <label className='flex items-start gap-2 pt-1 cursor-pointer'>
                            <input
                                type='checkbox'
                                checked={refundConfirmed}
                                onChange={(e) => setRefundConfirmed(e.target.checked)}
                                className='mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500'
                            />
                            <span className='text-xs font-semibold text-stone-800 leading-tight'>
                                {diff > 0 ? (
                                    <span>Tôi xác nhận Kế toán đã thực hiện chi bù <strong>{formatNumber(diff)} đ</strong> cho nhân sự theo đúng hồ sơ nghiệm thu.</span>
                                ) : (
                                    <span>Tôi xác nhận Kế toán đã thu đủ <strong>{formatNumber(Math.abs(diff))} đ</strong> tiền thừa về quỹ công ty.</span>
                                )}
                            </span>
                        </label>
                    </div>
                )}

                {/* Chế độ Từ chối / Yêu cầu làm lại */}
                {isRejectMode ? (
                    <div className='rounded-xl border border-red-200 bg-red-50/40 p-3.5 space-y-2 animate-in fade-in'>
                        <label className='text-xs font-bold text-red-800 flex items-center justify-between'>
                            <span>Lý do yêu cầu làm lại hồ sơ quyết toán <span className='text-red-500'>*</span></span>
                            <button
                                type='button'
                                onClick={() => setIsRejectMode(false)}
                                className='text-[11px] text-stone-500 hover:underline'
                            >
                                Quay lại duyệt
                            </button>
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                            placeholder='Nêu rõ chứng từ còn thiếu hoặc nội dung chi chưa hợp lý để nhân sự điều chỉnh và nộp lại...'
                            className={cn(inputCls, 'border-red-300 focus:border-red-500 bg-white')}
                        />
                    </div>
                ) : (
                    <div>
                        <label className={labelCls}>Ghi chú phê duyệt <span className='text-stone-400 font-normal'>(tùy chọn)</span></label>
                        <textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            rows={2}
                            placeholder='Ghi chú đối soát của kế toán...'
                            className={inputCls}
                        />
                    </div>
                )}

                {error && (
                    <p className='flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600'>
                        <AlertCircle size={14} className='shrink-0' /> {error}
                    </p>
                )}
            </div>

            <div className='flex shrink-0 justify-between items-center gap-3 border-t border-stone-100 bg-stone-50/60 px-5 py-3 sm:px-6'>
                <div>
                    {!isRejectMode ? (
                        <button
                            type='button'
                            onClick={() => { setIsRejectMode(true); setError(''); }}
                            className='inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline'
                        >
                            <AlertTriangle size={13} /> Yêu cầu làm lại hồ sơ
                        </button>
                    ) : (
                        <button
                            type='button'
                            onClick={() => { setIsRejectMode(false); setError(''); }}
                            className='text-xs text-stone-500 hover:underline'
                        >
                            Hủy từ chối
                        </button>
                    )}
                </div>

                <div className='flex items-center gap-2'>
                    <button type='button' onClick={onClose} className={btnSecondary}>
                        Đóng
                    </button>
                    {isRejectMode ? (
                        <button
                            type='button'
                            disabled={isRejecting}
                            onClick={handleReject}
                            className={btnDanger}
                        >
                            {isRejecting && <Loader2 size={14} className='animate-spin' />}
                            Gửi yêu cầu làm lại
                        </button>
                    ) : (
                        <button
                            type='button'
                            disabled={isApproving || isUploadingProofs}
                            onClick={handleApprove}
                            className={btnPrimary}
                        >
                            {(isApproving || isUploadingProofs) && <Loader2 size={14} className='animate-spin' />}
                            Duyệt quyết toán
                        </button>
                    )}
                </div>
            </div>
        </ModalShell>
    );
};
