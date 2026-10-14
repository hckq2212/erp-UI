import { useState } from 'react';
import {
    Receipt, FileSignature, ClipboardList, FileText, Upload,
    Trash2, AlertCircle, Loader2, Check, Info, ArrowRight, ArrowDownLeft,
    Image as ImageIcon, File as FileIcon
} from 'lucide-react';
import {
    useSubmitSettlementPaymentRequestMutation,
    useUploadPaymentRequestInvoiceFileMutation
} from '../../api/paymentRequests';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';
import { formatDateToDDMMYYYY } from '../../utils/format';
import { ModalShell, ModalHeader, AmountInput } from './PaymentRequestParts';
import { inputCls, labelCls, btnPrimary, btnSecondary } from './paymentRequestConfig';

const MAX_FILE_MB = 15;
const ACCEPTED_TYPES = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

let settleFileSeq = 0;
const createSettleTempId = (name, idx) => `settle_${++settleFileSeq}_${idx}_${name.replace(/[^a-zA-Z0-9]/g, '')}`;

export const PaymentSettlementModal = ({ request, onClose, onSuccess }) => {
    const paidAmount = Math.round(Number(request?.paidAmount || request?.amount || 0));

    const [settledAmount, setSettledAmount] = useState(
        request?.settledAmount ? String(request.settledAmount) : String(paidAmount)
    );
    const [settlementNote, setSettlementNote] = useState(request?.settlementNote || '');
    const [attachedFiles, setAttachedFiles] = useState(request?.settlementFiles || []);
    const [error, setError] = useState('');

    const [submitSettlement, { isLoading: isSubmitting }] = useSubmitSettlementPaymentRequestMutation();
    const [uploadInvoiceFile] = useUploadPaymentRequestInvoiceFileMutation();

    const numSettled = Number(settledAmount) || 0;
    const diff = numSettled - paidAmount;

    const isUploadingFiles = attachedFiles.some((f) => f.uploading);

    const handleUploadForDocType = async (fileList, docType) => {
        const rawFiles = Array.from(fileList || []);
        if (!rawFiles.length) return;

        for (let i = 0; i < rawFiles.length; i++) {
            const file = rawFiles[i];
            const isExtValid = file.name.match(/\.(jpe?g|png|webp|gif|pdf|doc|docx)$/i);
            const isTypeValid = ACCEPTED_TYPES.some((t) => file.type.startsWith(t)) || isExtValid;
            if (!isTypeValid) {
                setError(`File "${file.name}" không hợp lệ (hỗ trợ Ảnh, PDF hoặc Word .doc/.docx)`);
                continue;
            }
            if (file.size > MAX_FILE_MB * 1024 * 1024) {
                setError(`File "${file.name}" vượt quá ${MAX_FILE_MB}MB`);
                continue;
            }

            const isDoc = Boolean(file.name.match(/\.(doc|docx)$/i) || file.type.includes('word'));
            const isPdf = Boolean(file.name.match(/\.pdf$/i) || file.type.includes('pdf'));
            const inferredFileType = isPdf ? 'PDF' : (isDoc ? 'DOC' : 'IMAGE');

            const fileId = createSettleTempId(file.name, i);
            const tempId = fileId;

            setAttachedFiles((prev) => [
                ...prev,
                {
                    id: fileId,
                    name: file.name,
                    originalName: file.name,
                    size: file.size,
                    fileType: inferredFileType,
                    uploading: true,
                    tempId,
                    docType,
                }
            ]);

            try {
                const uploaded = await uploadInvoiceFile(file).unwrap();
                setAttachedFiles((prev) =>
                    prev.map((f) => (f.tempId === tempId ? {
                        ...uploaded,
                        id: fileId,
                        tempId,
                        name: file.name,
                        originalName: file.name,
                        docType,
                        uploading: false,
                    } : f))
                );
                setError('');
            } catch (err) {
                setAttachedFiles((prev) => prev.filter((f) => f.tempId !== tempId));
                setError(err?.data?.message || `Tải file "${file.name}" thất bại`);
            }
        }
    };

    const handleRemoveFile = (target) => {
        setAttachedFiles((prev) =>
            prev.filter((f) => (f.publicId || f.url || f.tempId || f.id) !== (target.publicId || target.url || target.tempId || target.id))
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isNaN(numSettled) || numSettled < 0) {
            setError('Vui lòng nhập tổng tiền thực chi hợp lệ (không được âm)');
            return;
        }

        if (isUploadingFiles) {
            setError('Vui lòng đợi file tải lên hoàn tất trước khi nộp');
            return;
        }

        const readyFiles = attachedFiles.filter((f) => !f.uploading);
        if (readyFiles.length === 0) {
            setError('Vui lòng tải lên ít nhất 1 chứng từ quyết toán (Biên bản nghiệm thu, Hóa đơn hoặc Hợp đồng)');
            return;
        }

        const expenseFiles = readyFiles.filter((f) => f.docType !== 'REFUND_PROOF');
        const refundProofFiles = readyFiles.filter((f) => f.docType === 'REFUND_PROOF');

        if (numSettled > 0 && expenseFiles.length === 0) {
            setError('Bạn có phát sinh thực chi nhưng chưa tải lên chứng từ chi phí thực tế (Biên bản nghiệm thu, Hóa đơn VAT, Hợp đồng...). Vui lòng tải lên ít nhất 1 chứng từ chi phí ở các mục 1 đến 5.');
            return;
        }

        if (diff < 0 && refundProofFiles.length === 0) {
            setError(`Bạn đang có số tiền thừa cần hoàn ứng là ${formatNumber(Math.abs(diff))} đ. Bắt buộc phải tải lên "6. Minh chứng hoàn ứng" (Bill chuyển khoản hoặc phiếu nộp tiền thừa) trước khi nộp.`);
            return;
        }

        if (numSettled === 0 && refundProofFiles.length === 0) {
            setError('Không phát sinh thực chi. Bắt buộc phải tải lên "6. Minh chứng hoàn ứng" (Bill chuyển khoản hoàn trả 100% tiền tạm ứng về quỹ công ty).');
            return;
        }

        try {
            await submitSettlement({
                id: request.id,
                settledAmount: numSettled,
                settlementFiles: readyFiles,
                settlementNote: settlementNote.trim() || undefined
            }).unwrap();

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err?.data?.message || 'Có lỗi xảy ra khi nộp hồ sơ quyết toán');
        }
    };

    const renderDocSection = (title, icon, docType, hint) => {
        const docFiles = attachedFiles.filter((f) => f.docType === docType);
        const isRefundDoc = docType === 'REFUND_PROOF';
        const isHighlight = isRefundDoc && diff < 0;

        return (
            <div className={cn(
                'rounded-xl border p-3 space-y-2 transition',
                isHighlight
                    ? 'border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-200 shadow-2xs'
                    : 'border-stone-200 bg-white'
            )}>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <div className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg shrink-0',
                            isHighlight ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-600'
                        )}>
                            {icon}
                        </div>
                        <div>
                            <span className={cn('text-xs font-bold', isHighlight ? 'text-indigo-900' : 'text-stone-800')}>{title}</span>
                            <span className='ml-1.5 text-[11px] text-stone-400'>({docFiles.length} file)</span>
                            {isHighlight && (
                                docFiles.length === 0 ? (
                                    <span className='ml-2 inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700'>
                                        Bắt buộc khi thừa tiền
                                    </span>
                                ) : (
                                    <span className='ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700'>
                                        ✓ Đã đính kèm
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                    <label className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer',
                        isHighlight
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-gray-300 hover:bg-orange-50 hover:text-orange-600'
                    )}>
                        <Upload size={12} /> Tải file
                        <input
                            type='file'
                            accept='image/*,application/pdf,.doc,.docx'
                            multiple
                            onChange={(e) => { handleUploadForDocType(e.target.files, docType); e.target.value = ''; }}
                            className='hidden'
                        />
                    </label>
                </div>
                {hint && <p className='text-[10px] text-stone-400 leading-tight'>{hint}</p>}
                {docFiles.length > 0 && (
                    <div className='space-y-1.5 pt-1'>
                        {docFiles.map((f) => (
                            <div key={f.publicId || f.url || f.tempId || f.id} className='flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs'>
                                <div className={cn(
                                    'flex h-6 w-6 items-center justify-center rounded shrink-0',
                                    f.fileType === 'PDF' ? 'bg-red-100 text-red-600' : f.fileType === 'DOC' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                )}>
                                    {f.fileType === 'PDF' ? <FileIcon size={12} /> : <ImageIcon size={12} />}
                                </div>
                                <span className='min-w-0 flex-1 truncate font-medium text-stone-700'>{f.name}</span>
                                {f.uploading ? (
                                    <Loader2 size={12} className='animate-spin text-stone-400' />
                                ) : (
                                    <button type='button' onClick={() => handleRemoveFile(f)} className='text-stone-400 hover:text-red-600'>
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const readyFiles = attachedFiles.filter((f) => !f.uploading);
    const expenseFiles = readyFiles.filter((f) => f.docType !== 'REFUND_PROOF');
    const refundProofFiles = readyFiles.filter((f) => f.docType === 'REFUND_PROOF');
    const isMissingProof =
        readyFiles.length === 0 ||
        (numSettled > 0 && expenseFiles.length === 0) ||
        ((diff < 0 || numSettled === 0) && refundProofFiles.length === 0);

    return (
        <ModalShell onClose={onClose} maxWidth='max-w-2xl'>
            <ModalHeader
                icon={Receipt}
                title='Nộp hồ sơ quyết toán hoàn ứng'
                subtitle={`Phiếu #${request?.code || request?.id?.slice(0, 8)} · Tạm ứng sản xuất`}
                onClose={onClose}
            />

            <form onSubmit={handleSubmit} className='flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6'>
                {/* 1. Tổng quan số tiền tạm ứng & thực chi */}
                <div className='rounded-xl border border-gray-200 bg-orange-50/50 p-4 space-y-3'>
                    <div className='grid grid-cols-2 gap-3 text-center'>
                        <div className='rounded-lg bg-white p-3 border border-gray-100 shadow-2xs'>
                            <span className='block text-xs text-stone-500'>Đã tạm ứng</span>
                            <span className='text-base font-bold text-stone-900'>{formatNumber(paidAmount)} đ</span>
                        </div>
                        <div className='rounded-lg bg-white p-3 border border-gray-100 shadow-2xs'>
                            <span className='block text-xs text-stone-500'>Hạn hoàn ứng</span>
                            <span className='text-base font-bold text-indigo-700'>
                                {request?.settlementDueDate ? formatDateToDDMMYYYY(request.settlementDueDate) : 'Chưa đặt'}
                            </span>
                        </div>
                    </div>

                    {/* Ô nhập Tổng thực chi */}
                    <div className='space-y-1.5 pt-1'>
                        <label className={labelCls}>
                            Tổng số tiền thực chi thực tế <span className='text-red-500'>*</span>
                        </label>
                        <AmountInput
                            value={settledAmount}
                            onChange={(val) => { setSettledAmount(val); setError(''); }}
                            placeholder='0'
                        />
                    </div>

                    {/* Box chênh lệch real-time */}
                    <div className={cn(
                        'rounded-xl p-3 text-xs border transition flex items-start gap-2.5',
                        diff === 0 && 'bg-emerald-50 border-emerald-200 text-emerald-900',
                        diff > 0 && 'bg-amber-50 border-amber-200 text-amber-950',
                        diff < 0 && 'bg-indigo-50 border-indigo-200 text-indigo-950'
                    )}>
                        <Info size={16} className='shrink-0 mt-0.5' />
                        <div className='min-w-0 flex-1 space-y-0.5'>
                            {diff === 0 && (
                                <>
                                    <p className='font-bold text-emerald-800'>✓ Khớp 100% số tiền đã tạm ứng</p>
                                    <p className='text-emerald-700'>Thực chi bằng đúng số tiền đã tạm ứng ({formatNumber(paidAmount)} đ), không phát sinh chênh lệch.</p>
                                </>
                            )}
                            {diff > 0 && (
                                <>
                                    <p className='font-bold text-amber-900'>⚠️ Chi vượt tạm ứng {formatNumber(diff)} đ (Công ty chi bù)</p>
                                    <p className='text-amber-800 leading-relaxed'>
                                        Thực chi ({formatNumber(numSettled)} đ) lớn hơn tiền tạm ứng ({formatNumber(paidAmount)} đ). Sau khi duyệt hồ sơ, Kế toán sẽ thực hiện chi bù <strong>{formatNumber(diff)} đ</strong> cho bạn.
                                    </p>
                                </>
                            )}
                            {diff < 0 && (
                                <>
                                    <p className='font-bold text-indigo-900'>ℹ️ Thừa tiền tạm ứng {formatNumber(Math.abs(diff))} đ (Hoàn tiền về quỹ)</p>
                                    <p className='text-indigo-800 leading-relaxed'>
                                        Thực chi ({formatNumber(numSettled)} đ) ít hơn tiền tạm ứng ({formatNumber(paidAmount)} đ). Bạn cần nộp lại <strong>{formatNumber(Math.abs(diff))} đ</strong> thừa về quỹ công ty cho Kế toán và tải ảnh Bill chuyển khoản / Phiếu nộp tiền vào mục <strong>6. Minh chứng hoàn ứng</strong> bên dưới.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Bộ hồ sơ chứng từ */}
                <div className='space-y-2.5'>
                    <div className='flex items-center justify-between'>
                        <label className={labelCls}>
                            Bộ hồ sơ chứng từ quyết toán <span className='text-red-500'>*</span>
                        </label>
                        <span className='text-[11px] text-stone-400'>Tổng {attachedFiles.length} file</span>
                    </div>

                    {renderDocSection('1. Biên bản nghiệm thu', <ClipboardList size={14} />, 'ACCEPTANCE_MINUTE', 'Bắt buộc khi bàn giao kết quả khoán việc hoặc công việc sản xuất')}
                    {renderDocSection('2. Hóa đơn VAT', <Receipt size={14} />, 'VAT_INVOICE', 'Hóa đơn tài chính từ bên cung ứng / vendor pháp nhân (nếu có)')}
                    {renderDocSection('3. Hợp đồng khoán việc', <FileSignature size={14} />, 'LABOR_CONTRACT', 'Hợp đồng khoán việc ký kết với nhân sự/talent thực hiện')}
                    {renderDocSection('4. Phụ lục phát sinh', <FileText size={14} />, 'ADDENDUM', 'Phụ lục hợp đồng hoặc tài liệu chứng minh chi phí phát sinh ngoài dự kiến')}
                    {renderDocSection('5. Các hóa đơn khác', <Receipt size={14} />, 'OTHER_INVOICE', 'Hóa đơn bán lẻ, biên lai thu tiền hoặc các chứng từ chi khác (nếu có)')}
                    {renderDocSection(
                        '6. Minh chứng hoàn ứng',
                        <ArrowDownLeft size={14} />,
                        'REFUND_PROOF',
                        diff < 0
                            ? 'Bắt buộc tải lên Bill chuyển khoản hoặc phiếu nộp tiền hoàn trả tiền thừa về tài khoản quỹ công ty'
                            : 'Đính kèm ảnh Bill chuyển khoản hoàn trả tiền thừa về quỹ công ty (nếu có)'
                    )}
                </div>

                {/* 3. Ghi chú quyết toán */}
                <div>
                    <label className={labelCls}>
                        Ghi chú quyết toán <span className='text-stone-400 font-normal'>(tùy chọn)</span>
                    </label>
                    <textarea
                        value={settlementNote}
                        onChange={(e) => setSettlementNote(e.target.value)}
                        rows={2}
                        placeholder='Nêu rõ chi tiết các khoản chi, lý do phát sinh chênh lệch (nếu có)...'
                        className={inputCls}
                    />
                </div>

                {isMissingProof && !error && (
                    <div className='flex items-start gap-2 rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-xs text-amber-900'>
                        <AlertCircle size={15} className='shrink-0 text-amber-600 mt-0.5' />
                        <div className='space-y-0.5'>
                            <p className='font-bold'>Chưa đủ hồ sơ minh chứng bắt buộc:</p>
                            <p className='text-amber-800 leading-relaxed'>
                                {numSettled > 0 && expenseFiles.length === 0
                                    ? '• Cần ít nhất 1 chứng từ chi phí thực tế (Biên bản nghiệm thu, Hóa đơn VAT, Hợp đồng khoán việc...)'
                                    : (diff < 0 || numSettled === 0) && refundProofFiles.length === 0
                                    ? '• Cần đính kèm "6. Minh chứng hoàn ứng" (Bill chuyển khoản nộp lại tiền thừa về quỹ)'
                                    : '• Vui lòng tải lên chứng từ quyết toán'}
                            </p>
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
                    disabled={isSubmitting || isUploadingFiles || isMissingProof}
                    onClick={handleSubmit}
                    className={btnPrimary}
                >
                    {(isSubmitting || isUploadingFiles) && <Loader2 size={14} className='animate-spin' />}
                    Nộp hồ sơ quyết toán
                </button>
            </div>
        </ModalShell>
    );
};
