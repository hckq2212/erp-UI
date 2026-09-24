import { useRef, useState } from 'react';
import {
    Upload, Image as ImageIcon, File as FileIcon, Loader2, Trash2, History, AlertCircle,
    Wallet, Store, Check, Paperclip, ExternalLink, Ban, Landmark, Banknote, Info,
} from 'lucide-react';
import {
    useReviewPaymentRequestMutation,
    useBodDecidePaymentRequestMutation,
    usePayPaymentRequestMutation,
    useCancelPaymentRequestMutation,
    useUpdatePaymentRequestMutation,
    useSubmitPaymentRequestMutation,
    useSupplementPaymentRequestMutation,
    useUploadPaymentRequestInvoiceFileMutation,
} from '../../api/paymentRequests';
import { formatCurrency } from '../../utils/format';
import { cn } from '../../utils/cn';
import { ModalShell, ModalHeader, StatusBadge, AmountInput } from './PaymentRequestParts';
import {
    APPROVAL_LABELS, APPROVAL_TONE, PAYMENT_LABELS, PAYMENT_TONE,
    TYPE_LABELS, isVendorRequest, fmtDate, inputCls, labelCls,
    btnPrimary, btnSecondary, btnWarnOutline, btnDangerOutline,
} from './paymentRequestConfig';

const canReview = (role) => ['ADMIN_SALE', 'BOD', 'ADMIN'].includes(role);
const canBodDecide = (role) => ['BOD', 'ADMIN'].includes(role);
const canPay = (role) => ['BOD', 'ADMIN', 'ADMIN_SALE'].includes(role);
const canCancelApproved = (role) => ['BOD', 'ADMIN'].includes(role);

const MAX_FILE_MB = 15;
const ACCEPTED_TYPES = ['image/', 'application/pdf'];

const HISTORY_ACTION_LABELS = {
    CREATED: 'Tạo yêu cầu',
    SUBMITTED: 'Gửi duyệt',
    SUPPLEMENTED: 'Bổ sung hồ sơ',
    REVIEWED: 'Admin Sale duyệt',
    BOD_DECISION: 'BOD quyết định',
    PAID: 'Đã chi tiền',
    CANCELLED: 'Đã hủy',
};

// ---------- Khối nhỏ dùng lại ----------

const Section = ({ title, icon: Icon, children, tone = 'plain' }) => (
    <section
        className={cn(
            'rounded-xl border p-4',
            tone === 'action' ? 'border-orange-200 bg-orange-50/60' : 'border-stone-200 bg-white'
        )}
    >
        <h3 className='mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800'>
            {Icon && <Icon size={15} className='text-orange-500' />}
            {title}
        </h3>
        {children}
    </section>
);

const InfoItem = ({ label, children }) => (
    <div className='min-w-0'>
        <dt className='text-xs text-stone-400'>{label}</dt>
        <dd className='mt-0.5 break-words text-sm font-medium text-stone-800'>{children}</dd>
    </div>
);

const ErrorLine = ({ children }) =>
    children ? (
        <p className='flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600'>
            <AlertCircle size={14} className='shrink-0' /> {children}
        </p>
    ) : null;

// Tiến trình duyệt: Tạo -> Admin Sale -> BOD -> Thanh toán.
const STEPS = ['Tạo yêu cầu', 'Admin Sale duyệt', 'BOD xác nhận', 'Thanh toán'];

const getStepIndex = (request) => {
    switch (request.approvalStatus) {
        case 'DRAFT': return 0;
        case 'PENDING_REVIEWER':
        case 'NEED_MORE_DOCS': return 1;
        case 'PENDING_BOD': return 2;
        case 'APPROVED': return request.paymentStatus === 'PAID' ? 4 : 3;
        default: return -1; // REJECTED / CANCELLED: kết thúc, không hiển thị tiến trình
    }
};

