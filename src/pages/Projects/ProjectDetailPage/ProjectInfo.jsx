import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    Briefcase,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Download,
    FileText,
    History,
    Loader2,
    PackageCheck,
    Paperclip,
    Plus,
    Send,
    Sparkles,
    Trash2,
    Upload,
    XCircle
} from 'lucide-react';
import {
    useAiFormatProjectProductDescriptionMutation,
    useApproveProjectProductDescriptionMutation,
    useCreateProjectProductDescriptionMutation,
    useExtractProjectProductDescriptionFileMutation,
    useGetProjectProductDescriptionsQuery,
    useRejectProjectProductDescriptionMutation,
    useSubmitProjectProductDescriptionMutation,
    useUpdateProjectMutation,
    useUpdateProjectProductDescriptionMutation,
} from '../../../api/projects';
import { useGetMeQuery } from '../../../api/auth';
import { getCurrentUserId, getUserAccountRole, isSameUser } from '../../../utils/authUser';
import { TEAM_MEMBER_ROLE } from '../../../utils/enums';
import { getFilePreviewUrl, uploadToCloudinary } from '../../../utils/cloudinary';
import { htmlToPlainText } from '../../../utils/html';
import { toast } from 'react-toastify';
import { Modal } from '../../../components/ui/Modal';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { generateProductDescriptionPdf } from '../../../utils/productDescriptionPdf';

const STATUS_LABELS = {
    DRAFT: 'Bản nháp',
    PENDING_REVIEW: 'Chờ PM duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Không duyệt',
};

