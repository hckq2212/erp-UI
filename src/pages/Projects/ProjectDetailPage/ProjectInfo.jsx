import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Briefcase,
    Calendar,
    CheckCircle2,
    FileText,
    History,
    Link as LinkIcon,
    PackageCheck,
    Plus,
    Send,
    Trash2,
    Upload,
    XCircle
} from 'lucide-react';
import {
    useApproveProjectProductDescriptionMutation,
    useCreateProjectProductDescriptionMutation,
    useGetProjectProductDescriptionsQuery,
    useRejectProjectProductDescriptionMutation,
    useSubmitProjectProductDescriptionMutation,
    useUpdateProjectProductDescriptionMutation,
} from '../../../api/projects';
import { useGetMeQuery } from '../../../api/auth';
import { getFilePreviewUrl, uploadToCloudinary } from '../../../utils/cloudinary';
import { toast } from 'react-toastify';
import { Modal } from '../../../components/ui/Modal';

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
const PRODUCT_DESCRIPTION_ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx'];
const PRODUCT_DESCRIPTION_ACCEPT = '.pdf,.docx,.xlsx';
const PRODUCT_DESCRIPTION_MAX_FILE_SIZE = 10 * 1024 * 1024;

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

const emptyProduct = () => ({
    id: null,
    productName: '',
    sourceType: 'LINK',
    link: '',
    file: null,
    existingFile: null,
});

const toEditableProduct = (item) => ({
    id: item?.id || null,
    productName: item?.productName || '',
    sourceType: item?.sourceType || 'LINK',
    link: item?.sourceType === 'LINK' ? item?.sourceUrl || '' : '',
    file: null,
    existingFile: item?.sourceType === 'FILE'
        ? {
            name: item?.sourceName || item?.sourceUrl || 'File đính kèm',
            url: item?.sourceUrl || '',
            size: item?.size,
            publicId: item?.publicId,
        }
        : null,
});

const getProductSource = (product) => {
    if (product.sourceType === 'LINK') {
        return product.link?.trim()
            ? {
                sourceType: 'LINK',
                sourceName: product.link.trim(),
                sourceUrl: product.link.trim(),
            }
            : null;
    }

    if (product.existingFile?.url) {
        return {
            sourceType: 'FILE',
            sourceName: product.existingFile.name,
            sourceUrl: product.existingFile.url,
            size: product.existingFile.size,
            publicId: product.existingFile.publicId,
        };
    }

    return null;
};

const getFileExtension = (fileName = '') => {
    const cleanName = fileName.split('?')[0].split('#')[0];
    const extension = cleanName.includes('.') ? cleanName.split('.').pop() : '';
    return extension.toLowerCase();
};

const validateProductDescriptionFile = (file) => {
    if (!file) return;

    const extension = getFileExtension(file.name);
    if (!PRODUCT_DESCRIPTION_ALLOWED_EXTENSIONS.includes(extension)) {
        throw new Error('Chỉ được upload file .pdf, .docx hoặc .xlsx');
    }

    if (file.size >= PRODUCT_DESCRIPTION_MAX_FILE_SIZE) {
        throw new Error('Dung lượng mỗi file mô tả sản phẩm phải dưới 10MB');
    }
};

