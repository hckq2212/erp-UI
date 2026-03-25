import { useState, useMemo } from 'react';
import { Calendar, Users, FileText, Search, UserPlus, ArrowUp, ArrowDown, ArrowUpDown, Plus, AlertCircle } from 'lucide-react';
import { TaskAssignModal } from './TaskAssignModal';
import { AddExtraTaskModal } from './AddExtraTaskModal';
import { useNavigate } from 'react-router-dom';
import { useGetTeamMembersQuery } from '../../../api/teams';
import { useRequestSupportMutation, useRespondToSupportMutation, useReturnSupportMutation, useRequestReturnSupportMutation } from '../../../api/tasks';
import { useTableFeatures } from '../../../hooks/useTableFeatures';
import { Pagination } from '../../../components/ui/Pagination';
import { cn } from '../../../utils/cn';
import { TASK_STATUS_LABELS } from '../../../utils/enums';
import { toast } from 'react-toastify';
import { formatDateTime, getRemainingTime } from '../../../utils/format';
import { useGetMeQuery } from '../../../api/auth';

export const TaskTable = ({ tasks = [], project }) => {
    const navigate = useNavigate();
    const { data: user } = useGetMeQuery();
    const teamId = project?.team?.id;
    const { data: members = [] } = useGetTeamMembersQuery(teamId, { skip: !teamId });
    const [requestSupport] = useRequestSupportMutation();
    const [respondToSupport] = useRespondToSupportMutation();
    const [returnSupport] = useReturnSupportMutation();
    const [requestReturnSupport] = useRequestReturnSupportMutation();

    const [filter, setFilter] = useState({
        status: 'ALL',
        search: '',
        assigneeId: 'ALL'
    });
    const [assigningTask, setAssigningTask] = useState(null);
    const [showAddExtraModal, setShowAddExtraModal] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState([]);

    const isTaskAssignable = (task) => {
        if (!isProjectInProgress) return false;

        // Standard Assign: Project Lead logic
        const canProjectLeadAssign = task.status === 'PENDING' || task.status === 'AWAITING_SUPPORT';

        // Support Lead Reassign logic
        const canSupportLeadAssign = task.isSupportAccepted &&
            task.supportLeadId === user?.id &&
            task.isSupportReturnRequested &&
            (task.status === 'DOING' || task.status === 'REWORKING' || task.status === 'SUPPORT_AWAITING_RETURN');

        // Original Team Lead Reassign logic (when support requested but not assigned yet)
        const canOriginalLeadReassign = task.isSupportRequested &&
            !task.supportTeamId &&
            task.project?.team?.teamLead?.id === user?.id;

        return canProjectLeadAssign || canSupportLeadAssign || canOriginalLeadReassign;
    };

    const handleRespondSupport = async (taskId, response) => {
        try {
            await respondToSupport({ id: taskId, action: response, projectId: project.id }).unwrap();
            toast.success(response === 'ACCEPT' ? 'Đã đồng ý hỗ trợ' : 'Đã từ chối hỗ trợ');
        } catch (error) {
            toast.error('Có lỗi xảy ra khi phản hồi yêu cầu');
        }
    };

    const handleReturnSupport = async (taskId) => {
        if (!window.confirm('Bạn có chắc chắn muốn trả lại task này cho team chính?')) return;
        try {
            await returnSupport({ id: taskId, projectId: project.id }).unwrap();
            toast.success('Đã trả lại task thành công');
        } catch (error) {
            toast.error(error.data?.message || 'Có lỗi xảy ra khi trả lại task');
        }
    };

    const handleRequestReturnSupport = async (taskId) => {
        try {
            await requestReturnSupport({ id: taskId, note: "Yêu cầu trả lại task", projectId: project.id }).unwrap();
            toast.success('Đã gửi yêu cầu hỗ trợ hoàn thành');
        } catch (error) {
            toast.error(error.data?.message || 'Có lỗi xảy ra khi yêu cầu');
        }
    };

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
            case 'SUPPORT_AWAITING_RETURN':
                return <span className="flex items-center gap-1.5 text-md font-medium text-indigo-600"> {label}</span>;
            default:
                return <span className="flex items-center gap-1.5 text-md font-medium text-gray-500"> {label}</span>;
        }
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ">
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
                    {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
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
                <table className="w-full text-sm text-left min-w-[1200px]">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    checked={paginatedTasks.length > 0 && paginatedTasks.every(t => !isTaskAssignable(t) || selectedTasks.includes(t.id))}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            const assignableIds = paginatedTasks
                                                .filter(isTaskAssignable)
                                                .map(t => t.id);
                                            setSelectedTasks(prev => [...new Set([...prev, ...assignableIds])]);
                                        } else {
                                            const pageIds = paginatedTasks.map(t => t.id);
                                            setSelectedTasks(prev => prev.filter(id => !pageIds.includes(id)));
                                        }
                                    }}
                                />
                            </th>
                            <th className="px-6 py-4 font-medium">STT</th>
                            {renderSortableHeader('Mã', 'code')}
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
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                            disabled={!isTaskAssignable(task)}
                                            checked={selectedTasks.includes(task.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTasks(prev => [...prev, task.id]);
                                                } else {
                                                    setSelectedTasks(prev => prev.filter(id => id !== task.id));
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{(currentPage - 1) * 10 + index + 1}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {task.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-blue-600 uppercase leading-snug">
                                            {task.name}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={cn("text-xs uppercase", getRemainingTime(task.plannedEndDate, task.status).color)}>
                                            {getRemainingTime(task.plannedEndDate, task.status).text}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 uppercase text-xs font-semibold text-gray-500">
                                        {task.performerType || '---'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-medium text-gray-700">{task.assignee?.fullName || task.vendorId || '---'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(task.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            {isProjectInProgress && (task.status === 'PENDING' || task.status === 'AWAITING_SUPPORT') && (
                                                <button
                                                    onClick={() => setAssigningTask(task)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 text-xs font-bold uppercase"
                                                >
                                                    Phân công
                                                </button>
                                            )}

                                            {/* Original Team Lead Actions */}
                                            {task.isSupportRequested && !task.supportTeamId && task.project?.team?.teamLead?.id === user?.id && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setAssigningTask(task)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                    >
                                                        Đổi người
                                                    </button>
                                                    <button
                                                        onClick={() => setAssigningTask(task)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                    >
                                                        Phân công lại
                                                    </button>
                                                </div>
                                            )}

                                            {/* Support Team Lead Actions (Pending) */}
                                            {task.status === 'SUPPORT_PENDING' && task.supportLeadId === user?.id && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleRespondSupport(task.id, 'ACCEPT')}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                    >
                                                        Đồng ý
                                                    </button>
                                                    <button
                                                        onClick={() => handleRespondSupport(task.id, 'REJECT')}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            )}

                                            {/* Support Team Lead Actions (Accepted) */}
                                            {task.isSupportAccepted && task.supportLeadId === user?.id && task.isSupportReturnRequested &&
                                                (task.status === 'DOING' || task.status === 'REWORKING' || task.status === 'SUPPORT_AWAITING_RETURN') && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setAssigningTask(task)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                        >
                                                            Phân công lại
                                                        </button>
                                                        <button
                                                            onClick={() => handleReturnSupport(task.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                        >
                                                            Trả lại
                                                        </button>
                                                    </div>
                                                )}

                                            {/* Original Team Member Request Support */}
                                            {/* {isProjectInProgress && (task.status === 'DOING' || task.status === 'REWORKING' || task.status === 'OVERDUE') && user?.id === task.assigneeId && !task.isSupportRequested && (
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            await requestSupport({ id: task.id, projectId: project.id, note: "Yêu cầu hỗ trợ" }).unwrap();
                                                            toast.success('Đã gửi yêu cầu hỗ trợ');
                                                        } catch (err) {
                                                            toast.error('Không thể gửi yêu cầu hỗ trợ');
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                >
                                                    Hỗ trợ
                                                </button>
                                            )} */}

                                            {/* Helper Request Return Support */}
                                            {/* {isProjectInProgress && (task.status === 'DOING' || task.status === 'REWORKING') && user?.id === task.helperId && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRequestReturnSupport(task.id);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                >
                                                    Hỗ trợ
                                                </button>
                                            )} */}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/tasks/${task.id}`);
                                                }}
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
                                <td colSpan={isProjectInProgress ? 8 : 7} className="px-6 py-10 text-center text-gray-400 italic">
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

            {/* Batch Action Bar */}
            {selectedTasks.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-50 ">
                    <div className="flex items-center gap-2 border-r border-gray-700 pr-6">
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            Đã chọn {selectedTasks.length} công việc
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                // Filter selected tasks that are actually in this page's task list (or pass all IDs if the modal can handle it)
                                const tasksToAssign = tasks.filter(t => selectedTasks.includes(t.id));
                                setAssigningTask(tasksToAssign);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            <Users className="w-3.5 h-3.5" />
                            Phân công
                        </button>

                        <button
                            onClick={() => setSelectedTasks([])}
                            className="text-red-400 hover:text-white px-3 py-2 rounded-xl text-xs font-bold uppercase transition-colors"
                        >
                            Hủy chọn
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
