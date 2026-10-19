import { useState, useMemo, useEffect, Fragment, useRef } from 'react';
import Select from 'react-select';
import { Calendar, Users, FileText, Search, UserPlus, UserMinus, Plus, AlertCircle, ChevronRight, ChevronDown, Play, X, Clock, Archive } from 'lucide-react';
import { TaskAssignModal } from './TaskAssignModal';
import { AddProjectServiceModal } from './AddProjectServiceModal';
import { useNavigate } from 'react-router-dom';
import { useGetTeamMembersQuery } from '../../../api/teams';
import { useGetMyNotificationsQuery, useMarkAsReadMutation } from '../../../api/notifications';
import { useRequestProjectStaffingMutation } from '../../../api/projects';
import { useApproveByCustomerMutation, useBulkStartTasksMutation, useBulkUnassignTasksMutation, useRequestSupportMutation, useRespondToSupportMutation, useReturnSupportMutation, useRequestReturnSupportMutation, useRequestTaskStaffingMutation, useRespondTaskStaffingMutation, useStartTaskMutation } from '../../../api/tasks';
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
import { getTaskDisplayName } from '../../../utils/taskName';
import { canDecideTaskOutcome } from '../../../utils/taskOutcomeAuthorization';

const filterSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '38px',
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#F38820' : '#E5E7EB',
        backgroundColor: state.isFocused ? '#FFFFFF' : '#F9FAFB',
        boxShadow: state.isFocused ? '0 0 0 1px #F38820' : 'none',
        cursor: 'pointer',
        fontSize: '0.875rem',
        transition: 'all 0.15s ease',
        '&:hover': {
            borderColor: state.isFocused ? '#F38820' : '#D1D5DB',
            backgroundColor: state.isFocused ? '#FFFFFF' : '#F3F4F6'
        }
    }),
    valueContainer: (base) => ({
        ...base,
        minHeight: '36px',
        padding: '2px 6px',
        gap: '2px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap'
    }),
    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
        color: '#1F2937'
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    indicatorsContainer: (base) => ({
        ...base,
        height: '36px',
        display: 'flex',
        alignItems: 'center'
    }),
    dropdownIndicator: (base) => ({
        ...base,
        color: '#9CA3AF',
        padding: '0 6px'
    }),
    clearIndicator: (base) => ({
        ...base,
        color: '#9CA3AF',
        padding: '0 4px',
        cursor: 'pointer',
        '&:hover': {
            color: '#EF4444'
        }
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: '#FFF7ED',
        borderRadius: '0.375rem',
        border: '1px solid #FED7AA',
        margin: '1px'
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: '#C2410C',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '1px 5px'
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: '#F38820',
        cursor: 'pointer',
        padding: '0 3px',
        borderRadius: '0 0.375rem 0.375rem 0',
        '&:hover': {
            backgroundColor: '#FFEDD5',
            color: '#DC2626'
        }
    }),
    singleValue: (base) => ({
        ...base,
        color: '#4B5563',
        fontSize: '0.875rem',
        fontWeight: 500
    }),
    placeholder: (base) => ({
        ...base,
        color: '#6B7280',
        fontSize: '0.875rem',
        fontWeight: 500,
        whiteSpace: 'nowrap'
    }),
    menuPortal: (base) => ({
        ...base,
        zIndex: 9999
    }),
    menu: (base) => ({
        ...base,
        zIndex: 9999,
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #E5E7EB'
    }),
    menuList: (base) => ({
        ...base,
        maxHeight: '240px',
        padding: '4px'
    }),
    option: (base, state) => ({
        ...base,
        fontSize: '0.875rem',
        borderRadius: '0.375rem',
        padding: '7px 10px',
        margin: '1px 0',
        cursor: 'pointer',
        backgroundColor: state.isSelected ? '#FFF7ED' : state.isFocused ? '#F3F4F6' : 'transparent',
        color: state.isSelected ? '#F38820' : '#374151',
        fontWeight: state.isSelected ? 600 : 400,
        ':active': {
            backgroundColor: '#FFEDD5',
            color: '#C2410C'
        }
    })
};

