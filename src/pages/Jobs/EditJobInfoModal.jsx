import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useUpdateJobMutation } from '../../api/jobs';
import { toast } from 'react-toastify';
import { formatNumber, parseNumber } from '../../utils/format';
import { useEffect } from 'react';

const jobInfoSchema = z.object({
    name: z.string().min(1, 'Tên hạng mục là bắt buộc'),
    nickname: z.string().max(120, 'Nickname không được vượt quá 120 ký tự').optional().default(''),
    code: z.string().min(1, 'Mã hạng mục là bắt buộc'),
    costPrice: z.string().transform((val) => val.replace(/[^0-9,.]/g, '')).optional().default('0'),
    vinicoin: z.string().transform((val) => val.replace(/[^0-9,.]/g, '')).optional().default('0'),
    timeToComplete: z.string().transform((val) => val.replace(/[^0-9.]/g, '')).optional().default('0'),
    isBriefVideo: z.boolean().optional().default(false),
    isQuotationItem: z.boolean().optional().default(true),
});

export const EditJobInfoModal = ({ isOpen, onClose, job }) => {
    const [updateJob, { isLoading }] = useUpdateJobMutation();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(jobInfoSchema),
        defaultValues: {
            name: '',
            nickname: '',
            code: '',
            costPrice: '',
            vinicoin: '',
            timeToComplete: '',
            isBriefVideo: false,
            isQuotationItem: true,
        },
    });

    useEffect(() => {
        if (isOpen && job) {
            reset({
                name: job.name,
                nickname: job.nickname || '',
                code: job.code,
                costPrice: String(job.costPrice || '0'),
                vinicoin: String(job.vinicoin || '0'),
                timeToComplete: String(job.timeToComplete || '0'),
                isBriefVideo: Boolean(job.isBriefVideo),
                isQuotationItem: job.isQuotationItem !== false,
            });
        }
    }, [isOpen, job, reset]);

    const costPriceValue = watch('costPrice');
    const vinicoinValue = watch('vinicoin');
    const timeToCompleteValue = watch('timeToComplete');
    const isBriefVideoValue = watch('isBriefVideo');

    useEffect(() => {
        if (isBriefVideoValue) setValue('isQuotationItem', false);
    }, [isBriefVideoValue, setValue]);

    const onSubmit = async (data) => {
        try {
            await updateJob({
                id: job.id,
                ...data,
                nickname: data.nickname?.trim() || null,
                costPrice: parseNumber(data.costPrice),
                vinicoin: parseNumber(data.vinicoin),
                timeToComplete: parseFloat(data.timeToComplete || '0'),
            }).unwrap();
            toast.success('Cập nhật thông tin hạng mục thành công');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi cập nhật hạng mục');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh Sửa Thông Tin Hạng Mục" size="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                        label="Nickname mặc định"
                        {...register('nickname')}
                        error={errors.nickname?.message}
                        placeholder="Ví dụ: video"
                    />
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
                            const rawValue = e.target.value.replace(/[^0-9,]/g, '').replace(/(,.*),/g, '$1');
                            setValue('costPrice', rawValue);
                        }}
                        error={errors.costPrice?.message}
                        placeholder="0"
                        suffix="VNĐ"
                    />
                    <Input
                        label="Vinicoin"
                        {...register('vinicoin')}
                        value={formatNumber(vinicoinValue)}
                        onChange={(e) => {
                            const rawValue = e.target.value.replace(/[^0-9,]/g, '').replace(/(,.*),/g, '$1');
                            setValue('vinicoin', rawValue);
                        }}
                        error={errors.vinicoin?.message}
                        placeholder="0"
                        suffix="VNĐ"
                    />
                    <Input
                        label="Thời gian hoàn thành (theo giờ)"
                        {...register('timeToComplete')}
                        value={timeToCompleteValue}
                        onChange={(e) => {
                            const rawValue = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                            setValue('timeToComplete', rawValue);
                        }}
                        error={errors.timeToComplete?.message}
                        placeholder="Số giờ dự kiến để hoàn thành"
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                        <input type="checkbox" {...register('isBriefVideo')} className="h-4 w-4 accent-blue-600" />
                        Yêu cầu nhập brief video
                    </label>
                    <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                        <input type="checkbox" {...register('isQuotationItem')} disabled={isBriefVideoValue} className="h-4 w-4 accent-blue-600 disabled:opacity-50" />
                        Được tính vào giá vốn dịch vụ
                    </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Lưu Thay Đổi
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
