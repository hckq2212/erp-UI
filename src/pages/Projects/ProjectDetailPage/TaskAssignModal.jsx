import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { X, Upload, Link as LinkIcon, Calendar, User, Users, FileText, Trash2, Plus, Info, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetTeamMembersQuery, useGetTeamsQuery, useLazyGetTeamsQuery, useLazyGetTeamMembersQuery } from '../../../api/teams';
import { useAssignTaskMutation, useAssignSupportTeamMutation, useRequestSupportMutation, useBulkAssignTasksMutation, useGetAssigneeDailyWorkloadQuery, useGetTaskQuery } from '../../../api/tasks';
import { formatDate, formatDateTimeISO } from '../../../utils/format';
import { useGetVendorsByJobQuery } from '../../../api/vendors';
import { uploadToCloudinary } from '../../../utils/cloudinary';
import { toast } from 'react-toastify';
import { getTaskDisplayName } from '../../../utils/taskName';
import { formatWorkloadLabel, getWorkloadColor, getWorkloadDisplayPercent } from '../../../utils/workload';
import { getTeamMemberRoles } from '../../../utils/teamMember';
import { TEAM_MEMBER_ROLE_LABELS } from '../../../utils/enums';

const WorkloadPill = ({ workload }) => {
    const percent = getWorkloadDisplayPercent(workload);

    return (
        <span
            className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-black text-white shadow-sm"
            style={{ backgroundColor: getWorkloadColor(percent) }}
        >
            {formatWorkloadLabel(workload)}
        </span>
    );
};

