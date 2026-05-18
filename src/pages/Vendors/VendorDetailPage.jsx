import { useParams, useNavigate } from 'react-router-dom';
import { useGetVendorQuery, useGetVendorJobsQuery, useAddVendorJobMutation, useUpdateVendorJobMutation, useRemoveVendorJobMutation } from '../../api/vendors';
import { formatCurrency, formatNumber } from '../../utils/format';
import { ArrowLeft, Store, Mail, Phone, MapPin, FileText, List, Trash2, Plus, CreditCard, Edit2, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { VendorJobModal } from './VendorJobModal';
import { AdditionalInfo } from '../../components/shared/AdditionalInfo';

export const VendorDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [selectedVendorJob, setSelectedVendorJob] = useState(null);
    const [activeTab, setActiveTab] = useState('jobs');

    const { data: vendor, isLoading, error } = useGetVendorQuery(id);
    const { data: vendorJobs = [], isLoading: isLoadingJobs } = useGetVendorJobsQuery(id);
    const [addVendorJob] = useAddVendorJobMutation();
    const [updateVendorJob] = useUpdateVendorJobMutation();
    const [removeVendorJob] = useRemoveVendorJobMutation();

    const handleAddOrUpdateJob = async (jobData) => {
        try {
            if (selectedVendorJob) {
                // For editing, jobId is the core job ID
                const jobId = selectedVendorJob.job?.id || selectedVendorJob.jobId;
                await updateVendorJob({ id, jobId, ...jobData }).unwrap();
                toast.success('Cập nhật giá thành công');
            } else {
                await addVendorJob({ id, ...jobData }).unwrap();
                toast.success('Thêm hạng mục thành công');
            }
            setIsJobModalOpen(false);
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleRemoveJob = async (jobId) => {
        if (window.confirm('Bạn có chắc muốn xóa hạng mục này khỏi vendor?')) {
            try {
                await removeVendorJob({ id, jobId }).unwrap();
                toast.success('Xóa hạng mục thành công');
            } catch (err) {
                toast.error(err?.data?.message || 'Có lỗi xảy ra khi xóa hạng mục');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">Đang tải thông tin vendor...</p>
            </div>
        );
    }

    if (error || !vendor) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 font-medium">Không tìm thấy thông tin vendor hoặc có lỗi xảy ra.</p>
                <Button onClick={() => navigate('/vendors')} className="mt-4">
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/vendors')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{vendor.name}</h1>
                        <p className="text-gray-500 text-sm mt-1">Chi tiết thông tin nhà cung cấp và các hạng mục phụ trách</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Cards */}
                <div className="lg:col-span-1 space-y-6">
                    {/* General Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Store className="h-5 w-5 text-blue-600" />
                            Thông tin chung
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tên Vendor</label>
                                <p className="text-md font-bold text-blue-600">{vendor.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mã số thuế</label>
                                    <p className="text-sm font-medium text-gray-900">{vendor.taxId || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Loại hình</label>
                                    <p className="text-sm font-medium text-gray-900">
                                        {vendor.type === 'BUSINESS' ? 'Doanh nghiệp' :
                                         vendor.type === 'INDIVIDUAL' ? 'Cá nhân' :
                                         vendor.type === 'KOL' ? 'KOL' :
                                         vendor.type === 'KOC' ? 'KOC' : vendor.type}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Phone className="h-5 w-5 text-green-600" />
                            Liên hệ
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="h-4 w-4 text-gray-400 mt-1" />
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email</label>
                                    <p className="text-sm text-gray-900">{vendor.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-4 w-4 text-gray-400 mt-1" />
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Điện thoại</label>
                                    <p className="text-sm text-gray-900">{vendor.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Địa chỉ</label>
                                    <p className="text-sm text-gray-900">{vendor.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bank Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-orange-500" />
                            Tài khoản ngân hàng
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Store className="h-4 w-4 text-gray-400 mt-1" />
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ngân hàng</label>
                                    <p className="text-sm text-gray-900">{vendor.bankName || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CreditCard className="h-4 w-4 text-gray-400 mt-1" />
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Số tài khoản</label>
                                    <p className="text-sm font-bold text-gray-900 font-mono tracking-wider">{vendor.bankAccount || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vendor Content Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs Header */}
                    <div className="flex border-b border-gray-200 gap-8">
                        <button
                            onClick={() => setActiveTab('jobs')}
                            className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'jobs' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <List className="h-4 w-4" />
                                Hạng mục phụ trách ({vendorJobs.length})
                            </div>
                            {activeTab === 'jobs' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                            )}
                        </button>
                        {(vendor.idCardFront || vendor.idCardBack) && (
                            <button
                                onClick={() => setActiveTab('idCard')}
                                className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'idCard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Căn cước công dân
                                </div>
                                {activeTab === 'idCard' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                )}
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('additional')}
                            className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === 'additional' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Thông tin thêm
                            </div>
                            {activeTab === 'additional' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                            )}
                        </button>
                    </div>

                    {activeTab === 'jobs' ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <List className="h-5 w-5 text-purple-600" />
                                    Danh sách hạng mục
                                </h2>
                                <Button size="sm" onClick={() => {
                                    setSelectedVendorJob(null);
                                    setIsJobModalOpen(true);
                                }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm hạng mục
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên hạng mục</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá Vendor cung cấp</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ghi chú</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {vendorJobs.map((job) => (
                                            <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{job.job.code}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{job.job.name}</td>
                                                <td className="px-6 py-4 text-sm text-blue-600 font-bold whitespace-nowrap">
                                                    {formatNumber(job.price)} VNĐ
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 italic max-w-xs truncate">
                                                    {job.note || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedVendorJob(job);
                                                            setIsJobModalOpen(true);
                                                        }}
                                                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                                                        title="Sửa giá"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveJob(job.id)}
                                                        className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors"
                                                        title="Gỡ hạng mục"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {vendorJobs.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                                    {isLoadingJobs ? 'Đang tải hạng mục...' : 'Chưa có hạng mục nào cho vendor này'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : activeTab === 'idCard' ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 ">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Hình ảnh Căn cước công dân
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-500 block">Mặt trước</label>
                                    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-gray-50 aspect-video flex items-center justify-center p-2 group transition-all hover:border-blue-200">
                                        {vendor.idCardFront ? (
                                            <img
                                                src={vendor.idCardFront}
                                                alt="Mặt trước CCCD"
                                                className="max-h-full max-w-full object-contain cursor-zoom-in transition-transform group-hover:scale-[1.02]"
                                                onClick={() => window.open(vendor.idCardFront, '_blank')}
                                            />
                                        ) : (
                                            <div className="text-center py-10">
                                                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400">Chưa cập nhật hình ảnh mặt trước</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-500 block">Mặt sau</label>
                                    <div className="border-2  border-gray-200 rounded-2xl overflow-hidden bg-gray-50 aspect-video flex items-center justify-center p-2 group transition-all hover:border-blue-200">
                                        {vendor.idCardBack ? (
                                            <img
                                                src={vendor.idCardBack}
                                                alt="Mặt sau CCCD"
                                                className="max-h-full max-w-full object-contain cursor-zoom-in transition-transform group-hover:scale-[1.02]"
                                                onClick={() => window.open(vendor.idCardBack, '_blank')}
                                            />
                                        ) : (
                                            <div className="text-center py-10">
                                                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400">Chưa cập nhật hình ảnh mặt sau</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <AdditionalInfo data={vendor} />
                    )}
                </div>
            </div>

            <VendorJobModal
                isOpen={isJobModalOpen}
                onClose={() => setIsJobModalOpen(false)}
                onSubmit={handleAddOrUpdateJob}
                vendorId={id}
                existingJob={selectedVendorJob}
                existingJobIds={vendorJobs.map(j => j.id)}
            />
        </div>
    );
};
