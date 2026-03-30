import { useState } from 'react';
import { useGetJobsQuery } from '../../../api/jobs';
import { useCreateTaskMutation } from '../../../api/tasks';
import { toast } from 'react-toastify';
import { Modal } from '../../../components/ui/Modal';
import { Briefcase, Plus } from 'lucide-react';

export const AddExtraTaskModal = ({ isOpen, onClose, project }) => {
    const { data: jobs = [] } = useGetJobsQuery();
    const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
    const [selectedJobId, setSelectedJobId] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedJobId) {
            toast.error('Vui lòng chọn một công việc');
            return;
        }

        const selectedJob = jobs.find(j => j.id.toString() === selectedJobId.toString());
        if (!selectedJob) return;

        try {
            await createTask({
                projectId: project.id,
                jobId: selectedJobId,
                name: selectedJob.name,
                isExtra: true
            }).unwrap();

            toast.success('Thêm công việc phát sinh thành công');
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra khi thêm công việc');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="THÊM CÔNG VIỆC PHÁT SINH"
            className="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">
                        Chọn công việc
                    </label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                        >
                            <option value="">-- Chọn loại công việc --</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>
                                    {job.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:bg-blue-300 disabled:shadow-none"
                    >
                        <Plus className="w-5 h-5" />
                        <span>{isCreating ? 'Đang xử lý...' : 'Thêm công việc'}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};
