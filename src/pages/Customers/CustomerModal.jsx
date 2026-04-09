import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useEffect } from 'react';

const customerSchema = z.object({
  name: z.string().min(1, 'Tên khách hàng là bắt buộc'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ').regex(/^\+?[0-9]{10,15}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ'),
  address: z.string().min(1, 'Địa chỉ là bắt buộc'),
  taxId: z.string().regex(/^\d{10}(\s?-\s?\d{3})?$/, 'Mã số thuế không hợp lệ (Phải là 10 số hoặc 13 số định dạng XXXXXXXXXX-XXX)').optional().or(z.literal('')),
  source: z.enum(['INTERNAL', 'REFERRAL_PARTNER']),
});

export const CustomerModal = ({ isOpen, onClose, customer, onSubmit, isSubmitting }) => {

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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

  const watchedTaxId = watch('taxId');

  useEffect(() => {
    const fetchInfo = async () => {
      const cleanTaxId = watchedTaxId?.replace(/[\s-]/g, '');
      if (isOpen && (cleanTaxId?.length === 10 || cleanTaxId?.length === 13)) {
        try {
          const { fetchTaxInfo } = await import('../../utils/tax');
          const data = await fetchTaxInfo(cleanTaxId);
          if (data) {
            if (data.name) setValue('name', data.name);
            if (data.address) setValue('address', data.address);
            import('react-toastify').then(({ toast }) => toast.info('Đã tự động điền thông tin doanh nghiệp'));
          }
        } catch (err) {
          console.error('Tax fetch failed:', err);
        }
      }
    };

    const timer = setTimeout(fetchInfo, 500);
    return () => clearTimeout(timer);
  }, [watchedTaxId, isOpen, setValue]);

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