const STATUS_COLORS = {
    DRAFT: 'bg-slate-50 text-slate-700 border-slate-200',
    PENDING_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const MAIN_STATUSES = ['APPROVED', 'PENDING_REVIEW', 'DRAFT'];

const formatDateTime = (value) => {
    if (!value) return 'Chưa có';

    return new Date(value).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatDateOnly = (value) => {
    if (!value) return 'Chưa xác định';
    return new Date(value).toLocaleDateString('vi-VN');
};

const toDateInputValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateOnly = (value) => {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00`);
    }
    return new Date(value);
};

const getProjectTimeline = (startDate, endDate) => {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);

    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return {
            hasTimeline: false,
            percent: 0,
            label: 'Chưa xác định',
            remainingText: 'Chưa có đủ ngày bắt đầu và ngày kết thúc từ cơ hội',
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
        return {
            hasTimeline: false,
            percent: 0,
            label: 'Ngày không hợp lệ',
            remainingText: 'Ngày kết thúc đang nhỏ hơn ngày bắt đầu',
        };
    }

    const totalMs = Math.max(end.getTime() - start.getTime(), 1);
    const elapsedMs = today.getTime() - start.getTime();
    const percent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (today < start) {
        const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / oneDayMs);
        return {
            hasTimeline: true,
            percent: 0,
            label: 'Chưa bắt đầu',
            remainingText: `Còn ${daysUntilStart} ngày đến ngày bắt đầu`,
        };
    }

    if (today > end) {
        const daysOver = Math.ceil((today.getTime() - end.getTime()) / oneDayMs);
        return {
            hasTimeline: true,
            percent: 100,
            label: 'Đã quá hạn',
            remainingText: `Quá hạn ${daysOver} ngày so với kế hoạch`,
        };
    }

    const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / oneDayMs);
    return {
        hasTimeline: true,
        percent,
        label: 'Đang thực hiện',
        remainingText: daysRemaining === 0 ? 'Hôm nay là ngày kết thúc theo kế hoạch' : `Còn ${daysRemaining} ngày theo kế hoạch`,
    };
};

const SPEC_TYPE_OPTIONS = [
    { value: 'text', label: 'Chữ tự do', inputType: 'text' },
    { value: 'number', label: 'Số', inputType: 'number' },
    { value: 'percent', label: 'Phần trăm', inputType: 'number' },
    { value: 'currency', label: 'Tiền tệ', inputType: 'number' },
    { value: 'date', label: 'Ngày', inputType: 'date' },
    { value: 'url', label: 'Link', inputType: 'url' },
];

const getSpecInputType = (type) => SPEC_TYPE_OPTIONS.find((opt) => opt.value === type)?.inputType || 'text';

const emptySpec = () => ({ key: '', value: '', type: 'text', useSubKeys: false, subKeys: [{ key: '', value: '' }] });

const emptyProduct = () => ({
    id: null,
    productName: '',
    note: '',
    fileUrl: '',
    fileName: '',
    extractedText: '',
    documents: [],
    docUploading: false,
    docUploadProgress: 0,
    docsUploading: false,
    extracting: false,
    aiFormatting: false,
    collapsed: true,
});

const toEditableProduct = (item) => ({
    id: item?.id || null,
    productName: item?.productName || '',
    note: item?.note || '',
    fileUrl: item?.fileUrl || '',
    fileName: item?.fileName || '',
    extractedText: item?.extractedText || '',
    documents: Array.isArray(item?.documents) ? item.documents : [],
    docUploading: false,
    docUploadProgress: 0,
    docsUploading: false,
    extracting: false,
    aiFormatting: false,
    collapsed: true,
});

const ProductSpecsView = ({ item }) => {
    const documents = Array.isArray(item?.documents) ? item.documents : [];
    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const [isTextOverflowing, setIsTextOverflowing] = useState(false);
    const textRef = useRef(null);

    useLayoutEffect(() => {
        const el = textRef.current;
        if (!el) {
            setIsTextOverflowing(false);
            return;
        }
        setIsTextOverflowing(el.scrollHeight > el.clientHeight + 1);
    }, [item?.extractedText]);

    return (
        <div className="min-w-0 space-y-2">
            {item?.extractedText && (
                <div className="rounded-lg border border-slate-300 bg-slate-50">
                    <div
                        ref={textRef}
                        className={`rich-content px-3 py-2 text-sm font-medium text-slate-900 ${isTextExpanded ? 'max-h-96 overflow-y-auto' : 'line-clamp-6'}`}
                        dangerouslySetInnerHTML={{ __html: item.extractedText }}
                    />
                    {isTextOverflowing && (
                        <button
                            type="button"
                            onClick={() => setIsTextExpanded((prev) => !prev)}
                            className="flex w-full items-center justify-center gap-1 border-t border-slate-200 py-1 text-[11px] font-bold text-blue-600 hover:bg-slate-100"
                        >
                            {isTextExpanded ? (
                                <>
                                    Thu gọn <ChevronUp className="w-3 h-3" />
                                </>
                            ) : (
                                <>
                                    Xem đầy đủ <ChevronDown className="w-3 h-3" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
            {item?.note && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Chú thích</p>
                    <div
                        className="rich-content mt-0.5 text-xs italic text-slate-400"
                        dangerouslySetInnerHTML={{ __html: item.note }}
                    />
                </div>
            )}
            {item?.fileUrl && (
                <a
                    href={getFilePreviewUrl(item.fileUrl, 'FILE')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                    <FileText className="w-3 h-3 shrink-0" />
                    <span className="truncate">{item.fileName || 'Tài liệu thông tin chuẩn'}</span>
                </a>
            )}
            {documents.length > 0 && (
                <div className="flex flex-col gap-1">
                    {documents.map((doc, docIdx) => (
                        <a
                            key={docIdx}
                            href={getFilePreviewUrl(doc?.url, 'FILE')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                            <Paperclip className="w-3 h-3 shrink-0" />
                            <span className="truncate">{doc?.name || 'Tài liệu bổ sung'}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

const ProductItemCard = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="flex flex-col gap-2 rounded-lg bg-white p-3">
            <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="flex items-center justify-between gap-2 text-left outline-none"
            >
                <p className="min-w-0 shrink-0 text-sm font-bold text-gray-800">{item?.productName || 'Chưa có tên sản phẩm'}</p>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
                ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                )}
            </button>
            {isExpanded && <ProductSpecsView item={item} />}
        </div>
    );
};

const VersionCard = ({ submission, canReview, canEditSubmission, onApprove, onReject, onEdit, isReviewing, projectName }) => {
    const [isRejectingInline, setIsRejectingInline] = useState(false);
    const [reviewNote, setReviewNote] = useState('');

    const handleCancelReject = () => {
        setIsRejectingInline(false);
        setReviewNote('');
    };

    const handleConfirmReject = async () => {
        await onReject(submission.id, reviewNote);
        handleCancelReject();
    };

    const handleDownloadPdf = () => {
        const items = Array.isArray(submission.items) ? submission.items : [];
        generateProductDescriptionPdf({
            title: submission.versionNumber ? `Thong tin chuan san pham - Version ${submission.versionNumber}` : 'Thong tin chuan san pham',
            projectName,
            items,
        });
    };

    return (
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-gray-900">
                            {submission.versionNumber ? `Version ${submission.versionNumber}` : 'Bản gửi chờ duyệt'}
                        </h4>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[submission.status] || STATUS_COLORS.DRAFT}`}>
                            {STATUS_LABELS[submission.status] || submission.status}
                        </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-gray-400">
                        Người tạo: {submission.createdBy?.fullName || 'Không xác định'}
                        {submission.reviewedBy?.fullName ? ` - Người duyệt: ${submission.reviewedBy.fullName}` : ''}
                    </p>
                    {submission.reviewNote && (
                        <p className="mt-2 text-sm italic text-rose-600">{submission.reviewNote}</p>
                    )}
                </div>

                <div className="flex shrink-0 gap-2">
                    <button
                        type="button"
                        onClick={handleDownloadPdf}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                        <Download className="w-4 h-4" />
                        Tải PDF
                    </button>
                    {canEditSubmission && ['DRAFT', 'REJECTED'].includes(submission.status) && (
                        <button
                            type="button"
                            onClick={() => onEdit(submission)}
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
                        >
                            <FileText className="w-4 h-4" />
                            Sửa
                        </button>
                    )}
                    {canReview && submission.status === 'PENDING_REVIEW' && (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsRejectingInline(true)}
                                disabled={isReviewing}
                                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                            >
                                <XCircle className="w-4 h-4" />
                                Không duyệt
                            </button>
                            <button
                                type="button"
                                onClick={() => onApprove(submission.id)}
                                disabled={isReviewing}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Duyệt
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isRejectingInline && (
                <div className="mt-4 rounded-xl border border-rose-100 bg-white p-3">
                    <label className="mb-2 block text-xs font-bold uppercase text-rose-600">Lý do không duyệt</label>
                    <textarea
                        rows="3"
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value)}
                        placeholder="Nhập lý do nếu cần..."
                        className="w-full resize-none rounded-lg border border-rose-100 px-3 py-2 text-sm outline-none focus:border-rose-300"
                    />
                    <div className="mt-3 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleCancelReject}
                            disabled={isReviewing}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmReject}
                            disabled={isReviewing}
                            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                            Xác nhận không duyệt
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-4 space-y-2">
                {(Array.isArray(submission.items) ? submission.items : []).map((item, index) => (
                    <ProductItemCard key={item?.id || index} item={item} />
                ))}
            </div>
        </div>
    );
};

