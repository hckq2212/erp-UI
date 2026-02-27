import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateServiceMutation } from '../../api/services';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const serviceSchema = z.object({
    name: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
    description: z.string().optional(),
});

export const CreateServiceModal = ({ isOpen, onClose }) => {
    const [createService, { isLoading }] = useCreateServiceMutation();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    });

    const onSubmit = async (data) => {
        try {
            const res = await createService(data).unwrap();
            toast.success('Tạo dịch vụ thành công');
            reset();
            navigate(`/services/${res.id}`);
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
