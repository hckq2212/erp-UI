import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateServiceMutation } from '../../api/services';
import { useGetJobsQuery } from '../../api/jobs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Trash2, Layers } from 'lucide-react';
import { AddJobModal } from './AddJobModal';
import { formatCurrency } from '../../utils/format';

const serviceSchema = z.object({
    name: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
    description: z.string().optional(),
    unit: z.string().min(1, 'Đơn vị tính là bắt buộc'),
    jobIds: z.array(z.string()).optional().default([]),
    isAI: z.boolean().optional().default(false),
});

export const CreateServiceModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [createService, { isLoading }] = useCreateServiceMutation();
    const { data: jobs = [] } = useGetJobsQuery();
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: '',
            description: '',
            unit: '',
            jobIds: [],
            isAI: false,
        },
    });

    const selectedJobIds = watch('jobIds') || [];

    const handleAddJob = (jobId) => {
        const strId = String(jobId);
        if (!selectedJobIds.map(String).includes(strId)) {
            setValue('jobIds', [...selectedJobIds, strId], { shouldValidate: true, shouldDirty: true });
        }
    };

    const handleAddJobsFromService = async (sourceService) => {
        const currentIds = selectedJobIds.map(String);
        const sourceJobs = (sourceService.serviceJobs || [])
            .map(sj => String(sj.jobId))
            .filter(id => !currentIds.includes(id));

        if (sourceJobs.length === 0) {
            toast.info('Dịch vụ được chọn không có hạng mục mới');
            return 0;
        }

        setValue('jobIds', [...selectedJobIds, ...sourceJobs], { shouldValidate: true, shouldDirty: true });
        toast.success(`Đã thêm ${sourceJobs.length} hạng mục từ "${sourceService.name}"`);
        return sourceJobs.length;
    };

    const handleRemoveJob = (jobIdToRemove) => {
        setValue(
            'jobIds',
            selectedJobIds.filter(id => String(id) !== String(jobIdToRemove)),
            { shouldValidate: true, shouldDirty: true }
        );
    };

    const onSubmit = async (data) => {
        try {
            const cleanedData = {
                ...data,
                description: data.description ? data.description.trim() : ''
            };
            const res = await createService(cleanedData).unwrap();
            toast.success('Tạo dịch vụ thành công');
            reset();
            if (res?.id) navigate(`/services/${res.id}`);
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi tạo dịch vụ');
        }
    };

    const selectedJobsList = selectedJobIds
        .map(id => jobs.find(j => String(j.id) === String(id)))
        .filter(Boolean);

    const totalCostPrice = selectedJobsList.reduce((sum, j) => sum + (Number(j.costPrice) || 0), 0);

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Thêm Dịch Vụ Mới" className="max-w-3xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                label="Tên dịch vụ *"
                                {...register('name')}
                                error={errors.name?.message}
                                placeholder="Ví dụ: Quay phim sự kiện, Thiết kế 3D..."
                            />
                        </div>

                        <Input
                            label="Đơn vị tính *"
                            {...register('unit')}
                            error={errors.unit?.message}
                            placeholder="Ví dụ: Ngày, Gói, Item, Giờ..."
                        />

                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 w-full hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    {...register('isAI')}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Dịch vụ liên quan đến AI</span>
                            </label>
                        </div>
                    </div>

                    {/* Hạng mục thực hiện section */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <label className="block text-sm font-bold text-gray-800">
                                    Hạng mục công việc thực hiện
                                </label>
                                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                                    {selectedJobsList.length} hạng mục
                                </span>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setIsAddJobModalOpen(true)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Thêm hạng mục
                            </Button>
                        </div>

                        {selectedJobsList.length === 0 ? (
                            <div
                                onClick={() => setIsAddJobModalOpen(true)}
                                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
                            >
                                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                    <Layers className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">Chưa có hạng mục nào được chọn</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Bấm vào đây để chọn từ danh sách, lấy từ dịch vụ khác hoặc tạo hạng mục mới
                                </p>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-2.5 font-semibold">Mã</th>
                                                <th className="px-4 py-2.5 font-semibold">Tên hạng mục</th>
                                                <th className="px-4 py-2.5 font-semibold">Đơn vị</th>
                                                <th className="px-4 py-2.5 font-semibold text-right">Giá vốn</th>
                                                <th className="px-4 py-2.5 font-semibold text-center w-12">Xóa</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {selectedJobsList.map((job) => (
                                                <tr key={job.id} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="px-4 py-3 font-mono text-xs text-gray-500 font-semibold">
                                                        {job.code}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-900">
                                                        {job.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                                        {job.unit || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-700 text-xs">
                                                        {formatCurrency(job.costPrice)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveJob(job.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                            title="Xóa hạng mục"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-100 flex justify-between items-center text-xs font-semibold text-gray-600">
                                    <span>Tổng giá vốn tạm tính:</span>
                                    <span className="text-blue-600 font-bold text-sm">
                                        {formatCurrency(totalCostPrice)}
                                    </span>
                                </div>
                            </div>
                        )}
                        {errors.jobIds && (
                            <p className="mt-1 text-sm text-red-600 font-medium">{errors.jobIds.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea
                            {...register('description')}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm min-h-[80px]"
                            placeholder="Nhập mô tả ngắn gọn về dịch vụ..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            Tạo Dịch Vụ
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal thêm hạng mục */}
            <AddJobModal
                isOpen={isAddJobModalOpen}
                onClose={() => setIsAddJobModalOpen(false)}
                onAddJob={handleAddJob}
                onAddJobsFromService={handleAddJobsFromService}
                existingJobIds={selectedJobIds}
                zIndex="z-[60]"
            />
        </>
    );
};
