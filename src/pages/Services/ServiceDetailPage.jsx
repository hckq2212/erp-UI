import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGetServiceQuery, useAddJobMutation, useRemoveJobMutation } from '../../api/services';
import { formatCurrency } from '../../utils/format';
import { ArrowLeft, Briefcase, Clock, DollarSign, List, Trash2, Plus, Star } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AddJobModal } from './AddJobModal';
import { toast } from 'react-toastify';

export const ServiceDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);

    const { data: service, isLoading, error } = useGetServiceQuery(id);
    const [addJob] = useAddJobMutation();
    const [removeJob] = useRemoveJobMutation();

    const handleAddJob = async (jobId) => {
        try {
            await addJob({ id, jobId }).unwrap();
            toast.success('Thêm hạng mục thành công');
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi thêm hạng mục');
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
                                <p className="text-lg font-bold text-blue-600">{service.name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Giá vốn</label>
                                <p className="text-md font-bold text-blue-600">{formatCurrency(service.costPrice)}</p>
                            </div>
                            {service.description && (
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mô tả</label>
                                    <p className="text-md font-bold text-blue-600">{service.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Jobs List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <List className="h-5 w-5 text-green-600" />
                                Hạng mục công việc ({service.jobs?.length || 0})
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
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá vốn</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Loại thực hiện</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {service.jobs?.map((job) => (
                                        <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {job.code}
                                                {service.outputJobId === job.id && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-tight border border-purple-200 ml-2">
                                                        Công việc đầu ra
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-600">{job.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-blue-600 font-medium">{formatCurrency(job.costPrice)}</td>
                                            <td className="px-6 py-4 text-sm text-right flex items-center justify-end gap-3">
                                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${job.defaultPerformerType === 'INTERNAL'
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'bg-orange-50 text-orange-700'
                                                    }`}>
                                                    {job.performerType === 'INTERNAL' ? 'Nội bộ' : 'Bên ngoài'}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveJob(job.id)}
                                                    className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors"
                                                    title="Xóa hạng mục"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!service.jobs || service.jobs.length === 0) && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
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
                serviceId={id}
                existingJobIds={service.jobs?.map(j => j.id)}
            />
        </div>
    );
};
