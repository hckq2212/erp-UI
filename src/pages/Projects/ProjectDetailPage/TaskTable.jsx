import { useState, useMemo } from 'react';
import { Calendar, Users, FileText, Search, UserPlus, ArrowUp, ArrowDown, ArrowUpDown, Plus } from 'lucide-react';
import { TaskAssignModal } from './TaskAssignModal';
import { AddExtraTaskModal } from './AddExtraTaskModal';
import { useNavigate } from 'react-router-dom';
import { useGetTeamMembersQuery } from '../../../api/teams';
import { useRequestSupportMutation } from '../../../api/tasks';
import { useTableFeatures } from '../../../hooks/useTableFeatures';
import { Pagination } from '../../../components/ui/Pagination';
import { cn } from '../../../utils/cn';
import { TASK_STATUS_LABELS } from '../../../utils/enums';
import { toast } from 'react-toastify';
import { formatDateTime } from '../../../utils/format';

export const TaskTable = ({ tasks = [], project }) => {
    const navigate = useNavigate();
    const teamId = project?.team?.id;
    const { data: members = [] } = useGetTeamMembersQuery(teamId, { skip: !teamId });
    const [requestSupport, { isLoading: isRequestingSupport }] = useRequestSupportMutation();

    const [filter, setFilter] = useState({
        status: 'ALL',
        search: '',
        assigneeId: 'ALL'
    });
    const [assigningTask, setAssigningTask] = useState(null);
    const [showAddExtraModal, setShowAddExtraModal] = useState(false);


    const getStatusBadge = (status) => {
        const label = TASK_STATUS_LABELS[status] || status;
        switch (status) {
            case 'DONE':
            case 'COMPLETED':
            case 'ACCEPTED':
                return <span className="flex items-center gap-1.5 text-md font-medium text-green-600"> {label}</span>;
            case 'DOING':
                return <span className="flex items-center gap-1.5 text-md font-medium text-amber-600"> {label}</span>;
            case 'PENDING':
                return <span className="flex items-center gap-1.5 text-md font-medium text-blue-600"> {label}</span>;
            case 'OVERDUE':
                return <span className="flex items-center gap-1.5 text-md font-medium text-red-600"> {label}</span>;
            case 'CANCELLED':
                return <span className="flex items-center gap-1.5 text-md font-medium text-gray-400"> {label}</span>;
            case 'AWAITING_PRICING':
                return <span className="flex items-center gap-1.5 text-md font-medium text-gray-400"> {label}</span>;
            case 'REJECTED':
                return <span className="flex items-center gap-1.5 text-md font-medium text-gray-400"> {label}</span>;
            case 'AWAITING_ACCEPTANCE':
                return <span className="flex items-center gap-1.5 text-md font-medium text-gray-400"> {label}</span>;
            case 'AWAITING_REVIEW':
                return <span className="flex items-center gap-1.5 text-md font-medium text-gray-400"> {label}</span>;
            case 'AWAITING_SUPPORT':
                return <span className="flex items-center gap-1.5 text-md font-medium text-red-500"> {label}</span>;
            default:
                return <span className="flex items-center gap-1.5 text-md font-medium text-gray-500"> {label}</span>;
        }
    };

    const getRemainingTime = (endDate, status) => {
        if (!endDate) return { text: '---', color: 'text-gray-400' };
        
        // Green if completed/accepted/done
        if (status === 'COMPLETED' || status === 'ACCEPTED' || status === 'DONE') {
            return { text: 'Đã hoàn thành', color: 'text-green-600 font-bold' };
        }

        const now = new Date();
        const end = new Date(endDate);
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let color = 'text-red-500 font-bold';
        if (diffDays >= 6) color = 'text-green-600 font-bold';
        else if (diffDays >= 2) color = 'text-amber-500 font-bold';

        if (diffDays < 0) {
            return { text: `Quá hạn ${Math.abs(diffDays)} ngày`, color: 'text-red-600 font-bold' };
        }

        if (diffTime < 24 * 60 * 60 * 1000) { // Less than 24 hours
            const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
            return { text: `Còn ${diffHours} giờ`, color: color };
        }

        return { text: `Còn ${diffDays} ngày`, color: color };
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.name.toLowerCase().includes(filter.search.toLowerCase()) ||
                task.code.toLowerCase().includes(filter.search.toLowerCase());
            const matchesStatus = filter.status === 'ALL' || task.status === filter.status;
            const matchesAssignee = filter.assigneeId === 'ALL' || task.assigneeId?.toString() === filter.assigneeId;
            return matchesSearch && matchesStatus && matchesAssignee;
        });
    }, [tasks, filter]);

    const {
        data: paginatedTasks,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems
    } = useTableFeatures(filteredTasks, { initialSort: { key: 'code', direction: 'ascending' } });

    const getSortIcon = (key) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
    };

    const renderSortableHeader = (label, sortKey, align = 'left') => (
        <th
            className={cn(
                "px-6 py-4 font-medium cursor-pointer hover:bg-gray-100/50 transition-colors group",
                align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
            )}
            onClick={() => requestSort(sortKey)}
        >
            <div className={cn("flex items-center", align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start')}>
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    const isProjectInProgress = project?.status === 'IN_PROGRESS' || project?.status === 'CONFIRMED';

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
                    <option value="CANCELLED">Đã hủy</option>
                    <option value="AWAITING_PRICING">Chờ định giá</option>
                    <option value="REJECTED">Yêu cầu làm lại</option>
                    <option value="AWAITING_ACCEPTANCE">Đang chờ nghiệm thu</option>
                    <option value="AWAITING_REVIEW">Đang chờ duyệt</option>
                    <option value="OVERDUE">Quá hạn</option>
                </select>
                <select
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none hover:bg-gray-100"
                    value={filter.assigneeId}
                    onChange={(e) => setFilter({ ...filter, assigneeId: e.target.value })}
                >
                    <option value="ALL">Tất cả nhân sự</option>
                    {members.map((member) => (
                        <option key={member.user.id} value={member.user.id}>
                            {member.user.fullName}
                        </option>
                    ))}
                </select>

                <button
                    onClick={() => setShowAddExtraModal(true)}
                    className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-sm font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>Thêm công việc</span>
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[1600px]">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-medium">STT</th>
                            {renderSortableHeader('Mã Công việc', 'code')}
                            {renderSortableHeader('Tên công việc', 'name')}
                            {renderSortableHeader('Thời hạn', 'plannedEndDate')}
                            {renderSortableHeader('Bên thực hiện', 'performerType')}
                            {renderSortableHeader('Người thực hiện', 'assignee.fullName', 'center')}
                            {renderSortableHeader('Trạng thái', 'status', 'center')}
                            {isProjectInProgress && (
                                <th className="px-6 py-4 font-medium text-center">Hành động</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedTasks.length > 0 ? (
                            paginatedTasks.map((task, index) => (
                                <tr
                                    key={task.id}
                                    className={cn(
                                        "transition-colors",
                                        task.isSupportRequested ? "bg-red-50/50 hover:bg-red-50 border-l-4 border-l-red-500" : "hover:bg-gray-50/50"
                                    )}
                                >
                                    <td className="px-6 py-4 text-gray-500">{(currentPage - 1) * 10 + index + 1}</td>
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

                                    <td className="px-6 py-4">
                                        <div className={cn("text-xs uppercase", getRemainingTime(task.plannedEndDate, task.status).color)}>
                                            {getRemainingTime(task.plannedEndDate, task.status).text}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                            {task.performerType}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-medium text-gray-700">{task.assignee?.fullName || task.vendorId || '---'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-medium text-gray-700">{TASK_STATUS_LABELS[task.status]}</span>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {isProjectInProgress && (task.status === 'PENDING' || task.status === 'AWAITING_SUPPORT') && (
                                                <button
                                                    onClick={() => setAssigningTask(task)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                >
                                                    Phân công
                                                </button>
                                            )}
                                            {isProjectInProgress && (task.status === 'DOING' || task.status === 'REWORKING') && !task.isSupportRequested && (
                                                <button
                                                    onClick={() => setAssigningTask(task)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                >
                                                    Hỗ trợ
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/tasks/${task.id}`)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-200 transition-all active:scale-95 text-xs font-bold uppercase"
                                            >
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </td>

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

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
            />

            {assigningTask && (
                <TaskAssignModal
                    isOpen={!!assigningTask}
                    onClose={() => setAssigningTask(null)}
                    task={assigningTask}
                    project={project}
                />
            )}

            {showAddExtraModal && (
                <AddExtraTaskModal
                    isOpen={showAddExtraModal}
                    onClose={() => setShowAddExtraModal(false)}
                    project={project}
                />
            )}
        </div>
    );
};
