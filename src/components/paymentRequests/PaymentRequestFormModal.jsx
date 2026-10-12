import { useMemo, useRef, useState } from 'react';
import {
    Briefcase, ClipboardList, Calendar, Wallet, Info,
    Upload, Image as ImageIcon, File as FileIcon, Loader2, Trash2, AlertCircle,
    Copy, Check, FileText, Zap, FileSignature, Receipt
} from 'lucide-react';
import { useGetTasksByProjectQuery, useGetTasksQuery } from '../../api/tasks';
import { useUploadPaymentRequestInvoiceFileMutation, useGetPaymentRequestsQuery } from '../../api/paymentRequests';
import { useGetMeQuery } from '../../api/auth';
import { cn } from '../../utils/cn';
import { ModalShell, ModalHeader, AmountInput } from './PaymentRequestParts';
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
    if (projectName && projectName.trim()) {
        const clean = projectName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
        if (clean) return clean;
    }
    return requestType === 'OTHER_WORK' ? 'CongViecKhac' : 'GETVINI';
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

// Component Upload chứng từ độc lập cho từng mục (HĐKV, BBNT, Phụ lục, Hóa đơn VAT)
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
    disabled,
    maxFiles = 5
}) => {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
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

    return (
        <div className='rounded-xl border border-stone-200 bg-white p-3 space-y-2 transition hover:border-orange-200'>
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
                <button
                    type='button'
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || isFull}
                    className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition',
                        isFull
                            ? 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50'
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
            {hint && (
                <p className='text-[10px] text-stone-400 leading-tight'>{hint}</p>
            )}

            {/* Khung thả file nhanh khi chưa có file */}
            {boxFiles.length === 0 ? (
                <div
                    onDragOver={(e) => { e.preventDefault(); if (!isFull) setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !isFull && inputRef.current?.click()}
                    className={cn(
                        'flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed py-2 px-3 text-center transition',
                        isDragging ? 'border-orange-400 bg-orange-50' : 'border-stone-200 hover:border-orange-300 hover:bg-orange-50/30'
                    )}
                >
                    <Upload size={13} className='text-stone-400 shrink-0' />
                    <span className='text-[11px] text-stone-500'>Kéo thả hoặc bấm để chọn (tối đa 5 file, mỗi file &le; 15MB)</span>
                </div>
            ) : (
                <div className='space-y-1.5 pt-0.5'>
                    {boxFiles.map((f) => {
                        const isUsingStandard = f.isStandard ?? Boolean(f.standardName && f.name === f.standardName);
                        const hasAlternative = Boolean(f.standardName && f.originalName && f.standardName !== f.originalName);

                        return (
                            <div
                                key={f.id || f.publicId || f.url || f.tempId}
                                className='rounded-lg border border-stone-200 bg-stone-50/90 p-2 text-xs transition hover:border-stone-300 space-y-1.5'
                            >
                                <div className='flex items-center gap-2.5'>
                                    <div className={cn(
                                        'flex h-6 w-6 shrink-0 items-center justify-center rounded',
                                        f.fileType === 'PDF' ? 'bg-red-100 text-red-600' :
                                        f.fileType === 'DOC' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                    )}>
                                        {f.fileType === 'PDF' ? <FileIcon size={12} /> :
                                         f.fileType === 'DOC' ? <FileText size={12} /> : <ImageIcon size={12} />}
                                    </div>
                                    <div className='min-w-0 flex-1'>
                                        <div className='flex items-center gap-1.5'>
                                            <p className='truncate text-xs font-semibold text-stone-800' title={f.name}>
                                                {f.name}
                                            </p>
                                            {isUsingStandard ? (
                                                <span className='shrink-0 rounded bg-emerald-50 px-1 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200'>
                                                    Chuẩn Getvini
                                                </span>
                                            ) : (
                                                <span className='shrink-0 rounded bg-stone-200/70 px-1 py-0.2 text-[9px] font-medium text-stone-600'>
                                                    Tên gốc
                                                </span>
                                            )}
                                        </div>
                                        {f.size ? <p className='text-[10px] text-stone-400 mt-0.5'>{(f.size / 1024).toFixed(0)} KB</p> : null}
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

                                {/* Option B: Nút chuyển đổi nhanh giữa tên chuẩn & tên gốc */}
                                {!f.uploading && hasAlternative && onToggleName && (
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

export const PaymentRequestFormModal = ({ projects, onClose, onSubmit, isSubmitting, currentUserId }) => {
    const [type, setType] = useState('PROJECT');
    const [projectId, setProjectId] = useState('');
    const [taskId, setTaskId] = useState('');
    const [content, setContent] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [autoStandardizeFileName, setAutoStandardizeFileName] = useState(true);
    const [attachedFiles, setAttachedFiles] = useState([]); // { name, standardName, originalName, url, size, fileType, publicId, uploading?, tempId, docType }
    const [error, setError] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const { data: projectTasks = [], isFetching: isLoadingTasks, isError: isTasksError } = useGetTasksByProjectQuery(
        projectId,
        { skip: !projectId || type !== 'PROJECT' }
    );
    const { data: userTasksData, isFetching: isLoadingOtherTasks, isError: isOtherTasksError } = useGetTasksQuery(
        { assigneeId: currentUserId, limit: 500 },
        { skip: !currentUserId || type !== 'OTHER_WORK' }
    );
    useGetMeQuery();
    const [uploadInvoiceFile] = useUploadPaymentRequestInvoiceFileMutation();

    const { data: projectRequestsData } = useGetPaymentRequestsQuery(
        { projectId, limit: 100 },
        { skip: !projectId || type !== 'PROJECT' }
    );

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
        () => projectTasks.filter((t) => t.assigneeId === currentUserId || t.assignee?.id === currentUserId),
        [projectTasks, currentUserId]
    );

    const nonProjectTasks = useMemo(() => {
        const list = Array.isArray(userTasksData) ? userTasksData : userTasksData?.data || [];
        return list.filter((t) => (!t.projectId && !t.project?.id) && (!currentUserId || t.assigneeId === currentUserId || t.assignee?.id === currentUserId));
    }, [userTasksData, currentUserId]);

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
                projectId: type === 'PROJECT' ? projectId : undefined,
                taskId: taskId || undefined,
                content: content.trim(),
                amount: Number(amount),
                dueDate,
                isUrgent,
                invoiceImages,
                invoicePdfs,
            });
        } catch (err) {
            setError(err?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    const isProjectMissing = hasSubmitted && type === 'PROJECT' && !projectId;
    const isTaskMissing = hasSubmitted && type === 'PROJECT' && !taskId;
    const isContentMissing = hasSubmitted && !content.trim();
    const isAmountMissing = hasSubmitted && (!amount || Number(amount) <= 0);
    const isDueDateMissing = hasSubmitted && !dueDate;

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
        <ModalShell onClose={requestClose} maxWidth='max-w-xl'>
            <ModalHeader
                icon={Wallet}
                title='Tạo yêu cầu thanh toán'
                subtitle='Chi phí sản xuất, khoán việc & gửi Admin Sale duyệt'
                onClose={requestClose}
            />

            <form id='payment-request-form' onSubmit={handleSubmit} className='flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6'>
                {/* 1. Loại yêu cầu */}
                <div>
                    <label className={labelCls}>
                        Loại yêu cầu <span className='text-red-500'>*</span>
                    </label>
                    <div className='grid grid-cols-2 gap-1 rounded-lg bg-orange-50 p-1'>
                        {typeBtn('PROJECT', Briefcase, 'Theo dự án', () => { setType('PROJECT'); handleProjectChange(projectId, 'PROJECT'); })}
                        {typeBtn('OTHER_WORK', ClipboardList, 'Công việc khác', () => { setType('OTHER_WORK'); handleProjectChange('', 'OTHER_WORK'); })}
                    </div>
                    <p className='mt-2 flex items-start gap-1.5 text-xs text-stone-500'>
                        <Info size={13} className='mt-0.5 shrink-0 text-orange-500' />
                        Khi giao việc cho vendor, hệ thống tự tạo sẵn yêu cầu (thuộc loại “Theo dự án”), bạn không cần tạo thủ công.
                    </p>
                </div>

                {/* 2. Chọn dự án & Công việc */}
                {type === 'PROJECT' && (
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        <div>
                            <label className={labelCls}>
                                Dự án <span className='text-red-500'>*</span>
                            </label>
                            <select
                                value={projectId}
                                onChange={(e) => handleProjectChange(e.target.value)}
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
                            Công việc (không thuộc dự án) <span className='text-xs font-normal text-stone-400'>(tùy chọn)</span>
                        </label>
                        <select
                            value={taskId}
                            onChange={(e) => { setTaskId(e.target.value); setError(''); }}
                            disabled={isLoadingOtherTasks}
                            className={inputCls}
                        >
                            <option value=''>
                                {isLoadingOtherTasks ? 'Đang tải công việc...' : '-- Chọn công việc không thuộc dự án (nếu có) --'}
                            </option>
                            {nonProjectTasks.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name} {t.code ? `(${t.code})` : ''}
                                </option>
                            ))}
                        </select>
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
                        placeholder='Mô tả nội dung chi phí sản xuất, họ tên đối tác/talent, công việc...'
                        className={cn(inputCls, isContentMissing && 'border-red-400 focus:border-red-500 bg-red-50/20')}
                    />
                </div>

                {/* 5. Số tiền & Hạn thanh toán */}
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

                {/* 7. Bộ Hồ Sơ Chứng Từ Sản Xuất (Đều là TÙY CHỌN / OPTIONAL) */}
                <div className='space-y-2.5 pt-1'>
                    <div className='flex items-center justify-between'>
                        <label className={labelCls}>
                            Hồ sơ chứng từ sản xuất <span className='text-xs font-normal text-stone-400'>(tùy chọn)</span>
                        </label>
                        <span className='text-[11px] text-stone-400'>
                            Đã tải: {attachedFiles.length} file
                        </span>
                    </div>

                    {/* Option C: Tự động đổi tên theo chuẩn Getvini */}
                    <label className='flex items-center gap-2.5 rounded-lg border border-orange-200 bg-orange-50/50 p-2.5 cursor-pointer hover:bg-orange-100/50 transition'>
                        <input
                            type='checkbox'
                            checked={autoStandardizeFileName}
                            onChange={(e) => handleToggleAutoStandardize(e.target.checked)}
                            className='h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500'
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
        </ModalShell>
    );
};