const ProgressSteps = ({ request }) => {
    const current = getStepIndex(request);
    if (current < 0) return null;
    const needDocs = request.approvalStatus === 'NEED_MORE_DOCS';
    return (
        <ol className='flex items-start'>
            {STEPS.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <li key={label} className='relative flex flex-1 flex-col items-center text-center'>
                        {i > 0 && (
                            <span className={cn('absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2', i <= current ? 'bg-orange-400' : 'bg-stone-200')} />
                        )}
                        <span
                            className={cn(
                                'relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                                done && 'bg-orange-500 text-white',
                                active && 'bg-white text-orange-600 ring-2 ring-orange-500',
                                !done && !active && 'bg-stone-100 text-stone-400'
                            )}
                        >
                            {done ? <Check size={14} /> : i + 1}
                        </span>
                        <span className={cn('mt-1.5 px-1 text-[11px] leading-tight', active ? 'font-semibold text-orange-700' : 'text-stone-500')}>
                            {label}
                            {active && needDocs && <span className='block text-orange-600'>(cần bổ sung)</span>}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
};

const FileLinks = ({ files, icon: Icon, tone }) =>
    files.map((f, idx) => (
        <a
            key={`${f.url}-${idx}`}
            href={f.url}
            target='_blank'
            rel='noreferrer'
            className='group flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 transition hover:border-orange-300 hover:bg-orange-50/50'
        >
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', tone)}>
                <Icon size={15} />
            </span>
            <span className='min-w-0 flex-1 truncate text-sm text-stone-700'>{f.name || 'Tệp đính kèm'}</span>
            <ExternalLink size={14} className='shrink-0 text-stone-300 group-hover:text-orange-500' />
        </a>
    ));

const RequestHistory = ({ history }) => {
    if (!history || history.length === 0) return null;
    return (
        <Section title='Lịch sử' icon={History}>
            <ol className='relative space-y-4 border-l-2 border-orange-100 pl-5'>
                {[...history].reverse().map((h, idx) => (
                    <li key={idx} className='relative'>
                        <span className='absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-orange-400 ring-1 ring-orange-200' />
                        <div className='flex flex-wrap items-baseline justify-between gap-x-3'>
                            <span className='text-sm font-medium text-stone-800'>
                                {HISTORY_ACTION_LABELS[h.action] || h.action}
                                {h.byName && <span className='font-normal text-stone-500'> · {h.byName}</span>}
                            </span>
                            <span className='text-xs text-stone-400'>{h.at ? new Date(h.at).toLocaleString('vi-VN') : ''}</span>
                        </div>
                        {h.note && <p className='mt-1 text-xs text-stone-500'>Ghi chú: {h.note}</p>}
                        {h.snapshot && h.action !== 'CREATED' && (
                            <p className='mt-1 rounded-md bg-stone-50 px-2 py-1 text-xs text-stone-400'>
                                Nội dung trước đó: "{h.snapshot.content}" — {formatCurrency(h.snapshot.amount)} — hạn {fmtDate(h.snapshot.dueDate)}
                            </p>
                        )}
                    </li>
                ))}
            </ol>
        </Section>
    );
};

// Nội dung / số tiền / hạn — dùng chung cho form Nháp và form Bổ sung.
const RequestFields = ({ content, setContent, amount, setAmount, dueDate, setDueDate }) => (
    <>
        <div>
            <label className={labelCls}>Nội dung</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={2} className={inputCls} />
        </div>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div>
                <label className={labelCls}>Số tiền</label>
                <AmountInput value={amount} onChange={setAmount} />
            </div>
            <div>
                <label className={labelCls}>Thời hạn thanh toán</label>
                <input type='date' value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
        </div>
    </>
);

// ---------- Người tạo bổ sung hồ sơ (NEED_MORE_DOCS) ----------
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
        <Section title='Bổ sung hồ sơ theo yêu cầu' icon={Paperclip} tone='action'>
            <div className='space-y-3'>
                <RequestFields {...{ content, setContent, amount, setAmount, dueDate, setDueDate }} />
                <div>
                    <label className={labelCls}>Đính kèm hoá đơn bổ sung (nếu có)</label>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className='flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-orange-200 bg-white px-4 py-4 text-center hover:border-orange-400 hover:bg-orange-50'
                    >
                        <Upload size={18} className='text-orange-400' />
                        <p className='text-xs text-stone-500'><span className='font-semibold text-orange-600'>Chọn file</span> để bổ sung</p>
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
                                <div key={f.publicId || f.url || f.tempId} className='flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2'>
                                    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', f.fileType === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600')}>
                                        {f.fileType === 'PDF' ? <FileIcon size={14} /> : <ImageIcon size={14} />}
                                    </div>
                                    <p className='min-w-0 flex-1 truncate text-xs font-medium text-stone-700'>{f.name}</p>
                                    {f.uploading ? <Loader2 size={14} className='animate-spin text-stone-400' /> : (
                                        <button type='button' onClick={() => handleRemoveFile(f)} className='text-stone-400 hover:text-red-600'>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <label className={labelCls}>Ghi chú cho người duyệt (nếu có)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder='VD: Đã bổ sung hoá đơn VAT theo yêu cầu'
                        className={inputCls}
                    />
                </div>
                <ErrorLine>{error}</ErrorLine>
                <button disabled={isSupplementing || isUploadingFiles} onClick={handleSubmit} className={btnPrimary}>
                    {(isSupplementing || isUploadingFiles) && <Loader2 size={15} className='animate-spin' />}
                    Gửi bổ sung
                </button>
            </div>
        </Section>
    );
};

