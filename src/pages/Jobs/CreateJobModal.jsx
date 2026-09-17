import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateJobMutation } from '../../api/jobs';
import { toast } from 'react-toastify';
import { formatNumber, parseNumber } from '../../utils/format';
import { Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const jobSchema = z.object({
    name: z.string().min(1, 'Tên hạng mục là bắt buộc'),
    nickname: z.string().max(120, 'Nickname không được vượt quá 120 ký tự').optional().default(''),
    code: z.string().min(1, 'Mã hạng mục là bắt buộc'),
    costPrice: z.string().transform((val) => val.replace(/[^0-9,.]/g, '')).optional().default('0'),
    vinicoin: z.string().transform((val) => val.replace(/[^0-9,.]/g, '')).optional().default('0'),
    timeToComplete: z.string().transform((val) => val.replace(/[^0-9.]/g, '')).optional().default('0'),
    defaultPerformerType: z.enum(['INTERNAL', 'EXTERNAL']).default('INTERNAL'),
    isBriefVideo: z.boolean().optional().default(false),
    isQuotationItem: z.boolean().optional().default(true),
    criteria: z.array(z.object({
        name: z.string().min(1, 'Tên tiêu chí không được để trống'),
        description: z.string().optional()
    })).optional().default([]),
});

export const CreateJobModal = ({ isOpen, onClose }) => {
    const [createJob, { isLoading }] = useCreateJobMutation();
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            name: '',
            nickname: '',
            code: '',
            costPrice: '',
            vinicoin: '',
            timeToComplete: '',
            defaultPerformerType: 'INTERNAL',
            isBriefVideo: false,
            isQuotationItem: true,
            criteria: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'criteria',
    });

    const costPriceValue = watch('costPrice');
    const vinicoinValue = watch('vinicoin');
    const timeToCompleteValue = watch('timeToComplete');

    const onSubmit = async (data) => {
        try {

            const result = await createJob({
                ...data,
                nickname: data.nickname?.trim() || null,
                costPrice: parseNumber(data.costPrice),
                vinicoin: parseNumber(data.vinicoin),
                timeToComplete: parseFloat(data.timeToComplete || '0'),
                criteria: data.criteria.map(c => ({
                    name: c.name,
                    description: c.description
                }))
            }).unwrap();
            toast.success('Tạo hạng mục thành công');
            navigate(`/jobs/${result.id}`);
            reset();
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi tạo hạng mục');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm Hạng Mục Công Việc Mới" size="lg">
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
                        <input type="checkbox" {...register('isQuotationItem')} className="h-4 w-4 accent-blue-600" />
                        Được tính vào báo giá
                    </label>
                </div>

                {/* Criteria Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Tiêu chí đánh giá</label>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => append({ name: '', description: '' })}
                            className="flex items-center gap-1.5 h-8 text-xs font-bold"
                        >
                            <Plus className="w-3.5 h-3.5" /> Thêm tiêu chí
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-start">
                                <div className="flex-1">
                                    <Input
                                        {...register(`criteria.${index}.name`)}
                                        placeholder={`Tiêu chí ${index + 1} *`}
                                        error={errors.criteria?.[index]?.name?.message}
                                        className="h-9 text-sm"
                                    />
                                    <textarea
                                        {...register(`criteria.${index}.description`)}
                                        placeholder="Mô tả chi tiết tiêu chí..."
                                        className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs h-16 resize-none"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors mt-0.5"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {fields.length === 0 && (
                            <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-xs text-gray-400 italic">Chưa có tiêu chí nào được thêm.</p>
                            </div>
                        )}
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
