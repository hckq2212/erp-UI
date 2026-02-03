import { useState } from 'react';
import { useAssessExtraTaskMutation } from '../../../api/tasks';
import { useGetServicesQuery } from '../../../api/services';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../../utils/format';
import { AlertCircle, Check, X, DollarSign, Tag, FileText } from 'lucide-react';
import { AddendumQuotationModal } from './AddendumQuotationModal';

export const AssessExtraTasks = ({ tasks = [], opportunityId }) => {
    const [assessExtraTask, { isLoading: isAssessing }] = useAssessExtraTaskMutation();
    const { data: services = [] } = useGetServicesQuery();

    // Local state for pricing inputs for each task
    const [taskInputs, setTaskInputs] = useState({});
    const [selectedTask, setSelectedTask] = useState(null);
    const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

    const handleInputChange = (taskId, field, value) => {
        setTaskInputs(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [field]: value
            }
        }));
    };

    const handleAssess = async (task, isRejected = false) => {
        const input = taskInputs[task.id] || {};

        if (!isRejected && input.isBillable && !input.sellingPrice) {
            toast.warning('Vui lòng nhập giá bán cho công việc có phí');
            return;
        }

        try {
            await assessExtraTask({
                id: task.id,
                isBillable: !!input.isBillable,
                sellingPrice: input.isBillable ? Number(input.sellingPrice) : 0,
                serviceId: input.isBillable ? Number(input.serviceId) : undefined,
                isRejected: isRejected
            }).unwrap();

            toast.success(isRejected ? 'Đã từ chối công việc' : 'Đã định giá công việc');
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra');
        }
    };

    if (tasks.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-10 border border-dashed border-gray-200 text-center">
                <p className="text-gray-500 italic">Không có công việc phát sinh nào chờ định giá</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {tasks.map((task) => {
                const input = taskInputs[task.id] || { isBillable: true };
                return (
                    <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-50 flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                            {task.code}
                                        </span>
                                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">
                                            Chờ định giá
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                        {task.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Dự án: <span className="font-semibold">{task.project?.name}</span>
                                    </p>
                                </div>
                            </div>
                            {/* <button
                                onClick={() => handleAssess(task, true)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Từ chối công việc"
                            >
                                <X className="w-5 h-5" />
                            </button> */}
                        </div>

                        <div className="p-5 bg-gray-50/50 flex flex-wrap gap-6 items-end">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Hình thức</label>
                                <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange(task.id, 'isBillable', true)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${input.isBillable ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        Có phí
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange(task.id, 'isBillable', false)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${!input.isBillable ? 'bg-amber-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        Hỗ trợ
                                    </button>
                                </div>
                            </div>

                            {/* {input.isBillable && (
                                <>
                                    <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1">
                                            <Tag className="w-3 h-3" /> Nhóm dịch vụ
                                        </label>
                                        <select
                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            value={input.serviceId || ''}
                                            onChange={(e) => handleInputChange(task.id, 'serviceId', e.target.value)}
                                        >
                                            <option value="">-- Chọn dịch vụ --</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" /> Giá bán (VNĐ)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-blue-600"
                                            value={input.sellingPrice || ''}
                                            onChange={(e) => handleInputChange(task.id, 'sellingPrice', e.target.value)}
                                        />
                                    </div>
                                </>
                            )} */}

                            {!input.isBillable && (
                                <div className="flex-1 flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-sm italic">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>Công việc hỗ trợ không tính phí cho khách hàng, nhưng vẫn tính chi phí vào hợp đồng.</span>
                                </div>
                            )}

                            {input.isBillable ? (
                                <button
                                    onClick={() => {
                                        setSelectedTask({
                                            ...task,
                                            sellingPrice: Number(input.sellingPrice || 0),
                                            serviceId: input.serviceId
                                        });
                                        setIsQuotationModalOpen(true);
                                    }}
                                    disabled={isAssessing}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-100 transition-all active:scale-95 disabled:bg-blue-300 flex items-center gap-2 font-bold"
                                >
                                    <FileText className="w-5 h-5" />
                                    <span>Báo giá</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleAssess(task)}
                                    disabled={isAssessing}
                                    className="px-6 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 shadow-md shadow-amber-100 transition-all active:scale-95 disabled:bg-amber-300 flex items-center gap-2 font-bold"
                                >
                                    <Check className="w-5 h-5" />
                                    <span>Gửi</span>
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            {selectedTask && (
                <AddendumQuotationModal
                    isOpen={isQuotationModalOpen}
                    onClose={() => setIsQuotationModalOpen(false)}
                    task={selectedTask}
                    opportunityId={opportunityId}
                    onSubmitted={() => {
                        // The task list will refresh due to RTK Query tags
                    }}
                />
            )}
        </div>
    );
};
