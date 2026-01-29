import { ClipboardList, Clock, Loader2, CheckCircle2 } from 'lucide-react';

export const TaskStatistics = ({ tasks = [] }) => {
    const stats = {
        total: tasks.length,
        overdue: tasks.filter(t => t.status === 'OVERDUE').length,
        inProgress: tasks.filter(t => t.status === 'DOING' || t.status === 'AWAITING_REVIEW' || t.status === 'AWAITING_ACCEPTANCE').length,
        completed: tasks.filter(t => t.status === 'DONE').length
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm">
                    <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-blue-600">Tổng số lượng công việc</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
            </div>

            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm">
                    <Clock className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-red-600">Quá hạn</p>
                    <p className="text-2xl font-bold text-red-900">{stats.overdue}</p>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-sm">
                    <Loader2 className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-amber-600">Đang thực hiện</p>
                    <p className="text-2xl font-bold text-amber-900">{stats.inProgress}</p>
                </div>
            </div>

            <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-green-600">Hoàn thành</p>
                    <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                </div>
            </div>
        </div>
    );
};
