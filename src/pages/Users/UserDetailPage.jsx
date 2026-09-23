import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetUserQuery, useUpdateUserMutation, useUpdateUserLaborContractsMutation } from '../../api/users';
import { USER_ROLE_COLORS, USER_ROLE } from '../../utils/enums';
import { uploadToCloudinary, getFilePreviewUrl } from '../../utils/cloudinary';
import { toast } from 'react-toastify';
import { Modal } from '../../components/ui/Modal';
import { UserTasksSection } from '../../components/users/UserTasksSection';
import {
    X, Upload, FileText, Download, Eye, Loader2,
    ArrowLeft, CheckCircle, Mail, Phone, User
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const UserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: user, isLoading, error } = useGetUserQuery(id);
    const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
    const [updateUserLaborContracts, { isLoading: isSavingContracts }] = useUpdateUserLaborContractsMutation();

    // File handling state
    const [isUploading, setIsUploading] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [contracts, setContracts] = useState([]);

    useEffect(() => {
        if (user && user.laborContract) {
            setContracts(user.laborContract);
        } else {
            setContracts([]);
        }
    }, [user]);

    const handleLocalFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (contracts.length + files.length > 5) {
            toast.error('Tối đa 5 hợp đồng lao động');
            return;
        }

        try {
            setIsUploading(true);
            const uploadPromises = files.map(file =>
                uploadToCloudinary(file, "GETVINI/ERP/user/labor_contract")
            );
            const uploadedFiles = await Promise.all(uploadPromises);

            setContracts(prev => [...prev, ...uploadedFiles]);
            toast.info('Tải tệp lên thành công. Nhấn "Lưu thay đổi" để cập nhật.');
        } catch (err) {
            toast.error(err.message || 'Lỗi khi tải tệp lên');
        } finally {
            setIsUploading(false);
            e.target.value = null; // Reset input
        }
    };

    const handleRemoveLocalContract = (indexToRemove) => {
        setContracts(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSaveChanges = async () => {
        try {
            await updateUserLaborContracts({
                id,
                laborContract: contracts
            }).unwrap();
            toast.success('Cập nhật hợp đồng lao động thành công');
        } catch (err) {
            toast.error(err.message || 'Lỗi khi cập nhật');
        }
    };

    const hasChanges = JSON.stringify(contracts) !== JSON.stringify(user?.laborContract || []);

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
                            <div className="w-24 h-24 bg-blue-600 text-white rounded-3xl flex items-center justify-center font-black text-4xl mx-auto shadow-xl shadow-blue-100 mb-6">
                                {user.fullName?.[0]}
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
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thông tin liên hệ</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <Mail className="w-4 h-4 text-blue-500" />
                                        <span className="truncate">{user.account?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <Phone className="w-4 h-4 text-blue-500" />
                                        <span>{user.phoneNumber || 'Chưa cập nhật'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <User className="w-4 h-4 text-blue-500" />
                                        <span>Username: <span className="font-bold text-gray-900">{user.account?.username}</span></span>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* Labor Contract Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <h3 className="font-black text-gray-900 text-sm tracking-wide uppercase">Hợp đồng lao động</h3>
                            </div>
                        </div>

                        {/* File Upload Dropzone */}
                        <div className="relative group">
                            <label className="flex flex-col items-center justify-center w-full min-h-[120px] px-4 py-6 border-2 border-dashed border-gray-200 hover:border-blue-400 bg-gray-50/50 hover:bg-blue-50/20 rounded-2xl cursor-pointer transition-all duration-300">
                                <div className="flex flex-col items-center justify-center text-center space-y-2">
                                    {isUploading ? (
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    ) : (
                                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors group-hover:scale-110 duration-300" />
                                    )}
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-700">
                                            {isUploading ? 'Đang tải...' : 'Tải tài liệu lên'}
                                        </p>
                                        <p className="text-[10px] text-gray-400">PDF, JPG, PNG lên đến 10MB</p>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                    onChange={handleLocalFileChange}
                                    disabled={isUploading}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* Contracts Preview List */}
                        {contracts.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                {contracts.map((file, index) => {
                                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url);
                                    return (
                                        <div
                                            key={index}
                                            className="relative group border border-gray-100 rounded-2xl overflow-hidden aspect-[4/3] bg-gray-50 flex items-center justify-center p-2 shadow-sm hover:shadow-md transition-all duration-300"
                                        >
                                            {isImage ? (
                                                <img
                                                    src={file.url}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover rounded-xl"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-center p-2">
                                                    <FileText className="w-10 h-10 text-blue-500 mb-1" />
                                                    <span className="text-[10px] font-bold text-gray-700 line-clamp-2 px-1">
                                                        {file.name}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Hover overlay actions */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-2xl">
                                                <button
                                                    onClick={() => setPreviewFile(file)}
                                                    className="p-1.5 bg-white/95 text-gray-700 hover:text-blue-600 rounded-lg hover:scale-105 transition-all shadow-md"
                                                    title="Xem trước"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 bg-white/95 text-gray-700 hover:text-green-600 rounded-lg hover:scale-105 transition-all shadow-md"
                                                    title="Tải xuống"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </div>

                                            {/* X Close button in top-right */}
                                            <button
                                                onClick={() => handleRemoveLocalContract(index)}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md hover:scale-110 transition-all z-10"
                                                title="Xóa tệp chọn"
                                            >
                                                <X className="w-3.5 h-3.5" />
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
                                disabled={isSavingContracts}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
                            >
                                {isSavingContracts ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Đang cập nhật...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Lưu thay đổi</span>
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

            {/* Document Preview Modal */}
            <Modal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                title={previewFile?.name || 'Xem tài liệu'}
                className="max-w-2xl"
            >
                <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden relative">
                    {previewFile && (
                        <iframe
                            src={getFilePreviewUrl(previewFile.url, 'FILE')}
                            className="w-full h-full border-none"
                            title="Tài liệu"
                        />
                    )}
                </div>
                <div className="flex justify-end pt-4">
                    <a
                        href={previewFile?.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-100"
                    >
                        <Download className="w-4 h-4" /> Tải về máy
                    </a>
                </div>
            </Modal>
        </div>
    );
};