const WorkloadBar = ({ workload }) => {
    const percent = getWorkloadDisplayPercent(workload);

    return (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(percent, 200) / 2}%`, backgroundColor: getWorkloadColor(percent) }}
            />
        </div>
    );
};

const formatDateKey = (date) => {
    if (!date) return '';
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return '';

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey) => {
    if (!dateKey) return null;
    const [year, month, day] = dateKey.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

const getDailyWorkloadClassName = (workloadPercent = 0, taskCount = 0, isSelected = false, hasData = true) => {
    const selectedClass = isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : '';
    if (!hasData) return `bg-transparent text-slate-300 ${selectedClass}`;
    if (workloadPercent >= 100) return `bg-red-50 text-red-700 ${selectedClass}`;
    if (workloadPercent >= 70) return `bg-amber-50 text-amber-700 ${selectedClass}`;
    if (workloadPercent > 0 || taskCount > 0) return `bg-blue-50 text-blue-700 ${selectedClass}`;
    return `bg-slate-50 text-slate-500 ${selectedClass}`;
};

const buildMonthCells = (dateKey) => {
    const selectedDate = parseDateKey(dateKey) || new Date();
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = (firstDay.getDay() + 6) % 7;
    const cells = Array.from({ length: leadingBlanks }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push(formatDateKey(new Date(year, month, day)));
    }

    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
};

const getMonthRange = (date) => {
    const value = date && !Number.isNaN(date.getTime()) ? date : new Date();
    return {
        startDate: formatDateKey(new Date(value.getFullYear(), value.getMonth(), 1)),
        endDate: formatDateKey(new Date(value.getFullYear(), value.getMonth() + 1, 0))
    };
};

const DailyWorkloadCalendar = ({ data, isLoading, isError, selectedDateKey, onSelectDate }) => {
    const days = data?.days || [];
    const maxDailyWorkloadPercent = days.reduce(
        (max, day) => Math.max(max, Number(day.workloadPercent ?? 0)),
        0
    );
    const daysByDate = new Map(days.map(day => [day.date, day]));
    const monthCells = buildMonthCells(selectedDateKey || data?.endDate);
    const monthLabelDate = parseDateKey(selectedDateKey || data?.endDate) || new Date();
    const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-black text-slate-700">
                        Lịch task tháng {monthLabelDate.getMonth() + 1}/{monthLabelDate.getFullYear()}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                        Chọn ngày để đặt deadline
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2 py-2 text-xs font-bold text-slate-400">
                    <span className="h-3 w-3 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
                    Đang tải lịch task...
                </div>
            ) : isError ? (
                <p className="text-xs font-bold text-red-500">
                    Không tải được lịch task, bạn vẫn có thể phân công.
                </p>
            ) : (
                <div className="space-y-2">
                    <div className="grid grid-cols-7 gap-1">
                        {weekdayLabels.map(label => (
                            <div key={label} className="py-1 text-center text-[10px] font-black uppercase text-slate-400">
                                {label}
                            </div>
                        ))}
                        {monthCells.map((dateKey, index) => {
                            if (!dateKey) {
                                return <div key={`blank-${index}`} className="aspect-square" />;
                            }

                            const day = daysByDate.get(dateKey);
                            const taskCount = Number(day?.taskCount || 0);
                            const workloadPercent = Number(day?.workloadPercent ?? 0);
                            const hasData = daysByDate.has(dateKey);
                            const isSelected = dateKey === selectedDateKey;
                            const title = hasData
                                ? `${formatDate(dateKey)}: ${taskCount} task - ${workloadPercent}% tải ngày`
                                : `${formatDate(dateKey)}: ngoài khoảng đang xem`;

                            return (
                                <button
                                    key={dateKey}
                                    type="button"
                                    className={`flex aspect-square min-h-10 flex-col items-center justify-center rounded-lg px-1.5 py-1.5 text-center transition hover:bg-blue-50 ${getDailyWorkloadClassName(workloadPercent, taskCount, isSelected, hasData)}`}
                                    title={title}
                                    onClick={() => onSelectDate(dateKey)}
                                >
                                    <span className="text-[10px] font-black leading-none opacity-70">
                                        {Number(dateKey.slice(8, 10))}
                                    </span>
                                    <span className="mt-1 text-[11px] font-black leading-none">
                                        {hasData ? `${workloadPercent}%` : '-'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
import { useGetUsersQuery } from '../../../api/users';

export const TaskAssignModal = ({ isOpen, onClose, task, project, onSuccess }) => {
    const isBulk = Array.isArray(task);
    const tasks = isBulk ? task : [task];
    const representativeTask = tasks[0];

    const parentTaskId = representativeTask?.parentTaskId;
    const { data: fetchedParentTask } = useGetTaskQuery(parentTaskId, {
        skip: !parentTaskId || Boolean(representativeTask?.parentTask?.plannedEndDate)
    });
    const parentTask = representativeTask?.parentTask || fetchedParentTask;

    const latestSubtask = useMemo(() => {
        const subtasks = representativeTask?.subtasks || [];
        const withEndDates = subtasks.filter(st => st.plannedEndDate);
        if (withEndDates.length === 0) return null;
        return [...withEndDates].sort(
            (a, b) => new Date(b.plannedEndDate).getTime() - new Date(a.plannedEndDate).getTime()
        )[0];
    }, [representativeTask?.subtasks]);

    const isSupportMode = !isBulk && task?.isSupportRequested;
    const projectId = project?.id;
    const teamId = project?.team?.id;
    const isVideoDemoTask = Boolean(representativeTask?.opportunityServiceJob?.isBriefVideo);
    const fileInputRef = useRef(null);
    const [plannedEndDate, setPlannedEndDate] = useState(formatDateTimeISO(representativeTask?.plannedEndDate) || '');

    useEffect(() => {
        if (isOpen && representativeTask) {
            setPlannedEndDate(formatDateTimeISO(representativeTask?.plannedEndDate) || '');
        }
    }, [isOpen, representativeTask]);

    const maximumDeadline = useMemo(() => {
        if (!parentTask?.plannedEndDate) return '';
        return formatDateTimeISO(parentTask.plannedEndDate);
    }, [parentTask?.plannedEndDate]);

    const minimumDeadline = useMemo(() => {
        let minDate = new Date();
        if (latestSubtask?.plannedEndDate) {
            const subtaskDate = new Date(latestSubtask.plannedEndDate);
            if (!Number.isNaN(subtaskDate.getTime()) && subtaskDate > minDate) {
                minDate = subtaskDate;
            }
        }
        return formatDateTimeISO(minDate);
    }, [latestSubtask?.plannedEndDate]);

    const safeMinDeadline = useMemo(() => {
        if (!minimumDeadline) return undefined;
        if (maximumDeadline && minimumDeadline > maximumDeadline) {
            return undefined;
        }
        return minimumDeadline;
    }, [minimumDeadline, maximumDeadline]);
    const workloadDate = useMemo(() => {
        const date = plannedEndDate ? new Date(plannedEndDate) : new Date();
        const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
        return {
            month: safeDate.getMonth() + 1,
            year: safeDate.getFullYear()
        };
    }, [plannedEndDate]);

    // Normal members
    const { data: members = [] } = useGetTeamMembersQuery(
        teamId ? { teamId, ...workloadDate } : undefined,
        { skip: !teamId }
    );
    const { data: allEmployees = [], isLoading: isLoadingEmployees } = useGetUsersQuery(undefined, {
        skip: !isVideoDemoTask
    });
    const activeEmployees = allEmployees.filter(employee => employee.account?.isActive === true);

    // Lazy fetch for support teams
    const [fetchTeams, { data: allTeams = [], isLoading: isLoadingTeams }] = useLazyGetTeamsQuery();

    // Lazy fetch for support members
    const [fetchSupportMembers, { data: supportMembers = [], isLoading: isLoadingSupportMembers }] = useLazyGetTeamMembersQuery();

    const [assignTask, { isLoading: isAssigningSingle }] = useAssignTaskMutation();
    const [assignSupportTeam, { isLoading: isAssigningSupport }] = useAssignSupportTeamMutation();
    const [requestSupport] = useRequestSupportMutation();
    const [bulkAssignTasks, { isLoading: isAssigningBulk }] = useBulkAssignTasksMutation();

    const isAssigning = isAssigningSingle || isAssigningBulk || isAssigningSupport;

    const [formData, setFormData] = useState({
        assigneeId: '',
        performerType: 'INTERNAL',
        description: representativeTask?.description || '',
        links: [''],
        selectedTeamId: '',
        isTeamAssignment: false
    });
    const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);

    const jobId = representativeTask?.jobId || representativeTask?.job?.id;
    const { data: vendorsResult, isLoading: isLoadingVendors } = useGetVendorsByJobQuery(jobId, {
        skip: formData.performerType !== 'VENDOR' || !jobId || isBulk // Simplify bulk vendor assignment logic if needed, but for now allow if all tasks share same jobId?
    });
    const vendors = Array.isArray(vendorsResult) ? vendorsResult : (vendorsResult?.data || []);
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({}); // { index: progress }
    const [isUploading, setIsUploading] = useState(false);
    const selectedDeadlineDateKey = useMemo(() => formatDateKey(plannedEndDate) || formatDateKey(new Date()), [plannedEndDate]);

    useEffect(() => {
        if (isSupportMode && representativeTask?.supportTeamId) {
            fetchSupportMembers({ teamId: representativeTask.supportTeamId, ...workloadDate });
        }
    }, [isSupportMode, representativeTask?.supportTeamId, fetchSupportMembers, workloadDate]);

    const internalMembers = isSupportMode && representativeTask?.supportTeamId ? supportMembers : members;
    const selectedMember = internalMembers.find(m => m.user?.id === formData.assigneeId);
    const dailyWorkloadRange = useMemo(() => {
        const selectedDate = parseDateKey(selectedDeadlineDateKey) || new Date();
        return getMonthRange(selectedDate);
    }, [selectedDeadlineDateKey]);
    const shouldFetchDailyWorkload = Boolean(
        formData.assigneeId &&
        formData.performerType === 'INTERNAL' &&
        !formData.isTeamAssignment &&
        dailyWorkloadRange
    );
    const {
        data: dailyWorkload,
        isFetching: isLoadingDailyWorkload,
        isError: isDailyWorkloadError
    } = useGetAssigneeDailyWorkloadQuery(
        {
            userId: formData.assigneeId,
            startDate: dailyWorkloadRange?.startDate,
            endDate: dailyWorkloadRange?.endDate
        },
        { skip: !shouldFetchDailyWorkload }
    );
    const handleSelectDeadlineDate = useCallback((dateKey) => {
        if (!dateKey) return;

        const currentDeadline = plannedEndDate ? new Date(plannedEndDate) : new Date();
        const hours = Number.isNaN(currentDeadline.getTime()) ? 17 : currentDeadline.getHours();
        const minutes = Number.isNaN(currentDeadline.getTime()) ? 30 : currentDeadline.getMinutes();
        setPlannedEndDate(`${dateKey}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }, [plannedEndDate]);

    const handleAddLink = useCallback(() => {
        setFormData(prev => ({ ...prev, links: [...prev.links, ''] }));
    }, []);

    const handleRemoveLink = useCallback((index) => {
        setFormData(prev => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index)
        }));
    }, []);

    const handleLinkChange = useCallback((index, value) => {
        setFormData(prev => {
            const newLinks = [...prev.links];
            newLinks[index] = value;
            return { ...prev, links: newLinks };
        });
    }, []);

    const handleFileChange = useCallback((e) => {
        const selectedFiles = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 5) {
            toast.warning('Chỉ được tối đa 5 file');
            return;
        }

        const totalSize = [...files, ...selectedFiles].reduce((acc, f) => acc + f.size, 0);
        if (totalSize > 25 * 1024 * 1024) {
            toast.error('Tổng dung lượng file không được vượt quá 25MB');
            return;
        }

        setFiles(prev => [...prev, ...selectedFiles]);
    }, [files]);

    const handleRemoveFile = useCallback((index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        if (e) e.preventDefault();

        if (!formData.isTeamAssignment && !formData.assigneeId) {
            toast.error('Vui lòng chọn người thực hiện');
            return;
        }

        if (formData.isTeamAssignment && !formData.selectedTeamId) {
            toast.error('Vui lòng chọn team hỗ trợ');
            return;
        }

        if (!plannedEndDate) {
            toast.error('Vui lòng nhập deadline');
            return;
        }

        const parsedDeadline = new Date(plannedEndDate);
        if (Number.isNaN(parsedDeadline.getTime())) {
            toast.error('Deadline không hợp lệ');
            return;
        }

        const now = new Date();
        now.setSeconds(0, 0);
        if (parsedDeadline.getTime() < now.getTime() - 60 * 1000) {
            toast.error('Deadline không được ở trong quá khứ');
            return;
        }

        // Ràng buộc 1: Task con không được có deadline sau task cha
        if (parentTask?.plannedEndDate) {
            const parentDeadline = new Date(parentTask.plannedEndDate);
            if (parsedDeadline > parentDeadline) {
                toast.error(`Deadline của công việc con không được sau deadline của công việc cha (Hạn chót cha: ${formatDate(parentTask.plannedEndDate)})`);
                return;
            }
        }

        // Ràng buộc 2: Task cha không được có deadline trước task con
        if (latestSubtask?.plannedEndDate) {
            const subtaskDeadline = new Date(latestSubtask.plannedEndDate);
            if (parsedDeadline < subtaskDeadline) {
                toast.error(`Deadline của công việc cha không được trước deadline của công việc con '${latestSubtask.name}' (Hạn chót con: ${formatDate(latestSubtask.plannedEndDate)})`);
                return;
            }
        }

        try {
            let attachments = [];

            // 1. Handle Links
            const validLinks = formData.links
                .filter(link => link.trim() !== '')
                .map(url => ({ type: 'LINK', name: url, url }));
            attachments.push(...validLinks);

            // 2. Handle Files (Direct Upload)
            if (files.length > 0) {
                setIsUploading(true);
                const uploadPromises = files.map((file, index) =>
                    uploadToCloudinary(
                        file,
                        'GETVINI/ERP/tasks',
                        (progress) => setUploadProgress(prev => ({ ...prev, [index]: progress }))
                    )
                );

                const uploadedFiles = await Promise.all(uploadPromises);
                attachments.push(...uploadedFiles);
                setIsUploading(false);
            }

            if (formData.isTeamAssignment) {
                // Bulk support team assignment not fully handled here yet, restricting to single for now based on UI
                if (!isBulk) {
                    if (task.status === 'DOING' && !task.isSupportRequested) {
                        await requestSupport({
                            id: task.id,
                            note: formData.description || "Cần hỗ trợ thực hiện công việc này",
                            projectId
                        }).unwrap();
                    }

                    await assignSupportTeam({
                        id: task.id,
                        teamId: formData.selectedTeamId,
                        projectId
                    }).unwrap();
                }
                toast.success('Giao hỗ trợ team thành công');
            } else {
                if (isBulk) {
                    await bulkAssignTasks({
                        taskIds: tasks.map(t => t.id),
                        assigneeId: formData.assigneeId,
                        performerType: formData.performerType,
                        plannedEndDate: parsedDeadline.toISOString(),
                        description: formData.description || undefined,
                        attachments,
                        projectId
                    }).unwrap();
                } else {
                    await assignTask({
                        id: task.id,
                        assigneeId: formData.assigneeId,
                        performerType: formData.performerType,
                        plannedEndDate: parsedDeadline.toISOString(),
                        description: formData.description || undefined,
                        attachments,
                        projectId
                    }).unwrap();
                }
                toast.success('Phân công công việc thành công');
            }
            onSuccess?.();
            onClose();
        } catch (err) {
            setIsUploading(false);
            toast.error(err?.data?.message || err?.message || 'Có lỗi xảy ra khi phân công');
        }
    }, [formData, files, isBulk, tasks, task, projectId, bulkAssignTasks, assignTask, assignSupportTeam, onClose, onSuccess, plannedEndDate, requestSupport, parentTask, latestSubtask]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/60"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: "spring",
                            duration: 0.4,
                            bounce: 0.2,
                            opacity: { duration: 0.2 },
                            scale: { duration: 0.3 }
                        }}
                        style={{ backfaceVisibility: 'hidden', willChange: "transform, opacity" }}
                        className="bg-white rounded-[32px] w-full max-w-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden relative transform-gpu"
                    >
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <Users className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                                        {isBulk ? `Phân công (${tasks.length}) công việc` : 'Phân công công việc'}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {isBulk ? (
                                            <span className="text-[11px] text-slate-400 font-medium italic">
                                                Đang thực hiện gán hàng loạt cho các công việc đã chọn
                                            </span>
                                        ) : (
                                            <>
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[11px] font-bold tracking-wider">{representativeTask.code}</span>
                                                <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">{getTaskDisplayName(representativeTask)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2.5 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-slate-600 hover:rotate-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div
                            className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 overscroll-contain"
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                willChange: 'scroll-position',
                                transform: 'translateZ(0)'
                            }}
                        >
                            {/* Performer Type Selector */}
                            {!formData.isTeamAssignment && !isVideoDemoTask && (
                                <div className="space-y-4">
                                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hình thức thực hiện</label>
                                    <div className="flex p-1.5 bg-slate-100/80 rounded-2xl relative">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, performerType: 'INTERNAL', assigneeId: '' })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all relative z-10 ${formData.performerType === 'INTERNAL' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            <Info className="w-4 h-4" /> Nội bộ
                                            {formData.performerType === 'INTERNAL' && (
                                                <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, performerType: 'VENDOR', assigneeId: '' })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all relative z-10 ${formData.performerType === 'VENDOR' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            <Briefcase className="w-4 h-4" /> Vendor
                                            {formData.performerType === 'VENDOR' && (
                                                <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Assignee Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                        {formData.isTeamAssignment ? 'Team hỗ trợ' : (formData.performerType === 'INTERNAL' ? 'Người thực hiện' : 'Đối tác Vendor')}
                                    </label>
                                    {/* {!isVideoDemoTask && !isBulk && ((isSupportMode || (representativeTask?.status === 'DOING' || representativeTask?.status === 'REWORKING') && !representativeTask?.isSupportRequested) && !representativeTask?.supportTeamId) && (
                                        <label className="flex items-center gap-2 cursor-pointer group/check">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    id="support-request-checkbox"
                                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-300"
                                                    checked={formData.isTeamAssignment}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        setFormData({
                                                            ...formData,
                                                            isTeamAssignment: isChecked,
                                                            assigneeId: '',
                                                            selectedTeamId: ''
                                                        });
                                                        if (isChecked) fetchTeams();
                                                    }}
                                                />
                                                <svg className="absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider group-hover/check:text-blue-700 transition-colors">
                                                Nhờ hỗ trợ từ team khác
                                            </span>
                                        </label>
                                    )} */}
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                        {formData.isTeamAssignment ? <Users className="w-full h-full" /> : <User className="w-full h-full" />}
                                    </div>

                                    {!isVideoDemoTask &&
                                        !formData.isTeamAssignment &&
                                        formData.performerType === 'INTERNAL' ? (
                                        <>
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white py-4 pl-12 pr-11 text-left font-medium text-slate-700 outline-none transition-all hover:border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50"
                                                onClick={() => setIsAssigneeOpen(prev => !prev)}
                                            >
                                                {selectedMember ? (
                                                    <>
                                                        <span className="min-w-0 flex-1 truncate">
                                                            {selectedMember.user.fullName}
                                                        </span>
                                                        <WorkloadPill workload={selectedMember.user.workload} />
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        Chọn người thực hiện
                                                    </span>
                                                )}
                                            </button>

                                            {isAssigneeOpen && (
                                                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-72 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl shadow-slate-200/80">
                                                    {internalMembers.length > 0 ? (
                                                        internalMembers.map(member => {
                                                            const workload = member.user?.workload;
                                                            const roleLabels = getTeamMemberRoles(member)
                                                                .map(role => TEAM_MEMBER_ROLE_LABELS[role] || role)
                                                                .join(' · ');

                                                            return (
                                                                <button
                                                                    key={member.id || member.user.id}
                                                                    type="button"
                                                                    className={`w-full rounded-xl p-3 text-left transition hover:bg-blue-50 ${formData.assigneeId === member.user.id
                                                                            ? 'bg-blue-50 ring-1 ring-blue-100'
                                                                            : ''
                                                                        }`}
                                                                    onClick={() => {
                                                                        setFormData({
                                                                            ...formData,
                                                                            assigneeId: member.user.id
                                                                        });
                                                                        setIsAssigneeOpen(false);
                                                                    }}
                                                                >
                                                                    <div className="mb-2 flex items-center justify-between gap-3">
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-sm font-black text-slate-800">
                                                                                {member.user.fullName}
                                                                            </p>
                                                                            <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                                                {roleLabels || 'Thành viên'}
                                                                            </p>
                                                                        </div>

                                                                        <WorkloadPill workload={workload} />
                                                                    </div>

                                                                    <WorkloadBar workload={workload} />
                                                                </button>
                                                            );
                                                        })
                                                    ) : (
                                                        <p className="px-3 py-8 text-center text-xs font-bold uppercase tracking-widest text-slate-300">
                                                            Không có nhân sự
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <select
                                                className="w-full cursor-pointer appearance-none rounded-2xl border-2 border-slate-100 bg-white py-4 pl-12 pr-4 font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50"
                                                value={
                                                    formData.isTeamAssignment
                                                        ? formData.selectedTeamId
                                                        : formData.assigneeId
                                                }
                                                onChange={event => {
                                                    const value = event.target.value;

                                                    if (formData.isTeamAssignment) {
                                                        setFormData({
                                                            ...formData,
                                                            selectedTeamId: value
                                                        });

                                                        if (value) {
                                                            fetchSupportMembers({
                                                                teamId: value,
                                                                ...workloadDate
                                                            });
                                                        }
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            assigneeId: value
                                                        });
                                                    }
                                                }}
                                                onFocus={() => {
                                                    if (
                                                        formData.isTeamAssignment &&
                                                        allTeams.length === 0
                                                    ) {
                                                        fetchTeams();
                                                    }
                                                }}
                                            >
                                                <option value="">
                                                    {formData.isTeamAssignment
                                                        ? isLoadingTeams
                                                            ? 'Đang tải danh sách team...'
                                                            : 'Chọn team hỗ trợ'
                                                        : isVideoDemoTask && isLoadingEmployees
                                                            ? 'Đang tải danh sách nhân viên...'
                                                            : formData.performerType === 'VENDOR' &&
                                                                isLoadingVendors
                                                                ? 'Đang tải danh sách...'
                                                                : `Chọn ${formData.performerType === 'INTERNAL'
                                                                    ? 'người thực hiện'
                                                                    : 'vendor'
                                                                }`}
                                                </option>

                                                {formData.isTeamAssignment
                                                    ? allTeams.map(team => (
                                                        <option key={team.id} value={team.id}>
                                                            {team.name} (Lead: {team.teamLead?.fullName})
                                                        </option>
                                                    ))
                                                    : formData.performerType === 'INTERNAL'
                                                        ? isVideoDemoTask
                                                            ? activeEmployees.map(employee => (
                                                                <option
                                                                    key={employee.id}
                                                                    value={employee.id}
                                                                >
                                                                    {employee.fullName}
                                                                </option>
                                                            ))
                                                            : (
                                                                isSupportMode &&
                                                                    representativeTask.supportTeamId
                                                                    ? supportMembers
                                                                    : members
                                                            ).map(member => (
                                                                <option
                                                                    key={member.user.id}
                                                                    value={member.user.id}
                                                                >
                                                                    {member.user.fullName}
                                                                </option>
                                                            ))
                                                        : vendors.map(vendor => (
                                                            <option key={vendor.id} value={vendor.id}>
                                                                {vendor.name}
                                                            </option>
                                                        ))}
                                            </select>

                                            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                                                <svg
                                                    className="h-5 w-5 text-slate-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            </div>
                                        </>
                                    )}
                                    {/* <select
                                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer text-slate-700 font-medium"
                                        value={formData.isTeamAssignment ? formData.selectedTeamId : formData.assigneeId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (formData.isTeamAssignment) {
                                                setFormData({ ...formData, selectedTeamId: val });
                                                if (val) fetchSupportMembers(val);
                                            } else {
                                                setFormData({ ...formData, assigneeId: val });
                                            }
                                        }}
                                        onFocus={() => {
                                            if (formData.isTeamAssignment && allTeams.length === 0) fetchTeams();
                                        }}
                                    >
                                        <option value="">
                                            {formData.isTeamAssignment
                                                ? (isLoadingTeams ? 'Đang tải danh sách team...' : 'Chọn team hỗ trợ')
                                                : (isVideoDemoTask && isLoadingEmployees
                                                    ? 'Đang tải danh sách nhân viên...'
                                                    : formData.performerType === 'VENDOR' && isLoadingVendors
                                                    ? 'Đang tải danh sách...'
                                                    : `Chọn ${formData.performerType === 'INTERNAL' ? 'người thực hiện' : 'vendor'}`)}
                                        </option>
                                        {formData.isTeamAssignment ? (
                                            allTeams.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} (Lead: {t.teamLead?.fullName})</option>
                                            ))
                                        ) : (
                                            formData.performerType === 'INTERNAL' ? (
                                                isVideoDemoTask
                                                    ? activeEmployees.map(employee => (
                                                        <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                                                    ))
                                                    : (isSupportMode && representativeTask.supportTeamId ? supportMembers : members).map(m => (
                                                        <option key={m.user.id} value={m.user.id}>{m.user.fullName}</option>
                                                    ))
                                            ) : (
                                                vendors.map(v => (
                                                    <option key={v.id} value={v.id}>{v.name}</option>
                                                ))
                                            )
                                        )}
                                    </select> */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {formData.performerType === 'VENDOR' && vendors.length === 0 && !isLoadingVendors && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold ring-1 ring-red-100 animate-in fade-in slide-in-from-top-1">
                                        <Info className="w-4 h-4" /> Chưa có vendor cung cấp dịch vụ này
                                    </div>
                                )}
                                {shouldFetchDailyWorkload && (
                                    <DailyWorkloadCalendar
                                        data={dailyWorkload}
                                        isLoading={isLoadingDailyWorkload}
                                        isError={isDailyWorkloadError}
                                        selectedDateKey={selectedDeadlineDateKey}
                                        onSelectDate={handleSelectDeadlineDate}
                                    />
                                )}
                            </div>

                            {/* Dates Grid */}
                            <div className="space-y-3">
                                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">Deadline</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="datetime-local"
                                        required
                                        min={safeMinDeadline}
                                        max={maximumDeadline || undefined}
                                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
                                        value={plannedEndDate}
                                        onChange={(e) => setPlannedEndDate(e.target.value)}
                                    />
                                </div>
                                {parentTask?.plannedEndDate && (
                                    <p className="text-[11px] font-semibold text-amber-600 ml-1">
                                        ⚠️ Công việc con: Hạn chót tối đa theo task cha là {formatDate(parentTask.plannedEndDate)}
                                    </p>
                                )}
                                {latestSubtask?.plannedEndDate && (
                                    <p className="text-[11px] font-semibold text-amber-600 ml-1">
                                        ⚠️ Công việc cha: Không được sớm hơn hạn chót công việc con &apos;{latestSubtask.name}&apos; ({formatDate(latestSubtask.plannedEndDate)})
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ghi chú & Chỉ dẫn</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <textarea
                                        rows={3}
                                        placeholder="Mô tả chi tiết công việc hoặc lưu ý cho người thực hiện..."
                                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400 min-h-[100px]"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Attachments Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Đính kèm</label>
                                    <button
                                        type="button"
                                        onClick={handleAddLink}
                                        className="flex items-center gap-1.5 py-1.5 px-3 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Thêm Link
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {/* Links */}
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        {formData.links.map((link, index) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ duration: 0.2 }}
                                                key={`link-${index}`}
                                                className="flex gap-2"
                                            >
                                                <div className="relative flex-1 group">
                                                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                    <input
                                                        type="url"
                                                        placeholder="Nhập link tài liệu (Google Drive, Dropbox...)"
                                                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all text-slate-600 font-medium"
                                                        value={link}
                                                        onChange={(e) => handleLinkChange(index, e.target.value)}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLink(index)}
                                                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                                >
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {/* Files */}
                                    <div
                                        className="relative overflow-hidden border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center bg-slate-50/30 hover:bg-blue-50/30 hover:border-blue-300 transition-all cursor-pointer group"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 group-hover:shadow-blue-100 transition-all">
                                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600">Thêm tệp đính kèm</p>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium italic">Kéo thả hoặc bấm để chọn tệp (Tối đa 5 file, 25MB)</p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            multiple
                                            onChange={handleFileChange}
                                        />
                                    </div>

                                    <AnimatePresence mode="popLayout" initial={false}>
                                        {files.length > 0 && (
                                            <div className="grid grid-cols-1 gap-2">
                                                {files.map((file, index) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        transition={{ duration: 0.2 }}
                                                        key={`file-${file.name}-${index}`}
                                                        className="flex items-center justify-between p-4 bg-white border-2 border-slate-50 rounded-2xl hover:border-blue-100 transition-all shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-bold text-slate-700 truncate max-w-[240px]">{file.name}</p>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                                    {isUploading && uploadProgress[index] !== undefined && (
                                                                        <div className="flex-1 max-w-[100px] h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                            <div
                                                                                className="bg-blue-600 h-full transition-all duration-300"
                                                                                style={{ width: `${uploadProgress[index]}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveFile(index);
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-red-500 transition-all hover:rotate-12"
                                                            disabled={isUploading}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 bg-white border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all"
                            >
                                Hủy bỏ
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={isAssigning || isUploading}
                                className="flex-[1.5] px-6 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:shadow-none"
                            >
                                {isAssigning || isUploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Đang xử lý</span>
                                    </>
                                ) : (
                                    <span>Xác nhận phân công</span>
                                )}
                            </motion.button>
                        </div>
                    </motion.div >
                </div >
            )}
        </AnimatePresence >
    );
};
