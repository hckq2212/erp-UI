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
import { useEffect, useState } from 'react';
import { JOB_CATEGORY_OPTIONS, JOB_LEVEL_OPTIONS, JOB_RESPONSIBLE_ROLE_OPTIONS } from '../../utils/enums';

const jobSchema = z.object({
    name: z.string().min(1, 'Tên hạng mục là bắt buộc'),
    nickname: z.string().max(120, 'Nickname không được vượt quá 120 ký tự').optional().default(''),
    code: z.string().min(1, 'Mã hạng mục là bắt buộc'),
    costPrice: z.string().transform((val) => val.replace(/[^0-9,.]/g, '')).optional().default('0'),
    vinicoin: z.string().transform((val) => val.replace(/[^0-9,.]/g, '')).optional().default('0'),
    timeToComplete: z.string().transform((val) => val.replace(/[^0-9.]/g, '')).optional().default('0'),
    description: z.string().max(5000, 'Mô tả công việc không được vượt quá 5000 ký tự').optional().default(''),
    sampleDocumentUrl: z.string().trim().max(2048, 'Link tài liệu mẫu không được vượt quá 2048 ký tự').refine((val) => !val || /^https?:\/\/\S+$/i.test(val), 'Link tài liệu mẫu phải bắt đầu bằng http:// hoặc https://').optional().default(''),
    defaultPerformerType: z.enum(['INTERNAL', 'EXTERNAL']).default('INTERNAL'),
    categories: z.array(z.string()).optional().default([]),
    level: z.enum(['A', 'B', 'C']).default('A'),
    responsibleRole: z.enum([
        'CONTENT_CREATOR',
        'EDITOR',
        'DESIGNER',
        'CAMERAMAN',
        'ACCOUNT',
        'VIDEO_EDITOR',
        'SOCIAL_MEDIA_MANAGER',
        'PROJECT_MANAGER'
    ]).or(z.literal('')).optional().default(''),
    isBriefVideo: z.boolean().optional().default(false),
    isQuotationItem: z.boolean().optional().default(true),
    criteria: z.array(z.object({
        name: z.string().min(1, 'Tên tiêu chí không được để trống'),
        description: z.string().optional()
    })).optional().default([]),
});

export const CreateJobModal = ({ isOpen, onClose }) => {
    const [createJob, { isLoading }] = useCreateJobMutation();
    const [isAiRelated, setIsAiRelated] = useState(false);
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
            description: '',
            sampleDocumentUrl: '',
            defaultPerformerType: 'INTERNAL',
            level: 'A',
            responsibleRole: '',
            isBriefVideo: false,
            isQuotationItem: true,
            categories: [],
            criteria: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'criteria',
    });

    // const costPriceValue = watch('costPrice');
    // const vinicoinValue = watch('vinicoin');
    // const timeToCompleteValue = watch('timeToComplete');
    // const isBriefVideoValue = watch('isBriefVideo');

    // useEffect(() => {
    //     if (isBriefVideoValue) setValue('isQuotationItem', false);
    // }, [isBriefVideoValue, setValue]);

    const costPriceValue = watch('costPrice');
    const vinicoinValue = watch('vinicoin');
    const timeToCompleteValue = watch('timeToComplete');
    const categoriesValue = watch('categories');

    useEffect(() => {
        if (!isOpen) setIsAiRelated(false);
    }, [isOpen]);

    const toggleCategory = (value) => {
        const current = categoriesValue || [];
        if (current.includes(value)) {
            setValue('categories', current.filter((c) => c !== value));
        } else {
            setValue('categories', [...current, value]);
        }
    };

    const handleAiRelatedChange = (checked) => {
        setIsAiRelated(checked);
        if (!checked) {
            setValue('isBriefVideo', false);
            setValue('isQuotationItem', true);
        }
    };

    const onSubmit = async (data) => {
        try {

            const result = await createJob({
                ...data,
                // nickname: data.nickname?.trim() || null,
                responsibleRole: data.responsibleRole || null,
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
            setIsAiRelated(false);
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
                    {/* <Input
                        label="Nickname mặc định"
                        {...register('nickname')}
                        error={errors.nickname?.message}
                        placeholder="Ví dụ: video"
                    /> */}
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Level
                        </label>
                        <select
                            {...register('level')}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        >
                            {JOB_LEVEL_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.level && (
                            <p className="mt-1 text-sm text-red-600 font-medium">{errors.level.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phụ trách
                        </label>
                        <select
                            {...register('responsibleRole')}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        >
                            <option value="">Chưa xác định</option>
                            {JOB_RESPONSIBLE_ROLE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.responsibleRole && (
                            <p className="mt-1 text-sm text-red-600 font-medium">{errors.responsibleRole.message}</p>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <Input
                            label="Tài liệu mẫu (Link)"
                            {...register('sampleDocumentUrl')}
                            error={errors.sampleDocumentUrl?.message}
                            placeholder="https://..."
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mô tả công việc
                        </label>
                        <textarea
                            {...register('description')}
                            rows={4}
                            placeholder="Mô tả chi tiết nội dung công việc..."
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm resize-y"
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600 font-medium">{errors.description.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={isAiRelated}
                            onChange={(e) => handleAiRelatedChange(e.target.checked)}
                            className="h-4 w-4 accent-blue-600"
                        />
                        Công việc liên quan tới AI
                    </label>

                    {isAiRelated && (
                        <div className="grid grid-cols-1 gap-3 pl-4 md:grid-cols-2">
                            <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                                <input type="checkbox" {...register('isBriefVideo')} className="h-4 w-4 accent-blue-600" />
                                Yêu cầu nhập brief video
                            </label>
                            {/* <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                                <input type="checkbox" {...register('isQuotationItem')} disabled={isBriefVideoValue} className="h-4 w-4 accent-blue-600 disabled:opacity-50" />
                                Được tính vào giá vốn dịch vụ
                            </label> */}
                            <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                                <input type="checkbox" {...register('isQuotationItem')} className="h-4 w-4 accent-blue-600" />
                                Được tính vào giá vốn dịch vụ
                            </label>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Danh mục</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {JOB_CATEGORY_OPTIONS.map((option) => (
                            <label
                                key={option.value}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={(categoriesValue || []).includes(option.value)}
                                    onChange={() => toggleCategory(option.value)}
                                    className="h-4 w-4 accent-blue-600"
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                    {(categoriesValue || []).length === 0 && (
                        <p className="text-xs text-gray-400 italic">Chưa xác định</p>
                    )}
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
