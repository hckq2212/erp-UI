import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useGetJobsQuery, useCreateJobMutation } from '../../api/jobs';
import { useGetServicesQuery } from '../../api/services';
import { ArrowLeft, CopyPlus, Plus, Search, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatCurrency, formatNumber } from '../../utils/format';

const jobSchema = z.object({
    name: z.string().min(1, 'Tên hạng mục là bắt buộc'),
    code: z.string().min(1, 'Mã hạng mục là bắt buộc'),
    costPrice: z.string().transform((val) => val.replace(/\D/g, '')).optional(),
    performerType: z.enum(['INTERNAL', 'EXTERNAL']),
});

export const AddJobModal = ({ isOpen, onClose, onAddJob, onAddJobsFromService, serviceId, existingJobIds = [] }) => {
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [isSelectingService, setIsSelectingService] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { data: allJobs = [], isLoading: isLoadingJobs } = useGetJobsQuery();
    const { data: servicesData, isLoading: isLoadingServices } = useGetServicesQuery();
    const [createJob, { isLoading: isCreating }] = useCreateJobMutation();
    const [copyingServiceId, setCopyingServiceId] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            name: '',
            code: '',
            costPrice: '',
            performerType: 'INTERNAL',
        },
    });

    const costPriceValue = watch('costPrice');

    useEffect(() => {
        if (!isOpen) {
            setIsCreatingNew(false);
            setIsSelectingService(false);
            setSearchTerm('');
            setCopyingServiceId(null);
            reset();
        }
    }, [isOpen, reset]);

    const handleCreateJob = async (data) => {
        try {
            const newJob = await createJob(data).unwrap();
            await onAddJob(newJob.id);
            toast.success('Tạo và thêm hạng mục mới thành công');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi tạo hạng mục');
        }
    };

    const filteredJobs = allJobs
        .filter(job => !existingJobIds.map(String).includes(String(job.id)))
        .filter(job =>
            job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.code.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const allServices = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);
    const filteredServices = allServices
        .filter(service => String(service.id) !== String(serviceId))
        .map(service => {
            const availableJobs = (service.serviceJobs || []).filter(sj => !existingJobIds.map(String).includes(String(sj.jobId)));
            return { ...service, availableJobs };
        })
        .filter(service => service.availableJobs.length > 0)
        .filter(service =>
            service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.code?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const handleAddFromService = async (sourceService) => {
        if (!onAddJobsFromService) return;
        try {
            setCopyingServiceId(sourceService.id);
            const addedCount = await onAddJobsFromService(sourceService);
            if (addedCount > 0) {
                onClose();
            }
        } finally {
            setCopyingServiceId(null);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isCreatingNew ? 'Tạo Hạng Mục Mới' : isSelectingService ? 'Thêm Hạng Mục Từ Dịch Vụ' : 'Thêm Hạng Mục Công Việc'}
        >
            {isCreatingNew ? (
                <form onSubmit={handleSubmit(handleCreateJob)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Tên hạng mục *"
                            {...register('name')}
                            error={errors.name?.message}
                        />
                        <Input
                            label="Mã hạng mục *"
                            {...register('code')}
                            error={errors.code?.message}
                        />
                        <Input
                            label="Giá vốn"
                            {...register('costPrice')}
                            value={formatNumber(costPriceValue)}
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, '');
                                setValue('costPrice', rawValue);
                            }}
                            error={errors.costPrice?.message}
                        />
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại thực hiện *</label>
                            <select
                                {...register('performerType')}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            >
                                <option value="INTERNAL">Nội bộ</option>
                                <option value="EXTERNAL">Bên ngoài</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsCreatingNew(false)}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại tìm kiếm
                        </Button>
                        <div className="space-x-3">
                            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
                            <Button type="submit" isLoading={isCreating}>Tạo & Thêm</Button>
                        </div>
                    </div>
                </form>
            ) : isSelectingService ? (
                <div className="space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm dịch vụ để lấy hạng mục..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                        />
                    </div>

                    <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                        {isLoadingServices ? (
                            <div className="p-10 flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            </div>
                        ) : filteredServices.length > 0 ? (
                            filteredServices.map((sourceService) => (
                                <div key={sourceService.id} className="p-4 flex justify-between items-start gap-4 hover:bg-gray-50 transition-colors">
                                    <div>
                                        <h4 className="font-medium text-gray-900 text-sm">{sourceService.name}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {sourceService.code || 'Chưa có mã'} • {sourceService.availableJobs.length} hạng mục có thể thêm
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                            {sourceService.availableJobs.map(sj => sj.job?.name).filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAddFromService(sourceService)}
                                        isLoading={copyingServiceId === sourceService.id}
                                        disabled={Boolean(copyingServiceId)}
                                        className="shrink-0 group hover:bg-blue-600 hover:text-white hover:border-blue-600"
                                    >
                                        <CopyPlus className="h-4 w-4 mr-1 transition-transform group-active:scale-95" />
                                        Thêm
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center text-gray-500 text-sm">
                                {searchTerm ? 'Không tìm thấy dịch vụ phù hợp' : 'Không có dịch vụ nào còn hạng mục mới để thêm'}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => {
                            setIsSelectingService(false);
                            setSearchTerm('');
                        }}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại tìm kiếm
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm hạng mục hiện có..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                        {isLoadingJobs ? (
                            <div className="p-10 flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            </div>
                        ) : filteredJobs.length > 0 ? (
                            filteredJobs.map((job) => (
                                <div key={job.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                    <div>
                                        <h4 className="font-medium text-gray-900 text-sm">{job.name}</h4>
                                        <p className="text-xs text-gray-500">{job.code} • {formatCurrency(job.costPrice)}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onAddJob(job.id)}
                                        className="group hover:bg-blue-600 hover:text-white hover:border-blue-600"
                                    >
                                        <Plus className="h-4 w-4 mr-1 transition-transform group-active:scale-95" />
                                        Thêm
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center text-gray-500 text-sm">
                                {searchTerm ? 'Không tìm thấy hạng mục nào' : 'Bắt đầu nhập để tìm hạng mục...'}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 py-4 border-t">
                        <p className="text-sm text-gray-500 text-center">Hoặc thêm nhanh từ dịch vụ khác / tạo hạng mục mới</p>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={() => {
                                setIsSelectingService(true);
                                setSearchTerm('');
                            }}
                        >
                            <CopyPlus className="h-4 w-4 mr-2" />
                            Thêm công việc từ dịch vụ
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={() => setIsCreatingNew(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo hạng mục mới
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
