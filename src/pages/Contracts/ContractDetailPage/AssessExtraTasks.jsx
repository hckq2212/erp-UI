import { useState, useEffect } from 'react';
import { useAssessExtraTaskMutation } from '../../../api/tasks';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../../utils/format';
import { AlertCircle, Check, X, DollarSign, Tag, FileText } from 'lucide-react';
import { AddendumQuotationModal } from './AddendumQuotationModal';
import { QuotationDetailModal } from '../../Opportunities/OpportunityDetailPage/QuotationDetailModal';

export const AssessExtraTasks = ({ tasks = [], opportunityId }) => {
    const [assessExtraTask, { isLoading: isAssessing }] = useAssessExtraTaskMutation();

    // Local state for pricing inputs for each task
    const [taskInputs, setTaskInputs] = useState({});
    const [selectedTask, setSelectedTask] = useState(null);
    const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
    const [viewQuotationId, setViewQuotationId] = useState(null);

    // Initialize inputs from tasks
    useEffect(() => {
        const initialInputs = {};
        tasks.forEach(task => {
            initialInputs[task.id] = {
                isBillable: task.pricingStatus !== 'NON_BILLABLE',
                sellingPrice: task.sellingPrice || 0
            };
        });
        setTaskInputs(initialInputs);
    }, [tasks]);

    const handleInputChange = (taskId, field, value) => {
        setTaskInputs(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [field]: value
            }
        }));
    };

    const handleAssess = async (task) => {
        const input = taskInputs[task.id] || { isBillable: false };

        try {
            await assessExtraTask({
                id: task.id,
                isBillable: false,
                sellingPrice: 0,
                isRejected: false
            }).unwrap();

            toast.success('Đã xác nhận công việc hỗ trợ');
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
                const input = taskInputs[task.id] || { isBillable: task.pricingStatus !== 'NON_BILLABLE' };
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

                            {!input.isBillable && (
                                <div className="flex-1 flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-sm italic">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>Công việc hỗ trợ không tính phí cho khách hàng, nhưng vẫn tính chi phí vào hợp đồng.</span>
                                </div>
                            )}

                            {task.quotation ? (
                                <button
                                    onClick={() => setViewQuotationId(task.quotation.id)}
                                    className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-md shadow-purple-100 transition-all active:scale-95 flex items-center gap-2 font-bold"
                                >
                                    <FileText className="w-5 h-5" />
                                    <span>Xem báo giá</span>
                                </button>
                            ) : input.isBillable ? (
                                <button
                                    onClick={() => {
                                        setSelectedTask({
                                            ...task,
                                            sellingPrice: Number(input.sellingPrice || 0)
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

            <QuotationDetailModal
                quotationId={viewQuotationId}
                isOpen={!!viewQuotationId}
                onClose={() => setViewQuotationId(null)}
                formatDate={(date) => new Date(date).toLocaleDateString('vi-VN')}
            // onEdit ignored for viewing in this context for now
            />
        </div>
    );
};
