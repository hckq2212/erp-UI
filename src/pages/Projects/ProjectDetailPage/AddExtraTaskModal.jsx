import { useEffect, useMemo, useState } from 'react';
import { useGetJobsQuery } from '../../../api/jobs';
import { useCreateTaskMutation } from '../../../api/tasks';
import { toast } from 'react-toastify';
import { Modal } from '../../../components/ui/Modal';
import { Trash2 } from 'lucide-react';

const createEmptyRow = () => ({
    jobId: '',
    quantity: 1
});

export const AddExtraTaskModal = ({ isOpen, onClose, project, isClosed: propIsClosed, isOnHold: propIsOnHold }) => {
    const isClosed = propIsClosed ?? ['COMPLETED', 'CANCELLED'].includes(project?.status);
    const isOnHold = propIsOnHold ?? (project?.status === 'ON_HOLD' || Boolean(project?.isOnHold));
    const { data: jobs = [] } = useGetJobsQuery();
    const [createTask] = useCreateTaskMutation();
    const [rows, setRows] = useState([createEmptyRow()]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRows([createEmptyRow()]);
            setIsSubmitting(false);
        }
    }, [isOpen]);


    const updateRow = (index, field, value) => {
        setRows(prev => prev.map((row, rowIndex) => (
            rowIndex === index ? { ...row, [field]: value } : row
        )));
    };

    const addRow = () => {
        setRows(prev => [...prev, createEmptyRow()]);
    };

    const removeRow = (index) => {
        setRows(prev => prev.filter((_, rowIndex) => rowIndex !== index));
    };

    const validateRows = () => {
        if (rows.length === 0) {
            toast.error('Vui lòng chọn ít nhất một công việc');
            return false;
        }

        const selectedJobIds = [];
        for (const row of rows) {
            if (!row.jobId) {
                toast.error('Vui lòng chọn đầy đủ công việc phát sinh');
                return false;
            }

            const quantity = Number(row.quantity);
            if (!Number.isInteger(quantity) || quantity <= 0) {
                toast.error('Số lượng công việc phải là số nguyên dương');
                return false;
            }

            selectedJobIds.push(row.jobId.toString());
        }

        const hasDuplicate = new Set(selectedJobIds).size !== selectedJobIds.length;
        if (hasDuplicate) {
            toast.error('Không chọn trùng một công việc ở nhiều dòng');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isClosed) {
            toast.warning('Dự án đã đóng — không thể thêm công việc phát sinh');
            return;
        }
        if (isOnHold) {
            toast.warning('Dự án đang tạm dừng — không thể thêm công việc phát sinh');
            return;
        }
        if (!validateRows()) return;

        setIsSubmitting(true);
        let createdCount = 0;

        try {
            for (const row of rows) {
                const selectedJob = jobs.find(job => job.id.toString() === row.jobId.toString());
                if (!selectedJob) {
                    throw new Error('Không tìm thấy công việc đã chọn');
                }

                const quantity = Number(row.quantity);
                for (let i = 0; i < quantity; i += 1) {
                    await createTask({
                        projectId: project.id,
                        jobId: row.jobId,
                        name: selectedJob.name,
                        isExtra: true
                    }).unwrap();
                    createdCount += 1;
                }
            }

            toast.success(`Đã thêm ${createdCount} công việc phát sinh`);
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || err?.message || 'Có lỗi xảy ra khi thêm công việc');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Thêm công việc phát sinh"
            className="max-w-4xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {isOnHold && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                        ⚠️ Dự án đang tạm dừng — không thể tạo công việc phát sinh.
                    </div>
                )}
                {isClosed && (
                    <div className="rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs font-semibold text-slate-700">
                        🔒 Dự án đã đóng — không thể tạo công việc phát sinh.
                    </div>
                )}
                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="grid grid-cols-[minmax(0,1fr)_112px_88px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                        <span>Công việc phát sinh</span>
                        <span>Số lượng</span>
                    </div>

                    <div className="max-h-[52vh] overflow-y-auto divide-y divide-gray-100">
                        {rows.map((row, index) => (
                            <div key={index} className="grid grid-cols-[minmax(0,1fr)_112px_88px] gap-3 px-4 py-3 items-center">
                                <div className="min-w-0">
                                    <label className="sr-only" htmlFor={`extra-job-${index}`}>Công việc</label>
                                    <select
                                        id={`extra-job-${index}`}
                                        className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:bg-gray-50 disabled:text-gray-400"
                                        value={row.jobId}
                                        onChange={(e) => updateRow(index, 'jobId', e.target.value)}
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Chọn công việc</option>
                                        {jobs
                                            .filter(job => !rows.some((r, rIdx) => rIdx !== index && r.jobId?.toString() === job.id?.toString()))
                                            .map(job => (
                                                <option key={job.id} value={job.id}>
                                                    {job.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="sr-only" htmlFor={`extra-quantity-${index}`}>Số lượng</label>
                                    <input
                                        id={`extra-quantity-${index}`}
                                        type="number"
                                        min="1"
                                        step="1"
                                        className="h-11 w-[70%] rounded-md border border-gray-300 bg-white px-3 text-center text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:bg-gray-50 disabled:text-gray-400"
                                        value={row.quantity}
                                        onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeRow(index)}
                                    disabled={rows.length === 1 || isSubmitting}
                                    className="h-11  px-3 text-sm font-medium text-gray-600"
                                >
                                    <Trash2 className="text-red-500" size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={addRow}
                        disabled={isSubmitting || isClosed || isOnHold}
                        className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Thêm công việc
                    </button>

                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="h-11 min-w-28 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || isClosed || isOnHold}
                        className="h-11 min-w-44 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Thêm công việc'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
