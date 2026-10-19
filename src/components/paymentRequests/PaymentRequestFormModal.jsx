import { useEffect, useMemo, useRef, useState } from 'react';
import Select from 'react-select';
import {
    Briefcase, ClipboardList, Calendar, Wallet, Info,
    Upload, Image as ImageIcon, File as FileIcon, Loader2, Trash2, AlertCircle,
    Copy, Check, FileText, Zap, FileSignature, Receipt,
    TrendingUp, AlertTriangle, ShieldCheck, HelpCircle, Layers, Link2, Sparkles, ExternalLink
} from 'lucide-react';
import { useGetTasksByProjectQuery, useGetTasksQuery } from '../../api/tasks';
import {
    useUploadPaymentRequestInvoiceFileMutation,
    useGetPaymentRequestsQuery,
    useGetServiceBudgetQuery
} from '../../api/paymentRequests';
import { useGetMeQuery } from '../../api/auth';
import { cn } from '../../utils/cn';
import { formatNumber, parseNumber } from '../../utils/format';
import { readMoneyToWords } from '../../utils/numberToWordsVi';
import { ModalShell, ModalHeader, AmountInput } from './PaymentRequestParts';
import { ServiceBudgetBox } from './ServiceBudgetBox';
import { PaymentRequestDocCreateModal, getPositionByRole, getDepartmentByRole, toIsoDate } from './PaymentRequestDocCreateModal';
import { inputCls, labelCls, btnPrimary, btnSecondary } from './paymentRequestConfig';

