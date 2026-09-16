import { useState, useMemo, Fragment } from 'react';
import { Calendar, Users, FileText, Search, UserPlus, UserMinus, Plus, AlertCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { TaskAssignModal } from './TaskAssignModal';
import { AddProjectServiceModal } from './AddProjectServiceModal';
import { useNavigate } from 'react-router-dom';
import { useGetTeamMembersQuery } from '../../../api/teams';
import { useApproveByCustomerMutation, useBulkUnassignTasksMutation, useRequestSupportMutation, useRespondSubtaskPlanMutation, useRespondToSupportMutation, useReturnSupportMutation, useRequestReturnSupportMutation } from '../../../api/tasks';
import { cn } from '../../../utils/cn';
import { PROJECT_MANAGEMENT_ROLES, TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../../utils/enums';
import { toast } from 'react-toastify';
import { formatDateTime, getRemainingTime } from '../../../utils/format';
import { useGetMeQuery } from '../../../api/auth';
import { InlineTaskNickname } from '../../../components/tasks/InlineTaskNickname';
import { ResolveStaffingRequestModal } from '../../../components/tasks/ResolveStaffingRequestModal';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { getCurrentUserId, isSameUser } from '../../../utils/authUser';

export const TaskTable = ({ tasks = [], project }) => {
    const navigate = useNavigate();
    const { data: user } = useGetMeQuery();
    const teamId = project?.team?.id;
    const { data: members = [] } = useGetTeamMembersQuery(teamId, { skip: !teamId });
    const [requestSupport] = useRequestSupportMutation();
    const [respondToSupport] = useRespondToSupportMutation();
    const [returnSupport] = useReturnSupportMutation();
    const [requestReturnSupport] = useRequestReturnSupportMutation();
    const [bulkUnassignTasks, { isLoading: isUnassigning }] = useBulkUnassignTasksMutation();
    const [approveByCustomer, { isLoading: isApprovingByCustomer }] = useApproveByCustomerMutation();
    const [respondSubtaskPlan, { isLoading: isRespondingSubtaskPlan }] = useRespondSubtaskPlanMutation();

    const currentUserId = getCurrentUserId(user);
    const isAdminOrBOD = PROJECT_MANAGEMENT_ROLES.includes(user?.role);
    const hasStaffingAdminOverride = ['ADMIN', 'BOD'].includes(user?.role);
    const isProjectLead = isSameUser(currentUserId, project?.team?.teamLead?.id);
    const isSupportLead = tasks.some(t => isSameUser(t.supportLeadId, currentUserId));
    const isHelper = tasks.some(t => isSameUser(t.helperId, currentUserId));

    const canSeeTable = isAdminOrBOD || isProjectLead || isSupportLead || isHelper;
    const canAddTask = isAdminOrBOD || isProjectLead;
    const isProjectInProgress = project?.status === 'IN_PROGRESS' || project?.status === 'CONFIRMED';

    const [filter, setFilter] = useState({
        status: 'ALL',
        search: '',
        assigneeId: 'ALL'
    });
    const [assigningTask, setAssigningTask] = useState(null);
    const [staffingTask, setStaffingTask] = useState(null);
    const [isStaffingResolutionOpen, setIsStaffingResolutionOpen] = useState(false);
    const [reviewingSubtaskPlanTask, setReviewingSubtaskPlanTask] = useState(null);
    const [showAddServiceModal, setShowAddServiceModal] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [selectionMode, setSelectionMode] = useState('assign');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [approvingTaskId, setApprovingTaskId] = useState(null);
    const [respondingSubtaskPlanId, setRespondingSubtaskPlanId] = useState(null);

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const handleRespondSubtaskPlan = async (task, action) => {
        const note = action === 'REJECT'
            ? window.prompt('Nhập lý do cần điều chỉnh phương án:')
            : undefined;
        if (action === 'REJECT' && note === null) return;

        setRespondingSubtaskPlanId(task.id);
        try {
            await respondSubtaskPlan({
                id: task.id,
                projectId: project.id,
                action,
                note: note?.trim() || undefined,
            }).unwrap();
            toast.success(action === 'APPROVE'
                ? 'Đã duyệt và kích hoạt phương án subtask'
                : 'Đã yêu cầu Account điều chỉnh phương án');
            setReviewingSubtaskPlanTask(null);
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể xử lý phương án subtask');
        } finally {
            setRespondingSubtaskPlanId(null);
        }
    };

    if (!canSeeTable) return null;

    const isTaskBatchAssignable = (task) => {
        if (!isProjectInProgress) return false;
        if (task.parentTaskId && task.subtaskPlanStatus && task.subtaskPlanStatus !== 'APPROVED') return false;

        const validStatuses = ['PENDING', 'REJECTED', 'AWAITING_SUPPORT'];
        if (!validStatuses.includes(task.status)) return false;

        if (isAdminOrBOD || isProjectLead) return true;

        if (isSameUser(task.supportLeadId, currentUserId)) return true;

        return false;
    };

    const isTaskUnassignable = (task) => {
        if (!isProjectInProgress || (!isAdminOrBOD && !isProjectLead)) return false;
        if (task.status !== 'DOING') return false;

        const hasPerformer = Boolean(task.assigneeId) || task.performerType === 'VENDOR';
        if (!hasPerformer) return false;

        const hasExecutionData = Boolean(
            task.result || task.actualStartDate || task.actualEndDate || task.lastSubmittedById ||
            task.reviews?.length || task.iterations?.length
        );
        if (hasExecutionData) return false;

        return !(
            task.isSupportRequested || task.isSupportAccepted || task.isSupportReturnRequested ||
            task.supportTeamId || task.supportLeadId || task.helperId ||
            task.supportRequestNote || task.supportReturnNote
        );
    };

    const isTaskSelectable = selectionMode === 'unassign' ? isTaskUnassignable : isTaskBatchAssignable;

    const handleToggleUnassignMode = () => {
        setSelectedTasks([]);
        setSelectionMode(prev => prev === 'unassign' ? 'assign' : 'unassign');
    };

    const handleBulkUnassign = async () => {
        if (selectedTasks.length === 0) return;
        if (!window.confirm(`Xoá phân công của ${selectedTasks.length} công việc đã chọn?`)) return;

        try {
            const result = await bulkUnassignTasks({
                projectId: project.id,
                taskIds: selectedTasks
            }).unwrap();
            const successCount = result?.unassigned?.length || 0;
            const skippedCount = result?.skipped?.length || 0;

            if (successCount > 0) {
                toast.success(`Đã xoá phân công ${successCount} công việc`);
            }
            if (skippedCount > 0) {
                toast.warning(`Đã bỏ qua ${skippedCount} công việc không còn hợp lệ`);
            }

            setSelectedTasks([]);
            setSelectionMode('assign');
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể xoá phân công');
        }
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

    const handleCustomerApprove = async (taskId) => {
        try {
            setApprovingTaskId(taskId);
            await approveByCustomer({ id: taskId, projectId: project.id }).unwrap();
            toast.success('Khách hàng đã duyệt công việc');
        } catch (error) {
            toast.error(error?.data?.message || 'Có lỗi xảy ra khi duyệt công việc');
        } finally {
            setApprovingTaskId(null);
        }
    };

    const getStatusBadge = (status) => {
        const label = TASK_STATUS_LABELS[status] || status;
        return (
            <span className={cn(
                "inline-flex whitespace-nowrap px-2 py-0.5 rounded-lg text-xs font-bold border",
                TASK_STATUS_COLORS[status] || 'bg-gray-50 text-gray-500 border-gray-100'
            )}>
                {label}
            </span>
        );
    };


    const filteredTasks = useMemo(() => {
        const filtered = tasks.filter(task => {
            const search = filter.search.toLowerCase();
            const matchesSearch = task.name?.toLowerCase().includes(search) ||
                task.nickname?.toLowerCase().includes(search) ||
                task.code?.toLowerCase().includes(search);
            const matchesStatus = filter.status === 'ALL' || task.status === filter.status;
            const matchesAssignee = filter.assigneeId === 'ALL' || task.assigneeId?.toString() === filter.assigneeId;
            return matchesSearch && matchesStatus && matchesAssignee;
        });

        // Sắp xếp các task theo mã code tăng dần (sử dụng natural sort để nhận diện số cuối chính xác)
        return [...filtered].sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }));
    }, [tasks, filter]);

    const groupedTasks = useMemo(() => {
        const groups = {};
        const others = [];

        filteredTasks.forEach(task => {
            const jobId = task.job?.id || task.jobId;
            if (jobId) {
                if (!groups[jobId]) {
                    groups[jobId] = {
                        job: task.job || { id: jobId, name: 'Tên Job đang trống' },
                        tasks: []
                    };
                }
                groups[jobId].tasks.push(task);
            } else {
                others.push(task);
            }
        });

        const result = Object.values(groups);
        result.sort((a, b) => (a.job.name || '').localeCompare(b.job.name || ''));

        if (others.length > 0) {
            result.push({
                job: { id: 'other', name: 'Công việc khác (Không thuộc nhóm nào)' },
                tasks: others
            });
        }

        return result;
    }, [filteredTasks]);

    const renderHeader = (label, align = 'left') => (
        <th
            className={cn(
                "px-6 py-4 font-medium",
                align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
            )}
        >
            {label}
        </th>
    );

    const selectableFilteredTasks = filteredTasks.filter(isTaskSelectable);

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
                    <option value="ALL">Tất cả trạng thái Công việc</option>
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
                {canAddTask && isProjectInProgress && (
                    <button
                        onClick={handleToggleUnassignMode}
                        className={cn(
                            "ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm font-medium text-sm",
                            selectionMode === 'unassign'
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        )}
                    >
                        <UserMinus className="w-4 h-4" />
                        <span>{selectionMode === 'unassign' ? 'Huỷ xoá phân công' : 'Xoá phân công'}</span>
                    </button>
                )}
                {canAddTask && (
                    <button
                        onClick={() => setShowAddServiceModal(true)}
                        className={cn(
                            "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-sm font-medium text-sm",
                            !isProjectInProgress && "ml-auto"
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Thêm dịch vụ</span>
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[1450px]">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-center">
                                <input
                                    type="checkbox"
                                    className={cn(
                                        "w-4 h-4 border-gray-300 rounded cursor-pointer",
                                        selectionMode === 'unassign' ? "text-red-600 focus:ring-red-500" : "text-blue-600 focus:ring-blue-500"
                                    )}
                                    checked={selectableFilteredTasks.length > 0 && selectableFilteredTasks.every(t => selectedTasks.includes(t.id))}
                                    disabled={selectableFilteredTasks.length === 0}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            const assignableIds = filteredTasks
                                                .filter(isTaskSelectable)
                                                .map(t => t.id);
                                            setSelectedTasks(prev => [...new Set([...prev, ...assignableIds])]);
                                        } else {
                                            const allIds = filteredTasks.map(t => t.id);
                                            setSelectedTasks(prev => prev.filter(id => !allIds.includes(id)));
                                        }
                                    }}
                                />
                            </th>
                            {/* <th className="px-6 py-4 font-medium">STT</th> */}
                            {renderHeader('Mã')}
                            {renderHeader('Tên công việc')}
                            {renderHeader('Thời hạn')}
                            {renderHeader('Bên thực hiện')}
                            {renderHeader('Người thực hiện', 'center')}
                            {renderHeader('Trạng thái', 'center')}
                            {isProjectInProgress && (
                                <th className="px-6 py-4 font-medium text-center">Hành động</th>
                            )}

                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {groupedTasks.length > 0 ? (
                            groupedTasks.map((group, groupIndex) => {
                                const assignableTasksInGroup = group.tasks.filter(isTaskSelectable);
                                const allAssignableSelected = assignableTasksInGroup.length > 0 && assignableTasksInGroup.every(t => selectedTasks.includes(t.id));
                                const someAssignableSelected = assignableTasksInGroup.some(t => selectedTasks.includes(t.id));

                                return (
                                    <Fragment key={group.job.id}>
                                        {/* Group Header Row */}
                                        <tr className="bg-gray-50/80 border-y border-gray-200 hover:bg-gray-100/50 transition-colors">
                                            <td className="px-6 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                    disabled={assignableTasksInGroup.length === 0}
                                                    checked={allAssignableSelected}
                                                    ref={input => {
                                                        if (input) {
                                                            input.indeterminate = someAssignableSelected && !allAssignableSelected;
                                                        }
                                                    }}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            const newIds = assignableTasksInGroup.map(t => t.id).filter(id => !selectedTasks.includes(id));
                                                            setSelectedTasks(prev => [...prev, ...newIds]);
                                                        } else {
                                                            const idsToRemove = assignableTasksInGroup.map(t => t.id);
                                                            setSelectedTasks(prev => prev.filter(id => !idsToRemove.includes(id)));
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td
                                                colSpan={isProjectInProgress ? 8 : 7}
                                                className="px-6 py-3 font-bold text-gray-800 cursor-pointer"
                                                onClick={() => toggleGroup(group.job.id)}
                                            >
                                                <div className="flex items-center gap-2 select-none">
                                                    {expandedGroups[group.job.id] ? (
                                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                                    )}
                                                    {group.job.name}
                                                    <span className="ml-2 text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                                        {group.tasks.length} công việc
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Group Tasks */}
                                        {expandedGroups[group.job.id] && group.tasks.map((task, index) => (
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
                                                        className={cn(
                                                            "w-4 h-4 border-gray-300 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
                                                            selectionMode === 'unassign' ? "text-red-600 focus:ring-red-500" : "text-blue-600 focus:ring-blue-500"
                                                        )}
                                                        disabled={!isTaskSelectable(task)}
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
                                                {/* <td className="px-6 py-4 text-gray-500 pl-8">{index + 1}</td> */}
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex whitespace-nowrap font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        {task.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <InlineTaskNickname
                                                        task={task}
                                                        projectId={project.id}
                                                        canEdit={isAdminOrBOD || isProjectLead}
                                                    />
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
                                                <td className="px-3 py-2 text-center w-fit">
                                                    {task.parentTaskId && task.subtaskPlanStatus && task.subtaskPlanStatus !== 'APPROVED' ? (
                                                        <span className="inline-flex whitespace-nowrap rounded-lg border border-amber-100 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                                                            {task.subtaskPlanStatus === 'PENDING_APPROVAL' ? 'Chờ PM duyệt' : 'Bản nháp'}
                                                        </span>
                                                    ) : getStatusBadge(task.status)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap">
                                                        {isProjectInProgress &&
                                                            (!task.parentTaskId || !task.subtaskPlanStatus || task.subtaskPlanStatus === 'APPROVED') &&
                                                            (task.status === 'PENDING' || task.status === 'AWAITING_SUPPORT') && (
                                                            <button
                                                                onClick={() => setAssigningTask(task)}
                                                                className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 text-xs font-bold uppercase"
                                                            >
                                                                Phân công
                                                            </button>
                                                        )}

                                                        {/* Original Team Lead Actions */}
                                                        {isProjectInProgress && (isProjectLead || isAdminOrBOD) && ['DOING', 'REWORKING', 'OVERDUE', 'REJECTED'].includes(task.status) && (
                                                            <button
                                                                onClick={() => setAssigningTask(task)}
                                                                className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                            >
                                                                Đổi người
                                                            </button>
                                                        )}

                                                        {/* Support Team Lead Actions (Pending) */}
                                                        {task.status === 'SUPPORT_PENDING' && isSameUser(task.supportLeadId, currentUserId) && (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleRespondSupport(task.id, 'ACCEPT')}
                                                                    className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                                >
                                                                    Đồng ý
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRespondSupport(task.id, 'REJECT')}
                                                                    className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                                >
                                                                    Từ chối
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Support Team Lead Actions (Accepted) */}
                                                        {task.isSupportAccepted && isSameUser(task.supportLeadId, currentUserId) && task.isSupportReturnRequested &&
                                                            (task.status === 'DOING' || task.status === 'REWORKING' || task.status === 'SUPPORT_AWAITING_RETURN') && (
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => setAssigningTask(task)}
                                                                        className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                                    >
                                                                        Đổi người
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReturnSupport(task.id)}
                                                                        className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                                    >
                                                                        Trả lại
                                                                    </button>
                                                                </div>
                                                            )}

                                                        {isProjectInProgress && (isProjectLead || isAdminOrBOD) && task.status === 'INTERNAL_COMPLETED' && (
                                                            <button
                                                                onClick={() => handleCustomerApprove(task.id)}
                                                                disabled={isApprovingByCustomer && approvingTaskId === task.id}
                                                                className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase disabled:opacity-60"
                                                            >
                                                                {isApprovingByCustomer && approvingTaskId === task.id ? 'Đang duyệt...' : 'Khách hàng duyệt'}
                                                            </button>
                                                        )}

                                                        {task.supportRequestType === 'STAFFING' &&
                                                            task.isSupportRequested &&
                                                            !task.isSupportAccepted &&
                                                            (isSameUser(task.supportLeadId, currentUserId) || hasStaffingAdminOverride) && (
                                                                <button
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        setStaffingTask(task);
                                                                        setIsStaffingResolutionOpen(true);
                                                                    }}
                                                                    className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white active:scale-95"
                                                                >
                                                                    <UserPlus className="h-3.5 w-3.5" />
                                                                    Bổ sung nhân sự
                                                                </button>
                                                            )}

                                                        {task.subtaskPlanStatus === 'PENDING_APPROVAL' &&
                                                            (isSameUser(task.subtaskPlanReviewerId, currentUserId) || hasStaffingAdminOverride) && (
                                                                <button
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        setReviewingSubtaskPlanTask(task);
                                                                    }}
                                                                    className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white active:scale-95"
                                                                >
                                                                    Duyệt phân bổ
                                                                </button>
                                                            )}

                                                        {/* Original Team Member Request Support */}
                                                        {/* {isProjectInProgress && (task.status === 'DOING' || task.status === 'REWORKING' || task.status === 'OVERDUE') && isSameUser(currentUserId, task.assigneeId) && !task.isSupportRequested && (
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
                                                        {/* {isProjectInProgress && (task.status === 'DOING' || task.status === 'REWORKING') && isSameUser(currentUserId, task.helperId) && (
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
                                                            className="inline-flex whitespace-nowrap items-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-200 transition-all active:scale-95 text-xs font-bold"
                                                        >
                                                            Xem chi tiết
                                                        </button>
                                                    </div>
                                                </td>

                                            </tr>
                                        ))}
                                    </Fragment>
                                );
                            })
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

            {showAddServiceModal && (
                <AddProjectServiceModal
                    isOpen={showAddServiceModal}
                    onClose={() => setShowAddServiceModal(false)}
                    project={project}
                />
            )}

            <ResolveStaffingRequestModal
                isOpen={isStaffingResolutionOpen}
                onClose={() => setIsStaffingResolutionOpen(false)}
                task={staffingTask}
                team={project?.team ? { ...project.team, members } : null}
                projectId={project?.id}
            />

            <Modal
                isOpen={Boolean(reviewingSubtaskPlanTask)}
                onClose={() => setReviewingSubtaskPlanTask(null)}
                title="Duyệt phương án phân bổ subtask"
                className="max-w-2xl"
            >
                {reviewingSubtaskPlanTask && (() => {
                    const planSubtasks = tasks.filter(candidate =>
                        isSameUser(candidate.parentTaskId, reviewingSubtaskPlanTask.id)
                    );
                    const totalPercent = planSubtasks.reduce(
                        (total, subtask) => total + Number(subtask.allocationPercent || 0),
                        0
                    );
                    const ownerHasSubtask = planSubtasks.some(subtask =>
                        isSameUser(
                            subtask.assigneeId || subtask.assignee?.id,
                            reviewingSubtaskPlanTask.assigneeId
                        )
                    );
                    const reviewerHasSubtask = planSubtasks.some(subtask =>
                        isSameUser(subtask.assigneeId || subtask.assignee?.id, currentUserId)
                    );

                    return (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
                                <p className="font-bold text-orange-900">
                                    {reviewingSubtaskPlanTask.nickname || reviewingSubtaskPlanTask.name}
                                </p>
                                <p className="mt-1 text-sm text-orange-700">
                                    Tổng phân bổ: {totalPercent.toLocaleString('vi-VN')}% · Người phụ trách task cha {ownerHasSubtask ? 'đã có' : 'chưa có'} phần việc
                                </p>
                            </div>

                            <div className="max-h-80 space-y-2 overflow-y-auto">
                                {planSubtasks.map(subtask => (
                                    <div
                                        key={subtask.id}
                                        className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-gray-100 bg-slate-50 px-4 py-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-gray-900">{subtask.name}</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {subtask.assignee?.fullName || 'Chưa có người thực hiện'}
                                            </p>
                                        </div>
                                        <span className="font-black text-orange-700">
                                            {Number(subtask.allocationPercent || 0).toLocaleString('vi-VN')}%
                                        </span>
                                    </div>
                                ))}
                                {planSubtasks.length === 0 && (
                                    <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
                                        Không tìm thấy danh sách subtask trong dữ liệu dự án.
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                {reviewerHasSubtask && !hasStaffingAdminOverride && (
                                    <p className="mr-auto max-w-sm text-xs font-semibold text-amber-700">
                                        Bạn có phần việc trong phương án nên ADMIN/BOD phải duyệt thay.
                                    </p>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => handleRespondSubtaskPlan(reviewingSubtaskPlanTask, 'REJECT')}
                                    disabled={isRespondingSubtaskPlan}
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    Yêu cầu sửa
                                </Button>
                                <Button
                                    onClick={() => handleRespondSubtaskPlan(reviewingSubtaskPlanTask, 'APPROVE')}
                                    isLoading={isRespondingSubtaskPlan && respondingSubtaskPlanId === reviewingSubtaskPlanTask.id}
                                    disabled={
                                        planSubtasks.length === 0 ||
                                        (reviewerHasSubtask && !hasStaffingAdminOverride)
                                    }
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    Duyệt và kích hoạt
                                </Button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {/* Batch Action Bar */}
            {selectedTasks.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-200 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-50 ">
                    <div className="flex items-center gap-2 border-r border-gray-700 pr-6">
                        <span className=" text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                            Đã chọn {selectedTasks.length} công việc
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {selectionMode === 'unassign' ? (
                            <button
                                onClick={handleBulkUnassign}
                                disabled={isUnassigning}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-red-500/20"
                            >
                                <UserMinus className="w-3.5 h-3.5" />
                                {isUnassigning ? 'Đang xoá...' : 'Xoá phân công'}
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    const tasksToAssign = tasks.filter(t => selectedTasks.includes(t.id));
                                    setAssigningTask(tasksToAssign);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <Users className="w-3.5 h-3.5" />
                                Phân công
                            </button>
                        )}

                        <button
                            onClick={() => {
                                setSelectedTasks([]);
                                if (selectionMode === 'unassign') setSelectionMode('assign');
                            }}
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