// ---------- Người tạo kiểm tra & gửi duyệt yêu cầu nháp ----------
// Áp dụng cả cho yêu cầu tự tạo và yêu cầu "chi phí phát sinh" hệ thống tự tạo khi giao task cho vendor.
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
        <Section
            title={request.isAutoGenerated ? 'Kiểm tra lại thông tin trước khi gửi duyệt' : 'Yêu cầu đang ở dạng nháp'}
            icon={Wallet}
            tone='action'
        >
            <div className='space-y-3'>
                <RequestFields {...{ content, setContent, amount, setAmount, dueDate, setDueDate }} />
                <ErrorLine>{error}</ErrorLine>
                <button disabled={isUpdating || isSubmitting} onClick={handleSubmit} className={btnPrimary}>
                    {(isUpdating || isSubmitting) && <Loader2 size={15} className='animate-spin' />}
                    Gửi duyệt
                </button>
            </div>
        </Section>
    );
};

// ---------- Modal chính ----------
export const PaymentRequestDetailModal = ({ request, currentUserRole, currentUserId, onClose }) => {
    const [note, setNote] = useState('');
    const [bodReason, setBodReason] = useState('');
    const [confirmedDueDate, setConfirmedDueDate] = useState(request.confirmedDueDate || request.dueDate || '');
    const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
    const [paymentRef, setPaymentRef] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [error, setError] = useState('');

    const [review, { isLoading: isReviewing }] = useReviewPaymentRequestMutation();
    const [bodDecide, { isLoading: isDeciding }] = useBodDecidePaymentRequestMutation();
    const [pay, { isLoading: isPaying }] = usePayPaymentRequestMutation();
    const [cancelRequest, { isLoading: isCancelling }] = useCancelPaymentRequestMutation();

    // Sau khi thao tác thành công thì đóng modal (đồng nhất với Gửi duyệt / Bổ sung),
    // để người dùng không bị "kẹt" trong modal và danh sách phía sau được làm mới.
    const run = async (fn) => {
        setError('');
        try {
            await fn();
            onClose();
        } catch (err) {
            setError(err?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const isVendor = isVendorRequest(request);
    const isRequester = currentUserId === request.requesterId;
    const invoiceImages = request.invoiceImages || [];
    const invoicePdfs = request.invoicePdfs || [];
    const isTerminal = ['REJECTED', 'CANCELLED'].includes(request.approvalStatus);
    const isPaid = request.paymentStatus === 'PAID';
    const dueDate = request.confirmedDueDate || request.dueDate;

    const isOwnPending = ['DRAFT', 'PENDING_REVIEWER', 'NEED_MORE_DOCS', 'PENDING_BOD'].includes(request.approvalStatus) && isRequester;
    const isApprovedUnpaid = request.approvalStatus === 'APPROVED' && !isPaid && canCancelApproved(currentUserRole);
    const showCancel = isOwnPending || isApprovedUnpaid;

    const handleCancel = () => {
        if (isApprovedUnpaid && !cancelReason.trim()) {
            setError('Vui lòng nhập lý do hủy');
            return;
        }
        if (!window.confirm('Bạn chắc chắn muốn hủy yêu cầu thanh toán này?')) return;
        run(() => cancelRequest({ id: request.id, reason: cancelReason }).unwrap());
    };

    return (
        <ModalShell onClose={onClose} maxWidth='max-w-2xl'>
            <ModalHeader
                icon={Wallet}
                title='Chi tiết yêu cầu thanh toán'
                onClose={onClose}
            >
                <span className='rounded-md bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700'>
                    {TYPE_LABELS[request.type] || request.type}
                </span>
                {isVendor && (
                    <span className='inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600'>
                        <Store size={12} /> Thuê vendor
                    </span>
                )}
                <StatusBadge label={APPROVAL_LABELS[request.approvalStatus] || request.approvalStatus} tone={APPROVAL_TONE[request.approvalStatus]} />
                {request.approvalStatus === 'APPROVED' && (
                    <StatusBadge label={PAYMENT_LABELS[request.paymentStatus] || request.paymentStatus} tone={PAYMENT_TONE[request.paymentStatus]} />
                )}
            </ModalHeader>

            <div className='flex-1 space-y-4 overflow-y-auto bg-stone-50/50 px-5 py-5 sm:px-6'>
                {/* Banner nổi bật cho công việc phát sinh chi phí */}
                {isVendor && (
                    <div className='overflow-hidden rounded-xl border border-l-4 border-orange-200 border-l-orange-400 bg-orange-50 text-stone-800'>
                        <div className='flex items-start gap-3 px-4 py-3.5'>
                            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600'>
                                <Store size={18} />
                            </span>
                            <div className='min-w-0 flex-1'>
                                <p className='text-sm font-semibold text-orange-700'>Công việc thuê vendor</p>
                                <p className='mt-0.5 text-xs text-stone-500'>
                                    {request.isAutoGenerated
                                        ? 'Hệ thống tự tạo khi công việc được giao cho vendor.'
                                        : 'Chi phí thuê vendor thực hiện công việc.'}
                                    {request.approvalStatus === 'DRAFT' && ' Vui lòng kiểm tra và gửi duyệt.'}
                                </p>
                                <dl className='mt-2.5 grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3'>
                                    <div>
                                        <dt className='text-stone-400'>Vendor</dt>
                                        <dd className='font-semibold text-stone-800'>{request.vendor?.name || '-'}</dd>
                                    </div>
                                    <div className='min-w-0'>
                                        <dt className='text-stone-400'>Công việc</dt>
                                        <dd className='truncate font-semibold text-stone-800'>{request.task?.name || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className='text-stone-400'>Giá vốn công việc</dt>
                                        <dd className='font-semibold text-stone-800'>{request.costPrice != null ? formatCurrency(request.costPrice) : '-'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                )}

                {/* Số tiền + hạn */}
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <div className='rounded-xl border border-orange-100 bg-white p-4'>
                        <p className='text-xs text-stone-400'>Số tiền yêu cầu</p>
                        <p className='mt-1 text-2xl font-bold tracking-tight text-orange-600'>{formatCurrency(request.amount)}</p>
                    </div>
                    <div className='rounded-xl border border-stone-200 bg-white p-4'>
                        <p className='text-xs text-stone-400'>
                            {request.confirmedDueDate ? 'Hạn thanh toán (BOD đã xác nhận)' : 'Hạn thanh toán'}
                        </p>
                        <p className={cn('mt-1 text-xl font-semibold', request.paymentStatus === 'OVERDUE' ? 'text-red-600' : 'text-stone-800')}>
                            {fmtDate(dueDate)}
                        </p>
                    </div>
                </div>

                {/* Tiến trình / kết quả cuối */}
                {isTerminal ? (
                    <div className={cn('flex items-start gap-3 rounded-xl border p-4', request.approvalStatus === 'REJECTED' ? 'border-red-200 bg-red-50' : 'border-stone-200 bg-stone-100')}>
                        <Ban size={18} className={cn('mt-0.5 shrink-0', request.approvalStatus === 'REJECTED' ? 'text-red-500' : 'text-stone-400')} />
                        <div className='text-sm'>
                            <p className='font-semibold text-stone-800'>
                                {request.approvalStatus === 'REJECTED' ? 'Yêu cầu đã bị từ chối' : 'Yêu cầu đã bị hủy'}
                            </p>
                            {(request.bodDecisionReason || request.reviewNote) && (
                                <p className='mt-0.5 text-stone-600'>Lý do: {request.bodDecisionReason || request.reviewNote}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <Section title='Tiến trình duyệt'>
                        <ProgressSteps request={request} />
                    </Section>
                )}

                {/* Thông tin chung */}
                <Section title='Thông tin' icon={Info}>
                    <p className='mb-3 whitespace-pre-line text-sm text-stone-700'>{request.content}</p>
                    <dl className='grid grid-cols-2 gap-x-4 gap-y-3 border-t border-stone-100 pt-3 sm:grid-cols-3'>
                        <InfoItem label='Người tạo'>{request.requester?.fullName || '-'}</InfoItem>
                        {request.project?.name && <InfoItem label='Dự án'>{request.project.name}</InfoItem>}
                        {!isVendor && request.task?.name && <InfoItem label='Công việc'>{request.task.name}</InfoItem>}
                        {request.reviewer?.fullName && <InfoItem label='Admin Sale duyệt'>{request.reviewer.fullName}</InfoItem>}
                        {request.bodDecisionBy?.fullName && <InfoItem label='BOD quyết định'>{request.bodDecisionBy.fullName}</InfoItem>}
                        {request.createdAt && <InfoItem label='Ngày tạo'>{fmtDate(request.createdAt)}</InfoItem>}
                    </dl>
                    {!isTerminal && request.reviewNote && (
                        <p className='mt-3 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800'>
                            <span className='font-semibold'>Ghi chú người duyệt:</span> {request.reviewNote}
                        </p>
                    )}
                    {!isTerminal && request.bodDecisionReason && (
                        <p className='mt-2 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800'>
                            <span className='font-semibold'>Lý do BOD:</span> {request.bodDecisionReason}
                        </p>
                    )}
                </Section>

                {/* Hóa đơn */}
                {(invoiceImages.length > 0 || invoicePdfs.length > 0) && (
                    <Section title={`Hóa đơn đính kèm (${invoiceImages.length + invoicePdfs.length})`} icon={Paperclip}>
                        <div className='space-y-2'>
                            <FileLinks files={invoiceImages} icon={ImageIcon} tone='bg-orange-100 text-orange-600' />
                            <FileLinks files={invoicePdfs} icon={FileIcon} tone='bg-red-100 text-red-600' />
                        </div>
                    </Section>
                )}

                {/* Thông tin đã chi */}
                {isPaid && (
                    <Section title='Thông tin thanh toán' icon={request.paymentMethod === 'CASH' ? Banknote : Landmark}>
                        <dl className='grid grid-cols-2 gap-x-4 gap-y-3'>
                            <InfoItem label='Hình thức'>{request.paymentMethod === 'CASH' ? 'Tiền mặt (phiếu chi)' : 'Chuyển khoản (ủy nhiệm chi)'}</InfoItem>
                            {request.paidAt && <InfoItem label='Ngày chi'>{fmtDate(request.paidAt)}</InfoItem>}
                            {request.cashVoucherNumber && <InfoItem label='Số phiếu chi'>{request.cashVoucherNumber}</InfoItem>}
                            {request.bankPaymentOrderUrl && (
                                <InfoItem label='Ủy nhiệm chi'>
                                    <a href={request.bankPaymentOrderUrl} target='_blank' rel='noreferrer' className='inline-flex items-center gap-1 text-orange-600 hover:underline'>
                                        Mở liên kết <ExternalLink size={12} />
                                    </a>
                                </InfoItem>
                            )}
                        </dl>
                    </Section>
                )}

                {/* ---- Khu vực thao tác ---- */}
                {request.approvalStatus === 'DRAFT' && isRequester && (
                    <DraftSubmitSection request={request} onDone={onClose} />
                )}

                {request.approvalStatus === 'NEED_MORE_DOCS' && isRequester && (
                    <SupplementSection request={request} onDone={onClose} />
                )}

                {request.approvalStatus === 'PENDING_REVIEWER' && canReview(currentUserRole) && (
                    <Section title='Admin Sale duyệt' tone='action'>
                        <div className='space-y-3'>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder='Ghi chú (nếu có)'
                                rows={2}
                                className={inputCls}
                            />
                            <div className='flex flex-wrap gap-2'>
                                <button
                                    disabled={isReviewing}
                                    onClick={() => run(() => review({ id: request.id, action: 'APPROVE', note }).unwrap())}
                                    className={btnPrimary}
                                >
                                    {isReviewing && <Loader2 size={15} className='animate-spin' />}
                                    Duyệt, trình BOD
                                </button>
                                <button
                                    disabled={isReviewing}
                                    onClick={() => run(() => review({ id: request.id, action: 'REQUEST_MORE_DOCS', note }).unwrap())}
                                    className={btnWarnOutline}
                                >
                                    Yêu cầu bổ sung
                                </button>
                                <button
                                    disabled={isReviewing}
                                    onClick={() => run(() => review({ id: request.id, action: 'REJECT', note }).unwrap())}
                                    className={btnDangerOutline}
                                >
                                    Từ chối
                                </button>
                            </div>
                        </div>
                    </Section>
                )}

                {request.approvalStatus === 'PENDING_BOD' && canBodDecide(currentUserRole) && (
                    <Section title='BOD xác nhận' tone='action'>
                        <div className='space-y-3'>
                            <div>
                                <label className={labelCls}>Xác nhận lại thời hạn thanh toán</label>
                                <input type='date' value={confirmedDueDate} onChange={(e) => setConfirmedDueDate(e.target.value)} className={inputCls} />
                            </div>
                            <textarea
                                value={bodReason}
                                onChange={(e) => setBodReason(e.target.value)}
                                placeholder='Lý do (bắt buộc nếu từ chối)'
                                rows={2}
                                className={inputCls}
                            />
                            <div className='flex flex-wrap gap-2'>
                                <button
                                    disabled={isDeciding}
                                    onClick={() => run(() => bodDecide({ id: request.id, action: 'APPROVE', reason: bodReason, confirmedDueDate }).unwrap())}
                                    className={btnPrimary}
                                >
                                    {isDeciding && <Loader2 size={15} className='animate-spin' />}
                                    Xác nhận
                                </button>
                                <button
                                    disabled={isDeciding}
                                    onClick={() => run(() => bodDecide({ id: request.id, action: 'REJECT', reason: bodReason }).unwrap())}
                                    className={btnDangerOutline}
                                >
                                    Từ chối
                                </button>
                            </div>
                        </div>
                    </Section>
                )}

                {request.approvalStatus === 'APPROVED' && !isPaid && canPay(currentUserRole) && (
                    <Section title='Chi tiền' icon={Landmark} tone='action'>
                        <div className='space-y-3'>
                            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                                {[
                                    ['BANK_TRANSFER', 'Chuyển khoản (ủy nhiệm chi)'],
                                    ['CASH', 'Tiền mặt (phiếu chi)'],
                                ].map(([value, label]) => (
                                    <label
                                        key={value}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm transition',
                                            paymentMethod === value ? 'border-orange-400 ring-2 ring-orange-100' : 'border-stone-200 hover:border-orange-200'
                                        )}
                                    >
                                        <input
                                            type='radio'
                                            checked={paymentMethod === value}
                                            onChange={() => setPaymentMethod(value)}
                                            className='accent-orange-500'
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                            <input
                                value={paymentRef}
                                onChange={(e) => setPaymentRef(e.target.value)}
                                placeholder={paymentMethod === 'BANK_TRANSFER' ? 'Link ủy nhiệm chi' : 'Số phiếu chi'}
                                className={inputCls}
                            />
                            <button
                                disabled={isPaying}
                                onClick={() => run(() => pay({
                                    id: request.id,
                                    paymentMethod,
                                    bankPaymentOrderUrl: paymentMethod === 'BANK_TRANSFER' ? paymentRef : undefined,
                                    cashVoucherNumber: paymentMethod === 'CASH' ? paymentRef : undefined,
                                }).unwrap())}
                                className={btnPrimary}
                            >
                                {isPaying && <Loader2 size={15} className='animate-spin' />}
                                Xác nhận đã chi
                            </button>
                        </div>
                    </Section>
                )}

                <ErrorLine>{error}</ErrorLine>

                <RequestHistory history={request.history} />

                {showCancel && (
                    <div className='rounded-xl border border-dashed border-stone-300 p-4'>
                        <p className='mb-2 text-sm font-medium text-stone-700'>Hủy yêu cầu thanh toán</p>
                        {isApprovedUnpaid && (
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder='Lý do hủy (bắt buộc)'
                                rows={2}
                                className={cn(inputCls, 'mb-2')}
                            />
                        )}
                        <button disabled={isCancelling} onClick={handleCancel} className={btnDangerOutline}>
                            {isCancelling && <Loader2 size={15} className='animate-spin' />}
                            Hủy yêu cầu
                        </button>
                    </div>
                )}
            </div>

            <div className='flex shrink-0 justify-end border-t border-stone-100 bg-white px-5 py-3 sm:px-6'>
                <button type='button' onClick={onClose} className={btnSecondary}>Đóng</button>
            </div>
        </ModalShell>
    );
};
