import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGetServiceQuery, useAddJobMutation, useRemoveJobMutation } from '../../api/services';
import { formatCurrency } from '../../utils/format';
import { ArrowLeft, Briefcase, Clock, DollarSign, List, Trash2, Plus, Star, Edit } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AddJobModal } from './AddJobModal';
import { toast } from 'react-toastify';
import { useUpdateServiceMutation, useDeleteServiceMutation } from '../../api/services';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';

export const ServiceDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', code: '', unit: '', description: '' });

    const { data: service, isLoading, error } = useGetServiceQuery(id);
    const [addJob] = useAddJobMutation();
    const [removeJob] = useRemoveJobMutation();
    const [updateService] = useUpdateServiceMutation();
    const [deleteService] = useDeleteServiceMutation();
    const user = useSelector(selectCurrentUser);
    const isAdminOrBOD = ['ADMIN', 'BOD'].includes(user?.role);

    const handleAddJob = async (jobId) => {
        try {
            await addJob({ id, jobId }).unwrap();
            toast.success('Thêm hạng mục thành công');
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi thêm hạng mục');
        }
    };

    const handleAddJobsFromService = async (sourceService) => {
        try {
            const existingIds = new Set((service.serviceJobs || []).map(sj => String(sj.jobId)));
            const jobsToAdd = (sourceService.serviceJobs || []).filter(sj => !existingIds.has(String(sj.jobId)));

            if (jobsToAdd.length === 0) {
                toast.info('Dịch vụ được chọn không có hạng mục mới để thêm');
                return 0;
            }

            const currentConfigs = (service.serviceJobs || []).map(sj => ({
                jobId: sj.jobId,
                quantity: sj.quantity || 1,
                isOutput: Boolean(sj.isOutput)
            }));

            const sourceConfigs = jobsToAdd.map(sj => ({
                jobId: sj.jobId,
                quantity: sj.quantity || 1,
                isOutput: Boolean(sj.isOutput)
            }));

            await updateService({ id, jobConfigs: [...currentConfigs, ...sourceConfigs] }).unwrap();
            toast.success(`Đã thêm ${jobsToAdd.length} hạng mục từ dịch vụ "${sourceService.name}"`);
            return jobsToAdd.length;
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi thêm hạng mục từ dịch vụ');
            return 0;
        }
    };

    const handleUpdateJobConfig = async (jobId, updates) => {
        try {
            const currentConfigs = service.serviceJobs.map(sj => ({
                jobId: sj.jobId,
                quantity: sj.jobId === jobId ? (updates.quantity ?? sj.quantity) : sj.quantity,
                isOutput: sj.jobId === jobId ? (updates.isOutput ?? sj.isOutput) : sj.isOutput
            }));

            await updateService({ id, jobConfigs: currentConfigs }).unwrap();
            toast.success('Cập nhật cấu hình hạng mục thành công');
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi cập nhật');
        }
    };

    const handleRemoveJob = async (jobId) => {
        if (window.confirm('Bạn có chắc muốn xóa hạng mục này khỏi dịch vụ?')) {
            try {
                await removeJob({ id, jobId }).unwrap();
                toast.success('Xóa hạng mục thành công');
            } catch (err) {
                toast.error(err?.data?.message || 'Có lỗi xảy ra khi xóa hạng mục');
            }
        }
    };

    const handleToggleEdit = () => {
        if (!isEditing) {
            setEditForm({
                name: service.name,
                code: service.code || '',
                unit: service.unit || '',
                description: service.description || ''
            });
        }
        setIsEditing(!isEditing);
    };

    const handleSaveUpdate = async () => {
        try {
            const cleanedForm = {
                ...editForm,
                code: editForm.code.trim(),
                description: editForm.description ? editForm.description.trim() : ''
            };
            await updateService({ id, ...cleanedForm }).unwrap();
            toast.success('Cập nhật thông tin thành công');
            setIsEditing(false);
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi cập nhật dịch vụ');
        }
    };

    const handleDeleteService = async () => {
        if (window.confirm(`Bạn có chắc muốn xóa dịch vụ "${service.name}"? Hành động này không thể hoàn tác.`)) {
            try {
                await deleteService(id).unwrap();
                toast.success('Xóa dịch vụ thành công');
                navigate('/services');
            } catch (err) {
                toast.error(err?.data?.message || 'Có lỗi xảy ra khi xóa dịch vụ');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">Đang tải thông tin dịch vụ...</p>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 font-medium">Không tìm thấy thông tin dịch vụ hoặc có lỗi xảy ra.</p>
                <Button onClick={() => navigate('/services')} className="mt-4">
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
                        onClick={() => navigate('/services')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{service.name}</h1>
                        <p className="text-gray-500 text-sm mt-1">Chi tiết thông tin dịch vụ và các hạng mục đi kèm</p>
                    </div>
                </div>

                {isAdminOrBOD && (
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveUpdate}
                                    className="shadow-sm"
                                >
                                    Lưu thay đổi
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleToggleEdit}
                                    className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
                                >
                                    Hủy
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={handleToggleEdit}
                                    className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Chỉnh sửa
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={handleDeleteService}
                                    className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100 shadow-sm"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Xóa dịch vụ
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-blue-600" />
                            Thông tin chung
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tên dịch vụ</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/10 text-lg font-bold text-blue-900"
                                    />
                                ) : (
                                    <p className="text-lg font-bold text-blue-600">{service.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mã dịch vụ</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editForm.code}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/10 text-md font-bold text-blue-900"
                                        placeholder="Ví dụ: VID"
                                    />
                                ) : (
                                    <p className="text-md font-mono font-bold text-blue-600">{service.code || '---'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Đơn vị tính</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editForm.unit}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/10 text-md font-bold text-blue-900"
                                        placeholder="Ví dụ: Ngày, Gói..."
                                    />
                                ) : (
                                    <p className="text-md font-bold text-blue-600">{service.unit || '---'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Giá vốn</label>
                                <p className="text-md font-bold text-blue-600">{formatCurrency(service.costPrice)}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mô tả</label>
                                {isEditing ? (
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={4}
                                        className="w-full mt-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/10 text-md font-bold text-blue-900"
                                        placeholder="Nhập mô tả..."
                                    />
                                ) : (
                                    <p className="text-md font-bold text-blue-600 whitespace-pre-wrap">{service.description || 'Không có mô tả'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Jobs List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <List className="h-5 w-5 text-green-600" />
                                Hạng mục công việc
                            </h2>
                            <Button onClick={() => setIsAddJobModalOpen(true)} size="sm">
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
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Số lượng</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Đầu ra</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá vốn</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {service.serviceJobs?.map((sj) => (
                                        <tr key={sj.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {sj.job?.code}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-600">{sj.job?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={sj.quantity}
                                                    onChange={(e) => handleUpdateJobConfig(sj.jobId, { quantity: parseInt(e.target.value) })}
                                                    className="w-16 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={sj.isOutput}
                                                    onChange={(e) => handleUpdateJobConfig(sj.jobId, { isOutput: e.target.checked })}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                                                {formatCurrency(sj.job?.costPrice * sj.quantity)}
                                                <div className="text-[10px] text-gray-400 font-normal">
                                                    {formatCurrency(sj.job?.costPrice)} / đơn vị
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleRemoveJob(sj.jobId)}
                                                    className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors"
                                                    title="Xóa hạng mục"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!service.serviceJobs || service.serviceJobs.length === 0) && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                                Chưa có hạng mục công việc nào cho dịch vụ này
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <AddJobModal
                isOpen={isAddJobModalOpen}
                onClose={() => setIsAddJobModalOpen(false)}
                onAddJob={handleAddJob}
                onAddJobsFromService={handleAddJobsFromService}
                serviceId={id}
                existingJobIds={service.serviceJobs?.map(sj => sj.jobId) || []}
            />
        </div>
    );
};
