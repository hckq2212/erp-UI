import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Select from 'react-select';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useUpdateServiceMutation } from '../../api/services';
import { useGetJobsQuery } from '../../api/jobs';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

const serviceSchema = z.object({
    name: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
    code: z.string().trim().min(1, 'Mã dịch vụ là bắt buộc'),
    description: z.string().optional(),
    unit: z.string().min(1, 'Đơn vị tính là bắt buộc'),
    jobIds: z.array(z.string()).optional().default([]),
    isAI: z.boolean().optional().default(false),
});

export const EditServiceModal = ({ isOpen, onClose, service }) => {
    const [updateService, { isLoading }] = useUpdateServiceMutation();
    const { data: jobs } = useGetJobsQuery();

    const jobOptions = jobs?.map(job => ({
        value: job.id,
        label: `${job.name} (${job.code})`
    })) || [];

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: '',
            code: '',
            description: '',
            unit: '',
            jobIds: [],
            isAI: false,
        },
    });

    useEffect(() => {
        if (service && isOpen) {
            reset({
                name: service.name || '',
                code: service.code || '',
                description: service.description || '',
                unit: service.unit || '',
                jobIds: service.serviceJobs?.map(sj => sj.jobId) || [],
                isAI: Boolean(service.isAI),
            });
        }
    }, [service, isOpen, reset]);

    const onSubmit = async (data) => {
        try {
            await updateService({ id: service.id, ...data, code: data.code.trim() }).unwrap();
            toast.success('Cập nhật dịch vụ thành công');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi cập nhật dịch vụ');
        }
    };

    const selectStyles = (hasError) => ({
        control: (base, state) => ({
            ...base,
            borderRadius: '0.5rem',
            padding: '1px',
            borderColor: hasError
                ? '#ef4444'
                : state.isFocused ? '#3b82f6' : '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
            '&:hover': {
                borderColor: hasError ? '#ef4444' : '#3b82f6'
            }
        }),
        placeholder: (base) => ({
            ...base,
            color: '#9ca3af',
            fontSize: '0.875rem'
        }),
        option: (base, state) => ({
            ...base,
            fontSize: '0.875rem',
            backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
            color: state.isSelected ? 'white' : '#374151',
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: '#eff6ff',
            borderRadius: '0.375rem',
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: '#1d4ed8',
            fontSize: '0.75rem',
            fontWeight: '600',
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: '#60a5fa',
            '&:hover': {
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
            },
        }),
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh Sửa Dịch Vụ">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Tên dịch vụ *"
                    {...register('name')}
                    error={errors.name?.message}
                    placeholder="Ví dụ: Quay phim, Thiết kế..."
                />

                <Input
                    label="Mã dịch vụ *"
                    {...register('code')}
                    error={errors.code?.message}
                    placeholder="Ví dụ: VID, DES..."
                />

                <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                    <input type="checkbox" {...register('isAI')} className="h-4 w-4 accent-blue-600" />
                    Đây là dịch vụ AI
                </label>

                <Input
                    label="Đơn vị tính *"
                    {...register('unit')}
                    error={errors.unit?.message}
                    placeholder="Ví dụ: Ngày, Gói, Item, Giờ..."
                />

                {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Các hạng mục thực hiện</label>
                    <Controller
                        name="jobIds"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                options={jobOptions}
                                placeholder="-- Chọn các hạng mục thuộc dịch vụ này --"
                                isMulti
                                isSearchable
                                value={jobOptions.filter(opt => field.value?.includes(opt.value))}
                                onChange={(vals) => field.onChange(vals ? vals.map(v => v.value) : [])}
                                classNamePrefix="react-select"
                                styles={selectStyles(errors.jobIds)}
                            />
                        )}
                    />
                    {errors.jobIds && (
                        <p className="mt-1 text-sm text-red-600 font-medium">{errors.jobIds.message}</p>
                    )}
                </div> */}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea
                        {...register('description')}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm min-h-[100px]"
                        placeholder="Nhập mô tả ngắn gọn về dịch vụ..."
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Cập Nhật
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
