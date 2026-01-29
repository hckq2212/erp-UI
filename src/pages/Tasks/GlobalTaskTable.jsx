import { useNavigate } from 'react-router-dom';
import { Calendar, User, Briefcase, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../utils/enums';

export const GlobalTaskTable = ({ tasks = [] }) => {
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Mã Công Việc</th>
                        <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Tên Công Việc</th>
                        <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs font-medium">Dự án</th>
                        <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Phân công</th>
                        <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Thời hạn</th>
                        <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-center">Trạng thái</th>
                        <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {tasks.length > 0 ? (
                        tasks.map((task) => (
                            <tr
                                key={task.id}
                                className="hover:bg-blue-50/30 transition-all group cursor-pointer"
                                onClick={() => navigate(`/tasks/${task.id}`)}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-mono text-blue-600 font-medium mb-0.5">{task.code}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900 line-clamp-1">{task.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <span className="text-sm font-medium line-clamp-1">{task.project?.name || '---'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200">
                                            {task.assignee?.fullName?.charAt(0) || <User className="w-3.5 h-3.5" />}
                                        </div>
                                        <span className="text-xs font-medium line-clamp-1">{task.assignee?.fullName || 'Chưa phân công'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-gray-500 text-xs text-nowrap">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Deadline: {formatDate(task.plannedEndDate)}</span>
                                        </div>
                                        {task.status === 'PENDING' && task.plannedEndDate && new Date(task.plannedEndDate) < new Date() && (
                                            <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                QUÁ HẠN
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                        TASK_STATUS_COLORS[task.status] || "bg-gray-100 text-gray-600"
                                    )}>
                                        {TASK_STATUS_LABELS[task.status] || task.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="px-4 py-2 text-white bg-blue-600 rounded-xl transition-all">
                                        Xem chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Clock className="w-12 h-12 text-gray-200" />
                                    <p className="text-gray-400 font-medium">Không tìm thấy công việc nào phù hợp</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
