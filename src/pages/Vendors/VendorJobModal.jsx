import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useGetJobsQuery, useCreateJobMutation } from '../../api/jobs';
import { Plus, Search, Check, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatCurrency, formatNumber } from '../../utils/format';

const jobSchema = z.object({
    // Job creation fields
    name: z.string().optional(),
    code: z.string().optional(),
    performerType: z.enum(['INTERNAL', 'EXTERNAL']).optional(),

    // Rate card fields
    price: z.string().min(1, 'Giá là bắt buộc').transform((val) => val.replace(/\D/g, '')),
    note: z.string().optional(),
});

export const VendorJobModal = ({ isOpen, onClose, onSubmit, vendorId, existingJob = null, existingJobIds = [] }) => {
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);

    const { data: allJobs = [], isLoading: isLoadingJobs } = useGetJobsQuery();
    const [createJob, { isLoading: isCreating }] = useCreateJobMutation();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            name: '',
            code: '',
            performerType: 'INTERNAL',
            price: '',
            note: '',
        },
    });

    const priceValue = watch('price');

    useEffect(() => {
        if (!isOpen) {
            setIsCreatingNew(false);
            setSearchTerm('');
            setSelectedJob(null);
            reset();
        } else if (existingJob) {
            // Map selectedJob to the core job object for consistent display
            setSelectedJob(existingJob.job);
            setValue('price', existingJob.price?.toString() || '');
            setValue('note', existingJob.note || '');
        }
    }, [isOpen, existingJob, reset, setValue]);

    const handleFormSubmit = async (data) => {
        try {
            let jobId = selectedJob?.id;

            if (isCreatingNew) {
                if (!data.name || !data.code) {
                    toast.error('Vui lòng nhập tên và mã hạng mục');
                    return;
                }
                const newJob = await createJob({
                    name: data.name,
                    code: data.code,
                    performerType: data.performerType,
                    costPrice: parseInt(data.price)
                }).unwrap();
                jobId = newJob.id;
            }

            if (!jobId) {
                toast.error('Vui lòng chọn hoặc tạo hạng mục');
                return;
            }

            await onSubmit({
                jobId,
                price: parseInt(data.price),
                note: data.note,
            });
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const filteredJobs = allJobs
        .filter(job => !existingJobIds.map(String).includes(String(job.id)))
        .filter(job =>
            job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.code.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={existingJob ? 'Cập Nhật Giá Hạng Mục' : (isCreatingNew ? 'Tạo Hạng Mục Mới' : 'Gán Hạng Mục Phụ Trách')}
        >
            {isCreatingNew ? (
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600">
                            <span className="text-xs font-bold uppercase tracking-wider">Bước 1: Thông tin hạng mục</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
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
                            <div className="md:col-span-2">
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

                        <div className="flex items-center gap-2 text-green-600 pt-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Bước 2: Thông tin Rate Card (Vendor)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50/50 p-4 rounded-xl border border-green-100">
                            <Input
                                label="Giá Vendor *"
                                {...register('price')}
                                value={formatNumber(priceValue)}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, '');
                                    setValue('price', rawValue);
                                }}
                                error={errors.price?.message}
                            />
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                <textarea
                                    {...register('note')}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm min-h-[60px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsCreatingNew(false)}>
                            Quay lại tìm kiếm
                        </Button>
                        <div className="space-x-3">
                            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
                            <Button type="submit" isLoading={isCreating}>Tạo & Gán</Button>
                        </div>
                    </div>
                </form>
            ) : selectedJob ? (
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100">
                            <div>
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Hạng mục đã chọn</p>
                                <p className="font-bold text-gray-900">{selectedJob.name}</p>
                                <p className="text-xs text-gray-500">{selectedJob.code}</p>
                            </div>
                            {!existingJob && (
                                <Button variant="outline" size="sm" onClick={() => setSelectedJob(null)}>
                                    <ArrowLeft className="h-4 w-4 mr-1" /> Thay đổi
                                </Button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <span className="text-xs font-bold uppercase tracking-wider">Thông tin Rate Card (Vendor)</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50/50 p-4 rounded-xl border border-green-100">
                                <Input
                                    label="Giá Vendor cung cấp"
                                    {...register('price')}
                                    value={formatNumber(priceValue)}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, '');
                                        setValue('price', rawValue);
                                    }}
                                    error={errors.price?.message}
                                />

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                    <textarea
                                        {...register('note')}
                                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm min-h-[60px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
                        <Button type="submit">Lưu Cấu Hình</Button>
                    </div>
                </form>
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
                                        <p className="text-xs text-gray-500">{job.code} • {formatCurrency(job.costPrice)} (Giá gốc)</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedJob(job)}
                                        className="group hover:bg-blue-600 hover:text-white hover:border-blue-600"
                                    >
                                        <Plus className="h-4 w-4 mr-1 transition-transform group-active:scale-95" />
                                        Chọn
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
                        <p className="text-sm text-gray-500 text-center">Hoặc bạn có thể tạo một hạng mục hoàn toàn mới</p>
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
