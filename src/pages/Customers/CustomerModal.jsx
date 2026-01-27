import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useEffect } from 'react';

const customerSchema = z.object({
  name: z.string().min(1, 'Tên khách hàng là bắt buộc'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ'),
  address: z.string().min(1, 'Địa chỉ là bắt buộc'),
  taxId: z.string().optional(),
  source: z.enum(['INTERNAL', 'REFERRAL_PARTNER']),
});

export const CustomerModal = ({ isOpen, onClose, customer, onSubmit, isSubmitting }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      taxId: '',
      source: 'INTERNAL',
    },
  });

  useEffect(() => {
    if (customer) {
      reset(customer);
    } else {
      reset({
        name: '',
        phone: '',
        email: '',
        address: '',
        taxId: '',
        source: 'INTERNAL',
      });
    }
  }, [customer, reset, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Chỉnh Sửa Khách Hàng' : 'Thêm Khách Hàng Mới'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Tên khách hàng *"
            id="name"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Số điện thoại *"
            id="phone"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <Input
            label="Email *"
            id="email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Mã số thuế"
            id="taxId"
            {...register('taxId')}
            error={errors.taxId?.message}
          />
          <div className="md:col-span-2">
             <Input
                label="Địa chỉ *"
                id="address"
                {...register('address')}
                error={errors.address?.message}
            />
          </div>
          
           <div className="w-full">
            <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                Nguồn *
            </label>
            <select
                id="source"
                {...register('source')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            >
                <option value="INTERNAL">Internal</option>
                <option value="REFERRAL_PARTNER">Referral Partner</option>
            </select>
            {errors.source && <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {customer ? 'Lưu Thay Đổi' : 'Tạo Khách Hàng'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
