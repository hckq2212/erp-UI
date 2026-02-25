import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSyncJobCriteriaMutation } from '../../api/jobCriterias';
import { toast } from 'react-toastify';
import { Plus, Trash2, ClipboardCheck } from 'lucide-react';
import { useEffect } from 'react';

const criteriaSchema = z.object({
    criteria: z.array(z.object({
        name: z.string().min(1, 'Tên tiêu chí không được để trống'),
        description: z.string().optional()
    })).optional().default([]),
});

export const EditJobCriteriaModal = ({ isOpen, onClose, job }) => {
    const [syncCriteria, { isLoading }] = useSyncJobCriteriaMutation();

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(criteriaSchema),
        defaultValues: {
            criteria: job?.criteria?.map(c => ({
                name: c.name,
                description: c.description || ''
            })) || [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'criteria',
    });

    // Reset form when job data changes or modal opens
    useEffect(() => {
        if (isOpen && job) {
            reset({
                criteria: job.criteria?.map(c => ({
                    name: c.name,
                    description: c.description || ''
                })) || [],
            });
        }
    }, [isOpen, job, reset]);

    const onSubmit = async (data) => {
        try {
            await syncCriteria({
                id: job.id,
                criteria: data.criteria.map(c => ({
                    name: c.name,
                    description: c.description
                }))
            }).unwrap();
            toast.success('Cập nhật tiêu chí thành công');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi cập nhật tiêu chí');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh Sửa Tiêu Chí Đánh Giá" size="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <p className="text-xs text-gray-500 italic">Quản lý các tiêu chí đánh giá chất lượng cho hạng mục này.</p>
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

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3 relative group">
                                <div className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <Input
                                            {...register(`criteria.${index}.name`)}
                                            label={`Tiêu chí ${index + 1} *`}
                                            placeholder="Tên tiêu chí"
                                            error={errors.criteria?.[index]?.name?.message}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors mt-7"
                                        title="Xóa tiêu chí"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">Mô tả tiêu chí</label>
                                    <textarea
                                        {...register(`criteria.${index}.description`)}
                                        placeholder="Mô tả chi tiết nội dung cần đánh giá..."
                                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs h-20 resize-none"
                                    />
                                </div>
                            </div>
                        ))}
                        {fields.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <ClipboardCheck className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-sm text-gray-400 italic">Chưa có tiêu chí nào. Nhấn "Thêm tiêu chí" để bắt đầu.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Cập Nhật Tiêu Chí
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