const ProductSourceLink = ({ item }) => {
    const sourceUrl = item?.sourceUrl || '';
    const sourceType = item?.sourceType || 'LINK';
    const sourceName = item?.sourceName || sourceUrl || 'Không có nguồn';

    if (!sourceUrl) {
        return (
            <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-400">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate">{sourceName}</span>
            </span>
        );
    }

    return (
        <a
            href={getFilePreviewUrl(sourceUrl, sourceType)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
            {sourceType === 'LINK' ? <LinkIcon className="w-4 h-4 shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />}
            <span className="truncate">{sourceName}</span>
        </a>
    );
};

const VersionCard = ({ submission, canReview, canEditSubmission, onApprove, onReject, onEdit, isReviewing }) => {
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
                    <div key={item?.id || index} className="flex flex-col gap-1 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="min-w-0 text-sm font-bold text-gray-800">{item?.productName || 'Chưa có tên sản phẩm'}</p>
                        <ProductSourceLink item={item} />
                    </div>
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
                                        <div key={item?.id || index} className="flex flex-col gap-1 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="min-w-0 text-sm font-bold text-gray-800">{item?.productName || 'Chưa có tên sản phẩm'}</p>
                                            <ProductSourceLink item={item} />
                                        </div>
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
    const fileInputsRef = useRef({});

    const hasPendingSubmission = submissions.some((submission) => submission?.status === 'PENDING_REVIEW');
    const isAssignedPm = user?.role === 'PM' && project?.team?.members?.some((member) =>
        member.role === 'PROJECT_MANAGER' && member.user?.id === user.id
    );
    const isProjectLead = project?.team?.teamLead?.id === user?.id;
    const canManageSubmission = user?.role === 'BD' || isAssignedPm || isProjectLead;
    const canReview = Boolean(isAssignedPm);
    const [products, setProducts] = useState([emptyProduct()]);
    const [loadedSubmissionId, setLoadedSubmissionId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [isUploading, setIsUploading] = useState(false);
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
        setProducts((prev) => [...prev, emptyProduct()]);
    };

    const removeProduct = (index) => {
        setProducts((prev) => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index));
    };

    const handleFileChange = (index, file) => {
        if (!file) return;
        try {
            validateProductDescriptionFile(file);
        } catch (error) {
            toast.error(error.message);
            if (fileInputsRef.current[index]) {
                fileInputsRef.current[index].value = '';
            }
            return;
        }

        updateProduct(index, {
            sourceType: 'FILE',
            file,
            existingFile: null,
            link: '',
        });
    };

    const openCreateForm = () => {
        setProducts([emptyProduct()]);
        setLoadedSubmissionId(null);
        setUploadProgress({});
        setIsFormOpen(true);
    };

    const openEditForm = (submission) => {
        const editableItems = Array.isArray(submission.items) ? submission.items : [];
        setProducts(editableItems.length ? editableItems.map(toEditableProduct) : [emptyProduct()]);
        setLoadedSubmissionId(submission.id);
        setUploadProgress({});
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setProducts([emptyProduct()]);
        setLoadedSubmissionId(null);
        setUploadProgress({});
        setIsFormOpen(false);
    };

    const buildPayload = async () => {
        const normalized = [];

        for (let index = 0; index < products.length; index += 1) {
            const product = products[index];
            const productName = product.productName.trim();

            if (!productName) {
                throw new Error(`Vui lòng nhập tên sản phẩm ở dòng ${index + 1}`);
            }

            let source = getProductSource(product);
            if (product.sourceType === 'FILE' && product.file) {
                validateProductDescriptionFile(product.file);
                setIsUploading(true);
                const uploadedFile = await uploadToCloudinary(
                    product.file,
                    `GETVINI/ERP/projects/${projectId}/product-descriptions`,
                    (progress) => setUploadProgress((prev) => ({ ...prev, [index]: progress }))
                );
                source = {
                    sourceType: 'FILE',
                    sourceName: uploadedFile.name,
                    sourceUrl: uploadedFile.url,
                    size: uploadedFile.size,
                    publicId: uploadedFile.publicId,
                };
            }

            if (!source?.sourceUrl) {
                throw new Error(`Vui lòng chọn file hoặc nhập link cho sản phẩm ${productName}`);
            }

            normalized.push({ id: product.id, productName, ...source });
        }

        return { items: normalized };
    };

    const saveDraft = async () => {
        try {
            setUploadProgress({});
            const payload = await buildPayload();
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
        } finally {
            setIsUploading(false);
        }
    };

    const submitForReview = async () => {
        try {
            setUploadProgress({});
            const payload = await buildPayload();
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
        } finally {
            setIsUploading(false);
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

    const isSaving = isCreating || isUpdating || isSubmitting || isUploading;
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

            {canManageSubmission && isFormOpen && (
                <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
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
                                onClick={addProduct}
                                disabled={!canEdit || isSaving}
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-600 shadow-sm ring-1 ring-gray-200 hover:bg-blue-50 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm sản phẩm
                            </button>
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

                    <div className="space-y-3">
                        {products.map((product, index) => (
                            <div key={index} className="rounded-xl border border-gray-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="grid flex-1 gap-3 md:grid-cols-[1fr_180px]">
                                        <input
                                            type="text"
                                            value={product.productName}
                                            onChange={(event) => updateProduct(index, { productName: event.target.value })}
                                            disabled={!canEdit || isSaving}
                                            placeholder="Tên sản phẩm"
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 disabled:bg-gray-50"
                                        />
                                        <select
                                            value={product.sourceType}
                                            onChange={(event) => updateProduct(index, {
                                                sourceType: event.target.value,
                                                link: '',
                                                file: null,
                                                existingFile: null,
                                            })}
                                            disabled={!canEdit || isSaving}
                                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400 disabled:bg-gray-50"
                                        >
                                            <option value="LINK">Link tham khảo</option>
                                            <option value="FILE">File đính kèm</option>
                                        </select>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeProduct(index)}
                                        disabled={!canEdit || isSaving || products.length === 1}
                                        className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mt-3">
                                    {product.sourceType === 'LINK' ? (
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="url"
                                                value={product.link}
                                                onChange={(event) => updateProduct(index, { link: event.target.value })}
                                                disabled={!canEdit || isSaving}
                                                placeholder="https://..."
                                                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 disabled:bg-gray-50"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <input
                                                type="file"
                                                accept={PRODUCT_DESCRIPTION_ACCEPT}
                                                ref={(node) => { fileInputsRef.current[index] = node; }}
                                                className="hidden"
                                                onChange={(event) => handleFileChange(index, event.target.files?.[0])}
                                                disabled={!canEdit || isSaving}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputsRef.current[index]?.click()}
                                                disabled={!canEdit || isSaving}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
                                            >
                                                <Upload className="h-4 w-4" />
                                                Chọn file
                                            </button>
                                            <span className="min-w-0 truncate text-sm font-medium text-gray-500">
                                                {product.file?.name || product.existingFile?.name || 'Chưa chọn file'}
                                            </span>
                                            {isUploading && uploadProgress[index] !== undefined && (
                                                <span className="text-xs font-bold text-blue-600">{uploadProgress[index]}%</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
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
        </div>
    );
};

export const ProjectInfo = ({ project }) => {
    const contract = project?.contract || {};
    const contractAttachments = Array.isArray(contract.attachments) ? contract.attachments : [];

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
