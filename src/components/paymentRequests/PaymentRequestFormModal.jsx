import { useMemo, useRef, useState } from 'react';
import {
    Briefcase, ClipboardList, Calendar, Wallet, Info,
    Upload, Image as ImageIcon, File as FileIcon, Loader2, Trash2, AlertCircle,
} from 'lucide-react';
import { useGetTasksByProjectQuery, useGetTasksQuery } from '../../api/tasks';
import { useUploadPaymentRequestInvoiceFileMutation } from '../../api/paymentRequests';
import { cn } from '../../utils/cn';
import { ModalShell, ModalHeader, AmountInput } from './PaymentRequestParts';
import { inputCls, labelCls, btnPrimary, btnSecondary } from './paymentRequestConfig';

const MAX_FILE_MB = 15;
const ACCEPTED_TYPES = ['image/', 'application/pdf'];

// yyyy-MM-dd (giá trị input date / lưu trong state) <-> dd/mm/yyyy (hiển thị)
const isoToDisplay = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return '';
    return `${d}/${m}/${y}`;
};

const displayToIso = (display) => {
    const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    const d = Number(dd), m = Number(mm), y = Number(yyyy);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return `${yyyy}-${mm}-${dd}`;
};

const DueDateField = ({ value, onChange, hasError }) => {
    const [text, setText] = useState(isoToDisplay(value));
    const hiddenDateRef = useRef(null);

    const syncFromIso = (iso) => setText(isoToDisplay(iso));

    const handleTextChange = (e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
        let formatted = digits;
        if (digits.length > 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
        else if (digits.length > 2) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        setText(formatted);

        if (digits.length === 8) {
            const iso = displayToIso(formatted);
            if (iso) onChange(iso);
        } else if (digits.length === 0) {
            onChange('');
        }
    };

    const handleHiddenDateChange = (e) => {
        onChange(e.target.value);
        syncFromIso(e.target.value);
    };

    const openPicker = () => {
        const el = hiddenDateRef.current;
        if (!el) return;
        if (typeof el.showPicker === 'function') el.showPicker();
        else el.click();
    };

    return (
        <div className='relative'>
            <input
                type='text'
                inputMode='numeric'
                value={text}
                onChange={handleTextChange}
                placeholder='dd/mm/yyyy'
                maxLength={10}
                className={cn(inputCls, 'pr-9', hasError && 'border-red-300 focus:border-red-400')}
            />
            <button
                type='button'
                onClick={openPicker}
                className='absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-orange-600'
                tabIndex={-1}
            >
                <Calendar size={16} />
            </button>
            <input
                ref={hiddenDateRef}
                type='date'
                value={value || ''}
                onChange={handleHiddenDateChange}
                className='absolute inset-0 h-full w-full opacity-0 pointer-events-none'
                tabIndex={-1}
                aria-hidden='true'
            />
        </div>
    );
};

const InvoiceFileList = ({ files, onRemove }) => {
    if (!files.length) return null;
    return (
        <div className='mt-3 space-y-2'>
            {files.map((f) => (
                <div key={f.publicId || f.url} className='flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2'>
                    <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                        f.fileType === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                    )}>
                        {f.fileType === 'PDF' ? <FileIcon size={16} /> : <ImageIcon size={16} />}
                    </div>
                    <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium text-stone-700'>{f.name}</p>
                        {f.size ? <p className='text-xs text-stone-400'>{(f.size / 1024).toFixed(0)} KB</p> : null}
                    </div>
                    {f.uploading ? (
                        <Loader2 size={16} className='animate-spin text-stone-400' />
                    ) : (
                        <button
                            type='button'
                            onClick={() => onRemove(f)}
                            className='text-stone-400 hover:text-red-600'
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export const PaymentRequestFormModal = ({ projects, onClose, onSubmit, isSubmitting, currentUserId }) => {
    const [type, setType] = useState('PROJECT');
    const [projectId, setProjectId] = useState('');
    const [taskId, setTaskId] = useState('');
    const [content, setContent] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [invoiceFiles, setInvoiceFiles] = useState([]); // { name, url, size, fileType, publicId, uploading? }
    const [error, setError] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const { data: projectTasks = [], isFetching: isLoadingTasks, isError: isTasksError } = useGetTasksByProjectQuery(
        projectId,
        { skip: !projectId || type !== 'PROJECT' }
    );
    const { data: userTasksData, isFetching: isLoadingOtherTasks, isError: isOtherTasksError } = useGetTasksQuery(
        { assigneeId: currentUserId, limit: 500 },
        { skip: !currentUserId || type !== 'OTHER_WORK' }
    );
    const [uploadInvoiceFile] = useUploadPaymentRequestInvoiceFileMutation();

    const myProjectTasks = useMemo(
        () => projectTasks.filter((t) => t.assigneeId === currentUserId || t.assignee?.id === currentUserId),
        [projectTasks, currentUserId]
    );

    const nonProjectTasks = useMemo(() => {
        const list = Array.isArray(userTasksData) ? userTasksData : userTasksData?.data || [];
        return list.filter((t) => (!t.projectId && !t.project?.id) && (!currentUserId || t.assigneeId === currentUserId || t.assignee?.id === currentUserId));
    }, [userTasksData, currentUserId]);

    const isUploadingFiles = invoiceFiles.some((f) => f.uploading);
    const isDirty = Boolean(content.trim() || amount || dueDate || invoiceFiles.length || projectId || taskId);

    // Esc / bấm nền / nút X đều đi qua đây; nếu đã nhập dở thì hỏi lại để khỏi mất dữ liệu.
    const requestClose = () => {
        if (isSubmitting) return;
        if (isDirty && !window.confirm('Bạn có thông tin chưa gửi. Đóng và bỏ các thay đổi này?')) return;
        onClose();
    };

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
            setInvoiceFiles((prev) => [...prev, { name: file.name, size: file.size, uploading: true, tempId }]);

            try {
                const uploaded = await uploadInvoiceFile(file).unwrap();
                setInvoiceFiles((prev) => prev.map((f) => (f.tempId === tempId ? { ...uploaded, uploading: false } : f)));
                setError('');
            } catch (err) {
                setInvoiceFiles((prev) => prev.filter((f) => f.tempId !== tempId));
                setError(err?.data?.message || `Tải file "${file.name}" thất bại`);
            }
        }
    };

    const handleRemoveFile = (target) => {
        setInvoiceFiles((prev) => prev.filter((f) => (f.publicId || f.url) !== (target.publicId || target.url)));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFilesSelected(e.dataTransfer.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setHasSubmitted(true);

        if (type === 'PROJECT') {
            if (!projectId) {
                setError('Vui lòng chọn dự án');
                return;
            }
            if (!taskId) {
                setError('Vui lòng chọn công việc của bạn trong dự án');
                return;
            }
        } else if (type === 'OTHER_WORK') {
            if (!taskId) {
                setError('Vui lòng chọn công việc của bạn (không thuộc dự án)');
                return;
            }
        }

        if (!content.trim()) {
            setError('Vui lòng nhập nội dung yêu cầu thanh toán');
            return;
        }

        if (!amount || Number(amount) <= 0) {
            setError('Vui lòng nhập số tiền thanh toán hợp lệ (lớn hơn 0 VNĐ)');
            return;
        }

        if (!dueDate) {
            setError('Vui lòng chọn hoặc nhập thời hạn thanh toán');
            return;
        }

        if (isUploadingFiles) {
            setError('Vui lòng đợi file hóa đơn tải lên xong');
            return;
        }

        const readyFiles = invoiceFiles.filter((f) => !f.uploading);
        if (readyFiles.length === 0) {
            setError('Vui lòng tải lên ít nhất một file hóa đơn hoặc chứng từ (ảnh hoặc PDF)');
            return;
        }

        const invoiceImages = readyFiles.filter((f) => f.fileType === 'IMAGE');
        const invoicePdfs = readyFiles.filter((f) => f.fileType === 'PDF');

        try {
            await onSubmit({
                type,
                projectId: type === 'PROJECT' ? projectId : undefined,
                taskId: taskId || undefined,
                content: content.trim(),
                amount: Number(amount),
                dueDate,
                invoiceImages,
                invoicePdfs,
            });
        } catch (err) {
            setError(err?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    const isProjectMissing = hasSubmitted && type === 'PROJECT' && !projectId;
    const isTaskMissing = hasSubmitted && !taskId;
    const isContentMissing = hasSubmitted && !content.trim();
    const isAmountMissing = hasSubmitted && (!amount || Number(amount) <= 0);
    const isDueDateMissing = hasSubmitted && !dueDate;
    const isInvoiceMissing = hasSubmitted && invoiceFiles.filter((f) => !f.uploading).length === 0;

    const typeBtn = (value, Icon, label, onPick) => (
        <button
            type='button'
            onClick={onPick}
            className={cn(
                'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                type === value ? 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-200' : 'text-stone-500 hover:text-stone-700'
            )}
        >
            <Icon size={15} /> {label}
        </button>
    );

    return (
        <ModalShell onClose={requestClose} maxWidth='max-w-lg'>
            <ModalHeader
                icon={Wallet}
                title='Tạo yêu cầu thanh toán'
                subtitle='Điền thông tin để gửi Admin Sale duyệt'
                onClose={requestClose}
            />

            <form id='payment-request-form' onSubmit={handleSubmit} className='flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6'>
                <div>
                    <label className={labelCls}>
                        Loại yêu cầu <span className='text-red-500'>*</span>
                    </label>
                    <div className='grid grid-cols-2 gap-1 rounded-lg bg-orange-50 p-1'>
                        {typeBtn('PROJECT', Briefcase, 'Theo dự án', () => setType('PROJECT'))}
                        {typeBtn('OTHER_WORK', ClipboardList, 'Công việc khác', () => { setType('OTHER_WORK'); setProjectId(''); setTaskId(''); })}
                    </div>
                    <p className='mt-2 flex items-start gap-1.5 text-xs text-stone-500'>
                        <Info size={13} className='mt-0.5 shrink-0 text-orange-500' />
                        Khi giao việc cho vendor, hệ thống tự tạo sẵn yêu cầu (thuộc loại “Theo dự án”), bạn không cần tạo thủ công.
                    </p>
                </div>

                {type === 'PROJECT' && (
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        <div>
                            <label className={labelCls}>
                                Dự án <span className='text-red-500'>*</span>
                            </label>
                            <select
                                value={projectId}
                                onChange={(e) => { setProjectId(e.target.value); setTaskId(''); setError(''); }}
                                className={cn(inputCls, isProjectMissing && 'border-red-400 focus:border-red-500 bg-red-50/20')}
                            >
                                <option value=''>-- Chọn dự án --</option>
                                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>
                                Công việc của bạn <span className='text-red-500'>*</span>
                            </label>
                            <select
                                value={taskId}
                                onChange={(e) => { setTaskId(e.target.value); setError(''); }}
                                disabled={!projectId || isLoadingTasks}
                                className={cn(inputCls, isTaskMissing && 'border-red-400 focus:border-red-500 bg-red-50/20')}
                            >
                                <option value=''>
                                    {isLoadingTasks ? 'Đang tải công việc...' : '-- Chọn công việc --'}
                                </option>
                                {myProjectTasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            {projectId && !isLoadingTasks && !isTasksError && myProjectTasks.length === 0 && (
                                <p className='mt-1 text-xs text-orange-600'>Bạn chưa được giao công việc nào trong dự án này</p>
                            )}
                            {isTasksError && (
                                <p className='mt-1 flex items-center gap-1 text-xs text-red-600'>
                                    <AlertCircle size={12} /> Không tải được danh sách công việc
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {type === 'OTHER_WORK' && (
                    <div>
                        <label className={labelCls}>
                            Công việc (không thuộc dự án) <span className='text-red-500'>*</span>
                        </label>
                        <select
                            value={taskId}
                            onChange={(e) => { setTaskId(e.target.value); setError(''); }}
                            disabled={isLoadingOtherTasks}
                            className={cn(inputCls, isTaskMissing && 'border-red-400 focus:border-red-500 bg-red-50/20')}
                        >
                            <option value=''>
                                {isLoadingOtherTasks ? 'Đang tải công việc...' : '-- Chọn công việc không thuộc dự án --'}
                            </option>
                            {nonProjectTasks.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name} {t.code ? `(${t.code})` : ''}
                                </option>
                            ))}
                        </select>
                        {!isLoadingOtherTasks && !isOtherTasksError && nonProjectTasks.length === 0 && (
                            <p className='mt-1 text-xs text-orange-600'>Bạn chưa có công việc nào không thuộc dự án</p>
                        )}
                        {isOtherTasksError && (
                            <p className='mt-1 flex items-center gap-1 text-xs text-red-600'>
                                <AlertCircle size={12} /> Không tải được danh sách công việc
                            </p>
                        )}
                    </div>
                )}

                <div>
                    <label className={labelCls}>
                        Nội dung <span className='text-red-500'>*</span>
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => { setContent(e.target.value); setError(''); }}
                        rows={3}
                        placeholder='Mô tả nội dung yêu cầu thanh toán...'
                        className={cn(inputCls, isContentMissing && 'border-red-400 focus:border-red-500 bg-red-50/20')}
                    />
                </div>

                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <div>
                        <label className={labelCls}>
                            Số tiền <span className='text-red-500'>*</span>
                        </label>
                        <AmountInput
                            value={amount}
                            onChange={(val) => { setAmount(val); setError(''); }}
                            className={isAmountMissing ? 'border-red-400 focus:border-red-500 bg-red-50/20' : ''}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>
                            Thời hạn thanh toán <span className='text-red-500'>*</span>
                        </label>
                        <DueDateField
                            value={dueDate}
                            onChange={(val) => { setDueDate(val); setError(''); }}
                            hasError={isDueDateMissing}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelCls}>
                        Hóa đơn (ảnh hoặc PDF) <span className='text-red-500'>*</span>
                    </label>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition',
                            isDragging
                                ? 'border-orange-400 bg-orange-50'
                                : isInvoiceMissing
                                    ? 'border-red-400 bg-red-50/30 hover:border-red-500 hover:bg-red-50/50'
                                    : 'border-stone-200 hover:border-orange-300 hover:bg-orange-50/50'
                        )}
                    >
                        <Upload size={20} className={cn(isInvoiceMissing ? 'text-red-400' : 'text-orange-400')} />
                        <p className='text-sm text-stone-500'>
                            <span className={cn('font-semibold', isInvoiceMissing ? 'text-red-600' : 'text-orange-600')}>Chọn file</span> hoặc kéo thả vào đây
                        </p>
                        <p className='text-xs text-stone-400'>Ảnh (jpg, png...) hoặc PDF, tối đa {MAX_FILE_MB}MB</p>
                        <input
                            ref={fileInputRef}
                            type='file'
                            accept='image/*,application/pdf'
                            multiple
                            onChange={(e) => { handleFilesSelected(e.target.files); e.target.value = ''; }}
                            className='hidden'
                        />
                    </div>
                    {isInvoiceMissing && (
                        <p className='mt-1 text-xs text-red-600'>Vui lòng tải lên ít nhất 1 file hóa đơn hoặc chứng từ</p>
                    )}
                    <InvoiceFileList files={invoiceFiles} onRemove={handleRemoveFile} />
                </div>

                {error && (
                    <p className='flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600'>
                        <AlertCircle size={14} className='shrink-0' /> {error}
                    </p>
                )}
            </form>

            <div className='flex shrink-0 justify-end gap-3 border-t border-stone-100 bg-stone-50/60 px-5 py-3.5 sm:px-6'>
                <button type='button' onClick={requestClose} className={btnSecondary}>
                    Hủy
                </button>
                <button
                    type='submit'
                    form='payment-request-form'
                    disabled={isSubmitting || isUploadingFiles}
                    className={btnPrimary}
                >
                    {(isSubmitting || isUploadingFiles) && <Loader2 size={15} className='animate-spin' />}
                    {isSubmitting ? 'Đang gửi...' : isUploadingFiles ? 'Đang tải file...' : 'Gửi yêu cầu'}
                </button>
            </div>
        </ModalShell>
    );
};
