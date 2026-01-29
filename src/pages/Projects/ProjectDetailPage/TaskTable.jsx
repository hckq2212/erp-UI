import { useState } from 'react';
import { Calendar, Users, FileText, Search, UserPlus } from 'lucide-react';
import { TaskAssignModal } from './TaskAssignModal';

export const TaskTable = ({ tasks = [], project }) => {
    const [filter, setFilter] = useState({
        status: 'ALL',
        search: ''
    });
    const [assigningTask, setAssigningTask] = useState(null);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'COMPLETED':
            case 'DONE':
                return <span className="flex items-center gap-1.5 text-md font-medium text-green-600"> Hoàn thành</span>;
            case 'PROCESSING':
            case 'IN_PROGRESS':
                return <span className="flex items-center gap-1.5 text-md font-medium text-amber-600"> Đang thực hiện</span>;
            case 'PENDING':
                return <span className="flex items-center gap-1.5 text-md font-medium text-blue-600"> Chưa phân công</span>;
            case 'OVERDUE':
                return <span className="flex items-center gap-1.5 text-md font-medium text-red-600"> Quá hạn</span>;
            case 'CANCELLED':
                return <span className="flex items-center gap-1.5 text-md font-medium text-gray-400"> Đã hủy</span>;
            default:
                return <span className="flex items-center gap-1.5 text-md font-medium text-gray-500"> {status}</span>;
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.name.toLowerCase().includes(filter.search.toLowerCase()) ||
            task.code.toLowerCase().includes(filter.search.toLowerCase());
        const matchesStatus = filter.status === 'ALL' || task.status === filter.status;
        return matchesSearch && matchesStatus;
    });

    const isProjectInProgress = project?.status === 'IN_PROGRESS';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm tên công việc"
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    />
                </div>
                <select
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none hover:bg-gray-100"
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                >
                    <option value="ALL">Tất cả trạng thái CV</option>
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="DOING">Đang thực hiện</option>
                    <option value="DONE">Hoàn thành</option>
                    <option value="OVERDUE">Quá hạn</option>
                </select>
                <select className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none hover:bg-gray-100">
                    <option>Tất cả nhân sự</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[1000px]">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-medium">STT</th>
                            <th className="px-6 py-4 font-medium text-blue-600">Mã Công việc</th>
                            <th className="px-6 py-4 font-medium text-blue-600">Tên công việc</th>
                            <th className="px-6 py-4 font-medium">Thời gian</th>
                            <th className="px-6 py-4 font-medium text-center">Nhân sự</th>
                            <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
                            {isProjectInProgress && (
                                <th className="px-6 py-4 font-medium text-blue-600 text-center">Hành động</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map((task, index) => (
                                <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {task.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-blue-600 uppercase">
                                                {task.name}
                                            </p>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            {formatDate(task.plannedStartDate)} <span className="text-gray-400">→</span> {formatDate(task.plannedEndDate)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-medium text-gray-700">{task.assignee?.fullName || '---'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-medium text-gray-700">{getStatusBadge(task.status)}</span>
                                    </td>
                                    {isProjectInProgress && (
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setAssigningTask(task)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                            >
                                                Phân công
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={isProjectInProgress ? 9 : 8} className="px-6 py-10 text-center text-gray-400 italic">
                                    Không tìm thấy công việc nào
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {assigningTask && (
                <TaskAssignModal
                    isOpen={!!assigningTask}
                    onClose={() => setAssigningTask(null)}
                    task={assigningTask}
                    project={project}
                />
            )}
        </div>
    );
};
