import { useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon, File as FileIcon, Loader2, Trash2, History, AlertCircle } from 'lucide-react';
import {
    useReviewPaymentRequestMutation,
    useBodDecidePaymentRequestMutation,
    usePayPaymentRequestMutation,
    useUpdatePaymentRequestMutation,
    useSubmitPaymentRequestMutation,
    useSupplementPaymentRequestMutation,
    useUploadPaymentRequestInvoiceFileMutation,
} from '../../api/paymentRequests';
import { formatCurrency, formatNumber, parseNumber } from '../../utils/format';
import { cn } from '../../utils/cn';

const canReview = (role) => ['ADMIN_SALE', 'BOD', 'ADMIN'].includes(role);
const canBodDecide = (role) => ['BOD', 'ADMIN'].includes(role);
const canPay = (role) => ['BOD', 'ADMIN', 'ADMIN_SALE'].includes(role);

const MAX_FILE_MB = 15;
const ACCEPTED_TYPES = ['image/', 'application/pdf'];

const HISTORY_ACTION_LABELS = {
    CREATED: 'Tạo yêu cầu',
    SUPPLEMENTED: 'Bổ sung hồ sơ',
    REVIEWED: 'Admin Sale duyệt',
    BOD_DECISION: 'BOD quyết định',
    PAID: 'Đã chi tiền',
};

