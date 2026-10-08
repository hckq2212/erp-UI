import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetUserQuery, useUpdateUserLaborContractsMutation, useUpdateUserProfileMutation } from '../../api/users';
import { USER_ROLE_COLORS, USER_ROLE } from '../../utils/enums';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { toast } from 'react-toastify';
import { UserTasksSection } from '../../components/users/UserTasksSection';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import {
    X, Upload, FileText, Download, Eye, Loader2,
    ArrowLeft, CheckCircle, Mail, Phone, User,
    Link2, ExternalLink, Shield,
    Lock, Unlock, Calendar
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { maskIdCardNumber, formatDateToDDMMYYYY } from '../../utils/format';

const MAX_CONTRACT_FILES = 1;
const MAX_CONTRACT_FILE_SIZE = 10 * 1024 * 1024;
const LABOR_CONTRACT_FOLDER = 'GETVINI/ERP/user/labor_contract';
const LABOR_CONTRACT_ACCEPT = '.docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const ALLOWED_LABOR_CONTRACT_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const getFileExtension = (name = '') => name.split('.').pop()?.toLowerCase() || '';
const isAllowedLaborContractFile = (file) => {
    const extension = getFileExtension(file.name);
    const hasAllowedExtension = extension === 'pdf' || extension === 'docx';
    const hasAllowedMimeType = !file.type || ALLOWED_LABOR_CONTRACT_MIME_TYPES.has(file.type);
    return hasAllowedExtension && hasAllowedMimeType;
};

const stripLocalPreviewFields = (contract) => {
    const { file, previewUrl, isLocal, ...savedContract } = contract;
    return savedContract;
};

export const UserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: user, isLoading, error } = useGetUserQuery(id);
    const [updateUserLaborContracts, { isLoading: isSavingContracts }] = useUpdateUserLaborContractsMutation();
    const [updateUserProfile, { isLoading: isUpdatingProfile }] = useUpdateUserProfileMutation();

    // CCCD admin state
    const [idCardNumber, setIdCardNumber] = useState('');
    const [showIdCardNumber, setShowIdCardNumber] = useState(false);
    const [isIdCardNumberFocused, setIsIdCardNumberFocused] = useState(false);
    const [isUploadingIdCard, setIsUploadingIdCard] = useState(false);

    const handleSaveIdCard = async () => {
        const cleanIdNumber = idCardNumber?.trim() || '';
        if (cleanIdNumber && !/^([0-9]{9}|[0-9]{12})$/.test(cleanIdNumber)) {
            toast.error('Số CCCD / CMND không hợp lệ! Vui lòng nhập đúng 9 hoặc 12 chữ số.');
            return;
        }

        try {
            setIsUploadingIdCard(true);
            const currentIdCard = user?.idCard || {};
            const idCardUpdate = {
                ...currentIdCard,
                idNumber: cleanIdNumber || null,
            };
            await updateUserProfile({ id, idCard: idCardUpdate }).unwrap();
            toast.success('Cập nhật CCCD thành công');
        } catch (err) {
            toast.error(err.message || 'Lỗi khi cập nhật CCCD');
        } finally {
            setIsUploadingIdCard(false);
        }
    };

    const idCardHasChanges = idCardNumber !== (user?.idCard?.idNumber || '');

    // File handling state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewFile, setPreviewFile] = useState(null);
    const [contracts, setContracts] = useState([]);
    const localPreviewUrlsRef = useRef(new Set());

    const revokeLocalPreviewUrl = (url) => {
        if (!url || !localPreviewUrlsRef.current.has(url)) return;
        URL.revokeObjectURL(url);
        localPreviewUrlsRef.current.delete(url);
    };

    const revokeAllLocalPreviewUrls = () => {
        localPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        localPreviewUrlsRef.current.clear();
    };

    useEffect(() => {
        revokeAllLocalPreviewUrls();
        if (user && user.laborContract) {
            setContracts(user.laborContract);
        } else {
            setContracts([]);
        }
        // Sync idCard when user data reloads
        setIdCardNumber(user?.idCard?.idNumber || '');
    }, [user]);

    useEffect(() => () => {
        revokeAllLocalPreviewUrls();
    }, []);

    const handleLocalFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (files.length > MAX_CONTRACT_FILES) {
            toast.error('Chỉ được chọn 1 file hợp đồng lao động');
            e.target.value = null;
            return;
        }

        const invalidFile = files.find((file) => !isAllowedLaborContractFile(file));
        if (invalidFile) {
            toast.error('Chỉ chấp nhận file .docx hoặc .pdf cho hợp đồng lao động');
            e.target.value = null;
            return;
        }

        const oversizedFile = files.find((file) => file.size > MAX_CONTRACT_FILE_SIZE);
        if (oversizedFile) {
            toast.error('Mỗi file hợp đồng lao động tối đa 10MB');
            e.target.value = null;
            return;
        }

        revokeAllLocalPreviewUrls();

        const localContracts = files.map((file) => {
            const previewUrl = URL.createObjectURL(file);
            localPreviewUrlsRef.current.add(previewUrl);
            return {
                type: 'FILE',
                name: file.name,
                size: file.size,
                format: getFileExtension(file.name),
                resource_type: 'raw',
                file,
                previewUrl,
                isLocal: true,
            };
        });

        setContracts(localContracts);
        setPreviewFile(null);
        e.target.value = null;
    };

    const handleRemoveLocalContract = (indexToRemove) => {
        setContracts(prev => {
            const contract = prev[indexToRemove];
            if (contract?.isLocal) revokeLocalPreviewUrl(contract.previewUrl);
            return prev.filter((_, index) => index !== indexToRemove);
        });
        setPreviewFile(null);
    };

    const handleSaveChanges = async () => {
        try {
            setIsUploading(true);
            setUploadProgress(0);

            const localContracts = contracts.filter((contract) => contract.isLocal);
            if (localContracts.length === 0) setUploadProgress(100);
            const savedContracts = [];
            let uploadedLocalCount = 0;

            for (const contract of contracts) {
                if (!contract.isLocal) {
                    savedContracts.push(stripLocalPreviewFields(contract));
                    continue;
                }

                const uploadedContract = await uploadToCloudinary(
                    contract.file,
                    LABOR_CONTRACT_FOLDER,
                    (fileProgress) => {
                        const totalProgress = ((uploadedLocalCount + (fileProgress / 100)) / Math.max(localContracts.length, 1)) * 100;
                        setUploadProgress(Math.round(totalProgress));
                    },
                );

                uploadedLocalCount += 1;
                setUploadProgress(Math.round((uploadedLocalCount / Math.max(localContracts.length, 1)) * 100));
                savedContracts.push(uploadedContract);
            }

            const result = await updateUserLaborContracts({
                id,
                laborContract: savedContracts
            }).unwrap();

            revokeAllLocalPreviewUrls();
            setContracts(result?.laborContract || savedContracts);
            setUploadProgress(100);
            toast.success('Cập nhật hợp đồng lao động thành công');
        } catch (err) {
            toast.error(err.message || 'Lỗi khi cập nhật hợp đồng lao động');
        } finally {
            setIsUploading(false);
        }
    };

    const isSaving = isUploading || isSavingContracts;
    const persistedContracts = contracts.filter((contract) => !contract.isLocal).map(stripLocalPreviewFields);
    const savedLaborContracts = user?.laborContract || [];
    const hasSavedLaborContract = savedLaborContracts.length > 0;
    const hasChanges = contracts.some((contract) => contract.isLocal) || JSON.stringify(persistedContracts) !== JSON.stringify(savedLaborContracts);
    const saveButtonLabel = hasSavedLaborContract ? 'Cập nhật' : 'Tải lên';
    const previewUrl = previewFile?.previewUrl || previewFile?.url || '';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="bg-red-50 p-6 rounded-2xl text-red-600 text-center space-y-4">
                <p className="font-bold">Không tìm thấy thông tin nhân sự</p>
                <button
                    onClick={() => navigate('/users')}
                    className="bg-white border border-red-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors inline-flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-full pt-6 mx-auto pb-12">
            <button
                onClick={() => navigate('/users')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Quay lại danh sách nhân sự</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* ... existing profile card content ... */}
                        <div className="p-8 text-center bg-gradient-to-b from-blue-50 to-white pt-10">
                            <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto shadow-xl shadow-blue-100 mb-6">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-black text-4xl">
                                        {user.fullName?.[0]}
                                    </div>
                                )}
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 leading-tight mb-1">{user.fullName}</h1>
                            <div className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase border shadow-sm",
                                USER_ROLE_COLORS[user.account?.role] || 'bg-gray-50 text-gray-700 border-gray-100'
                            )}>
                                {USER_ROLE[user.account?.role] || user.account?.role}
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thông tin cá nhân & liên hệ</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span className="truncate">{user.account?.email || 'Chưa cập nhật email'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span>{user.phoneNumber || 'Chưa cập nhật SĐT'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span>Ngày sinh: <span className="font-bold text-gray-900">{user.birthday ? formatDateToDDMMYYYY(user.birthday) : 'Chưa cập nhật'}</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <User className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span>Tài khoản: <span className="font-bold text-gray-900">{user.account?.username}</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <div className={cn("w-2 h-2 rounded-full shrink-0", user.account?.isActive && !user.isLocked ? "bg-emerald-500" : "bg-rose-500")} />
                                        <span>Trạng thái: <span className={cn("font-bold", user.account?.isActive && !user.isLocked ? "text-emerald-600" : "text-rose-600")}>
                                            {user.account?.isActive && !user.isLocked ? "Đang hoạt động" : "Bị khóa"}
                                        </span></span>
                                    </div>
                                    {user.portfolioUrl && (
                                        <a href={user.portfolioUrl} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-3 text-sm text-blue-600 bg-blue-50 p-3 rounded-2xl hover:bg-blue-100 transition-colors">
                                            <Link2 className="w-4 h-4 shrink-0" />
                                            <span className="truncate flex-1">Portfolio</span>
                                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Hobbies tags */}
                            {Array.isArray(user.hobbies) && user.hobbies.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sở thích</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {user.hobbies.map((tag, i) => (
                                            <span key={i} className="inline-flex items-center bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold px-2.5 py-1 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}


                        </div>
                    </div>

                    {/* CCCD Card (Admin/Manager Management) */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-sm tracking-wide uppercase">Căn cước công dân</h3>
                                </div>
                            </div>
                            {idCardHasChanges && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">
                                    Chưa lưu
                                </span>
                            )}
                        </div>

                        {/* Số CCCD Input */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Số CCCD</label>
                                {idCardNumber && (
                                    <button
                                        type="button"
                                        onClick={() => setShowIdCardNumber(prev => !prev)}
                                        className="text-[10px] font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                        title={showIdCardNumber ? "Khóa lại / Che bớt số CCCD" : "Mở khóa / Xem đầy đủ số CCCD"}
                                    >
                                        {showIdCardNumber ? (
                                            <>
                                                <Unlock className="w-3 h-3 text-orange-500" />
                                                <span className="text-orange-600 font-bold">Đang hiện đủ</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-3 h-3 text-gray-400" />
                                                <span>Mở khóa xem đủ</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={
                                        showIdCardNumber || isIdCardNumberFocused
                                            ? idCardNumber
                                            : maskIdCardNumber(idCardNumber)
                                    }
                                    onFocus={() => setIsIdCardNumberFocused(true)}
                                    onBlur={() => setIsIdCardNumberFocused(false)}
                                    onChange={(e) => setIdCardNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                    placeholder="Chưa cập nhật số CCCD"
                                    className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-mono"
                                />
                                {idCardNumber && (
                                    <button
                                        type="button"
                                        onClick={() => setShowIdCardNumber(prev => !prev)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                                        title={showIdCardNumber ? "Khóa lại / Che bớt" : "Mở khóa xem đủ"}
                                    >
                                        {showIdCardNumber ? <Unlock className="w-4 h-4 text-orange-500" /> : <Lock className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Save / Cancel buttons for CCCD */}
                        {idCardHasChanges && (
                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleSaveIdCard}
                                    disabled={isUploadingIdCard || isUpdatingProfile}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                >
                                    {isUploadingIdCard || isUpdatingProfile ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Đang lưu CCCD...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            <span>Lưu thay đổi CCCD</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIdCardNumber(user?.idCard?.idNumber || '')}
                                    disabled={isUploadingIdCard || isUpdatingProfile}
                                    className="px-3 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl font-bold text-xs transition-all"
                                >
                                    Hủy
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Labor Contract Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <h3 className="font-black text-gray-900 text-sm tracking-wide uppercase">Hợp đồng lao động</h3>
                            </div>
                        </div>

                        {/* File Upload Dropzone */}
                        <div className="relative group">
                            <label className={cn(
                                "flex items-center justify-center w-full min-h-[82px] px-4 py-4 border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-2xl transition-all duration-300",
                                isSaving
                                    ? "cursor-not-allowed opacity-70"
                                    : "cursor-pointer hover:border-orange-300 hover:bg-orange-50/30"
                            )}>
                                <div className="flex items-center justify-center gap-3 text-left">
                                    {isSaving ? (
                                        <Loader2 className="h-6 w-6 shrink-0 text-orange-500 animate-spin" />
                                    ) : (
                                        <Upload className="h-6 w-6 shrink-0 text-gray-400 transition-colors duration-300 group-hover:text-orange-500" />
                                    )}
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-gray-700">
                                            {isSaving ? 'Đang lưu...' : 'Chọn tài liệu'}
                                        </p>
                                        <p className="text-[10px] text-gray-400">Chỉ nhận DOCX hoặc PDF, tối đa 10MB</p>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    accept={LABOR_CONTRACT_ACCEPT}
                                    onChange={handleLocalFileChange}
                                    disabled={isSaving}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {isSaving && (
                            <div className="space-y-2">
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-full rounded-full bg-orange-500 transition-all duration-300"
                                        style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                                    Đang tải lên {Math.min(uploadProgress, 100)}%
                                </p>
                            </div>
                        )}

                        {/* Contracts Preview List */}
                        {contracts.length > 0 && (
                            <div className="space-y-3">
                                {contracts.map((file, index) => {
                                    const fileUrl = file.previewUrl || file.url;
                                    const fileTypeLabel = getFileExtension(file.name || file.url).toUpperCase() || 'FILE';
                                    return (
                                        <div
                                            key={`${file.name || file.url}-${index}`}
                                            className="relative flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 py-3 pl-3 pr-2 shadow-sm transition-all duration-300 hover:border-orange-100 hover:bg-white hover:shadow-md"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-black text-gray-800" title={file.name}>
                                                    {file.name}
                                                </p>
                                                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                                    {fileTypeLabel}
                                                </p>
                                            </div>
                                            <div className="ml-auto flex shrink-0 items-center gap-1.5 pr-2">
                                                <button
                                                    onClick={() => setPreviewFile(file)}
                                                    disabled={!fileUrl}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 transition-all hover:text-orange-600 hover:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Xem trước"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    download={file.isLocal ? file.name : undefined}
                                                    rel="noreferrer"
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 transition-all hover:text-green-600 hover:ring-green-100"
                                                    title="Tải xuống"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveLocalContract(index)}
                                                disabled={isSaving}
                                                className="absolute -right-2 -top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-md transition-all hover:scale-105 hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                                title="Xóa tệp chọn"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Save changes button */}
                        {hasChanges && (
                            <button
                                onClick={handleSaveChanges}
                                disabled={isSaving}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-100 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Đang lưu...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        <span>{saveButtonLabel}</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Tasks & Activity */}
                <div className="lg:col-span-2">
                    <UserTasksSection userId={id} userName={user?.fullName} />
                </div>
            </div>

            <DocumentPreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                url={previewUrl}
                fileName={previewFile?.name || 'Hợp đồng lao động'}
            />
        </div>
    );
};