export const TaskTable = ({
    tasks = [],
    project,
    isClosed: propIsClosed,
    isOnHold: propIsOnHold,
    bulkAction = 'assign',
    emptyMessage = 'Không tìm thấy công việc nào'
}) => {
    const navigate = useNavigate();
    const { data: user } = useGetMeQuery();
    const teamId = project?.team?.id;
    const { data: members = [] } = useGetTeamMembersQuery(teamId, { skip: !teamId });
    const [requestSupport] = useRequestSupportMutation();
    const [respondToSupport] = useRespondToSupportMutation();
    const [returnSupport] = useReturnSupportMutation();
    const [requestReturnSupport] = useRequestReturnSupportMutation();
    const [bulkUnassignTasks, { isLoading: isUnassigning }] = useBulkUnassignTasksMutation();
    const [bulkStartTasks, { isLoading: isBulkStarting }] = useBulkStartTasksMutation();
    const [approveByCustomer, { isLoading: isApprovingByCustomer }] = useApproveByCustomerMutation();
    const [requestTaskStaffing, { isLoading: isRequestingStaffing }] = useRequestTaskStaffingMutation();
    const [respondTaskStaffing, { isLoading: isRespondingTaskStaffing }] = useRespondTaskStaffingMutation();
    const [requestProjectStaffing, { isLoading: isRequestingProjectStaffing }] = useRequestProjectStaffingMutation();
    const { data: notifications = [] } = useGetMyNotificationsQuery();
    const [markAsRead] = useMarkAsReadMutation();
    const [isProjectStaffingResolutionOpen, setIsProjectStaffingResolutionOpen] = useState(false);
    const [activeStaffingRequest, setActiveStaffingRequest] = useState(null);
    const [localStaffingRequests, setLocalStaffingRequests] = useState(() => {
        try {
            const key = `project_staffing_requests_${project?.id}`;
            const stored = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(stored) && stored.length > 0) return stored;
            const single = localStorage.getItem(`project_staffing_req_${project?.id}`);
            if (single) return [{ id: 'legacy_1', note: single, createdAt: new Date().toISOString() }];
            return [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            const key = `project_staffing_requests_${project?.id}`;
            const stored = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(stored) && stored.length > 0) {
                setLocalStaffingRequests(stored);
            } else {
                const single = localStorage.getItem(`project_staffing_req_${project?.id}`);
                setLocalStaffingRequests(single ? [{ id: 'legacy_1', note: single, createdAt: new Date().toISOString() }] : []);
            }
        } catch {
            setLocalStaffingRequests([]);
        }
    }, [project?.id]);

    const allStaffingRequests = useMemo(() => {
        const list = [];
        const seenKeys = new Set();

        // 1. Task-level staffing requests from tasks prop
        tasks.forEach(t => {
            if (t.supportRequestType === 'STAFFING' && t.isSupportRequested && !t.isSupportAccepted) {
                const key = `task_${t.id}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    list.push({
                        uniqueKey: key,
                        type: 'TASK',
                        taskId: t.id,
                        task: t,
                        targetName: `${t.code ? `[${t.code}] ` : ''}${t.nickname || t.name || 'Công việc'}`,
                        note: t.supportRequestNote || '',
                        createdAt: t.updatedAt || t.createdAt,
                    });
                }
            }
        });

        // 2. Project-level staffing requests from unread notifications
        notifications.forEach(n => {
            if (n.type === 'TASK_STAFFING_REQUEST' && !n.isRead) {
                const isProjectLevel = String(n.relatedEntityId) === String(project?.id) ||
                    n.link === `/projects/${project?.id}` ||
                    n.link?.endsWith(`/projects/${project?.id}`);
                if (isProjectLevel) {
                    const key = `notif_${n.id}`;
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        const note = n.content ? n.content.replace(/^.*?Ghi chú:\s*/, '') : '';
                        list.push({
                            uniqueKey: key,
                            type: 'PROJECT',
                            notifId: n.id,
                            targetName: 'Yêu cầu cho toàn dự án',
                            note: note || project?.staffingRequestNote || '',
                            createdAt: n.createdAt,
                        });
                    }
                }
            }
        });

        // 3. Local requests from localStorage
        localStaffingRequests.forEach(req => {
            if (req.note && !list.some(item => item.note === req.note)) {
                const key = `local_${req.id}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    list.push({
                        uniqueKey: key,
                        type: 'PROJECT',
                        localId: req.id,
                        targetName: 'Yêu cầu cho toàn dự án',
                        note: req.note,
                        createdAt: req.createdAt,
                    });
                }
            }
        });

        // 4. Fallback legacy project.isStaffingRequested
        if (project?.isStaffingRequested && !list.some(item => item.type === 'PROJECT')) {
            list.push({
                uniqueKey: `project_${project.id}`,
                type: 'PROJECT',
                targetName: 'Yêu cầu cho toàn dự án',
                note: project.staffingRequestNote || '',
            });
        }

        return list;
    }, [tasks, notifications, project, localStaffingRequests]);
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
    const isClosed = propIsClosed ?? ['COMPLETED', 'CANCELLED'].includes(project?.status);
    const isOnHold = propIsOnHold ?? (project?.status === 'ON_HOLD' || Boolean(project?.isOnHold));
    const canManageAllTasks = !isClosed && !isOnHold && (isAdminOrBOD || isProjectLead || isProjectManager);
    const isPersonalView = bulkAction === 'start';
    const isSupportLead = tasks.some(t => isSameUser(t.supportLeadId, currentUserId));
    const isHelper = tasks.some(t => isSameUser(t.helperId, currentUserId));
    const isAssignee = tasks.some(t => isSameUser(t.assigneeId, currentUserId) || isSameUser(t.assignee?.id, currentUserId));
    const isTeamMember = Boolean(project?.team?.members?.some(m => isSameUser(m.user?.id, currentUserId)));

    const canSeeTable = true;
    const canCreateProjectWork = !isClosed && !isOnHold && (user?.role === 'PM' || user?.role === 'ADMIN');
    const isProjectInProgress = !isClosed && !isOnHold && (project?.status === 'IN_PROGRESS' || project?.status === 'CONFIRMED');

    const hasMainPerformer = (task) => Boolean(
        task?.assigneeId || task?.assignee?.id || task?.vendor || task?.vendorId || task?.performerType === 'VENDOR'
    );

    const canManageTaskAssignment = (task) => {
        if (isClosed || isOnHold) return false;
        if (isAdmin) return true;
        if (!isProjectLead) return false;
        if (!hasMainPerformer(task)) return true;
        return !task?.assignerId || isSameUser(task.assignerId, currentUserId);
    };

    const [filter, setFilter] = useState({
        statuses: [],
        search: '',
        assigneeIds: []
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
    const dragSelectionRef = useRef({ isDragging: false, checked: true, touchedTaskIds: new Set() });

    const applyTaskSelection = (taskId, checked) => {
        setSelectedTasks(prev => {
            const hasTask = prev.includes(taskId);
            if (checked) return hasTask ? prev : [...prev, taskId];
            return hasTask ? prev.filter(id => id !== taskId) : prev;
        });
    };

    const handleTaskCheckboxMouseDown = (event, task) => {
        if (!isTaskSelectable(task)) return;
        event.preventDefault();
        event.stopPropagation();

        const nextChecked = !selectedTasks.includes(task.id);
        dragSelectionRef.current = {
            isDragging: true,
            checked: nextChecked,
            touchedTaskIds: new Set([task.id])
        };
        applyTaskSelection(task.id, nextChecked);
    };

    const handleTaskCheckboxMouseEnter = (task) => {
        const dragState = dragSelectionRef.current;
        if (!dragState.isDragging || !isTaskSelectable(task) || dragState.touchedTaskIds.has(task.id)) return;

        dragState.touchedTaskIds.add(task.id);
        applyTaskSelection(task.id, dragState.checked);
    };

    const stopTaskCheckboxDrag = () => {
        if (!dragSelectionRef.current.isDragging) return;
        dragSelectionRef.current = { isDragging: false, checked: true, touchedTaskIds: new Set() };
    };

    useEffect(() => {
        window.addEventListener('mouseup', stopTaskCheckboxDrag);
        return () => window.removeEventListener('mouseup', stopTaskCheckboxDrag);
    }, []);

    const handleStartTask = async (task) => {
        if (isClosed) {
            toast.warning('Dự án đã đóng — không thể bắt đầu công việc');
            return;
        }
        if (isOnHold) {
            toast.warning('Dự án đang tạm dừng — không thể bắt đầu công việc');
            return;
        }
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

    const handleBulkStart = async () => {
        if (isClosed) {
            toast.warning('Dự án đã đóng — không thể bắt đầu công việc');
            return;
        }
        if (isOnHold) {
            toast.warning('Dự án đang tạm dừng — không thể bắt đầu công việc');
            return;
        }
        if (selectedTasks.length === 0) return;
        if (!window.confirm(`Bắt đầu ${selectedTasks.length} công việc đã chọn?`)) return;

        try {
            const result = await bulkStartTasks({
                projectId: project.id,
                taskIds: selectedTasks
            }).unwrap();
            const successCount = result?.started?.length || 0;
            const skipped = result?.skipped || [];

            if (successCount > 0) {
                toast.success(`Đã bắt đầu ${successCount} công việc`);
            }
            if (skipped.length > 0) {
                const firstReason = skipped[0]?.reason ? `: ${skipped[0].reason}` : '';
                toast.warning(`Đã bỏ qua ${skipped.length} công việc${firstReason}`);
            }
            setSelectedTasks([]);
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể bắt đầu các công việc đã chọn');
        }
    };

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const handleOpenStaffingModal = () => {
        if (isClosed) {
            toast.warning('Dự án đã đóng — không thể yêu cầu bổ sung nhân sự');
            return;
        }
        if (isOnHold) {
            toast.warning('Dự án đang tạm dừng — không thể yêu cầu bổ sung nhân sự');
            return;
        }
        if (selectedTasks.length === 1) {
            setStaffingTaskId(selectedTasks[0]);
        } else {
            setStaffingTaskId('');
        }
        setIsRowSpecificStaffing(false);
        setStaffingNote('');
        setIsStaffingModalOpen(true);
    };

    const handleOpenResolveStaffing = (req) => {
        if (isClosed) {
            toast.warning('Dự án đã đóng — không thể bổ sung nhân sự');
            return;
        }
        if (isOnHold) {
            toast.warning('Dự án đang tạm dừng — không thể bổ sung nhân sự');
            return;
        }
        setActiveStaffingRequest(req);
        if (req.type === 'TASK' && req.task) {
            setStaffingTask(req.task);
            setIsStaffingResolutionOpen(true);
        } else {
            setIsProjectStaffingResolutionOpen(true);
        }
    };

    const handleRejectRequest = async (req) => {
        if (isClosed) {
            toast.warning('Dự án đã đóng — không thể thao tác');
            return;
        }
        if (isOnHold) {
            toast.warning('Dự án đang tạm dừng — không thể thao tác');
            return;
        }
        const isLeadOnly = isProjectLead && !isProjectManager && !hasStaffingAdminOverride;
        const confirmMsg = isLeadOnly
            ? `Bạn có chắc chắn muốn hủy yêu cầu bổ sung nhân sự cho "${req.targetName}"?`
            : `Bạn có chắc chắn muốn từ chối yêu cầu bổ sung nhân sự cho "${req.targetName}"?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            if (req.type === 'TASK' && req.taskId) {
                await respondTaskStaffing({
                    id: req.taskId,
                    projectId: project?.id,
                    action: 'REJECT'
                }).unwrap();
            }
            if (req.notifId) {
                try {
                    await markAsRead(req.notifId).unwrap();
                } catch { }
            }
            if (req.localId || req.type === 'PROJECT') {
                try {
                    const key = `project_staffing_requests_${project?.id}`;
                    const existing = JSON.parse(localStorage.getItem(key) || '[]');
                    const filtered = existing.filter(item => item.id !== req.localId && item.note !== req.note);
                    localStorage.setItem(key, JSON.stringify(filtered));
                    setLocalStaffingRequests(filtered);
                    localStorage.removeItem(`project_staffing_req_${project?.id}`);
                } catch { }
            }
            toast.success(isLeadOnly ? 'Đã hủy yêu cầu bổ sung nhân sự' : 'Đã từ chối yêu cầu bổ sung nhân sự');
        } catch (error) {
            toast.error(error?.data?.message || 'Có lỗi xảy ra khi xử lý yêu cầu');
        }
    };

    const handleSendStaffingRequest = async () => {
        if (isClosed) {
            toast.warning('Dự án đã đóng — không thể gửi yêu cầu nhân sự');
            return;
        }
        if (isOnHold) {
            toast.warning('Dự án đang tạm dừng — không thể gửi yêu cầu nhân sự');
            return;
        }
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
                try {
                    const key = `project_staffing_requests_${project?.id}`;
                    const existing = JSON.parse(localStorage.getItem(key) || '[]');
                    const newReq = {
                        id: 'req_' + Date.now(),
                        note: staffingNote.trim(),
                        createdAt: new Date().toISOString()
                    };
                    existing.push(newReq);
                    localStorage.setItem(key, JSON.stringify(existing));
                    setLocalStaffingRequests(existing);
                    localStorage.setItem(`project_staffing_req_${project?.id}`, staffingNote.trim());
                } catch { }
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

    const isSubtaskPlanStartable = (task) => !task.parentTaskId ||
        !task.parentTask?.subtaskPlanStatus ||
        task.parentTask.subtaskPlanStatus === 'APPROVED';

    const isTaskStartable = (task) => isProjectInProgress &&
        task.status === 'NOT_STARTED' &&
        isSameUser(task.assigneeId || task.assignee?.id, currentUserId) &&
        isSubtaskPlanStartable(task);

    const isTaskSelectable = bulkAction === 'start'
        ? isTaskStartable
        : selectionMode === 'unassign'
            ? isTaskUnassignable
            : isTaskBatchAssignable;

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
        if (isClosed) {
            toast.warning('Dự án đã đóng — không thể xoá phân công');
            return;
        }
        if (isOnHold) {
            toast.warning('Dự án đang tạm dừng — không thể xoá phân công');
            return;
        }
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
        if (isClosed || isOnHold) {
            toast.warning(isClosed ? 'Dự án đã đóng — không thể xử lý yêu cầu' : 'Dự án đang tạm dừng — không thể xử lý yêu cầu');
            return;
        }
        try {
            await respondToSupport({ id: taskId, action: response, projectId: project.id }).unwrap();
            toast.success(response === 'ACCEPT' ? 'Đã đồng ý hỗ trợ' : 'Đã từ chối hỗ trợ');
        } catch (error) {
            toast.error('Có lỗi xảy ra khi phản hồi yêu cầu');
        }
    };

    const handleReturnSupport = async (taskId) => {
        if (isClosed || isOnHold) {
            toast.warning(isClosed ? 'Dự án đã đóng — không thể trả lại task' : 'Dự án đang tạm dừng — không thể trả lại task');
            return;
        }
        if (!window.confirm('Bạn có chắc chắn muốn trả lại task này cho team chính?')) return;
        try {
            await returnSupport({ id: taskId, projectId: project.id }).unwrap();
            toast.success('Đã trả lại task thành công');
        } catch (error) {
            toast.error(error.data?.message || 'Có lỗi xảy ra khi trả lại task');
        }
    };

    const handleRequestReturnSupport = async (taskId) => {
        if (isClosed || isOnHold) {
            toast.warning(isClosed ? 'Dự án đã đóng — không thể yêu cầu' : 'Dự án đang tạm dừng — không thể yêu cầu');
            return;
        }
        try {
            await requestReturnSupport({ id: taskId, note: "Yêu cầu trả lại task", projectId: project.id }).unwrap();
            toast.success('Đã gửi yêu cầu hỗ trợ hoàn thành');
        } catch (error) {
            toast.error(error.data?.message || 'Có lỗi xảy ra khi yêu cầu');
        }
    };

    const handleCustomerApprove = async (taskId) => {
        if (isClosed) {
            toast.warning('Dự án đã đóng — không thể duyệt công việc');
            return;
        }
        if (isOnHold) {
            toast.warning('Dự án đang tạm dừng — không thể duyệt công việc');
            return;
        }
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


    const statusOptions = useMemo(() => [
        ...Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
            value,
            label
        }))
    ], []);

    const assigneeOptions = useMemo(() => {
        const map = new Map();
        members.forEach(member => {
            if (member.user?.id) {
                map.set(member.user.id.toString(), member.user.fullName || member.user.name || 'Chưa có tên');
            }
        });
        tasks.forEach(task => {
            const u = task.assignee;
            if (u?.id && !map.has(u.id.toString())) {
                map.set(u.id.toString(), u.fullName || u.name || 'Chưa có tên');
            }
        });
        return Array.from(map.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
    }, [members, tasks]);

    const selectedStatuses = useMemo(() => {
        if (!filter.statuses || filter.statuses.length === 0) return [];
        return statusOptions.filter(opt => filter.statuses.includes(opt.value));
    }, [statusOptions, filter.statuses]);

    const selectedAssignees = useMemo(() => {
        if (!filter.assigneeIds || filter.assigneeIds.length === 0) return [];
        return assigneeOptions.filter(opt => filter.assigneeIds.includes(opt.value));
    }, [assigneeOptions, filter.assigneeIds]);

    const filteredTasks = useMemo(() => {
        const filtered = tasks.filter(task => {
            const search = filter.search.toLowerCase();
            const matchesSearch = task.name?.toLowerCase().includes(search) ||
                task.nickname?.toLowerCase().includes(search) ||
                task.code?.toLowerCase().includes(search) ||
                task.parentTask?.name?.toLowerCase().includes(search) ||
                task.parentTask?.nickname?.toLowerCase().includes(search) ||
                task.parentTask?.code?.toLowerCase().includes(search);
            const matchesStatus = (!filter.statuses || filter.statuses.length === 0) ||
                filter.statuses.includes(task.status);
            const matchesAssignee = (!filter.assigneeIds || filter.assigneeIds.length === 0) ||
                (task.assigneeId && filter.assigneeIds.includes(task.assigneeId.toString())) ||
                (task.assignee?.id && filter.assigneeIds.includes(task.assignee?.id.toString()));
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
        <div className="space-y-4">
            {/* Banner trạng thái tạm dừng */}
            {isOnHold && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white bg-amber-500">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-amber-900">
                                Dự án đang tạm dừng — Chế độ chỉ đọc
                            </p>
                            <p className="mt-1 text-xs text-amber-700">
                                Mọi hoạt động phân công, bắt đầu công việc và cập nhật tiến độ đều tạm ngưng cho đến khi dự án được mở lại.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Banner trạng thái đã đóng */}
            {isClosed && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white bg-slate-600">
                            <Archive className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800">
                                Dự án đã đóng — Chế độ lưu trữ chỉ đọc
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                                Toàn bộ công việc và dữ liệu dự án đã được lưu trữ ở chế độ Chỉ đọc (Read-only).
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Khối hiển thị yêu cầu bổ sung nhân sự */}
            {!isPersonalView && (isProjectManager || hasStaffingAdminOverride || isProjectLead) && allStaffingRequests.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                <UserPlus className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-amber-950 text-sm">
                                Yêu cầu bổ sung nhân sự ({allStaffingRequests.length})
                            </span>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                            {(isProjectManager || hasStaffingAdminOverride) ? 'Chờ PM xử lý' : 'Đang chờ PM xử lý'}
                        </span>
                    </div>

                    <div className="space-y-2">
                        {allStaffingRequests.map((req) => (
                            <div
                                key={req.uniqueKey}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-200/80 bg-white/90 p-3 shadow-xs transition-all hover:border-amber-300"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-gray-900 text-sm">
                                            {req.targetName}
                                        </span>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                            req.type === 'TASK'
                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : "bg-purple-50 text-purple-700 border-purple-200"
                                        )}>
                                            {req.type === 'TASK' ? 'Công việc' : 'Toàn dự án'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-amber-900">
                                        <span className="font-semibold text-gray-600">Nội dung cần bổ sung: </span>
                                        {req.note ? `"${req.note}"` : 'Không có ghi chú cụ thể'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    {(isProjectManager || hasStaffingAdminOverride) && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenResolveStaffing(req)}
                                                disabled={isClosed || isOnHold}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                <UserPlus className="h-3.5 w-3.5" />
                                                <span>Bổ sung nhân sự</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRejectRequest(req)}
                                                disabled={isRespondingTaskStaffing || isClosed || isOnHold}
                                                className="inline-flex items-center rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                Từ chối
                                            </button>
                                        </>
                                    )}
                                    {isProjectLead && !isProjectManager && !hasStaffingAdminOverride && (
                                        <button
                                            type="button"
                                            onClick={() => handleRejectRequest(req)}
                                            disabled={isRespondingTaskStaffing || isClosed || isOnHold}
                                            className="inline-flex items-center rounded-xl border border-red-300 bg-white px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                                            title="Hủy yêu cầu bổ sung nhân sự này"
                                        >
                                            Hủy yêu cầu
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ">
                {/* Filters & Actions */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-2.5 min-w-0">
                    <div className="relative flex-1 min-w-[140px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm tên công việc"
                            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#F38820] focus:bg-white transition-all h-[38px]"
                            value={filter.search}
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        />
                        {filter.search && (
                            <button
                                type="button"
                                onClick={() => setFilter({ ...filter, search: '' })}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                                title="Xóa tìm kiếm"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="min-w-[180px] max-w-[280px] shrink-0">
                        <Select
                            aria-label="Lọc theo trạng thái"
                            options={statusOptions}
                            value={selectedStatuses}
                            onChange={(opts) => setFilter(prev => ({ ...prev, statuses: opts ? opts.map(o => o.value) : [] }))}
                            isMulti
                            isSearchable
                            isClearable
                            closeMenuOnSelect={false}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            noOptionsMessage={() => 'Không tìm thấy trạng thái'}
                            placeholder="Tất cả trạng thái"
                            styles={filterSelectStyles}
                        />
                    </div>
                    {!isPersonalView && <div className="min-w-[190px] max-w-[300px] shrink-0">
                        <Select
                            aria-label="Lọc theo nhân sự"
                            options={assigneeOptions}
                            value={selectedAssignees}
                            onChange={(opts) => setFilter(prev => ({ ...prev, assigneeIds: opts ? opts.map(o => o.value) : [] }))}
                            isMulti
                            isSearchable
                            isClearable
                            closeMenuOnSelect={false}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            noOptionsMessage={() => 'Không tìm thấy nhân sự'}
                            placeholder="Tất cả nhân sự"
                            styles={filterSelectStyles}
                        />
                    </div>}
                    <div className="flex items-center gap-2 shrink-0 whitespace-nowrap ml-auto">
                        {!isPersonalView && isProjectLead && isProjectInProgress && (
                            <button
                                type="button"
                                onClick={handleOpenStaffingModal}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-[#F38820] border border-orange-200 hover:bg-orange-100 rounded-lg transition-all active:scale-95 shadow-sm font-medium text-xs sm:text-sm whitespace-nowrap"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Yêu cầu thêm người</span>
                            </button>
                        )}
                        {bulkAction !== 'start' && (isAdmin || isProjectLead) && isProjectInProgress && (
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
                        {!isPersonalView && canCreateProjectWork && isProjectInProgress && (
                            <button
                                type="button"
                                onClick={() => setShowAddServiceModal(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all active:scale-95 shadow-sm font-medium text-xs sm:text-sm whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Thêm dịch vụ</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className={cn("w-full text-sm text-left", isPersonalView ? "min-w-[900px]" : "min-w-[1450px]")}>
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-center">
                                    <input
                                        type="checkbox"
                                        className={cn(
                                            "w-4 h-4 border-gray-300 rounded cursor-pointer",
                                            selectionMode === 'unassign' ? "text-red-600 focus:ring-red-500" : "text-orange-500 accent-[#F38820] focus:ring-orange-400"
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
                                {!isPersonalView && renderHeader('Bên thực hiện')}
                                {!isPersonalView && renderHeader('Người thực hiện', 'center')}
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
                                                        className="w-4 h-4 text-orange-500 accent-[#F38820] border-gray-300 rounded focus:ring-orange-400 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
                                                    colSpan={isPersonalView ? 5 : 7}
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
                                                            task.isExtra ? "bg-amber-50/50 hover:bg-amber-50 border-l-4 border-l-amber-400" :
                                                                "hover:bg-orange-50/20"
                                                    )}
                                                >
                                                    <td
                                                        className="px-6 py-4 text-center select-none"
                                                        onClick={(e) => e.stopPropagation()}
                                                        onMouseDown={(e) => handleTaskCheckboxMouseDown(e, task)}
                                                        onMouseEnter={() => handleTaskCheckboxMouseEnter(task)}
                                                        onMouseUp={stopTaskCheckboxDrag}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className={cn(
                                                                "w-4 h-4 border-gray-300 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
                                                                selectionMode === 'unassign' ? "text-red-600 focus:ring-red-500" : "text-orange-500 accent-[#F38820] focus:ring-orange-400"
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
                                                        {task.parentTaskId && task.parentTask && (
                                                            <p
                                                                className="mt-1 truncate text-xs text-gray-500"
                                                                title={`${task.parentTask.code || '---'} - ${getTaskDisplayName(task.parentTask)}`}
                                                            >
                                                                Công việc cha: <span className="font-mono">{task.parentTask.code || '---'}</span>
                                                                {' - '}{getTaskDisplayName(task.parentTask)}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className={cn("text-xs uppercase", getRemainingTime(task.plannedEndDate, task.status).color)}>
                                                            {getRemainingTime(task.plannedEndDate, task.status).text}
                                                        </div>
                                                    </td>
                                                    {!isPersonalView && (
                                                        <td className="px-6 py-4 uppercase text-xs font-semibold text-gray-500">
                                                            {task.performerType || '---'}
                                                        </td>
                                                    )}
                                                    {!isPersonalView && (
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="font-medium text-gray-700">{task.assignee?.fullName || task.vendorId || '---'}</span>
                                                        </td>
                                                    )}
                                                    <td className="px-3 py-2 text-center w-fit">
                                                        {getStatusBadge(task.status)}
                                                    </td>
                                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap">
                                                            {task.status === 'NOT_STARTED' &&
                                                                isSubtaskPlanStartable(task) &&
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

                                                            {!isPersonalView && isProjectInProgress && canManageTaskAssignment(task) &&
                                                                (task.status === 'PENDING' || task.status === 'AWAITING_SUPPORT') && (
                                                                    <button
                                                                        onClick={() => setAssigningTask(task)}
                                                                        className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all active:scale-95 text-xs font-bold uppercase shadow-sm"
                                                                    >
                                                                        Phân công
                                                                    </button>
                                                                )}

                                                            {/* Original Team Lead Actions */}
                                                            {!isPersonalView && isProjectInProgress && canManageTaskAssignment(task) && ['NOT_STARTED', 'DOING', 'REWORKING', 'OVERDUE', 'REJECTED'].includes(task.status) && (
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

                                                            {!isPersonalView && isProjectInProgress && canDecideTaskOutcome(task, currentUserId, project) && task.status === 'INTERNAL_COMPLETED' && (
                                                                <button
                                                                    onClick={() => handleCustomerApprove(task.id)}
                                                                    disabled={isApprovingByCustomer && approvingTaskId === task.id}
                                                                    className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95 text-xs font-bold uppercase disabled:opacity-60"
                                                                >
                                                                    {isApprovingByCustomer && approvingTaskId === task.id ? 'Đang duyệt...' : 'Khách hàng duyệt'}
                                                                </button>
                                                            )}

                                                            {!isPersonalView && isProjectInProgress &&
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

                                                            {!isPersonalView && isProjectInProgress && isProjectLead && !['COMPLETED', 'CANCELLED'].includes(task.status) && (
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

                                                            {!isPersonalView && (
                                                                <TaskReminderButton
                                                                    task={task}
                                                                    isProjectInProgress={isProjectInProgress}
                                                                    canManage={canManageAllTasks}
                                                                />
                                                            )}

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
                                    <td colSpan={isPersonalView ? 6 : 8} className="px-6 py-10 text-center text-gray-400 italic">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
                    isClosed={isClosed}
                    isOnHold={isOnHold}
                />
            )}

            {showAddServiceModal && (
                <AddProjectServiceModal
                    isOpen={showAddServiceModal}
                    onClose={() => setShowAddServiceModal(false)}
                    project={project}
                    isClosed={isClosed}
                    isOnHold={isOnHold}
                />
            )}

            <ResolveStaffingRequestModal
                isOpen={isStaffingResolutionOpen}
                onClose={() => setIsStaffingResolutionOpen(false)}
                task={staffingTask}
                team={project?.team ? { ...project.team, members } : null}
                projectId={project?.id}
            />

            <ResolveStaffingRequestModal
                isOpen={isProjectStaffingResolutionOpen}
                onClose={() => {
                    setIsProjectStaffingResolutionOpen(false);
                    setActiveStaffingRequest(null);
                }}
                project={{ ...project, staffingRequestNote: activeStaffingRequest?.note }}
                team={project?.team ? { ...project.team, members } : null}
                projectId={project?.id}
                onSuccess={() => {
                    if (activeStaffingRequest?.notifId) {
                        markAsRead(activeStaffingRequest.notifId).catch(() => { });
                    }
                    try {
                        const key = `project_staffing_requests_${project?.id}`;
                        const existing = JSON.parse(localStorage.getItem(key) || '[]');
                        const filtered = existing.filter(item => item.id !== activeStaffingRequest?.localId && item.note !== activeStaffingRequest?.note);
                        localStorage.setItem(key, JSON.stringify(filtered));
                        setLocalStaffingRequests(filtered);
                        localStorage.removeItem(`project_staffing_req_${project?.id}`);
                    } catch { }
                    setActiveStaffingRequest(null);
                }}
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
                        <span className=" text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                            Đã chọn {selectedTasks.length} công việc
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {bulkAction === 'start' ? (
                            <button
                                onClick={handleBulkStart}
                                disabled={isBulkStarting}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <Play className="w-3.5 h-3.5" />
                                {isBulkStarting ? 'Đang bắt đầu...' : 'Bắt đầu công việc'}
                            </button>
                        ) : selectionMode === 'unassign' ? (
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
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-orange-500/20"
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