const MAX_FILE_MB = 15;
const ACCEPTED_TYPES = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// yyyy-MM-dd (giá trị input date / lưu trong state) <-> dd/mm/yyyy (hiển thị)
const isoToDisplay = (iso) => {
    if (!iso) return '';
    const clean = String(iso).split('T')[0].trim();
    if (clean.includes('/')) return clean;
    const parts = clean.split('-');
    if (parts.length === 3) {
        if (parts[0].length === 4) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    return '';
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

const getCurrentDateParts = () => {
    const now = new Date();
    return {
        dd: String(now.getDate()).padStart(2, '0'),
        mm: String(now.getMonth() + 1).padStart(2, '0'),
        yy: String(now.getFullYear()).slice(-2),
        fullYear: String(now.getFullYear())
    };
};

const getNormalizedProjectName = (projectName, requestType) => {
    const raw = (projectName || '').trim();
    if (requestType === 'OTHER_WORK' || !raw || raw === 'Công việc khác' || raw === 'CongViecKhac' || raw === 'Cong_viec_khac') {
        return 'CongViecKhac';
    }
    const clean = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
    return clean || 'GETVINI';
};

const formatDocFileName = (file, docType, projectName, existingNames = new Set(), forcedIndex = 0, requestType = 'PROJECT') => {
    const rawName = file?.originalName || file?.name || '';
    const rawExt = rawName ? rawName.substring(rawName.lastIndexOf('.')) : '';
    const safeExt = rawExt || (file?.type?.includes('pdf') ? '.pdf' : file?.type?.includes('word') ? '.docx' : '.jpg');

    const { dd, mm, yy, fullYear } = getCurrentDateParts();
    const cleanProject = getNormalizedProjectName(projectName, requestType);

    let docCode = '';
    switch (docType) {
        case 'LABOR_CONTRACT':
            docCode = 'HDKV-GETVINI';
            break;
        case 'ACCEPTANCE_MINUTE':
            docCode = 'BBNT-GETVINI';
            break;
        case 'ADDENDUM':
            docCode = 'PLHDPhatSinh-GETVINI';
            break;
        case 'VAT_INVOICE':
            docCode = 'HDVAT-GETVINI';
            break;
        case 'PAYMENT_REQUEST_DOC':
            docCode = 'DNTT-GETVINI';
            break;
        case 'OTHER_INVOICE':
            docCode = 'HDKHAC-GETVINI';
            break;
        default:
            docCode = 'CHUNGTU-GETVINI';
    }

    const baseStandard = `${dd}${mm}${yy}/${cleanProject}/${fullYear}/${docCode}`;
    const baseSafeUpload = `${dd}${mm}${yy}_${cleanProject}_${fullYear}_${docCode}`;

    let standardName = `${baseStandard}${safeExt}`;
    let safeUploadName = `${baseSafeUpload}${safeExt}`;

    // Nếu forcedIndex > 0 hoặc tên này đã bị trùng (đã có trong existingNames):
    if (forcedIndex > 0 || (existingNames && existingNames.has(standardName))) {
        let counter = forcedIndex > 0 ? forcedIndex : 1;
        while (counter <= 99) {
            const suffix = `_${String(counter).padStart(2, '0')}`;
            const candidateStandard = `${baseStandard}${suffix}${safeExt}`;
            const candidateUpload = `${baseSafeUpload}${suffix}${safeExt}`;
            if (!existingNames || !existingNames.has(candidateStandard)) {
                standardName = candidateStandard;
                safeUploadName = candidateUpload;
                break;
            }
            counter++;
        }
    }

    return { standardName, safeUploadName };
};

const DueDateField = ({ value, onChange, hasError }) => {
    const [text, setText] = useState(isoToDisplay(value));
    const hiddenDateRef = useRef(null);

    // Đồng bộ text hiển thị khi value prop từ ngoài thay đổi (ví dụ: khi đưa từ Modal tạo mẫu vào)
    useEffect(() => {
        setText(isoToDisplay(value));
    }, [value]);

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

// Component Upload chứng từ độc lập cho từng mục (HĐKV, BBNT, Phụ lục, Hóa đơn VAT, Giấy ĐNTT)
// Hỗ trợ 2 chế độ: [ Tải tệp từ máy ] | [ Nhập liên kết (URL) ]
const DocumentUploadBox = ({
    title,
    icon: BoxIcon,
    hint,
    badge = '(tùy chọn)',
    docType,
    files,
    onUpload,
    onRemove,
    onToggleName,
    onOpenCreateModal,
    onAddLink,
    disabled,
    maxFiles = 5
}) => {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [inputMode, setInputMode] = useState('FILE'); // 'FILE' | 'URL'
    const [linkUrl, setLinkUrl] = useState('');
    const [linkName, setLinkName] = useState('');
    const [linkError, setLinkError] = useState('');

    const boxFiles = files.filter((f) => f.docType === docType);
    const isFull = boxFiles.length >= maxFiles;

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (isFull) return;
        if (e.dataTransfer?.files?.length) {
            onUpload(e.dataTransfer.files, docType);
        }
    };

    const handleLinkSubmit = (e) => {
        e?.preventDefault();
        setLinkError('');
        if (!linkUrl.trim()) {
            setLinkError('Vui lòng nhập đường dẫn liên kết');
            return;
        }
        if (!linkUrl.trim().match(/^https?:\/\//i)) {
            setLinkError('Đường dẫn phải bắt đầu bằng http:// hoặc https://');
            return;
        }
        if (isFull) {
            setLinkError(`Mục này đã đạt giới hạn tối đa ${maxFiles} file/liên kết`);
            return;
        }

        onAddLink?.(linkUrl.trim(), linkName.trim(), docType);
        setLinkUrl('');
        setLinkName('');
    };

    return (
        <div className='rounded-xl border border-stone-200 bg-white p-3 space-y-2.5 transition hover:border-gray-200'>
            {/* Header: Tiêu đề + Huy hiệu số lượng + Nút thao tác nhanh */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600 shrink-0'>
                        {BoxIcon && <BoxIcon size={14} />}
                    </div>
                    <div>
                        <span className='text-xs font-bold text-stone-800'>{title}</span>
                        <span className='ml-1.5 text-[11px] font-normal text-stone-400'>
                            {badge}
                            <span className={cn('ml-1 font-mono text-[10px] font-medium', isFull ? 'text-amber-600 font-bold' : 'text-stone-500')}>
                                ({boxFiles.length}/{maxFiles} file)
                            </span>
                        </span>
                    </div>
                </div>

                <div className='flex items-center gap-1.5'>
                    {onOpenCreateModal && (
                        <button
                            type='button'
                            onClick={onOpenCreateModal}
                            disabled={disabled || isFull}
                            className='inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 shadow-2xs transition hover:bg-orange-100 hover:text-orange-800 disabled:opacity-50 cursor-pointer'
                            title='Mở form lập Giấy đề nghị thanh toán từ mẫu chuẩn'
                        >
                            <Sparkles size={12} className='text-orange-500' />
                            <span>Tạo từ mẫu</span>
                        </button>
                    )}

                    <button
                        type='button'
                        onClick={() => inputRef.current?.click()}
                        disabled={disabled || isFull}
                        className={cn(
                            'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer',
                            isFull
                                ? 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
                                : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-gray-300 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50'
                        )}
                        title={isFull ? `Đã đạt tối đa ${maxFiles} file` : 'Tải file'}
                    >
                        <Upload size={12} /> {isFull ? 'Đã đủ 5 file' : 'Tải file'}
                    </button>
                    <input
                        ref={inputRef}
                        type='file'
                        accept='image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        multiple
                        disabled={isFull}
                        onChange={(e) => {
                            onUpload(e.target.files, docType);
                            e.target.value = '';
                        }}
                        className='hidden'
                    />
                </div>
            </div>

            {hint && (
                <p className='text-[10px] text-stone-400 leading-tight'>{hint}</p>
            )}

            {/* Thanh chuyển chế độ: Tệp tài liệu đính kèm | Tải tệp từ máy | Nhập liên kết (URL) (Theo Image 3) */}
            <div className='flex items-center justify-between border-t border-stone-100 pt-2 text-xs'>
                <span className='text-[11px] font-medium text-stone-500'>Tệp tài liệu đính kèm</span>
                <div className='flex items-center gap-1 text-[11px]'>
                    <button
                        type='button'
                        onClick={() => setInputMode('FILE')}
                        className={cn(
                            'rounded px-2.5 py-0.5 font-medium transition cursor-pointer',
                            inputMode === 'FILE'
                                ? 'bg-orange-100 text-orange-600 font-semibold'
                                : 'text-stone-500 hover:text-stone-800'
                        )}
                    >
                        Tải tệp từ máy
                    </button>
                    <span className='text-stone-300'>|</span>
                    {/* <button
                        type='button'
                        onClick={() => setInputMode('URL')}
                        className={cn(
                            'rounded px-2.5 py-0.5 font-medium transition cursor-pointer',
                            inputMode === 'URL'
                                ? 'bg-orange-100 text-orange-600 font-semibold'
                                : 'text-stone-500 hover:text-stone-800'
                        )}
                    >
                        Nhập liên kết (URL)
                    </button> */}
                </div>
            </div>

            {/* Nội dung theo chế độ chọn */}
            {inputMode === 'FILE' ? (
                <div
                    onDragOver={(e) => { e.preventDefault(); if (!isFull) setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !isFull && inputRef.current?.click()}
                    className={cn(
                        'flex flex-col cursor-pointer items-center justify-center gap-1 rounded-xl border border-dashed py-3 px-3 text-center transition',
                        isDragging ? 'border-gray-400 bg-orange-50' : 'border-stone-200 hover:border-gray-300 hover:bg-orange-50/20'
                    )}
                >
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500 border border-orange-100 shadow-2xs'>
                        <Upload size={15} />
                    </div>
                    <p className='text-xs font-semibold text-stone-700 mt-0.5'>
                        Nhấp để chọn tệp hoặc kéo thả vào đây
                    </p>
                    <p className='text-[10px] text-stone-400'>
                        Hỗ trợ PDF, DOCX, XLSX, PNG, JPG (Tối đa 15MB)
                    </p>
                </div>
            ) : (
                /* Khung nhập liên kết URL */
                <div className='rounded-xl border border-dashed border-stone-200 bg-stone-50/60 p-2.5 space-y-2'>
                    <div className='flex flex-col sm:flex-row gap-2'>
                        <div className='relative flex-1'>
                            <input
                                type='url'
                                value={linkUrl}
                                onChange={(e) => { setLinkUrl(e.target.value); setLinkError(''); }}
                                placeholder='Dán link (Google Drive, Docs, link hóa đơn điện tử...)'
                                className='w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200'
                            />
                        </div>
                        <input
                            type='text'
                            value={linkName}
                            onChange={(e) => setLinkName(e.target.value)}
                            placeholder='Tên gợi nhớ (tùy chọn)'
                            className='w-full sm:w-44 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200'
                        />
                        <button
                            type='button'
                            disabled={isFull || !linkUrl.trim()}
                            onClick={handleLinkSubmit}
                            className='inline-flex items-center justify-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-orange-600 disabled:opacity-50 shrink-0 cursor-pointer'
                        >
                            <Link2 size={13} /> Thêm liên kết
                        </button>
                    </div>
                    {linkError && <p className='text-[10px] text-red-500'>{linkError}</p>}
                </div>
            )}

            {/* Danh sách file / liên kết đã đính kèm trong mục */}
            {boxFiles.length > 0 && (
                <div className='space-y-1.5 pt-0.5'>
                    {boxFiles.map((f) => {
                        const isUsingStandard = f.isStandard ?? Boolean(f.standardName && f.name === f.standardName);
                        const hasAlternative = !f.isGeneratedDoc && Boolean(f.standardName && f.originalName && f.standardName !== f.originalName);
                        const isLink = Boolean(f.isLink || f.fileType === 'LINK');

                        return (
                            <div
                                key={f.id || f.publicId || f.url || f.tempId}
                                className='rounded-lg border border-stone-200 bg-stone-50/90 p-2 text-xs transition hover:border-stone-300 space-y-1.5'
                            >
                                <div className='flex items-center gap-2.5'>
                                    <div className={cn(
                                        'flex h-6 w-6 shrink-0 items-center justify-center rounded',
                                        isLink ? 'bg-sky-100 text-sky-600' :
                                        f.fileType === 'PDF' ? 'bg-red-100 text-red-600' :
                                        f.fileType === 'DOC' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                    )}>
                                        {isLink ? <Link2 size={12} /> :
                                         f.fileType === 'PDF' ? <FileIcon size={12} /> :
                                         f.fileType === 'DOC' ? <FileText size={12} /> : <ImageIcon size={12} />}
                                    </div>
                                    <div className='min-w-0 flex-1'>
                                        <div className='flex items-center gap-1.5'>
                                            <p className='truncate text-xs font-semibold text-stone-800' title={f.name}>
                                                {f.name}
                                            </p>
                                            {f.isGeneratedDoc ? (
                                                <span className='shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 border border-indigo-200'>
                                                    Google Drive (Tự động tải lên khi gửi)
                                                </span>
                                            ) : isLink ? (
                                                <span className='shrink-0 rounded bg-sky-50 px-1 py-0.2 text-[9px] font-bold text-sky-700 border border-sky-200'>
                                                    Liên kết URL
                                                </span>
                                            ) : isUsingStandard ? (
                                                <span className='shrink-0 rounded bg-emerald-50 px-1 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200'>
                                                    Chuẩn Getvini
                                                </span>
                                            ) : (
                                                <span className='shrink-0 rounded bg-stone-200/70 px-1 py-0.2 text-[9px] font-medium text-stone-600'>
                                                    Tên gốc
                                                </span>
                                            )}
                                        </div>
                                        {isLink && f.url ? (
                                            <a
                                                href={f.url}
                                                target='_blank'
                                                rel='noreferrer'
                                                className='text-[10px] text-sky-600 hover:underline flex items-center gap-0.5 mt-0.5 truncate'
                                            >
                                                <span className='truncate'>{f.url}</span> <ExternalLink size={9} className='shrink-0' />
                                            </a>
                                        ) : f.size ? (
                                            <p className='text-[10px] text-stone-400 mt-0.5'>{(f.size / 1024).toFixed(0)} KB</p>
                                        ) : null}
                                    </div>
                                    {f.uploading ? (
                                        <Loader2 size={13} className='animate-spin text-stone-400 shrink-0' />
                                    ) : (
                                        <button
                                            type='button'
                                            onClick={() => onRemove(f)}
                                            className='text-stone-400 hover:text-red-600 p-0.5 shrink-0 transition'
                                            title='Xóa file'
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>

                                {/* Xem và sửa lại tài liệu mẫu */}
                                {!f.uploading && f.isGeneratedDoc && onOpenCreateModal && (
                                    <div className='flex items-center justify-between border-t border-stone-200/60 pt-1 text-[11px]'>
                                        <button
                                            type='button'
                                            onClick={onOpenCreateModal}
                                            className='inline-flex items-center gap-1 font-medium text-orange-600 hover:text-orange-700 transition cursor-pointer'
                                        >
                                            <Sparkles size={11} className='text-orange-500' />
                                            <span>Xem lại / Sửa thông tin bản mẫu</span>
                                        </button>
                                    </div>
                                )}

                                {/* Chuyển đổi nhanh giữa tên chuẩn & tên gốc */}
                                {!f.uploading && !isLink && hasAlternative && onToggleName && (
                                    <div className='flex items-center justify-between border-t border-stone-200/60 pt-1 text-[11px]'>
                                        {isUsingStandard ? (
                                            <button
                                                type='button'
                                                onClick={() => onToggleName(f)}
                                                className='inline-flex items-center gap-1 text-stone-500 hover:text-orange-600 transition'
                                                title={`Khôi phục tên gốc: ${f.originalName}`}
                                            >
                                                <span className='text-[10px]'>↩ Khôi phục tên gốc:</span>
                                                <span className='font-mono text-[10px] underline truncate max-w-[220px] text-stone-600 hover:text-orange-600'>
                                                    {f.originalName}
                                                </span>
                                            </button>
                                        ) : (
                                            <button
                                                type='button'
                                                onClick={() => onToggleName(f)}
                                                className='inline-flex items-center gap-1 font-medium text-orange-600 hover:text-orange-700 transition'
                                                title={`Áp dụng tên chuẩn: ${f.standardName}`}
                                            >
                                                <span className='text-[10px]'>✨ Đổi sang tên chuẩn:</span>
                                                <span className='font-mono text-[10px] underline truncate max-w-[220px] text-orange-700'>
                                                    {f.standardName}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Kiểm tra một công việc có thuộc dịch vụ có quản lý ngân sách (isBudget === true) hay không
const isTaskBudgetService = (task) => {
    if (!task) return false;
    return (
        task.contractService?.service?.isBudget === true ||
        task.contractService?.isBudget === true ||
        task.opportunityServiceJob?.opportunityService?.service?.isBudget === true ||
        task.mappedService?.isBudget === true ||
        task.isBudget === true
    );
};

const isProjectClosed = (p) => ['COMPLETED', 'CANCELLED'].includes(p?.status);
const isProjectOnHold = (p) => p?.status === 'ON_HOLD' || Boolean(p?.isOnHold);

const stripDiacritics = (str = '') =>
    String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();

const customFilterOption = (option, rawInput) => {
    if (!rawInput) return true;
    const search = stripDiacritics(rawInput.trim());
    const label = stripDiacritics(option.label || '');
    return label.includes(search);
};

const getSelectStyles = (hasError = false) => ({
    control: (base, state) => ({
        ...base,
        minHeight: '38px',
        backgroundColor: state.isDisabled ? '#F9FAFB' : '#FFFFFF',
        borderColor: hasError
            ? '#F87171'
            : state.isFocused
                ? '#F38820'
                : '#E5E7EB',
        borderRadius: '0.5rem',
        boxShadow: state.isFocused
            ? hasError
                ? '0 0 0 2px rgba(239, 68, 68, 0.2)'
                : '0 0 0 2px rgba(243, 136, 32, 0.2)'
            : 'none',
        '&:hover': {
            borderColor: hasError
                ? '#EF4444'
                : state.isFocused
                    ? '#F38820'
                    : '#D1D5DB',
        },
        fontSize: '0.875rem',
        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
    }),
    valueContainer: (base) => ({
        ...base,
        padding: '2px 10px',
    }),
    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
        color: '#1F2937',
        fontSize: '0.875rem',
    }),
    placeholder: (base) => ({
        ...base,
        color: '#9CA3AF',
        fontSize: '0.875rem',
    }),
    singleValue: (base) => ({
        ...base,
        color: '#1F2937',
        fontSize: '0.875rem',
        fontWeight: 500,
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused ? '#F38820' : '#9CA3AF',
        padding: '4px 8px',
        '&:hover': {
            color: '#F38820',
        },
    }),
    clearIndicator: (base) => ({
        ...base,
        color: '#9CA3AF',
        padding: '4px 8px',
        cursor: 'pointer',
        '&:hover': {
            color: '#EF4444',
        },
    }),
    menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
    }),
    menu: (base) => ({
        ...base,
        zIndex: 9999,
        borderRadius: '0.5rem',
        overflow: 'hidden',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #E5E7EB',
    }),
    menuList: (base) => ({
        ...base,
        maxHeight: '220px',
        padding: '4px',
    }),
    option: (base, state) => ({
        ...base,
        fontSize: '0.875rem',
        borderRadius: '0.375rem',
        padding: '8px 12px',
        margin: '1px 0',
        cursor: 'pointer',
        backgroundColor: state.isSelected ? '#FFF7ED' : state.isFocused ? '#F3F4F6' : 'transparent',
        color: state.isSelected ? '#F38820' : '#1F2937',
        fontWeight: state.isSelected ? 600 : 400,
        ':active': {
            backgroundColor: '#FFEDD5',
            color: '#C2410C',
        },
    }),
});

export const PaymentRequestFormModal = ({ projects, onClose, onSubmit, isSubmitting, currentUserId }) => {
    const [type, setType] = useState('PROJECT');
    const [projectId, setProjectId] = useState('');
    const [taskId, setTaskId] = useState('');
    const [content, setContent] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [settlementDueDate, setSettlementDueDate] = useState('');
    const [overBudgetReason, setOverBudgetReason] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [autoStandardizeFileName, setAutoStandardizeFileName] = useState(true);
    const [attachedFiles, setAttachedFiles] = useState([]); // { name, standardName, originalName, url, size, fileType, publicId, uploading?, tempId, docType }
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const isProjectBased = type === 'PROJECT' || type === 'ADVANCE';

    const { data: projectTasks = [], isFetching: isLoadingTasks, isError: isTasksError } = useGetTasksByProjectQuery(
        projectId,
        { skip: !projectId || !isProjectBased }
    );
    const { data: userTasksData, isFetching: isLoadingOtherTasks, isError: isOtherTasksError } = useGetTasksQuery(
        { assigneeId: currentUserId, limit: 500 },
        { skip: !currentUserId || type !== 'OTHER_WORK' }
    );
    const { data: me } = useGetMeQuery();
    const [uploadInvoiceFile] = useUploadPaymentRequestInvoiceFileMutation();

    const { data: projectRequestsData } = useGetPaymentRequestsQuery(
        { projectId, limit: 100 },
        { skip: !projectId || !isProjectBased }
    );

    const { data: budgetInfo, isFetching: isLoadingBudget } = useGetServiceBudgetQuery(
        { projectId, taskId },
        { skip: !projectId || !taskId || !isProjectBased }
    );

    const isOverBudgetLevel3 = useMemo(() => {
        if (!budgetInfo?.hasService || !budgetInfo?.hasTotalServiceBudget) return false;
        const numAmount = Number(amount) || 0;
        if (numAmount <= 0) return false;
        const remainingTotal = Number(budgetInfo.remainingTotalServiceBudget) || 0;
        return remainingTotal <= 0 || numAmount > remainingTotal;
    }, [budgetInfo, amount]);

    const existingProjectFileNames = useMemo(() => {
        const names = new Set();
        const list = Array.isArray(projectRequestsData?.data)
            ? projectRequestsData.data
            : (Array.isArray(projectRequestsData) ? projectRequestsData : []);
        list.forEach((req) => {
            (req.invoiceImages || []).forEach((f) => {
                if (f.name) names.add(f.name);
                if (f.standardName) names.add(f.standardName);
            });
            (req.invoicePdfs || []).forEach((f) => {
                if (f.name) names.add(f.name);
                if (f.standardName) names.add(f.standardName);
            });
        });
        return names;
    }, [projectRequestsData]);

    const getTakenFileNames = (excludeFileId = null) => {
        const set = new Set(existingProjectFileNames);
        attachedFiles.forEach((f) => {
            if (excludeFileId && f.id === excludeFileId) return;
            if (f.standardName) set.add(f.standardName);
            if (f.name) set.add(f.name);
        });
        return set;
    };

    const myProjectTasks = useMemo(
        () => projectTasks.filter((t) => {
            const isAssigned = t.assigneeId === currentUserId || t.assignee?.id === currentUserId;
            if (!isAssigned) return false;
            return isTaskBudgetService(t);
        }),
        [projectTasks, currentUserId]
    );

    const hasAnyAssignedTaskInProject = useMemo(
        () => projectTasks.some((t) => t.assigneeId === currentUserId || t.assignee?.id === currentUserId),
        [projectTasks, currentUserId]
    );

    const nonProjectTasks = useMemo(() => {
        const list = Array.isArray(userTasksData) ? userTasksData : userTasksData?.data || [];
        return list.filter((t) => (!t.projectId && !t.project?.id) && (!currentUserId || t.assigneeId === currentUserId || t.assignee?.id === currentUserId));
    }, [userTasksData, currentUserId]);

    const activeProjects = useMemo(() => {
        if (!Array.isArray(projects)) return [];
        return projects.filter((p) => !isProjectClosed(p) && !isProjectOnHold(p));
    }, [projects]);

    const projectOptions = useMemo(() => {
        return activeProjects.map((p) => {
            const contractCode = p.contract?.contractCode || p.contractCode;
            const label = contractCode ? `[${contractCode}] ${p.name}` : p.name;
            return {
                value: p.id,
                label,
                project: p,
            };
        });
    }, [activeProjects]);

    const taskOptions = useMemo(() => {
        return myProjectTasks.map((t) => {
            const serviceName = t.contractService?.service?.name || t.contractService?.name || t.mappedService?.name;
            const codePrefix = t.code ? `[${t.code}] ` : '';
            const serviceSuffix = serviceName ? ` (Dịch vụ: ${serviceName})` : '';
            return {
                value: t.id,
                label: `${codePrefix}${t.name}${serviceSuffix}`,
                task: t,
            };
        });
    }, [myProjectTasks]);

    const nonProjectTaskOptions = useMemo(() => {
        return nonProjectTasks.map((t) => ({
            value: t.id,
            label: `${t.code ? `[${t.code}] ` : ''}${t.name}`,
            task: t,
        }));
    }, [nonProjectTasks]);

    const handleProjectChange = (newProjectId, newType = type) => {
        setProjectId(newProjectId);
        setTaskId('');
        setError('');

        const project = projects?.find((p) => p.id === newProjectId);
        const projectName = project?.name || (newType === 'OTHER_WORK' ? 'CongViecKhac' : '');

        setAttachedFiles((prev) => {
            if (!prev.length) return prev;
            const reserved = new Set(existingProjectFileNames);

            return prev.map((f) => {
                const dummyFile = {
                    originalName: f.originalName,
                    name: f.originalName || f.name,
                    type: f.fileType === 'PDF' ? 'application/pdf' : f.fileType === 'DOC' ? 'application/msword' : 'image/jpeg'
                };
                const { standardName, safeUploadName } = formatDocFileName(dummyFile, f.docType, projectName, reserved, 0, newType);
                reserved.add(standardName);

                const isStandard = f.isStandard ?? Boolean(f.standardName && f.name === f.standardName);
                const newName = isStandard ? standardName : (f.originalName || f.name);

                return {
                    ...f,
                    standardName,
                    safeUploadName,
                    isStandard,
                    name: newName
                };
            });
        });
    };

    const isUploadingFiles = attachedFiles.some((f) => f.uploading);
    const isDirty = Boolean(content.trim() || amount || dueDate || attachedFiles.length || projectId || taskId);

    const requestClose = () => {
        if (isSubmitting) return;
        if (isDirty && !window.confirm('Bạn có thông tin chưa gửi. Đóng và bỏ các thay đổi này?')) return;
        onClose();
    };

    // Option B: Chuyển đổi qua lại giữa tên chuẩn Getvini và tên file gốc của từng file
    const handleToggleFileName = (targetFile) => {
        setAttachedFiles((prev) => {
            const next = prev.map((f) => {
                const isMatch = f.id && targetFile.id ? f.id === targetFile.id : (f.publicId || f.url || f.tempId) === (targetFile.publicId || targetFile.url || targetFile.tempId);
                if (!isMatch) return f;
                const isCurrentlyStandard = f.isStandard ?? Boolean(f.standardName && f.name === f.standardName);
                const nextIsStandard = !isCurrentlyStandard;
                const nextName = nextIsStandard ? (f.standardName || f.name) : (f.originalName || f.name);
                return {
                    ...f,
                    isStandard: nextIsStandard,
                    name: nextName
                };
            });

            if (next.length > 0) {
                const allStandard = next.every((f) => f.isStandard);
                const allOriginal = next.every((f) => !f.isStandard);
                if (allStandard) setAutoStandardizeFileName(true);
                else if (allOriginal) setAutoStandardizeFileName(false);
            }

            return next;
        });
    };

    // Option C: Bật/tắt tự động đổi tên file - đồng bộ tức thì toàn bộ file đã tải lên
    const handleToggleAutoStandardize = (checked) => {
        setAutoStandardizeFileName(checked);
        setAttachedFiles((prev) =>
            prev.map((f) => ({
                ...f,
                isStandard: checked,
                name: checked ? (f.standardName || f.name) : (f.originalName || f.name)
            }))
        );
    };

    const MAX_FILES_PER_DOC_TYPE = 5;

    const handleUploadForDocType = async (fileList, docType) => {
        const rawFiles = Array.from(fileList || []);
        if (!rawFiles.length) return;

        const existingCount = attachedFiles.filter((f) => f.docType === docType).length;
        if (existingCount >= MAX_FILES_PER_DOC_TYPE) {
            setError(`Mục này đã đạt giới hạn tối đa ${MAX_FILES_PER_DOC_TYPE} file.`);
            return;
        }

        const availableSlots = MAX_FILES_PER_DOC_TYPE - existingCount;
        const files = rawFiles.slice(0, availableSlots);
        if (rawFiles.length > availableSlots) {
            setError(`Chỉ có thể tải thêm ${availableSlots} file cho mục này (tối đa ${MAX_FILES_PER_DOC_TYPE} file/mục).`);
        }

        const project = projects?.find((p) => p.id === projectId);
        const projectName = project?.name || (type === 'OTHER_WORK' ? 'CongViecKhac' : '');
        const reservedNames = getTakenFileNames();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
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

            // Format lại tên file theo chuẩn Getvini (ngày hiện tại); nếu trùng thì tự động thêm _01, _02...
            const { standardName, safeUploadName } = formatDocFileName(file, docType, projectName, reservedNames, 0, type);
            reservedNames.add(standardName);
            const initialName = autoStandardizeFileName ? standardName : file.name;
            const fileToUpload = new File([file], safeUploadName, { type: file.type });

            const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${i}`;
            const tempId = `${safeUploadName}-${Date.now()}-${i}`;
            setAttachedFiles((prev) => [
                ...prev,
                {
                    id: fileId,
                    name: initialName,
                    standardName,
                    safeUploadName,
                    originalName: file.name,
                    size: file.size,
                    fileType: inferredFileType,
                    uploading: true,
                    tempId,
                    docType,
                    isStandard: autoStandardizeFileName
                }
            ]);

            try {
                const uploaded = await uploadInvoiceFile(fileToUpload).unwrap();
                const finalFileType = uploaded.fileType || inferredFileType;
                setAttachedFiles((prev) =>
                    prev.map((f) => (f.tempId === tempId || f.id === fileId ? {
                        ...uploaded,
                        id: fileId,
                        tempId,
                        name: f.name, // Giữ tên nếu người dùng đã bấm đổi trong lúc file đang upload
                        standardName,
                        safeUploadName,
                        originalName: file.name,
                        fileType: finalFileType,
                        docType,
                        uploading: false,
                        isStandard: f.isStandard ?? autoStandardizeFileName
                    } : f))
                );
                setError('');
            } catch (err) {
                setAttachedFiles((prev) => prev.filter((f) => f.tempId !== tempId && f.id !== fileId));
                setError(err?.data?.message || `Tải file "${initialName}" thất bại`);
            }
        }
    };

    const handleRemoveFile = (target) => {
        setAttachedFiles((prev) =>
            prev.filter((f) => {
                if (f.id && target.id) return f.id !== target.id;
                return (f.publicId || f.url || f.tempId) !== (target.publicId || target.url || target.tempId);
            })
        );
    };

    const handleAddLink = (url, customName, docType) => {
        if (!url || !url.trim()) return;
        const cleanUrl = url.trim();
        if (!cleanUrl.match(/^https?:\/\//i)) {
            setError('Đường dẫn liên kết phải bắt đầu bằng http:// hoặc https://');
            return;
        }

        const existingCount = attachedFiles.filter((f) => f.docType === docType).length;
        if (existingCount >= MAX_FILES_PER_DOC_TYPE) {
            setError(`Mục này đã đạt giới hạn tối đa ${MAX_FILES_PER_DOC_TYPE} file/liên kết.`);
            return;
        }

        const rawName = customName?.trim() || cleanUrl.split('/').pop()?.split('?')[0] || 'Tài liệu liên kết';
        const isDoc = Boolean(cleanUrl.match(/\.(docx?|doc)$/i));
        const isPdf = Boolean(cleanUrl.match(/\.pdf$/i));
        const fileType = isPdf ? 'PDF' : (isDoc ? 'DOC' : 'LINK');

        const project = projects?.find((p) => p.id === projectId);
        const projectName = project?.name || (type === 'OTHER_WORK' ? 'CongViecKhac' : '');
        const reservedNames = getTakenFileNames();
        const dummyFile = { name: rawName, originalName: rawName, type: isPdf ? 'application/pdf' : 'application/msword' };
        const { standardName } = formatDocFileName(dummyFile, docType, projectName, reservedNames, 0, type);

        const fileId = `link_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        setAttachedFiles((prev) => [
            ...prev,
            {
                id: fileId,
                name: autoStandardizeFileName ? standardName : rawName,
                standardName,
                originalName: rawName,
                url: cleanUrl,
                size: 0,
                fileType,
                docType,
                uploading: false,
                isStandard: autoStandardizeFileName,
                isLink: true,
            }
        ]);
        setError('');
    };

    const handleApplyDocFromModal = (docFile) => {
        const fileId = `file_doc_${Date.now()}`;
        setAttachedFiles((prev) => {
            const filtered = prev.filter((f) => f.docType !== 'PAYMENT_REQUEST_DOC');
            return [
                ...filtered,
                {
                    ...docFile,
                    id: fileId,
                    name: docFile.name,
                    standardName: docFile.standardName || docFile.name,
                    originalName: docFile.originalName || docFile.name,
                    url: docFile.url || '',
                    size: docFile.size || 0,
                    fileType: 'DOC',
                    docType: 'PAYMENT_REQUEST_DOC',
                    uploading: false,
                    isStandard: true,
                    isGeneratedDoc: docFile.isGeneratedDoc,
                    docData: docFile.docData,
                }
            ];
        });

        // 🔄 ĐỒNG BỘ TỪ MODAL TẠO MẪU RA FORM CHÍNH:
        if (docFile?.docData) {
            const { amount: docAmount, reason: docReason, dueDate: docDueDate, projectName: docProjName } = docFile.docData;
            // 1. Đồng bộ Số tiền
            if (docAmount !== undefined && Number(docAmount) > 0) {
                setAmount(Number(docAmount));
            }
            // 2. Đồng bộ Nội dung / Lý do thanh toán
            if (docReason && docReason.trim()) {
                setContent(docReason.trim());
            }
            // 3. Đồng bộ Hạn thanh toán (chuyển về YYYY-MM-DD cho input date)
            if (docDueDate && docDueDate.trim()) {
                const iso = toIsoDate(docDueDate.trim());
                if (iso) setDueDate(iso);
            }
            // 4. Đồng bộ Dự án nếu chưa chọn mà tên dự án trong modal khớp với dự án sẵn có (chỉ nhận dự án đang hoạt động)
            if (docProjName && docProjName.trim() && type === 'PROJECT') {
                const matched = activeProjects?.find(
                    (p) => p.name?.toLowerCase().trim() === docProjName.toLowerCase().trim()
                );
                if (matched && matched.id !== projectId) {
                    setProjectId(matched.id);
                }
            }
        }

        setError('');
    };

    // 🔄 TỰ ĐỘNG ĐỒNG BỘ TỪ FORM CHÍNH VÀO TÀI LIỆU MẪU ĐÃ ĐÍNH KÈM (KHI SỬA Ở FORM CHÍNH)
    useEffect(() => {
        setAttachedFiles((prev) => {
            const hasGeneratedDoc = prev.some((f) => f.isGeneratedDoc);
            if (!hasGeneratedDoc) return prev;
            return prev.map((f) => {
                if (!f.isGeneratedDoc || !f.docData) return f;
                const project = projects?.find((p) => p.id === projectId);
                const currentProjName = type === 'OTHER_WORK' ? 'CongViecKhac' : (project?.name || f.docData.projectName || '');
                const numAmount = amount ? parseNumber(amount) : f.docData.amount;
                return {
                    ...f,
                    docData: {
                        ...f.docData,
                        amount: numAmount,
                        amountInWords: numAmount > 0 ? readMoneyToWords(numAmount) : f.docData.amountInWords,
                        reason: content?.trim() ? content.trim() : f.docData.reason,
                        dueDate: dueDate || f.docData.dueDate,
                        projectName: currentProjName,
                    }
                };
            });
        });
    }, [amount, content, dueDate, projectId, type, projects]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setHasSubmitted(true);

        if (isProjectBased) {
            if (!projectId) {
                setError('Vui lòng chọn dự án');
                return;
            }
            const selectedProject = projects?.find((p) => p.id === projectId);
            if (selectedProject) {
                const isClosed = isProjectClosed(selectedProject);
                const isOnHold = isProjectOnHold(selectedProject);
                if (isClosed || isOnHold) {
                    setError(`Dự án "${selectedProject.name}" đang ở trạng thái ${isClosed ? 'đã đóng' : 'tạm dừng'}. Không thể tạo yêu cầu thanh toán / tạm ứng.`);
                    return;
                }
            }
            if (!taskId) {
                setError('Vui lòng chọn công việc của bạn trong dự án');
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

        if (type === 'ADVANCE' && !settlementDueDate) {
            setError('Vui lòng chọn hoặc nhập hạn hoàn ứng dự kiến cho phiếu tạm ứng');
            return;
        }

        if (isOverBudgetLevel3 && (!overBudgetReason || !overBudgetReason.trim())) {
            setError('Yêu cầu thanh toán vượt ngân sách dịch vụ dự án. Vui lòng nhập lý do giải trình.');
            return;
        }

        if (isUploadingFiles) {
            setError('Vui lòng đợi file tải lên hoàn tất trước khi gửi');
            return;
        }

        // CÁC CHỨNG TỪ HOÀN TOÀN TÙY CHỌN (OPTIONAL) - Không chặn submit nếu chưa up file
        const readyFiles = attachedFiles.filter((f) => !f.uploading);
        const invoiceImages = readyFiles.filter((f) => f.fileType === 'IMAGE');
        const invoicePdfs = readyFiles.filter((f) => f.fileType !== 'IMAGE'); // Gom PDF và Word DOC/DOCX vào nhóm tài liệu

        try {
            await onSubmit({
                type,
                projectId: isProjectBased ? projectId : undefined,
                taskId: taskId || undefined,
                content: content.trim(),
                amount: Number(amount),
                dueDate,
                settlementDueDate: type === 'ADVANCE' ? settlementDueDate : undefined,
                overBudgetReason: overBudgetReason?.trim() || undefined,
                isUrgent,
                invoiceImages,
                invoicePdfs,
            });
        } catch (err) {
            setError(err?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    const isProjectMissing = hasSubmitted && isProjectBased && !projectId;
    const isTaskMissing = hasSubmitted && isProjectBased && !taskId;
    const isContentMissing = hasSubmitted && !content.trim();
    const isAmountMissing = hasSubmitted && (!amount || Number(amount) <= 0);
    const isDueDateMissing = hasSubmitted && !dueDate;
    const isSettlementDueDateMissing = hasSubmitted && type === 'ADVANCE' && !settlementDueDate;

    const typeBtn = (value, Icon, label, onPick) => (
        <button
            type='button'
            onClick={onPick}
            className={cn(
                'flex items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold sm:text-sm transition',
                type === value ? 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-200' : 'text-stone-500 hover:text-stone-700'
            )}
        >
            <Icon size={15} /> {label}
        </button>
    );

    return (
        <ModalShell onClose={requestClose} maxWidth='max-w-xl'>
            <ModalHeader
                icon={Wallet}
                title={type === 'ADVANCE' ? 'Tạo phiếu tạm ứng sản xuất' : 'Tạo yêu cầu thanh toán'}
                subtitle={type === 'ADVANCE' ? 'Tạm ứng kinh phí thực hiện & quyết toán hoàn ứng sau khi hoàn thành' : 'Chi phí sản xuất, khoán việc & gửi Admin Sale duyệt'}
                onClose={requestClose}
            />

            <form id='payment-request-form' onSubmit={handleSubmit} className='flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6'>
                {/* 1. Loại yêu cầu */}
                <div>
                    <label className={labelCls}>
                        Loại yêu cầu <span className='text-red-500'>*</span>
                    </label>
                    <div className='grid grid-cols-3 gap-1 rounded-lg bg-orange-50 p-1'>
                        {typeBtn('PROJECT', Briefcase, 'Theo dự án', () => { setType('PROJECT'); handleProjectChange(projectId, 'PROJECT'); })}
                        {typeBtn('OTHER_WORK', ClipboardList, 'Công việc khác', () => { setType('OTHER_WORK'); handleProjectChange('', 'OTHER_WORK'); })}
                        {typeBtn('ADVANCE', Wallet, 'Tạm ứng', () => { setType('ADVANCE'); handleProjectChange(projectId, 'ADVANCE'); })}
                    </div>
                    <p className='mt-2 flex items-start gap-1.5 text-xs text-stone-500'>
                        <Info size={13} className='mt-0.5 shrink-0 text-orange-500' />
                        {type === 'ADVANCE' ? (
                            <span>Phiếu tạm ứng chi phí sản xuất: Kế toán duyệt và chi tiền trước; nhân sự hoàn ứng đầy đủ chứng từ sau khi nghiệm thu.</span>
                        ) : (
                            <span>Khi giao việc cho vendor, hệ thống tự tạo sẵn yêu cầu (thuộc loại “Theo dự án”), bạn không cần tạo thủ công.</span>
                        )}
                    </p>
                </div>

                {/* 2. Chọn dự án & Công việc */}
                {isProjectBased && (
                    <div className='space-y-3'>
                        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                            <div>
                                <label className={labelCls}>
                                    Dự án <span className='text-red-500'>*</span>
                                </label>
                                <Select
                                    value={projectOptions.find((opt) => opt.value === projectId) || null}
                                    onChange={(opt) => handleProjectChange(opt ? opt.value : '')}
                                    options={projectOptions}
                                    placeholder='-- Tìm kiếm & chọn dự án --'
                                    noOptionsMessage={() => (activeProjects.length === 0 ? 'Không có dự án đang hoạt động' : 'Không tìm thấy dự án phù hợp')}
                                    isClearable
                                    isSearchable
                                    filterOption={customFilterOption}
                                    styles={getSelectStyles(isProjectMissing)}
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    menuPosition='fixed'
                                />
                                {activeProjects.length < (projects?.length || 0) && (
                                    <p className='mt-1 text-[11px] text-stone-400'>
                                        * Đã ẩn các dự án đã đóng hoặc tạm dừng.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className={labelCls}>
                                    Công việc của bạn <span className='text-red-500'>*</span>
                                </label>
                                <Select
                                    value={taskOptions.find((opt) => opt.value === taskId) || null}
                                    onChange={(opt) => {
                                        setTaskId(opt ? opt.value : '');
                                        setError('');
                                    }}
                                    options={taskOptions}
                                    placeholder={
                                        !projectId
                                            ? '-- Vui lòng chọn dự án trước --'
                                            : isLoadingTasks
                                                ? 'Đang tải công việc...'
                                                : myProjectTasks.length === 0
                                                    ? 'Không có công việc phù hợp'
                                                    : '-- Tìm kiếm & chọn công việc --'
                                    }
                                    noOptionsMessage={() => 'Không tìm thấy công việc phù hợp'}
                                    isDisabled={!projectId || isLoadingTasks}
                                    isLoading={isLoadingTasks}
                                    isClearable
                                    isSearchable
                                    filterOption={customFilterOption}
                                    styles={getSelectStyles(isTaskMissing)}
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    menuPosition='fixed'
                                />
                                {projectId && !isLoadingTasks && !isTasksError && myProjectTasks.length === 0 && (
                                    <p className='mt-1 text-xs text-orange-600'>
                                        {hasAnyAssignedTaskInProject
                                            ? 'Dự án này chưa có công việc nào của bạn thuộc dịch vụ có quản lý ngân sách (isBudget).'
                                            : 'Bạn chưa được giao công việc nào trong dự án này'}
                                    </p>
                                )}
                                {isTasksError && (
                                    <p className='mt-1 flex items-center gap-1 text-xs text-red-600'>
                                        <AlertCircle size={12} /> Không tải được danh sách công việc
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Box Đối Soát Ngân Sách Dịch Vụ 2 Tầng */}
                        {taskId && (
                            <ServiceBudgetBox
                                budgetInfo={budgetInfo}
                                isLoading={isLoadingBudget}
                                amount={amount}
                                overBudgetReason={overBudgetReason}
                                setOverBudgetReason={setOverBudgetReason}
                            />
                        )}
                    </div>
                )}

                {type === 'OTHER_WORK' && (
                    <div>
                        <label className={labelCls}>
                            Công việc (không thuộc dự án) <span className='text-xs font-normal text-stone-400'>(tùy chọn)</span>
                        </label>
                        <Select
                            value={nonProjectTaskOptions.find((opt) => opt.value === taskId) || null}
                            onChange={(opt) => {
                                setTaskId(opt ? opt.value : '');
                                setError('');
                            }}
                            options={nonProjectTaskOptions}
                            placeholder={
                                isLoadingOtherTasks
                                    ? 'Đang tải công việc...'
                                    : '-- Tìm kiếm & chọn công việc không thuộc dự án (nếu có) --'
                            }
                            noOptionsMessage={() => 'Không tìm thấy công việc'}
                            isDisabled={isLoadingOtherTasks}
                            isLoading={isLoadingOtherTasks}
                            isClearable
                            isSearchable
                            filterOption={customFilterOption}
                            styles={getSelectStyles(false)}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            menuPosition='fixed'
                        />
                        {!isLoadingOtherTasks && !isOtherTasksError && nonProjectTasks.length === 0 && (
                            <p className='mt-1 text-xs text-stone-400'>Bạn chưa có công việc nào không thuộc dự án (có thể để trống)</p>
                        )}
                        {isOtherTasksError && (
                            <p className='mt-1 flex items-center gap-1 text-xs text-red-600'>
                                <AlertCircle size={12} /> Không tải được danh sách công việc
                            </p>
                        )}
                    </div>
                )}


                {/* 4. Nội dung yêu cầu */}
                <div>
                    <label className={labelCls}>
                        Nội dung <span className='text-red-500'>*</span>
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => { setContent(e.target.value); setError(''); }}
                        rows={2}
                        placeholder={type === 'ADVANCE' ? 'Mô tả mục đích tạm ứng kinh phí sản xuất, các khoản dự kiến chi...' : 'Mô tả nội dung chi phí sản xuất, họ tên đối tác/talent, công việc...'}
                        className={cn(inputCls, isContentMissing && 'border-red-400 focus:border-red-500 bg-red-50/20')}
                    />
                </div>

                {/* 5. Số tiền & Hạn thanh toán */}
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <div>
                        <label className={labelCls}>
                            Số tiền {type === 'ADVANCE' ? 'tạm ứng' : ''} <span className='text-red-500'>*</span>
                        </label>
                        <AmountInput
                            value={amount}
                            onChange={(val) => { setAmount(val); setError(''); }}
                            className={isAmountMissing ? 'border-red-400 focus:border-red-500 bg-red-50/20' : ''}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>
                            Thời hạn thanh toán {type === 'ADVANCE' ? '(nhận tiền)' : ''} <span className='text-red-500'>*</span>
                        </label>
                        <DueDateField
                            value={dueDate}
                            onChange={(val) => { setDueDate(val); setError(''); }}
                            hasError={isDueDateMissing}
                        />
                    </div>
                </div>

                {/* Hạn hoàn ứng dự kiến cho phiếu tạm ứng */}
                {type === 'ADVANCE' && (
                    <div className='rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 space-y-1.5'>
                        <div className='flex items-center justify-between'>
                            <label className={labelCls}>
                                Hạn hoàn ứng dự kiến <span className='text-red-500'>*</span>
                            </label>
                            <span className='text-[11px] text-indigo-700 font-medium'>
                                Thời điểm dự kiến nộp đủ chứng từ quyết toán
                            </span>
                        </div>
                        <DueDateField
                            value={settlementDueDate}
                            onChange={(val) => { setSettlementDueDate(val); setError(''); }}
                            hasError={isSettlementDueDateMissing}
                        />
                    </div>
                )}

                {/* 6. Cờ Thanh toán gấp (Studio yêu cầu thanh toán ngay) */}
                <label className='flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 cursor-pointer hover:bg-amber-100/60 transition'>
                    <input
                        type='checkbox'
                        checked={isUrgent}
                        onChange={(e) => setIsUrgent(e.target.checked)}
                        className='h-4 w-4 rounded border-amber-300 text-orange-600 focus:ring-orange-500'
                    />
                    <div className='min-w-0 flex-1'>
                        <span className='text-xs font-bold text-amber-900 flex items-center gap-1.5'>
                            <Zap size={14} className='text-amber-600 fill-amber-500' />
                            Studio yêu cầu thanh toán gấp (sau buổi quay)
                        </span>
                        <span className='text-[11px] text-amber-800/80 block mt-0.5 leading-tight'>
                            Áp dụng khi đã có thỏa thuận Studio cần trả ngay; hệ thống sẽ ưu tiên duyệt và chi nhanh.
                        </span>
                    </div>
                </label>

                {/* Banner giải thích cho phiếu tạm ứng */}
                {type === 'ADVANCE' && (
                    <div className='rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-900'>
                        <div className='flex items-start gap-2'>
                            <Info size={16} className='text-indigo-600 shrink-0 mt-0.5' />
                            <div>
                                <p className='font-bold'>Chính sách hoàn ứng sản xuất 2 pha:</p>
                                <p className='mt-0.5 text-indigo-800 leading-relaxed'>
                                    Phiếu tạm ứng <strong>chưa bắt buộc nộp hóa đơn/biên bản nghiệm thu ngay</strong>. Bạn có thể đính kèm Kế hoạch/Dự toán sơ bộ bên dưới (nếu có). Sau khi hoàn thành công việc và giải ngân xong, bạn sẽ nộp đầy đủ 4 mục chứng từ thực tế tại bước <strong>Quyết toán hoàn ứng</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. Bộ Hồ Sơ Chứng Từ Sản Xuất (Đều là TÙY CHỌN / OPTIONAL) */}
                <div className='space-y-2.5 pt-1'>
                    <div className='flex items-center justify-between'>
                        <label className={labelCls}>
                            {type === 'ADVANCE' ? 'Hồ sơ dự toán / Kế hoạch tạm ứng' : 'Hồ sơ chứng từ sản xuất'} <span className='text-xs font-normal text-stone-400'>(tùy chọn)</span>
                        </label>
                        <span className='text-[11px] text-stone-400'>
                            Đã tải: {attachedFiles.length} file
                        </span>
                    </div>

                    {/* Option C: Tự động đổi tên theo chuẩn Getvini */}
                    <label className='flex items-center gap-2.5 rounded-lg border border-gray-200 bg-orange-50/50 p-2.5 cursor-pointer hover:bg-orange-100/50 transition'>
                        <input
                            type='checkbox'
                            checked={autoStandardizeFileName}
                            onChange={(e) => handleToggleAutoStandardize(e.target.checked)}
                            className='h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500'
                        />
                        <div className='min-w-0 flex-1'>
                            <span className='text-xs font-semibold text-stone-800 block'>
                                Tự động đổi tên file theo công thức chuẩn Getvini khi tải lên
                            </span>
                            <span className='text-[10px] text-stone-500 block leading-tight mt-0.5'>
                                Bật để áp dụng công thức <strong>ngày tháng năm / dự án / năm / LOẠI-GETVINI</strong>; bạn vẫn có thể chuyển đổi về tên gốc trên từng file bất kỳ lúc nào.
                            </span>
                        </div>
                    </label>

                    {/* Mục 1: Hợp đồng khoán việc */}
                    <DocumentUploadBox
                        title='1. Hợp đồng khoán việc'
                        icon={FileSignature}
                        docType='LABOR_CONTRACT'
                        hint='Tên file mẫu: ngày tháng năm/tên dự án/năm/HDKV-GETVINI (hỗ trợ .docx, .pdf, ảnh)'
                        files={attachedFiles}
                        onUpload={handleUploadForDocType}
                        onRemove={handleRemoveFile}
                        onToggleName={handleToggleFileName}
                        onAddLink={handleAddLink}
                        disabled={isSubmitting || isUploadingFiles}
                    />

                    {/* Mục 2: Biên bản nghiệm thu */}
                    <DocumentUploadBox
                        title='2. Biên bản nghiệm thu'
                        icon={ClipboardList}
                        docType='ACCEPTANCE_MINUTE'
                        hint='Tên file mẫu: ngày tháng năm/tên dự án/năm/BBNT-GETVINI (hỗ trợ .docx, .pdf, ảnh)'
                        files={attachedFiles}
                        onUpload={handleUploadForDocType}
                        onRemove={handleRemoveFile}
                        onToggleName={handleToggleFileName}
                        onAddLink={handleAddLink}
                        disabled={isSubmitting || isUploadingFiles}
                    />

                    {/* Mục 3: Phụ lục phát sinh */}
                    <DocumentUploadBox
                        title='3. Phụ lục phát sinh'
                        icon={FileText}
                        docType='ADDENDUM'
                        hint='Tên file mẫu: ngày tháng năm/tên dự án/năm/PLHDPhatSinh-GETVINI (hỗ trợ .docx, .pdf, ảnh)'
                        files={attachedFiles}
                        onUpload={handleUploadForDocType}
                        onRemove={handleRemoveFile}
                        onToggleName={handleToggleFileName}
                        onAddLink={handleAddLink}
                        disabled={isSubmitting || isUploadingFiles}
                    />

                    {/* Mục 4: Hóa đơn VAT (Chỉ áp dụng nếu bên nhận là Công ty / Pháp nhân) */}
                    <DocumentUploadBox
                        title='4. Hóa đơn VAT'
                        icon={Receipt}
                        docType='VAT_INVOICE'
                        hint='Tên file mẫu: ngày tháng năm/tên dự án/năm/HDVAT-GETVINI (PDF hoặc ảnh scan)'
                        files={attachedFiles}
                        onUpload={handleUploadForDocType}
                        onRemove={handleRemoveFile}
                        onToggleName={handleToggleFileName}
                        onAddLink={handleAddLink}
                        disabled={isSubmitting || isUploadingFiles}
                    />

                    {/* Mục 5: Giấy đề nghị thanh toán */}
                    <DocumentUploadBox
                        title='5. Giấy đề nghị thanh toán'
                        icon={FileText}
                        docType='PAYMENT_REQUEST_DOC'
                        hint='Tên file mẫu: ngày tháng năm/tên dự án/năm/DNTT-GETVINI (hỗ trợ .docx, .pdf)'
                        files={attachedFiles}
                        onUpload={handleUploadForDocType}
                        onRemove={handleRemoveFile}
                        onToggleName={handleToggleFileName}
                        onOpenCreateModal={() => setIsDocModalOpen(true)}
                        onAddLink={handleAddLink}
                        disabled={isSubmitting || isUploadingFiles}
                    />

                    {/* Mục 6: Các hóa đơn khác */}
                    <DocumentUploadBox
                        title='6. Các hóa đơn khác'
                        icon={Receipt}
                        docType='OTHER_INVOICE'
                        hint='Tên file mẫu: ngày tháng năm/tên dự án/năm/HDKHAC-GETVINI (hóa đơn bán lẻ, biên lai, vé, bill khác...)'
                        files={attachedFiles}
                        onUpload={handleUploadForDocType}
                        onRemove={handleRemoveFile}
                        onToggleName={handleToggleFileName}
                        onAddLink={handleAddLink}
                        disabled={isSubmitting || isUploadingFiles}
                    />
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

            {isDocModalOpen && (() => {
                const existingDoc = attachedFiles.find((f) => f.isGeneratedDoc)?.docData;
                return (
                    <PaymentRequestDocCreateModal
                        isOpen={isDocModalOpen}
                        onClose={() => setIsDocModalOpen(false)}
                        initialData={{
                            requesterName: me?.fullName || me?.name || existingDoc?.requesterName || '',
                            role: me?.role,
                            voucherNo: existingDoc?.voucherNo,
                            position: existingDoc?.position || getPositionByRole(me?.role),
                            department: existingDoc?.department || getDepartmentByRole(me?.role),
                            projectName: type === 'OTHER_WORK' ? 'CongViecKhac' : (projects?.find((p) => p.id === projectId)?.name || existingDoc?.projectName || ''),
                            amount: (amount !== '' && amount !== null && amount !== undefined) ? amount : (existingDoc?.amount !== undefined ? existingDoc.amount : ''),
                            reason: content?.trim() || existingDoc?.reason || '',
                            dueDate: dueDate || existingDoc?.dueDate || '',
                            requestType: type,
                        }}
                        onApplyDoc={handleApplyDocFromModal}
                        onUploadFile={handleUploadForDocType}
                    />
                );
            })()}
        </ModalShell>
    );
};