// Hiển thị lịch sử thay đổi của yêu cầu (tạo mới, bổ sung, duyệt...) để không mất dấu vết
// mỗi lần người tạo bổ sung hồ sơ theo yêu cầu "Cần bổ sung".
const RequestHistory = ({ history }) => {
    if (!history || history.length === 0) return null;
    return (
        <div className='mt-5 border-t border-slate-100 pt-4'>
            <p className='mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700'>
                <History size={15} /> Lịch sử
            </p>
            <div className='space-y-3'>
                {[...history].reverse().map((h, idx) => (
                    <div key={idx} className='rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs'>
                        <div className='flex items-center justify-between'>
                            <span className='font-medium text-slate-700'>{HISTORY_ACTION_LABELS[h.action] || h.action}</span>
                            <span className='text-slate-400'>{h.at ? new Date(h.at).toLocaleString('vi-VN') : ''}</span>
                        </div>
                        {h.note && <p className='mt-1 text-slate-500'>Ghi chú: {h.note}</p>}
                        {h.snapshot && (
                            <p className='mt-1 text-slate-400'>
                                Nội dung trước đó: "{h.snapshot.content}" — {formatCurrency(h.snapshot.amount)} — hạn {h.snapshot.dueDate}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Khu vực cho phép người tạo BỔ SUNG hồ sơ khi yêu cầu ở trạng thái "Cần bổ sung".
// Lịch sử của lần gửi trước (nội dung/số tiền/hạn/hoá đơn cũ) được BE tự lưu lại,
// người dùng ở đây chỉ cần cập nhật thông tin mới và/hoặc đính kèm thêm hoá đơn.
const SupplementSection = ({ request, onDone }) => {
    const [content, setContent] = useState(request.content || '');
    const [amount, setAmount] = useState(request.amount || '');
    const [dueDate, setDueDate] = useState(request.confirmedDueDate || request.dueDate || '');
    const [note, setNote] = useState('');
    const [newFiles, setNewFiles] = useState([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const [uploadInvoiceFile] = useUploadPaymentRequestInvoiceFileMutation();
    const [supplement, { isLoading: isSupplementing }] = useSupplementPaymentRequestMutation();

    const isUploadingFiles = newFiles.some((f) => f.uploading);

    const handleFilesSelected = async (fileList) => {
        const files = Array.from(fileList || []);
        for (const file of files) {
            const isAccepted = ACCEPTED_TYPES.some((t) => file.type.startsWith(t));
            if (!isAccepted) {
                setError(`File "${file.name}" không phải ảnh hoặc PDF`);
                continue;
            }
            if (file.size > MAX_FILE_MB * 1024 * 1024) {
                setError(`File "${file.name}" vượt quá ${MAX_FILE_MB}MB`);
                continue;
            }
            const tempId = `${file.name}-${Date.now()}`;
            setNewFiles((prev) => [...prev, { name: file.name, size: file.size, uploading: true, tempId }]);
            try {
                const uploaded = await uploadInvoiceFile(file).unwrap();
                setNewFiles((prev) => prev.map((f) => (f.tempId === tempId ? { ...uploaded, uploading: false } : f)));
            } catch (err) {
                setNewFiles((prev) => prev.filter((f) => f.tempId !== tempId));
                setError(err?.data?.message || `Tải file "${file.name}" thất bại`);
            }
        }
    };

    const handleRemoveFile = (target) => {
        setNewFiles((prev) => prev.filter((f) => (f.publicId || f.url) !== (target.publicId || target.url)));
    };

    const handleSubmit = async () => {
        setError('');
        if (!content.trim() || !amount || !dueDate) {
            setError('Vui lòng nhập đầy đủ nội dung, số tiền và thời hạn thanh toán');
            return;
        }
        if (isUploadingFiles) {
            setError('Vui lòng đợi file hóa đơn tải lên xong');
            return;
        }
        const readyFiles = newFiles.filter((f) => !f.uploading);
        try {
            await supplement({
                id: request.id,
                content: content.trim(),
                amount: Number(amount),
                dueDate,
                note: note.trim() || undefined,
                addInvoiceImages: readyFiles.filter((f) => f.fileType === 'IMAGE'),
                addInvoicePdfs: readyFiles.filter((f) => f.fileType === 'PDF'),
            }).unwrap();
            onDone?.();
        } catch (err) {
            setError(err?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    return (
        <div className='mt-5 space-y-3 border-t border-slate-100 pt-4'>
            <p className='text-sm font-medium text-slate-700'>Bổ sung hồ sơ theo yêu cầu</p>
            <div>
                <label className='mb-1 block text-xs text-slate-500'>Nội dung</label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={2}
                    className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                />
            </div>
            <div className='grid grid-cols-2 gap-3'>
                <div>
                    <label className='mb-1 block text-xs text-slate-500'>Số tiền</label>
                    <input
                        type='text'
                        inputMode='numeric'
                        value={formatNumber(amount)}
                        onChange={(e) => setAmount(parseNumber(e.target.value))}
                        className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                    />
                </div>
                <div>
                    <label className='mb-1 block text-xs text-slate-500'>Thời hạn thanh toán</label>
                    <input
                        type='date'
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                    />
                </div>
            </div>
            <div>
                <label className='mb-1 block text-xs text-slate-500'>Đính kèm hoá đơn bổ sung (nếu có)</label>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className='flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 px-4 py-4 text-center hover:border-blue-300 hover:bg-slate-50'
                >
                    <Upload size={18} className='text-slate-400' />
                    <p className='text-xs text-slate-500'><span className='font-medium text-blue-600'>Chọn file</span> để bổ sung</p>
                    <input
                        ref={fileInputRef}
                        type='file'
                        accept='image/*,application/pdf'
                        multiple
                        onChange={(e) => { handleFilesSelected(e.target.files); e.target.value = ''; }}
                        className='hidden'
                    />
                </div>
                {newFiles.length > 0 && (
                    <div className='mt-2 space-y-2'>
                        {newFiles.map((f) => (
                            <div key={f.publicId || f.url || f.tempId} className='flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>
                                <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', f.fileType === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600')}>
                                    {f.fileType === 'PDF' ? <FileIcon size={14} /> : <ImageIcon size={14} />}
                                </div>
                                <p className='min-w-0 flex-1 truncate text-xs font-medium text-slate-700'>{f.name}</p>
                                {f.uploading ? <Loader2 size={14} className='animate-spin text-slate-400' /> : (
                                    <button type='button' onClick={() => handleRemoveFile(f)} className='text-slate-400 hover:text-red-600'>
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div>
                <label className='mb-1 block text-xs text-slate-500'>Ghi chú cho người duyệt (nếu có)</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder='VD: Đã bổ sung hoá đơn VAT theo yêu cầu'
                    className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                />
            </div>
            {error && (
                <p className='flex items-center gap-1.5 text-sm text-red-600'>
                    <AlertCircle size={14} /> {error}
                </p>
            )}
            <button
                disabled={isSupplementing || isUploadingFiles}
                onClick={handleSubmit}
                className='flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60'
            >
                {(isSupplementing || isUploadingFiles) && <Loader2 size={15} className='animate-spin' />}
                Gửi bổ sung
            </button>
        </div>
    );
};

// Khu vực cho phép người tạo xem lại/chỉnh sửa và GỬI DUYỆT yêu cầu đang ở trạng thái nháp.
// Áp dụng cả cho yêu cầu tự tạo thủ công lẫn yêu cầu "chi phí phát sinh" hệ thống tự tạo khi
// task được phân công cho vendor (isAutoGenerated) - lúc đó nội dung/số tiền đã được điền sẵn,
// người phụ trách chỉ cần kiểm tra lại rồi gửi duyệt.
const DraftSubmitSection = ({ request, onDone }) => {
    const [content, setContent] = useState(request.content || '');
    const [amount, setAmount] = useState(request.amount || '');
    const [dueDate, setDueDate] = useState(request.dueDate || '');
    const [error, setError] = useState('');

    const [updateRequest, { isLoading: isUpdating }] = useUpdatePaymentRequestMutation();
    const [submitRequest, { isLoading: isSubmitting }] = useSubmitPaymentRequestMutation();

    const isDirty = content.trim() !== (request.content || '') ||
        Number(amount) !== Number(request.amount) ||
        dueDate !== request.dueDate;

    const handleSubmit = async () => {
        setError('');
        if (!content.trim() || !amount || !dueDate) {
            setError('Vui lòng nhập đầy đủ nội dung, số tiền và thời hạn thanh toán');
            return;
        }
        try {
            if (isDirty) {
                await updateRequest({ id: request.id, content: content.trim(), amount: Number(amount), dueDate }).unwrap();
            }
            await submitRequest(request.id).unwrap();
            onDone?.();
        } catch (err) {
            setError(err?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    return (
        <div className='mt-5 space-y-3 border-t border-slate-100 pt-4'>
            <p className='text-sm font-medium text-slate-700'>
                {request.isAutoGenerated ? 'Kiểm tra lại thông tin trước khi gửi duyệt' : 'Yêu cầu đang ở dạng nháp'}
            </p>
            <div>
                <label className='mb-1 block text-xs text-slate-500'>Nội dung</label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={2}
                    className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                />
            </div>
            <div className='grid grid-cols-2 gap-3'>
                <div>
                    <label className='mb-1 block text-xs text-slate-500'>Số tiền</label>
                    <input
                        type='text'
                        inputMode='numeric'
                        value={formatNumber(amount)}
                        onChange={(e) => setAmount(parseNumber(e.target.value))}
                        className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                    />
                </div>
                <div>
                    <label className='mb-1 block text-xs text-slate-500'>Thời hạn thanh toán</label>
                    <input
                        type='date'
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                    />
                </div>
            </div>
            {error && (
                <p className='flex items-center gap-1.5 text-sm text-red-600'>
                    <AlertCircle size={14} /> {error}
                </p>
            )}
            <button
                disabled={isUpdating || isSubmitting}
                onClick={handleSubmit}
                className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60'
            >
                {(isUpdating || isSubmitting) && <Loader2 size={15} className='animate-spin' />}
                Gửi duyệt
            </button>
        </div>
    );
};

export const PaymentRequestDetailModal = ({ request, currentUserRole, currentUserId, onClose }) => {
    const [note, setNote] = useState('');
    const [bodReason, setBodReason] = useState('');
    const [confirmedDueDate, setConfirmedDueDate] = useState(request.confirmedDueDate || request.dueDate || '');
    const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
    const [paymentRef, setPaymentRef] = useState('');
    const [error, setError] = useState('');

    const [review, { isLoading: isReviewing }] = useReviewPaymentRequestMutation();
    const [bodDecide, { isLoading: isDeciding }] = useBodDecidePaymentRequestMutation();
    const [pay, { isLoading: isPaying }] = usePayPaymentRequestMutation();

    const run = async (fn) => {
        setError('');
        try {
            await fn();
        } catch (err) {
            setError(err?.data?.message || 'Có lỗi xảy ra');
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
            <div className='w-full max-w-xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto'>
                <div className='mb-4 flex items-center justify-between'>
                    <h2 className='text-lg font-semibold text-slate-800'>Chi tiết yêu cầu thanh toán</h2>
                    <button onClick={onClose} className='text-slate-400 hover:text-slate-700'><X size={20} /></button>
                </div>

                <div className='space-y-2 text-sm'>
                    <p><span className='text-slate-500'>Nội dung:</span> {request.content}</p>
                    <p><span className='text-slate-500'>Số tiền:</span> {formatCurrency(request.amount)}</p>
                    <p><span className='text-slate-500'>Thời hạn:</span> {request.confirmedDueDate || request.dueDate}</p>
                    {request.costPrice != null && (
                        <p><span className='text-slate-500'>Giá vốn công việc:</span> {formatCurrency(request.costPrice)}</p>
                    )}
                    {request.vendor?.name && (
                        <p><span className='text-slate-500'>Vendor:</span> {request.vendor.name}</p>
                    )}
                    {request.isAutoGenerated && (
                        <p className='text-xs italic text-slate-400'>Yêu cầu này được hệ thống tự tạo khi phân công công việc cho vendor. Vui lòng kiểm tra và gửi duyệt.</p>
                    )}
                    <p><span className='text-slate-500'>Người tạo:</span> {request.requester?.fullName || '-'}</p>
                    <p><span className='text-slate-500'>Trạng thái duyệt:</span> {request.approvalStatus}</p>
                    <p><span className='text-slate-500'>Trạng thái thanh toán:</span> {request.paymentStatus}</p>
                    {request.reviewNote && <p><span className='text-slate-500'>Ghi chú người duyệt:</span> {request.reviewNote}</p>}
                    {request.bodDecisionReason && <p><span className='text-slate-500'>Lý do BOD:</span> {request.bodDecisionReason}</p>}
                </div>

                {request.approvalStatus === 'DRAFT' && currentUserId === request.requesterId && (
                    <DraftSubmitSection request={request} onDone={onClose} />
                )}

                {request.approvalStatus === 'NEED_MORE_DOCS' && currentUserId === request.requesterId && (
                    <SupplementSection request={request} onDone={onClose} />
                )}

                {request.approvalStatus === 'PENDING_REVIEWER' && canReview(currentUserRole) && (
                    <div className='mt-5 space-y-2 border-t border-slate-100 pt-4'>
                        <p className='text-sm font-medium text-slate-700'>Admin Sale duyệt</p>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder='Ghi chú (nếu có)'
                            rows={2}
                            className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                        />
                        <div className='flex gap-2'>
                            <button
                                disabled={isReviewing}
                                onClick={() => run(() => review({ id: request.id, action: 'APPROVE', note }).unwrap())}
                                className='rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700'
                            >
                                Duyệt, trình BOD
                            </button>
                            <button
                                disabled={isReviewing}
                                onClick={() => run(() => review({ id: request.id, action: 'REQUEST_MORE_DOCS', note }).unwrap())}
                                className='rounded-lg bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600'
                            >
                                Yêu cầu bổ sung
                            </button>
                            <button
                                disabled={isReviewing}
                                onClick={() => run(() => review({ id: request.id, action: 'REJECT', note }).unwrap())}
                                className='rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700'
                            >
                                Từ chối
                            </button>
                        </div>
                    </div>
                )}

                {request.approvalStatus === 'PENDING_BOD' && canBodDecide(currentUserRole) && (
                    <div className='mt-5 space-y-2 border-t border-slate-100 pt-4'>
                        <p className='text-sm font-medium text-slate-700'>BOD xác nhận</p>
                        <div>
                            <label className='mb-1 block text-xs text-slate-500'>Xác nhận lại thời hạn thanh toán</label>
                            <input
                                type='date'
                                value={confirmedDueDate}
                                onChange={(e) => setConfirmedDueDate(e.target.value)}
                                className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                            />
                        </div>
                        <textarea
                            value={bodReason}
                            onChange={(e) => setBodReason(e.target.value)}
                            placeholder='Lý do (bắt buộc nếu từ chối)'
                            rows={2}
                            className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                        />
                        <div className='flex gap-2'>
                            <button
                                disabled={isDeciding}
                                onClick={() => run(() => bodDecide({ id: request.id, action: 'APPROVE', reason: bodReason, confirmedDueDate }).unwrap())}
                                className='rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700'
                            >
                                Xác nhận
                            </button>
                            <button
                                disabled={isDeciding}
                                onClick={() => run(() => bodDecide({ id: request.id, action: 'REJECT', reason: bodReason }).unwrap())}
                                className='rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700'
                            >
                                Từ chối
                            </button>
                        </div>
                    </div>
                )}

                {request.approvalStatus === 'APPROVED' && request.paymentStatus !== 'PAID' && canPay(currentUserRole) && (
                    <div className='mt-5 space-y-2 border-t border-slate-100 pt-4'>
                        <p className='text-sm font-medium text-slate-700'>Chi tiền</p>
                        <div className='flex gap-4 text-sm'>
                            <label className='flex items-center gap-2'>
                                <input type='radio' checked={paymentMethod === 'BANK_TRANSFER'} onChange={() => setPaymentMethod('BANK_TRANSFER')} />
                                Chuyển khoản (ủy nhiệm chi)
                            </label>
                            <label className='flex items-center gap-2'>
                                <input type='radio' checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} />
                                Tiền mặt (phiếu chi)
                            </label>
                        </div>
                        <input
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            placeholder={paymentMethod === 'BANK_TRANSFER' ? 'Link ủy nhiệm chi' : 'Số phiếu chi'}
                            className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                        />
                        <button
                            disabled={isPaying}
                            onClick={() => run(() => pay({
                                id: request.id,
                                paymentMethod,
                                bankPaymentOrderUrl: paymentMethod === 'BANK_TRANSFER' ? paymentRef : undefined,
                                cashVoucherNumber: paymentMethod === 'CASH' ? paymentRef : undefined,
                            }).unwrap())}
                            className='rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700'
                        >
                            Xác nhận đã chi
                        </button>
                    </div>
                )}

                {error && <p className='mt-3 text-sm text-red-600'>{error}</p>}

                <RequestHistory history={request.history} />
            </div>
        </div>
    );
};