const ProductDescriptionHistoryModal = ({ isOpen, onClose, submissions, canEditSubmission, onEdit }) => {
    const sortedSubmissions = useMemo(() => (
        submissions
            .filter(Boolean)
            .sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0))
    ), [submissions]);

    const handleEdit = (submission) => {
        onClose();
        onEdit(submission);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Lịch sử mô tả sản phẩm"
            className="max-w-4xl"
        >
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                {sortedSubmissions.length > 0 ? (
                    sortedSubmissions.map((submission) => (
                        <div key={submission.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="font-bold text-gray-900">
                                            {submission.versionNumber ? `Version ${submission.versionNumber}` : 'Bản gửi'}
                                        </h4>
                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[submission.status] || STATUS_COLORS.DRAFT}`}>
                                            {STATUS_LABELS[submission.status] || submission.status}
                                        </span>
                                    </div>
                                    <div className="mt-2 grid gap-1 text-xs font-medium text-gray-500 sm:grid-cols-2">
                                        <p>Người tạo: <span className="font-bold text-gray-700">{submission.createdBy?.fullName || 'Không xác định'}</span></p>
                                        <p>Thời điểm tạo: <span className="font-bold text-gray-700">{formatDateTime(submission.createdAt)}</span></p>
                                        <p>Người duyệt: <span className="font-bold text-gray-700">{submission.reviewedBy?.fullName || 'Chưa có'}</span></p>
                                        <p>Thời điểm duyệt: <span className="font-bold text-gray-700">{formatDateTime(submission.reviewedAt)}</span></p>
                                    </div>
                                    {submission.reviewNote && (
                                        <p className="mt-2 text-sm italic text-rose-600">{submission.reviewNote}</p>
                                    )}
                                </div>

                                {canEditSubmission && submission.status === 'REJECTED' && (
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(submission)}
                                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Sửa
                                    </button>
                                )}
                            </div>

                            <div className="mt-4 space-y-2">
                                {Array.isArray(submission.items) && submission.items.length > 0 ? (
                                    submission.items.map((item, index) => (
                                        <ProductItemCard key={item?.id || index} item={item} />
                                    ))
                                ) : (
                                    <p className="rounded-lg bg-white p-3 text-sm italic text-gray-400">Chưa có sản phẩm</p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-sm italic text-gray-400">
                        Chưa có lịch sử mô tả sản phẩm
                    </p>
                )}
            </div>
        </Modal>
    );
};

const ProductDescriptionSection = ({ project }) => {
    const { data: user } = useGetMeQuery();
    const projectId = project?.id;
    const { data: submissionResponse = [], isLoading } = useGetProjectProductDescriptionsQuery(projectId, {
        skip: !projectId,
    });
    const submissions = useMemo(() => (
        Array.isArray(submissionResponse) ? submissionResponse : []
    ), [submissionResponse]);
    const [createSubmission, { isLoading: isCreating }] = useCreateProjectProductDescriptionMutation();
    const [updateSubmission, { isLoading: isUpdating }] = useUpdateProjectProductDescriptionMutation();
    const [submitSubmission, { isLoading: isSubmitting }] = useSubmitProjectProductDescriptionMutation();
    const [approveSubmission, { isLoading: isApproving }] = useApproveProjectProductDescriptionMutation();
    const [rejectSubmission, { isLoading: isRejecting }] = useRejectProjectProductDescriptionMutation();
    const [extractFile] = useExtractProjectProductDescriptionFileMutation();
    const [aiFormat] = useAiFormatProjectProductDescriptionMutation();

    const currentUserId = getCurrentUserId(user);
    const userRole = getUserAccountRole(user);
    const isAdmin = ['ADMIN', 'BOD'].includes(userRole);
    const hasPendingSubmission = submissions.some((submission) => submission?.status === 'PENDING_REVIEW');
    const isAssignedPm = (userRole === 'PM' || isSameUser(project?.projectManager?.id, currentUserId)) &&
        project?.team?.members?.some((member) =>
            (member.role === 'PROJECT_MANAGER' || member.role === 'PM' || member.role === TEAM_MEMBER_ROLE.PROJECT_MANAGER) &&
            isSameUser(member.user?.id, currentUserId)
        );
    const isAccount = isSameUser(project?.team?.teamLead?.id, currentUserId) ||
        project?.team?.members?.some((member) =>
            (member.role === 'ACCOUNT' || member.role === 'LEAD' || member.role === TEAM_MEMBER_ROLE.ACCOUNT) &&
            isSameUser(member.user?.id, currentUserId)
        );
    const canManageSubmission = isAdmin || isAccount || isAssignedPm;
    const canReview = Boolean(isAssignedPm || isAdmin);
    const [products, setProducts] = useState([emptyProduct()]);
    const [loadedSubmissionId, setLoadedSubmissionId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const activeSubmission = useMemo(() => (
        submissions.find((submission) => submission?.id === loadedSubmissionId) || null
    ), [loadedSubmissionId, submissions]);
    const visibleSubmissions = useMemo(() => (
        submissions.filter((submission) => submission?.status && MAIN_STATUSES.includes(submission.status))
    ), [submissions]);
    const canEdit = canManageSubmission && isFormOpen && !hasPendingSubmission;

    useEffect(() => {
        if (loadedSubmissionId && !activeSubmission) {
            setProducts([emptyProduct()]);
            setLoadedSubmissionId(null);
            setIsFormOpen(false);
        }
    }, [activeSubmission, loadedSubmissionId]);

    const updateProduct = (index, patch) => {
        setProducts((prev) => prev.map((item, idx) => idx === index ? { ...item, ...patch } : item));
    };

    const addProduct = () => {
        setProducts((prev) => [...prev.map((item) => ({ ...item, collapsed: true })), emptyProduct()]);
    };

    const toggleProductCollapsed = (index) => {
        setProducts((prev) => prev.map((item, idx) => idx === index ? { ...item, collapsed: !item.collapsed } : item));
    };

    const removeProduct = (index) => {
        setProducts((prev) => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index));
    };

    const handleDocFileChange = async (productIndex, file) => {
        if (!file) return;
        updateProduct(productIndex, { docUploading: true, docUploadProgress: 0 });
        try {
            const uploaded = await uploadToCloudinary(
                file,
                'GETVINI/ERP/product-description',
                (progress) => updateProduct(productIndex, { docUploadProgress: progress })
            );
            updateProduct(productIndex, {
                fileUrl: uploaded.url,
                fileName: file.name,
                docUploading: false,
                docUploadProgress: 0,
                extracting: true,
            });
            try {
                const result = await extractFile({ projectId, fileUrl: uploaded.url }).unwrap();
                updateProduct(productIndex, {
                    extractedText: result?.extractedText || '',
                    hasComplexLayout: Boolean(result?.hasComplexLayout),
                    extracting: false,
                });
                if (result?.hasComplexLayout) {
                    toast.warn('File có nhiều cột/bảng phức tạp, vui lòng kiểm tra kỹ nội dung trích xuất trước khi gửi duyệt');
                }
            } catch (extractErr) {
                toast.error(extractErr?.data?.message || extractErr?.message || 'Trích xuất nội dung file thất bại');
                updateProduct(productIndex, { extracting: false });
            }
        } catch (err) {
            toast.error(err?.message || 'Tải file lên thất bại');
            updateProduct(productIndex, { docUploading: false, docUploadProgress: 0 });
        }
    };

    const handleAiFormat = async (productIndex) => {
        const product = products[productIndex];
        const rawText = htmlToPlainText(product?.extractedText || '');
        if (!rawText) {
            toast.error('Chưa có nội dung trích xuất để format');
            return;
        }
        updateProduct(productIndex, { aiFormatting: true });
        try {
            const result = await aiFormat({
                projectId,
                text: product.extractedText,
                productName: product.productName,
            }).unwrap();
            updateProduct(productIndex, {
                extractedText: result?.extractedText || product.extractedText,
                aiFormatting: false,
            });
        } catch (err) {
            toast.error(err?.data?.message || err?.message || 'AI formatting thất bại');
            updateProduct(productIndex, { aiFormatting: false });
        }
    };

    const handleAdditionalDocsChange = async (productIndex, fileList) => {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;
        updateProduct(productIndex, { docsUploading: true });
        try {
            const uploadedDocs = [];
            for (const file of files) {
                const uploaded = await uploadToCloudinary(file, 'GETVINI/ERP/product-description/attachments');
                uploadedDocs.push({ url: uploaded.url, name: file.name });
            }
            setProducts((prev) => prev.map((item, idx) => idx === productIndex
                ? { ...item, documents: [...item.documents, ...uploadedDocs], docsUploading: false }
                : item));
        } catch (err) {
            toast.error(err?.message || 'Tải tài liệu lên thất bại');
            updateProduct(productIndex, { docsUploading: false });
        }
    };

    const removeAdditionalDoc = (productIndex, docIndex) => {
        setProducts((prev) => prev.map((item, idx) => idx === productIndex
            ? { ...item, documents: item.documents.filter((_, dIdx) => dIdx !== docIndex) }
            : item));
    };

    const openCreateForm = () => {
        setProducts([emptyProduct()]);
        setLoadedSubmissionId(null);
        setIsFormOpen(true);
    };

    const openEditForm = (submission) => {
        const editableItems = Array.isArray(submission.items) ? submission.items : [];
        setProducts(editableItems.length ? editableItems.map(toEditableProduct) : [emptyProduct()]);
        setLoadedSubmissionId(submission.id);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setProducts([emptyProduct()]);
        setLoadedSubmissionId(null);
        setIsFormOpen(false);
    };

    const buildPayload = () => {
        const normalized = products.map((product, index) => {
            const productName = product.productName.trim();

            if (!productName) {
                throw new Error(`Vui lòng nhập tên sản phẩm ở dòng ${index + 1}`);
            }

            const fileUrl = product.fileUrl.trim();

            if (!fileUrl) {
                throw new Error(`Vui lòng upload file thông tin chuẩn (doc/pdf) cho sản phẩm ${productName}`);
            }

            return {
                id: product.id,
                productName,
                fileUrl,
                fileName: product.fileName || null,
                extractedText: product.extractedText || null,
                note: product.note.trim() || null,
                documents: Array.isArray(product.documents) ? product.documents : [],
            };
        });

        return { items: normalized };
    };

    const saveDraft = async () => {
        try {
            const payload = buildPayload();
            if (activeSubmission?.status === 'REJECTED') {
                const created = await createSubmission({ projectId, ...payload }).unwrap();
                setLoadedSubmissionId(created.id);
                toast.success('Đã tạo bản nháp mới từ bản không duyệt');
            } else if (activeSubmission) {
                await updateSubmission({ projectId, submissionId: activeSubmission.id, ...payload }).unwrap();
                toast.success('Đã cập nhật bản mô tả sản phẩm');
            } else {
                const created = await createSubmission({ projectId, ...payload }).unwrap();
                setLoadedSubmissionId(created.id);
                toast.success('Đã tạo bản mô tả sản phẩm');
            }
        } catch (err) {
            toast.error(err?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu bản mô tả sản phẩm');
        }
    };

    const submitForReview = async () => {
        try {
            const payload = buildPayload();
            if (activeSubmission?.status === 'REJECTED') {
                const saved = await createSubmission({ projectId, ...payload }).unwrap();
                await submitSubmission({ projectId, submissionId: saved.id }).unwrap();
            } else if (activeSubmission) {
                await submitSubmission({ projectId, submissionId: activeSubmission.id, ...payload }).unwrap();
            } else {
                const saved = await createSubmission({ projectId, ...payload }).unwrap();
                await submitSubmission({ projectId, submissionId: saved.id }).unwrap();
            }
            toast.success('Đã gửi PM duyệt thông tin chuẩn sản phẩm');
            closeForm();
        } catch (err) {
            toast.error(err?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi duyệt');
        }
    };

    const handleApprove = async (submissionId) => {
        try {
            await approveSubmission({ projectId, submissionId }).unwrap();
            toast.success('Đã duyệt version mô tả sản phẩm');
        } catch (err) {
            toast.error(err?.data?.message || 'Duyệt thất bại');
        }
    };

    const handleReject = async (submissionId, reviewNote = '') => {
        try {
            await rejectSubmission({ projectId, submissionId, reviewNote }).unwrap();
            toast.success('Đã không duyệt bản mô tả sản phẩm');
        } catch (err) {
            toast.error(err?.data?.message || 'Không duyệt thất bại');
        }
    };

    const isSaving = isCreating || isUpdating || isSubmitting;
    const isReviewing = isApproving || isRejecting;

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <PackageCheck className="h-5 w-5 text-emerald-600" />
                    <h2 className="font-semibold text-gray-900">Mô tả sản phẩm (Thông tin chuẩn)</h2>
                </div>
                <div className="flex items-center gap-2">
                    {isLoading && <span className="text-xs font-semibold text-gray-400">Đang tải...</span>}
                    <button
                        type="button"
                        onClick={() => setIsHistoryOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                        <History className="w-4 h-4" />
                        Lịch sử
                    </button>
                    {canManageSubmission && !hasPendingSubmission && !isFormOpen && (
                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Tạo bản gửi
                        </button>
                    )}
                </div>
            </div>

            {canManageSubmission && isFormOpen && (
                <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">
                                {activeSubmission?.status === 'REJECTED' ? 'Chỉnh sửa bản không duyệt' : activeSubmission ? 'Chỉnh sửa bản nháp' : 'Bản gửi mới'}
                            </h3>
                            {hasPendingSubmission && (
                                <p className="mt-1 text-xs font-medium text-amber-600">
                                    Đang có bản chờ PM duyệt, bạn có thể chỉnh tiếp sau khi PM phản hồi.
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-gray-600 shadow-sm ring-1 ring-gray-200 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <p className="text-xs font-medium text-amber-700">
                            Đây là các thông tin sẽ được dùng để đối chiếu khi chạy QC. Vui lòng upload đầy đủ file thông tin chuẩn (doc/pdf) cho từng sản phẩm để QC đối chiếu chính xác. Hệ thống chỉ trích xuất nội dung chữ trong file, bỏ qua hình ảnh.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {products.map((product, index) => (
                            <div key={index} className="overflow-hidden rounded-xl border-2 border-gray-200 bg-white">
                                <div className="flex items-center justify-between gap-2 bg-gray-50 px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleProductCollapsed(index)}
                                        className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none"
                                    >
                                        {product.collapsed ? (
                                            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                                        ) : (
                                            <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
                                        )}
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-bold text-gray-800">
                                                {product.productName || `Sản phẩm ${index + 1}`}
                                            </span>
                                            {product.collapsed && (
                                                <span className="block truncate text-xs font-medium text-gray-400">
                                                    {product.fileUrl ? 'Đã có file thông tin chuẩn' : 'Chưa upload file'}
                                                    {product.note ? ' • Có chú thích' : ''}
                                                    {product.documents.length > 0 ? ` • ${product.documents.length} tài liệu bổ sung` : ''}
                                                </span>
                                            )}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => removeProduct(index)}
                                        disabled={!canEdit || isSaving || products.length === 1}
                                        className="shrink-0 rounded-lg p-2 text-gray-400 outline-none hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {!product.collapsed && (
                                <div className="space-y-3 p-4">
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-blue-600">
                                        Thông tin chính - Tên sản phẩm
                                    </label>
                                    <input
                                        type="text"
                                        value={product.productName}
                                        onChange={(event) => updateProduct(index, { productName: event.target.value })}
                                        disabled={!canEdit || isSaving}
                                        placeholder="Tên sản phẩm"
                                        className="w-full rounded-lg border-2 border-blue-200 bg-blue-50/40 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-blue-400 disabled:bg-gray-50"
                                    />
                                </div>

                                <div className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-3">
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-blue-600">
                                        File thông tin chuẩn (doc/pdf)
                                    </label>
                                    <div className="relative">
                                        <Upload className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(event) => handleDocFileChange(index, event.target.files?.[0])}
                                            disabled={!canEdit || isSaving || product.docUploading}
                                            className="w-full rounded-lg border border-blue-200 bg-white py-2 pl-9 pr-3 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-blue-100 file:px-2 file:py-1 file:text-xs file:font-bold file:text-blue-700 focus:border-blue-400 disabled:bg-gray-50"
                                        />
                                    </div>
                                    {product.docUploading && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Đang tải lên... {product.docUploadProgress}%
                                        </div>
                                    )}
                                    {!product.docUploading && product.fileUrl && (
                                        <a
                                            href={product.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            {product.fileName || 'Xem file đã upload'}
                                        </a>
                                    )}
                                </div>

                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <label className="block text-xs font-bold uppercase tracking-wide text-emerald-700">
                                            Nội dung trích xuất
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handleAiFormat(index)}
                                            disabled={!canEdit || isSaving || product.aiFormatting || product.extracting || !product.extractedText}
                                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                                        >
                                            {product.aiFormatting ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="h-3 w-3" />
                                            )}
                                            AI formatting
                                        </button>
                                    </div>
                                    {!product.extracting && product.hasComplexLayout && (
                                        <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                            File có nhiều cột/bảng phức tạp, nội dung trích xuất bên dưới có thể bị sai thứ tự hoặc thiếu sót. Vui lòng kiểm tra kỹ và chỉnh sửa trước khi gửi duyệt.
                                        </div>
                                    )}
                                    {product.extracting ? (
                                        <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-white px-3 py-2.5 text-xs text-emerald-600">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Đang trích xuất nội dung từ file...
                                        </div>
                                    ) : (
                                        <RichTextEditor
                                            value={product.extractedText}
                                            onChange={(html) => updateProduct(index, { extractedText: html })}
                                            placeholder="Nội dung trích xuất từ file sẽ hiện ở đây, có thể chỉnh sửa"
                                            minHeight={140}
                                            mode="basic"
                                        />
                                    )}
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-400">
                                        Chú thích
                                    </label>
                                    <RichTextEditor
                                        value={product.note}
                                        onChange={(html) => updateProduct(index, { note: html })}
                                        placeholder="Nhập ghi chú cho sản phẩm (không bắt buộc)"
                                        minHeight={160}
                                        mode="link"
                                    />
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                                        Tài liệu bổ sung
                                    </label>
                                    <div className="relative">
                                        <Paperclip className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                            onChange={(event) => handleAdditionalDocsChange(index, event.target.files)}
                                            disabled={!canEdit || isSaving || product.docsUploading}
                                            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-blue-700 focus:border-blue-400 disabled:bg-gray-50"
                                        />
                                    </div>
                                    {product.docsUploading && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Đang tải tài liệu lên...
                                        </div>
                                    )}
                                    {product.documents.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {product.documents.map((doc, docIdx) => (
                                                <div
                                                    key={docIdx}
                                                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs"
                                                >
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex min-w-0 items-center gap-1 text-blue-600 hover:text-blue-700"
                                                    >
                                                        <FileText className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate">{doc.name}</span>
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAdditionalDoc(index, docIdx)}
                                                        disabled={!canEdit || isSaving}
                                                        className="shrink-0 rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                </div>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addProduct}
                            disabled={!canEdit || isSaving}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-white px-3 py-3 text-xs font-bold text-blue-600 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm sản phẩm
                        </button>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => generateProductDescriptionPdf({
                                title: 'Thong tin chuan san pham (nhap)',
                                projectName: project?.name,
                                items: products,
                            })}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                        >
                            <Download className="h-4 w-4" />
                            Tải PDF
                        </button>
                        <button
                            type="button"
                            onClick={saveDraft}
                            disabled={!canEdit || isSaving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <FileText className="h-4 w-4" />
                            Lưu nháp
                        </button>
                        <button
                            type="button"
                            onClick={submitForReview}
                            disabled={!canEdit || isSaving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            {isSaving ? 'Đang xử lý...' : 'Gửi PM duyệt'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {visibleSubmissions.length > 0 ? (
                    visibleSubmissions.map((submission) => (
                        <VersionCard
                            key={submission.id}
                            submission={submission}
                            canReview={canReview}
                            canEditSubmission={canManageSubmission && !hasPendingSubmission}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onEdit={openEditForm}
                            isReviewing={isReviewing}
                            projectName={project?.name}
                        />
                    ))
                ) : (
                    <p className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-sm italic text-gray-400">
                        Chưa có thông tin chuẩn sản phẩm
                    </p>
                )}
            </div>

            <ProductDescriptionHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                submissions={submissions}
                canEditSubmission={canManageSubmission && !hasPendingSubmission}
                onEdit={openEditForm}
            />
        </div>
    );
};

export const ProjectInfo = ({ project }) => {
    const { data: user } = useGetMeQuery();
    const [updateProject, { isLoading: isUpdatingTimeline }] = useUpdateProjectMutation();
    const contract = project?.contract || {};
    const contractAttachments = Array.isArray(contract.attachments) ? contract.attachments : [];
    const timeline = getProjectTimeline(project?.plannedStartDate, project?.plannedEndDate);
    const [timelineForm, setTimelineForm] = useState({
        plannedStartDate: toDateInputValue(project?.plannedStartDate),
        plannedEndDate: toDateInputValue(project?.plannedEndDate),
    });
    const currentUserId = getCurrentUserId(user);
    const userRole = getUserAccountRole(user);
    const isAssignedPm = userRole === 'PM' && project?.team?.members?.some(member =>
        (member.role === 'PROJECT_MANAGER' || member.role === 'PM' || member.role === TEAM_MEMBER_ROLE.PROJECT_MANAGER) &&
        isSameUser(member.user?.id, currentUserId)
    );
    const canEditTimeline = userRole === 'ADMIN' || isAssignedPm;
    const hasTimelineChanges = timelineForm.plannedStartDate !== toDateInputValue(project?.plannedStartDate) ||
        timelineForm.plannedEndDate !== toDateInputValue(project?.plannedEndDate);

    useEffect(() => {
        setTimelineForm({
            plannedStartDate: toDateInputValue(project?.plannedStartDate),
            plannedEndDate: toDateInputValue(project?.plannedEndDate),
        });
    }, [project?.plannedStartDate, project?.plannedEndDate]);

    const handleTimelineChange = (key, value) => {
        setTimelineForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveTimeline = async () => {
        if (!canEditTimeline || !project?.id) return;

        try {
            await updateProject({
                id: project.id,
                plannedStartDate: timelineForm.plannedStartDate || null,
                plannedEndDate: timelineForm.plannedEndDate || null,
            }).unwrap();
            toast.success('Đã cập nhật tiến trình dự án');
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể cập nhật tiến trình dự án');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
                <div className="flex items-center gap-2 mb-5">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-semibold text-gray-900">Thông tin dự án</h2>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Mã hợp đồng</p>
                            <p className="text-sm font-medium text-gray-700">{contract.contractCode || 'Chưa có'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Tên hợp đồng</p>
                            <p className="text-sm font-medium text-gray-700">{contract.name || 'Chưa có'}</p>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                        <div className="mb-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Tiến trình dự án</p>
                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-12 pl-4">
                                    <div className="flex flex-col">
                                        <p className="font-medium text-gray-700">Ngày dự kiến bắt đầu</p>
                                        {canEditTimeline ? (
                                            <input
                                                type="date"
                                                value={timelineForm.plannedStartDate}
                                                onChange={(event) => handleTimelineChange('plannedStartDate', event.target.value)}
                                                disabled={isUpdatingTimeline}
                                                className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-blue-400 disabled:bg-gray-50"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-gray-700">{formatDateOnly(project?.plannedStartDate)}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-medium text-gray-700">Ngày dự kiến kết thúc</p>
                                        {canEditTimeline ? (
                                            <input
                                                type="date"
                                                value={timelineForm.plannedEndDate}
                                                onChange={(event) => handleTimelineChange('plannedEndDate', event.target.value)}
                                                disabled={isUpdatingTimeline}
                                                className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-blue-400 disabled:bg-gray-50"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-gray-700">{formatDateOnly(project?.plannedEndDate)}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-start gap-2 lg:items-end">
                                <p className="font-medium text-blue-700">{timeline.remainingText}</p>
                                {canEditTimeline && (
                                    <button
                                        type="button"
                                        onClick={handleSaveTimeline}
                                        disabled={!hasTimelineChanges || isUpdatingTimeline}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >
                                        {isUpdatingTimeline ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        )}
                                        Sửa tiến trình
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                    {contractAttachments.length > 0 ? (
                        <div className="flex flex-col items-start gap-2 overflow-hidden">
                            <div>
                                <h2 className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Mô tả khách hàng</h2>
                            </div>
                            {contract.description && (
                                <div className="">
                                    <div className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                        <span>Brief</span>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-gray-500 mt-1 italic text-sm">{contract.description}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-row flex-nowrap gap-3 overflow-x-auto w-full pb-2">
                                {contractAttachments.map((file, idx) => {
                                    const fileName = file?.name || file?.url || 'Tài liệu đính kèm';
                                    return (
                                        <a
                                            key={idx}
                                            href={getFilePreviewUrl(file?.url, file?.type)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 hover:bg-white transition-all"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-700 truncate text-ellipsis" title={fileName}>{fileName.length > 40 ? fileName.slice(0, 40) + '...' : fileName}</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">{file?.type || 'FILE'}</p>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 italic text-center py-4">Không có tài liệu đính kèm</p>
                    )}
                </div>
            </div>

            <ProductDescriptionSection project={project} />
        </div>
    );
};