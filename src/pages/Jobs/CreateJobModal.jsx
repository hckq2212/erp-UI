import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateJobMutation } from '../../api/jobs';
import { toast } from 'react-toastify';
import { formatNumber } from '../../utils/format';

const jobSchema = z.object({
    name: z.string().min(1, 'Tên hạng mục là bắt buộc'),
    code: z.string().min(1, 'Mã hạng mục là bắt buộc'),
    costPrice: z.string().transform((val) => val.replace(/\D/g, '')).optional().default('0'),
    defaultPerformerType: z.enum(['INTERNAL', 'EXTERNAL']).default('INTERNAL'),
});

export const CreateJobModal = ({ isOpen, onClose }) => {
    const [createJob, { isLoading }] = useCreateJobMutation();

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
            costPrice: '',
            defaultPerformerType: 'INTERNAL',
        },
    });

    const costPriceValue = watch('costPrice');

    const onSubmit = async (data) => {
        try {
            await createJob({
                ...data,
                costPrice: parseInt(data.costPrice || '0'),
            }).unwrap();
            toast.success('Tạo hạng mục thành công');
            reset();
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi tạo hạng mục');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm Hạng Mục Công Việc Mới">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Input
                            label="Tên hạng mục *"
                            {...register('name')}
                            error={errors.name?.message}
                            placeholder="Ví dụ: Quay phim chính, Edit video..."
                        />
                    </div>
                    <Input
                        label="Mã hạng mục *"
                        {...register('code')}
                        error={errors.code?.message}
                        placeholder="Ví dụ: VID, DES..."
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
                        placeholder="0"
                    />
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bên thực hiện mặc định</label>
                        <select
                            {...register('defaultPerformerType')}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                        >
                            <option value="INTERNAL">Nội bộ</option>
                            <option value="EXTERNAL">Bên ngoài</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Tạo Hạng Mục
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
