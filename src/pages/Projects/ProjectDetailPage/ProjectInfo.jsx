import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Briefcase,
    Calendar,
    CheckCircle2,
    FileText,
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

const emptyProduct = () => ({
    productName: '',
    sourceType: 'LINK',
    link: '',
    file: null,
    existingFile: null,
});

const toEditableProduct = (item) => ({
    productName: item.productName || '',
    sourceType: item.sourceType || 'LINK',
    link: item.sourceType === 'LINK' ? item.sourceUrl || '' : '',
    file: null,
    existingFile: item.sourceType === 'FILE'
        ? {
            name: item.sourceName,
            url: item.sourceUrl,
            size: item.size,
            publicId: item.publicId,
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

const ProductSourceLink = ({ item }) => (
    <a
        href={getFilePreviewUrl(item.sourceUrl, item.sourceType)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
    >
        {item.sourceType === 'LINK' ? <LinkIcon className="w-4 h-4 shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />}
        <span className="truncate">{item.sourceName || item.sourceUrl}</span>
    </a>
);

const VersionCard = ({ submission, canReview, onApprove, onReject, isReviewing }) => (
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

            {canReview && submission.status === 'PENDING_REVIEW' && (
                <div className="flex shrink-0 gap-2">
                    <button
                        type="button"
                        onClick={() => onReject(submission.id)}
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
                </div>
            )}
        </div>

        <div className="mt-4 space-y-2">
            {submission.items?.map((item) => (
                <div key={item.id} className="flex flex-col gap-1 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="min-w-0 text-sm font-bold text-gray-800">{item.productName}</p>
                    <ProductSourceLink item={item} />
                </div>
            ))}
        </div>
    </div>
);

const ProductDescriptionSection = ({ project }) => {
    const { data: user } = useGetMeQuery();
    const projectId = project?.id;
    const { data: submissions = [], isLoading } = useGetProjectProductDescriptionsQuery(projectId, {
        skip: !projectId,
    });
    const [createSubmission, { isLoading: isCreating }] = useCreateProjectProductDescriptionMutation();
    const [updateSubmission, { isLoading: isUpdating }] = useUpdateProjectProductDescriptionMutation();
    const [submitSubmission, { isLoading: isSubmitting }] = useSubmitProjectProductDescriptionMutation();
    const [approveSubmission, { isLoading: isApproving }] = useApproveProjectProductDescriptionMutation();
    const [rejectSubmission, { isLoading: isRejecting }] = useRejectProjectProductDescriptionMutation();
    const fileInputsRef = useRef({});

    const editableSubmission = useMemo(() => (
        submissions.find((submission) =>
            ['DRAFT', 'REJECTED'].includes(submission.status) &&
            submission.createdBy?.id === user?.id
        )
    ), [submissions, user?.id]);

    const hasPendingSubmission = submissions.some((submission) => submission.status === 'PENDING_REVIEW');
    const isAssignedPm = user?.role === 'PM' && project?.team?.members?.some((member) =>
        member.role === 'PROJECT_MANAGER' && member.user?.id === user.id
    );
    const isProjectLead = project?.team?.teamLead?.id === user?.id;
    const canManageSubmission = user?.role === 'BD' || isAssignedPm || isProjectLead;
    const canEdit = canManageSubmission && !hasPendingSubmission;
    const canReview = Boolean(isAssignedPm);
    const [products, setProducts] = useState([emptyProduct()]);
    const [loadedSubmissionId, setLoadedSubmissionId] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (editableSubmission && editableSubmission.id !== loadedSubmissionId) {
            setProducts(editableSubmission.items?.length ? editableSubmission.items.map(toEditableProduct) : [emptyProduct()]);
            setLoadedSubmissionId(editableSubmission.id);
        }
        if (!editableSubmission && loadedSubmissionId) {
            setProducts([emptyProduct()]);
            setLoadedSubmissionId(null);
        }
    }, [editableSubmission, loadedSubmissionId]);

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
        updateProduct(index, {
            sourceType: 'FILE',
            file,
            existingFile: null,
            link: '',
        });
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

            normalized.push({ productName, ...source });
        }

        return { items: normalized };
    };

    const saveDraft = async () => {
        try {
            setUploadProgress({});
            const payload = await buildPayload();
            if (editableSubmission) {
                await updateSubmission({ projectId, submissionId: editableSubmission.id, ...payload }).unwrap();
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
            const saved = editableSubmission
                ? await updateSubmission({ projectId, submissionId: editableSubmission.id, ...payload }).unwrap()
                : await createSubmission({ projectId, ...payload }).unwrap();

            await submitSubmission({ projectId, submissionId: saved.id }).unwrap();
            toast.success('Đã gửi PM duyệt thông tin chuẩn sản phẩm');
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

    const handleReject = async (submissionId) => {
        const reviewNote = window.prompt('Lý do không duyệt (có thể bỏ trống):') || '';
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
                {isLoading && <span className="text-xs font-semibold text-gray-400">Đang tải...</span>}
            </div>

            <div className="space-y-4">
                {submissions.length > 0 ? (
                    submissions.map((submission) => (
                        <VersionCard
                            key={submission.id}
                            submission={submission}
                            canReview={canReview}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            isReviewing={isReviewing}
                        />
                    ))
                ) : (
                    <p className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-sm italic text-gray-400">
                        Chưa có thông tin chuẩn sản phẩm
                    </p>
                )}
            </div>

            {canManageSubmission && (
                <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">
                                {editableSubmission?.status === 'REJECTED' ? 'Chỉnh sửa bản không duyệt' : 'Bản gửi mới'}
                            </h3>
                            {hasPendingSubmission && (
                                <p className="mt-1 text-xs font-medium text-amber-600">
                                    Đang có bản chờ PM duyệt, bạn có thể chỉnh tiếp sau khi PM phản hồi.
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={addProduct}
                            disabled={!canEdit || isSaving}
                            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-600 shadow-sm ring-1 ring-gray-200 hover:bg-blue-50 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm sản phẩm
                        </button>
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
                            <p className="text-sm font-medium text-gray-700">{project.contract.contractCode}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Tên hợp đồng</p>
                            <p className="text-sm font-medium text-gray-700">{project.contract.name}</p>
                        </div>
                    </div>
                    {project?.contract?.attachments && project?.contract?.attachments.length > 0 ? (
                        <div className="flex flex-col items-start gap-2 overflow-hidden">
                            <div>
                                <h2 className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Mô tả khách hàng</h2>
                            </div>
                            {project?.contract?.description && (
                                <div className="">
                                    <div className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                        <span>Brief</span>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-gray-500 mt-1 italic text-sm">{project?.contract?.description}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-row flex-nowrap gap-3 overflow-x-auto w-full pb-2">
                                {project?.contract?.attachments.map((file, idx) => (
                                    <a
                                        key={idx}
                                        href={getFilePreviewUrl(file.url, file.type)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 hover:bg-white transition-all"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-700 truncate text-ellipsis" title={file.name}>{file.name.length > 40 ? file.name.slice(0, 40) + '...' : file.name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">{file.type}</p>
                                        </div>
                                    </a>
                                ))}
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
