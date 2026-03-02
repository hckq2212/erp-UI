import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Select from 'react-select';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateServiceMutation } from '../../api/services';
import { useGetJobsQuery } from '../../api/jobs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const serviceSchema = z.object({
    name: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
    description: z.string().optional(),
    outputJobId: z.string().min(1, 'Vui lòng chọn công việc đầu ra'),
});

export const CreateServiceModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [createService, { isLoading }] = useCreateServiceMutation();
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
            description: '',
            outputJobId: '',
        },
    });

    const onSubmit = async (data) => {
        try {
            const res = await createService(data).unwrap();
            toast.success('Tạo dịch vụ thành công');
            reset();
            if (res?.id) navigate(`/services/${res.id}`);
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi tạo dịch vụ');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm Dịch Vụ Mới">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Tên dịch vụ *"
                    {...register('name')}
                    error={errors.name?.message}
                    placeholder="Ví dụ: Quay phim, Thiết kế..."
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Công việc đầu ra *</label>
                    <Controller
                        name="outputJobId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                options={jobOptions}
                                placeholder="-- Tìm và chọn công việc --"
                                isClearable
                                isSearchable
                                value={jobOptions.find(opt => opt.value === field.value) || null}
                                onChange={(val) => field.onChange(val ? val.value : '')}
                                classNamePrefix="react-select"
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        borderRadius: '0.5rem',
                                        padding: '1px',
                                        borderColor: errors.outputJobId
                                            ? '#ef4444'
                                            : state.isFocused ? '#3b82f6' : '#d1d5db',
                                        boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                                        '&:hover': {
                                            borderColor: errors.outputJobId ? '#ef4444' : '#3b82f6'
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
                                    })
                                }}
                            />
                        )}
                    />
                    {errors.outputJobId && (
                        <p className="mt-1 text-sm text-red-600 font-medium">{errors.outputJobId.message}</p>
                    )}
                </div>

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
                        Tạo Dịch Vụ
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
