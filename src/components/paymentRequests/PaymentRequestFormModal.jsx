import { useMemo, useRef, useState } from 'react';
import {
    X, Briefcase, ClipboardList, Calendar, Wallet, FileText,
    Upload, Image as ImageIcon, File as FileIcon, Loader2, Trash2, AlertCircle,
} from 'lucide-react';
import { useGetTasksByProjectQuery } from '../../api/tasks';
import { useUploadPaymentRequestInvoiceFileMutation } from '../../api/paymentRequests';
import { formatNumber, parseNumber } from '../../utils/format';
import { cn } from '../../utils/cn';

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
                className={cn(
                    'w-full rounded-lg border px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100',
                    hasError ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-blue-400'
                )}
            />
            <button
                type='button'
                onClick={openPicker}
                className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600'
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
                <div key={f.publicId || f.url} className='flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>
                    <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                        f.fileType === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    )}>
                        {f.fileType === 'PDF' ? <FileIcon size={16} /> : <ImageIcon size={16} />}
                    </div>
                    <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium text-slate-700'>{f.name}</p>
                        {f.size ? <p className='text-xs text-slate-400'>{(f.size / 1024).toFixed(0)} KB</p> : null}
                    </div>
                    {f.uploading ? (
                        <Loader2 size={16} className='animate-spin text-slate-400' />
                    ) : (
                        <button
                            type='button'
                            onClick={() => onRemove(f)}
                            className='text-slate-400 hover:text-red-600'
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
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const { data: projectTasks = [], isFetching: isLoadingTasks, isError: isTasksError } = useGetTasksByProjectQuery(
        projectId,
        { skip: !projectId || type !== 'PROJECT' }
    );
    const [uploadInvoiceFile] = useUploadPaymentRequestInvoiceFileMutation();

    const myTasks = useMemo(
        () => projectTasks.filter((t) => t.assigneeId === currentUserId || t.assignee?.id === currentUserId),
        [projectTasks, currentUserId]
    );

    const isUploadingFiles = invoiceFiles.some((f) => f.uploading);

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

        if (!content.trim() || !amount || !dueDate) {
            setError('Vui lòng nhập đầy đủ nội dung, số tiền và thời hạn thanh toán');
            return;
        }
        if (type === 'PROJECT' && (!projectId || !taskId)) {
            setError('Vui lòng chọn dự án và công việc của bạn trong dự án đó');
            return;
        }
        if (isUploadingFiles) {
            setError('Vui lòng đợi file hóa đơn tải lên xong');
            return;
        }

        const readyFiles = invoiceFiles.filter((f) => !f.uploading);
        const invoiceImages = readyFiles.filter((f) => f.fileType === 'IMAGE');
        const invoicePdfs = readyFiles.filter((f) => f.fileType === 'PDF');

        try {
            await onSubmit({
                type,
                projectId: type === 'PROJECT' ? projectId : undefined,
                taskId: type === 'PROJECT' ? taskId : undefined,
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

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm'>
            <div className='flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'>
                <div className='flex items-center justify-between border-b border-slate-100 px-6 py-4'>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600'>
                            <Wallet size={20} />
                        </div>
                        <div>
                            <h2 className='text-lg font-semibold text-slate-800'>Tạo yêu cầu thanh toán</h2>
                            <p className='text-xs text-slate-400'>Điền thông tin để gửi yêu cầu duyệt</p>
                        </div>
                    </div>
                    <button onClick={onClose} className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700'>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className='flex-1 space-y-5 overflow-y-auto px-6 py-5'>
                    <div>
                        <label className='mb-2 block text-xs font-medium text-slate-500'>Loại yêu cầu</label>
                        <div className='grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1'>
                            <button
                                type='button'
                                onClick={() => setType('PROJECT')}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                                    type === 'PROJECT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                <Briefcase size={15} /> Theo dự án
                            </button>
                            <button
                                type='button'
                                onClick={() => { setType('OTHER_WORK'); setProjectId(''); setTaskId(''); }}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                                    type === 'OTHER_WORK' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                <ClipboardList size={15} /> Công việc khác
                            </button>
                        </div>
                    </div>

                    {type === 'PROJECT' && (
                        <div className='grid grid-cols-2 gap-3'>
                            <div>
                                <label className='mb-1 block text-xs text-slate-500'>Dự án</label>
                                <select
                                    value={projectId}
                                    onChange={(e) => { setProjectId(e.target.value); setTaskId(''); }}
                                    className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
                                >
                                    <option value=''>-- Chọn dự án --</option>
                                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className='mb-1 block text-xs text-slate-500'>Công việc của bạn</label>
                                <select
                                    value={taskId}
                                    onChange={(e) => setTaskId(e.target.value)}
                                    disabled={!projectId || isLoadingTasks}
                                    className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400'
                                >
                                    <option value=''>
                                        {isLoadingTasks ? 'Đang tải công việc...' : '-- Chọn công việc --'}
                                    </option>
                                    {myTasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                {projectId && !isLoadingTasks && !isTasksError && myTasks.length === 0 && (
                                    <p className='mt-1 text-xs text-amber-600'>Bạn chưa được giao công việc nào trong dự án này</p>
                                )}
                                {isTasksError && (
                                    <p className='mt-1 flex items-center gap-1 text-xs text-red-600'>
                                        <AlertCircle size={12} /> Không tải được danh sách công việc
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className='mb-1 block text-xs text-slate-500'>Nội dung</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={3}
                            placeholder='Mô tả nội dung yêu cầu thanh toán...'
                            className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
                        />
                    </div>

                    <div className='grid grid-cols-2 gap-3'>
                        <div>
                            <label className='mb-1 block text-xs text-slate-500'>Số tiền</label>
                            <div className='relative'>
                                <input
                                    type='text'
                                    inputMode='numeric'
                                    value={formatNumber(amount)}
                                    onChange={(e) => setAmount(parseNumber(e.target.value))}
                                    placeholder='0'
                                    className='w-full rounded-lg border border-slate-200 px-3 py-2 pr-12 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
                                />
                                <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400'>VNĐ</span>
                            </div>
                        </div>
                        <div>
                            <label className='mb-1 block text-xs text-slate-500'>Thời hạn thanh toán</label>
                            <DueDateField value={dueDate} onChange={setDueDate} />
                        </div>
                    </div>

                    <div>
                        <label className='mb-1 block text-xs text-slate-500'>Hóa đơn (ảnh hoặc PDF)</label>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition',
                                isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                            )}
                        >
                            <Upload size={20} className='text-slate-400' />
                            <p className='text-sm text-slate-500'>
                                <span className='font-medium text-blue-600'>Chọn file</span> hoặc kéo thả vào đây
                            </p>
                            <p className='text-xs text-slate-400'>Ảnh (jpg, png...) hoặc PDF, tối đa {MAX_FILE_MB}MB</p>
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='image/*,application/pdf'
                                multiple
                                onChange={(e) => { handleFilesSelected(e.target.files); e.target.value = ''; }}
                                className='hidden'
                            />
                        </div>
                        <InvoiceFileList files={invoiceFiles} onRemove={handleRemoveFile} />
                    </div>

                    {error && (
                        <p className='flex items-center gap-1.5 text-sm text-red-600'>
                            <AlertCircle size={14} /> {error}
                        </p>
                    )}
                </form>

                <div className='flex justify-end gap-3 border-t border-slate-100 px-6 py-4'>
                    <button type='button' onClick={onClose} className='rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50'>
                        Hủy
                    </button>
                    <button
                        type='submit'
                        onClick={handleSubmit}
                        disabled={isSubmitting || isUploadingFiles}
                        className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60'
                    >
                        {(isSubmitting || isUploadingFiles) && <Loader2 size={15} className='animate-spin' />}
                        {isSubmitting ? 'Đang gửi...' : isUploadingFiles ? 'Đang tải file...' : 'Gửi yêu cầu'}
                    </button>
                </div>
            </div>
        </div>
    );
};
