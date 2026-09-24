import { useState, useMemo, useEffect, Fragment } from 'react';
import { Calendar, Users, FileText, Search, UserPlus, UserMinus, Plus, AlertCircle, ChevronRight, ChevronDown, Play } from 'lucide-react';
import { TaskAssignModal } from './TaskAssignModal';
import { AddProjectServiceModal } from './AddProjectServiceModal';
import { useNavigate } from 'react-router-dom';
import { useGetTeamMembersQuery } from '../../../api/teams';
import { useRequestProjectStaffingMutation } from '../../../api/projects';
import { useApproveByCustomerMutation, useBulkUnassignTasksMutation, useRequestSupportMutation, useRespondToSupportMutation, useReturnSupportMutation, useRequestReturnSupportMutation, useRequestTaskStaffingMutation, useStartTaskMutation } from '../../../api/tasks';
import { cn } from '../../../utils/cn';
import { PROJECT_MANAGEMENT_ROLES, TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../../utils/enums';
import { toast } from 'react-toastify';
import { formatDateTime, getRemainingTime } from '../../../utils/format';
import { useGetMeQuery } from '../../../api/auth';
import { InlineTaskNickname } from '../../../components/tasks/InlineTaskNickname';
import { ResolveStaffingRequestModal } from '../../../components/tasks/ResolveStaffingRequestModal';
import { TaskReminderButton } from '../../../components/tasks/TaskReminderButton';
import { getCurrentUserId, isSameUser } from '../../../utils/authUser';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { hasTeamMemberRole } from '../../../utils/teamMember';

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
    const [requestTaskStaffing, { isLoading: isRequestingStaffing }] = useRequestTaskStaffingMutation();
    const [requestProjectStaffing, { isLoading: isRequestingProjectStaffing }] = useRequestProjectStaffingMutation();
    const [startTask, { isLoading: isStartingTask }] = useStartTaskMutation();

    const currentUserId = getCurrentUserId(user);
    const isAdminOrBOD = PROJECT_MANAGEMENT_ROLES.includes(user?.role);
    const isAdmin = user?.role === 'ADMIN';
    const hasStaffingAdminOverride = ['ADMIN', 'BOD'].includes(user?.role);
    const isProjectLead = isSameUser(currentUserId, project?.team?.teamLead?.id) ||
        isSameUser(currentUserId, project?.team?.teamLeadId) ||
        Boolean(project?.team?.members?.some(member =>
            hasTeamMemberRole(member, 'ACCOUNT') && isSameUser(member.user?.id, currentUserId)
        )) ||
        Boolean(members.some(member =>
            hasTeamMemberRole(member, 'ACCOUNT') && isSameUser(member.user?.id, currentUserId)
        ));
    const isProjectManager = isSameUser(currentUserId, project?.projectManager?.id) ||
        Boolean(project?.team?.members?.some(m => hasTeamMemberRole(m, 'PROJECT_MANAGER') && isSameUser(m.user?.id, currentUserId)));
    const canManageAllTasks = isAdminOrBOD || isProjectLead || isProjectManager;
    const isSupportLead = tasks.some(t => isSameUser(t.supportLeadId, currentUserId));
    const isHelper = tasks.some(t => isSameUser(t.helperId, currentUserId));
    const isAssignee = tasks.some(t => isSameUser(t.assigneeId, currentUserId) || isSameUser(t.assignee?.id, currentUserId));
    const isTeamMember = Boolean(project?.team?.members?.some(m => isSameUser(m.user?.id, currentUserId)));

    const canSeeTable = true;
    const canCreateProjectWork = user?.role === 'PM' || user?.role === 'ADMIN';
    const isProjectInProgress = project?.status === 'IN_PROGRESS' || project?.status === 'CONFIRMED';

    const hasMainPerformer = (task) => Boolean(
        task?.assigneeId || task?.assignee?.id || task?.vendor || task?.vendorId || task?.performerType === 'VENDOR'
    );

    const canManageTaskAssignment = (task) => {
        if (isAdmin) return true;
        if (!isProjectLead) return false;
        if (!hasMainPerformer(task)) return true;
        return !task?.assignerId || isSameUser(task.assignerId, currentUserId);
    };

    const [filter, setFilter] = useState({
        status: 'ALL',
        search: '',
        assigneeId: 'ALL'
    });
    const [assigningTask, setAssigningTask] = useState(null);
    const [staffingTask, setStaffingTask] = useState(null);
    const [isStaffingResolutionOpen, setIsStaffingResolutionOpen] = useState(false);
    const [showAddServiceModal, setShowAddServiceModal] = useState(false);
    const [isStaffingModalOpen, setIsStaffingModalOpen] = useState(false);
    const [staffingTaskId, setStaffingTaskId] = useState('');
    const [isRowSpecificStaffing, setIsRowSpecificStaffing] = useState(false);
    const [staffingNote, setStaffingNote] = useState('');
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [selectionMode, setSelectionMode] = useState('assign');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [approvingTaskId, setApprovingTaskId] = useState(null);
    const [startingTaskId, setStartingTaskId] = useState(null);

    const handleStartTask = async (task) => {
        setStartingTaskId(task.id);
        try {
            await startTask({ id: task.id, projectId: project?.id }).unwrap();
            toast.success('Đã bắt đầu công việc!');
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể bắt đầu công việc');
        } finally {
            setStartingTaskId(null);
        }
    };

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const handleOpenStaffingModal = () => {
        if (selectedTasks.length === 1) {
            setStaffingTaskId(selectedTasks[0]);
        } else {
            setStaffingTaskId('');
        }
        setIsRowSpecificStaffing(false);
        setStaffingNote('');
        setIsStaffingModalOpen(true);
    };

    const handleSendStaffingRequest = async () => {
        if (!staffingNote.trim()) {
            toast.error('Vui lòng nhập lý do hoặc vị trí nhân sự cần bổ sung');
            return;
        }
        try {
            if (staffingTaskId) {
                await requestTaskStaffing({
                    id: staffingTaskId,
                    projectId: project?.id,
                    note: staffingNote.trim()
                }).unwrap();
            } else {
                await requestProjectStaffing({
                    id: project?.id,
                    note: staffingNote.trim()
                }).unwrap();
            }
            toast.success('Đã gửi yêu cầu bổ sung nhân sự cho PM');
            setIsStaffingModalOpen(false);
            setStaffingNote('');
            setStaffingTaskId('');
            setIsRowSpecificStaffing(false);
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể gửi yêu cầu bổ sung nhân sự');
        }
    };

    if (!canSeeTable) return null;

    const isTaskBatchAssignable = (task) => {
        if (!isProjectInProgress) return false;
        const validStatuses = ['PENDING', 'REJECTED', 'AWAITING_SUPPORT'];
        if (!validStatuses.includes(task.status)) return false;

        if (canManageTaskAssignment(task)) return true;

        if (isSameUser(task.supportLeadId, currentUserId)) return true;

        return false;
    };

    const isTaskUnassignable = (task) => {
        if (!isProjectInProgress || !canManageTaskAssignment(task)) return false;
        if (!['NOT_STARTED', 'DOING'].includes(task.status)) return false;

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

    // Tự động loại bỏ các task đã phân công hoặc không còn thoả mãn điều kiện chọn khỏi selectedTasks
    useEffect(() => {
        if (selectedTasks.length === 0) return;
        const selectableIds = new Set(tasks.filter(isTaskSelectable).map(t => t.id));
        setSelectedTasks(prev => {
            const next = prev.filter(id => selectableIds.has(id));
            return next.length === prev.length ? prev : next;
        });
    }, [tasks, selectionMode]);

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
            {/* Filters & Actions */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-2.5 min-w-0">
                <div className="relative flex-1 min-w-[140px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm tên công việc"
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    />
                </div>
                <select
                    className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none hover:bg-gray-100 shrink-0"
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <select
                    className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none hover:bg-gray-100 shrink-0 max-w-[160px] truncate"
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
                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap ml-auto">
                    {isProjectLead && isProjectInProgress && (
                        <button
                            type="button"
                            onClick={handleOpenStaffingModal}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-[#F38820] border border-orange-200 hover:bg-orange-100 rounded-lg transition-all active:scale-95 shadow-sm font-medium text-xs sm:text-sm whitespace-nowrap"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Yêu cầu thêm người</span>
                        </button>
                    )}
                    {(isAdmin || isProjectLead) && isProjectInProgress && (
                        <button
                            type="button"
                            onClick={handleToggleUnassignMode}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all active:scale-95 shadow-sm font-medium text-xs sm:text-sm whitespace-nowrap",
                                selectionMode === 'unassign'
                                    ? "bg-red-600 text-white hover:bg-red-700"
                                    : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                            )}
                        >
                            <UserMinus className="w-4 h-4" />
                            <span>{selectionMode === 'unassign' ? 'Huỷ xoá phân công' : 'Xoá phân công'}</span>
                        </button>
                    )}
                    {canCreateProjectWork && isProjectInProgress && (
                        <button
                            type="button"
                            onClick={() => setShowAddServiceModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-sm font-medium text-xs sm:text-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm dịch vụ</span>
                        </button>
                    )}
                </div>
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
                            <th className="px-6 py-4 font-medium text-center">Hành động</th>
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
                                                colSpan={7}
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
                                                onClick={() => navigate(`/tasks/${task.id}`)}
                                                className={cn(
                                                    "transition-colors cursor-pointer",
                                                    task.isSupportRequested ? "bg-red-50/50 hover:bg-red-50 border-l-4 border-l-red-500" :
                                                    Number(task.spentAmount || 0) > Number(task.cost || 0) ? "bg-red-50/40 hover:bg-red-50 border-l-4 border-l-red-400" :
                                                    task.isExtra ? "bg-amber-50/50 hover:bg-amber-50 border-l-4 border-l-amber-400" :
                                                    "hover:bg-blue-50/40"
                                                )}
                                            >
                                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
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
                                                        canEdit={isProjectInProgress && task.status !== 'ON_HOLD' && (isAdminOrBOD || isProjectLead)}
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
                                                    {getStatusBadge(task.status)}
                                                </td>
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap">
                                                        {task.status === 'NOT_STARTED' &&
                                                            (!task.parentTaskId || task.subtaskPlanStatus === 'APPROVED') &&
                                                            (isSameUser(currentUserId, task.assigneeId) ||
                                                                isSameUser(currentUserId, task.assignee?.id) ||
                                                                isSameUser(currentUserId, task.helperId) ||
                                                                isSameUser(currentUserId, task.helper?.id)) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartTask(task)}
                                                                    disabled={isStartingTask && startingTaskId === task.id}
                                                                    className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 text-xs font-bold uppercase disabled:opacity-60"
                                                                >
                                                                    <Play className="h-3.5 w-3.5" />
                                                                    {isStartingTask && startingTaskId === task.id ? 'Đang bắt đầu...' : 'Bắt đầu công việc'}
                                                                </button>
                                                            )}

                                                        {isProjectInProgress && canManageTaskAssignment(task) &&
                                                            (task.status === 'PENDING' || task.status === 'AWAITING_SUPPORT') && (
                                                            <button
                                                                onClick={() => setAssigningTask(task)}
                                                                className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 text-xs font-bold uppercase"
                                                            >
                                                                Phân công
                                                            </button>
                                                        )}

                                                        {/* Original Team Lead Actions */}
                                                        {isProjectInProgress && canManageTaskAssignment(task) && ['NOT_STARTED', 'DOING', 'REWORKING', 'OVERDUE', 'REJECTED'].includes(task.status) && (
                                                            <button
                                                                onClick={() => setAssigningTask(task)}
                                                                className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase"
                                                            >
                                                                Đổi người
                                                            </button>
                                                        )}

                                                        {/* Deprecated cross-team support buttons */}
                                                        {/*
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
                                                        */}

                                                        {isProjectInProgress && (isProjectLead || isAdminOrBOD) && task.status === 'INTERNAL_COMPLETED' && (
                                                            <button
                                                                onClick={() => handleCustomerApprove(task.id)}
                                                                disabled={isApprovingByCustomer && approvingTaskId === task.id}
                                                                className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase disabled:opacity-60"
                                                            >
                                                                {isApprovingByCustomer && approvingTaskId === task.id ? 'Đang duyệt...' : 'Khách hàng duyệt'}
                                                            </button>
                                                        )}

                                                        {isProjectInProgress &&
                                                            task.status !== 'ON_HOLD' &&
                                                            task.supportRequestType === 'STAFFING' &&
                                                            task.isSupportRequested &&
                                                            !task.isSupportAccepted &&
                                                            (isSameUser(task.supportLeadId, currentUserId) || isProjectManager || hasStaffingAdminOverride) && (
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

                                                        {isProjectInProgress && isProjectLead && !['COMPLETED', 'CANCELLED'].includes(task.status) && (
                                                            task.supportRequestType === 'STAFFING' && task.isSupportRequested && !task.isSupportAccepted ? (
                                                                <span className="inline-flex whitespace-nowrap items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-xs font-medium border border-amber-200">
                                                                    <UserPlus className="w-3.5 h-3.5" />
                                                                    Chờ duyệt thêm người
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setStaffingTaskId(task.id);
                                                                        setIsRowSpecificStaffing(true);
                                                                        setStaffingNote('');
                                                                        setIsStaffingModalOpen(true);
                                                                    }}
                                                                    title="Yêu cầu PM bổ sung nhân sự cho công việc này"
                                                                    className="inline-flex whitespace-nowrap items-center gap-1 px-2.5 py-1.5 bg-orange-50 text-[#F38820] rounded-xl hover:bg-[#F38820] hover:text-white transition-all active:scale-95 text-xs font-bold"
                                                                >
                                                                    <UserPlus className="w-3.5 h-3.5" />
                                                                    Yêu cầu thêm người
                                                                </button>
                                                            )
                                                        )}

                                                        <TaskReminderButton
                                                            task={task}
                                                            isProjectInProgress={isProjectInProgress}
                                                            canManage={canManageAllTasks}
                                                        />

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
                                <td colSpan={8} className="px-6 py-10 text-center text-gray-400 italic">
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
                    onSuccess={() => {
                        const assignedIds = Array.isArray(assigningTask)
                            ? assigningTask.map(t => t.id)
                            : [assigningTask?.id];
                        setSelectedTasks(prev => prev.filter(id => !assignedIds.includes(id)));
                        if (selectionMode === 'unassign') setSelectionMode('assign');
                    }}
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
                isOpen={isStaffingModalOpen}
                onClose={() => {
                    setIsStaffingModalOpen(false);
                    setIsRowSpecificStaffing(false);
                }}
                title="Yêu cầu PM bổ sung nhân sự"
                className="max-w-lg"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        PM sẽ nhận được thông báo và thêm nhân sự vào đội dự án để hỗ trợ thực hiện công việc.
                    </p>
                    {!isRowSpecificStaffing ? (
                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                Công việc liên quan <span className="text-xs font-normal text-gray-400">(Không bắt buộc)</span>
                            </label>
                            <select
                                value={staffingTaskId}
                                onChange={(e) => setStaffingTaskId(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            >
                                <option value="">-- Yêu cầu chung cho dự án (Không gắn công việc) --</option>
                                {tasks
                                    .filter(t => t.performerType === 'INTERNAL' || !t.performerType)
                                    .map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.code ? `[${t.code}] ` : ''}{t.nickname || t.name || 'Công việc'} ({TASK_STATUS_LABELS[t.status] || t.status})
                                        </option>
                                    ))}
                            </select>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3">
                            <span className="text-xs font-medium text-gray-500 block mb-1">Công việc yêu cầu bổ sung nhân sự:</span>
                            <span className="text-sm font-bold text-gray-800">
                                {(() => {
                                    const target = tasks.find(t => t.id === staffingTaskId);
                                    return target ? `${target.code ? `[${target.code}] ` : ''}${target.nickname || target.name || 'Công việc'}` : 'Công việc đã chọn';
                                })()}
                            </span>
                        </div>
                    )}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-gray-700">
                            Ghi chú / Vị trí cần bổ sung <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={staffingNote}
                            onChange={(e) => setStaffingNote(e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            placeholder="Nhập lý do cần thêm nhân sự, vị trí hoặc kỹ năng cần bổ sung..."
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsStaffingModalOpen(false)}>Hủy</Button>
                        <Button
                            onClick={handleSendStaffingRequest}
                            isLoading={isRequestingStaffing || isRequestingProjectStaffing}
                            disabled={!staffingNote.trim()}
                            className="bg-[#F38820] text-white hover:bg-[#D97010] focus:ring-orange-500 disabled:opacity-50"
                        >
                            Gửi cho PM
                        </Button>
                    </div>
                </div>
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
