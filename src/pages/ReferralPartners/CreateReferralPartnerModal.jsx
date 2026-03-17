import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateReferralPartnerMutation } from '../../api/referralPartners';
import { toast } from 'react-toastify';
import { PARTNER_TYPE_LABELS } from '../../utils/enums';

const partnerSchema = z.object({
    name: z.string().min(1, 'Tên đối tác là bắt buộc').regex(/^[a-zA-ZÀ-ỹ0-9\s]+$/, 'Tên không được chứa ký tự đặc biệt'),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
    address: z.string().optional(),
    taxId: z.string().optional(),
    type: z.enum(['BUSINESS', 'INDIVIDUAL']).default('BUSINESS'),
}).superRefine((data, ctx) => {
    if (data.taxId) {
        if (data.type === 'INDIVIDUAL') {
            if (!/^(\d{9}|\d{12})$/.test(data.taxId)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "CMND/CCCD không hợp lệ (Phải là 9 hoặc 12 số)",
                    path: ["taxId"]
                });
            }
        } else {
            if (!/^\d{10}(\s?-\s?\d{3})?$/.test(data.taxId)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Mã số thuế không hợp lệ (Phải là 10 số hoặc 13 số định dạng XXXXXXXXXX-XXX)",
                    path: ["taxId"]
                });
            }
        }
    }
});

export const CreateReferralPartnerModal = ({ isOpen, onClose }) => {
    const [createPartner, { isLoading }] = useCreateReferralPartnerMutation();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(partnerSchema),
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
            await createPartner(data).unwrap();
            toast.success('Tạo đối tác thành công');
            reset();
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi tạo đối tác');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm Đối Tác Mới">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Input
                            label="Tên đối tác *"
                            {...register('name')}
                            error={errors.name?.message}
                            placeholder="Nhập tên đối tác..."
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
                            {Object.entries(PARTNER_TYPE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
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
                        Tạo Đối Tác
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
