import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateVendorMutation } from '../../api/vendors';
import { toast } from 'react-toastify';

const vendorSchema = z.object({
    name: z.string().min(1, 'Tên vendor là bắt buộc'),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    taxId: z.string().optional(),
    type: z.enum(['BUSINESS', 'INDIVIDUAL']).default('BUSINESS'),
});

export const CreateVendorModal = ({ isOpen, onClose }) => {
    const [createVendor, { isLoading }] = useCreateVendorMutation();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(vendorSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
            taxId: '',
            type: 'BUSINESS',
        },
    });

    const onSubmit = async (data) => {
        try {
            await createVendor(data).unwrap();
            toast.success('Tạo vendor thành công');
            reset();
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi tạo vendor');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm Nhà Cung Cấp Mới">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Input
                            label="Tên nhà cung cấp *"
                            {...register('name')}
                            error={errors.name?.message}
                            placeholder="Nhập tên vendor..."
                        />
                    </div>
                    <Input
                        label="Email"
                        {...register('email')}
                        error={errors.email?.message}
                        placeholder="example@gmail.com"
                    />
                    <Input
                        label="Số điện thoại"
                        {...register('phone')}
                        error={errors.phone?.message}
                        placeholder="Nhập số điện thoại..."
                    />
                    <Input
                        label="Mã số thuế"
                        {...register('taxId')}
                        error={errors.taxId?.message}
                        placeholder="Nhập MST..."
                    />
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại hình</label>
                        <select
                            {...register('type')}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                        >
                            <option value="BUSINESS">Doanh nghiệp</option>
                            <option value="INDIVIDUAL">Cá nhân</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                        <textarea
                            {...register('address')}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm min-h-[80px]"
                            placeholder="Nhập địa chỉ chi tiết..."
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Tạo Vendor
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
