import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ListOrdered, Pencil, Percent, Plus, UserPlus, Users, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import {
    useCreateSubtaskMutation,
    useRequestTaskStaffingMutation,
    useRespondTaskStaffingMutation,
    useUpdateSubtaskMutation,
} from '../../api/tasks';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ResolveStaffingRequestModal } from './ResolveStaffingRequestModal';
import { SubtaskRoadmapModal } from './SubtaskRoadmapModal';
import { formatNumber, formatDate } from '../../utils/format';
import { getCurrentUserId, isSameUser, getUserAccountRole } from '../../utils/authUser';
import { TASK_STATUS_LABELS } from '../../utils/enums';

const emptySubtaskForm = {
    name: '',
    assigneeId: '',
    allocationPercent: '',
    description: '',
};

const SPLITTABLE_TASK_STATUSES = new Set(['PENDING', 'DOING', 'REWORKING', 'OVERDUE', 'AWAITING_SUPPORT']);
const SPLITTABLE_STATUS_TEXT = 'Chờ thực hiện, Đang thực hiện, Đang làm lại, Quá hạn, Đang nhờ hỗ trợ';

const getAllocationPercent = subtask => {
    const percent = Number(subtask?.allocationPercent || 0);
    return percent > 0 ? percent : 0;
};

export const TaskDelegationPanel = ({
    task,
    currentUser,
    isStaffingModalOpen: externalIsStaffingModalOpen,
    setIsStaffingModalOpen: externalSetIsStaffingModalOpen,
    isSubtaskModalOpen: externalIsSubtaskModalOpen,
    setIsSubtaskModalOpen: externalSetIsSubtaskModalOpen,
}) => {
    const navigate = useNavigate();
    const [internalIsStaffingModalOpen, setInternalIsStaffingModalOpen] = useState(false);
    const isStaffingModalOpen = externalIsStaffingModalOpen !== undefined ? externalIsStaffingModalOpen : internalIsStaffingModalOpen;
    const setIsStaffingModalOpen = externalSetIsStaffingModalOpen || setInternalIsStaffingModalOpen;
    const [isAddStaffingMemberModalOpen, setIsAddStaffingMemberModalOpen] = useState(false);
    const [internalIsSubtaskModalOpen, setInternalIsSubtaskModalOpen] = useState(false);
    const isSubtaskModalOpen = externalIsSubtaskModalOpen !== undefined ? externalIsSubtaskModalOpen : internalIsSubtaskModalOpen;
    const setIsSubtaskModalOpen = externalSetIsSubtaskModalOpen || setInternalIsSubtaskModalOpen;
    const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
    const [editingSubtaskId, setEditingSubtaskId] = useState(null);
    const [staffingNote, setStaffingNote] = useState('');
    const [subtaskForm, setSubtaskForm] = useState(emptySubtaskForm);
    const [requestStaffing, { isLoading: isRequestingStaffing }] = useRequestTaskStaffingMutation();
    const [respondStaffing, { isLoading: isRespondingStaffing }] = useRespondTaskStaffingMutation();
    const [createSubtask, { isLoading: isCreatingSubtask }] = useCreateSubtaskMutation();
    const [updateSubtask, { isLoading: isUpdatingSubtask }] = useUpdateSubtaskMutation();

    const currentUserId = getCurrentUserId(currentUser);
    const userRole = getUserAccountRole(currentUser);
    const team = task?.project?.team;
    const currentMembership = team?.members?.find(member => isSameUser(member.user?.id, currentUserId));
    const isPM = currentMembership?.role === 'PROJECT_MANAGER' || isSameUser(task?.project?.projectManager?.id, currentUserId);
    const isAccount = isSameUser(team?.teamLead?.id, currentUserId) || currentMembership?.role === 'ACCOUNT';
    const isAdminOverride = ['ADMIN', 'BOD'].includes(userRole);
    const isTeamLead = isSameUser(team?.teamLead?.id, currentUserId);
    const canDelegate = isAccount || isPM || isAdminOverride || isTeamLead;
    const isStaffRole = !userRole ||
        userRole.startsWith('STAFF') ||
        ['STAFF', 'STAFF_A', 'STAFF_B', 'STAFF_C', 'STAFF_D', 'EMPLOYEE', 'USER'].includes(userRole);
    const isManagementRole = ['ADMIN', 'BOD', 'PROJECT_MANAGER', 'ACCOUNT', 'PM', 'TEAM_LEAD'].includes(userRole);
    const canViewAllocationPercent = !isStaffRole && (canDelegate || isManagementRole);
    const isPendingStaffingRequest = task?.supportRequestType === 'STAFFING' &&
        task?.isSupportRequested &&
        !task?.isSupportAccepted;
    const canRespondStaffing = isPendingStaffingRequest &&
        (isPM || isAdminOverride);

    const assignableMembers = useMemo(() => (
        (team?.members || []).filter(member =>
            member.user?.id && member.role !== 'PROJECT_MANAGER'
        )
    ), [team?.members]);

    const subtasks = task?.subtasks || [];
    const allocatedPercent = subtasks.reduce(
        (total, subtask) => total + getAllocationPercent(subtask),
        0
    );
    const remainingPercent = Math.max(0, 100 - allocatedPercent);
    const isSubtaskDefinitionLocked = subtask => Boolean(
        subtask?.result ||
        subtask?.actualStartDate ||
        subtask?.actualEndDate ||
        subtask?.lastSubmittedById ||
        subtask?.rewardVinicoin != null ||
        subtask?.reviews?.length ||
        subtask?.iterations?.length ||
        ['AWAITING_REVIEW', 'INTERNAL_COMPLETED', 'COMPLETED', 'ACCEPTED', 'AWAITING_SUPPORT'].includes(subtask?.status)
    );
    const isSplittableStatus = SPLITTABLE_TASK_STATUSES.has(task?.status);
    const projectManager = team?.members?.find(member =>
        member.role === 'PROJECT_MANAGER' && member.user?.id
    );

    let sharedActionBlockedReason = '';
    if (task?.performerType !== 'INTERNAL') {
        sharedActionBlockedReason = 'Chỉ công việc nội bộ mới được yêu cầu nhân sự hoặc chia subtask.';
    } else if (!isSplittableStatus) {
        sharedActionBlockedReason = `Chỉ khả dụng khi task ở trạng thái: ${SPLITTABLE_STATUS_TEXT}. Trạng thái hiện tại: ${TASK_STATUS_LABELS[task?.status] || task?.status || 'Không xác định'}.`;
    } else if (!team) {
        sharedActionBlockedReason = 'Task chưa thuộc đội dự án.';
    }

    const subtaskBlockedReason = sharedActionBlockedReason || (
        !task?.job
            ? 'Task chưa có hạng mục để xác định quỹ Vinicoin.'
            : !task?.assigneeId
                ? 'Cần phân công người thực hiện task chính trước khi chia subtask.'
                : remainingPercent <= 0
                    ? 'Phương án đã phân bổ đủ 100%.'
                : assignableMembers.length === 0
                    ? 'Đội dự án chưa có thành viên để nhận subtask.'
                    : ''
    );

    if (!task?.project) return null;

    if (task.parentTaskId) {
        return (
            <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-gray-900">
                                Thông tin công việc
                            </h2>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Thuộc công việc: {task.parentTask?.nickname || task.parentTask?.name || 'Task gốc'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {canViewAllocationPercent && (
                            <span className="rounded-xl bg-orange-50 px-4 py-2 font-black text-orange-700">
                                {getAllocationPercent(task).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%
                            </span>
                        )}
                        {task.rewardVinicoin != null && (
                            <span className="rounded-xl bg-emerald-50 px-4 py-2 font-black text-emerald-700">
                                Reward: {formatNumber(task.rewardVinicoin)} Vinicoin
                            </span>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/tasks/${task.parentTaskId}`)}
                            className="border-orange-200 text-orange-700 hover:bg-orange-50"
                        >
                            Xem task gốc
                        </Button>
                    </div>
                </div>
            </section>
        );
    }

    const handleRequestStaffing = async () => {
        try {
            await requestStaffing({
                id: task.id,
                projectId: task.project.id,
                note: staffingNote.trim(),
            }).unwrap();
            toast.success('Đã gửi yêu cầu bổ sung nhân sự cho PM');
            setStaffingNote('');
            setIsStaffingModalOpen(false);
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể gửi yêu cầu cho PM');
        }
    };

    const handleRespondStaffing = async action => {
        try {
            await respondStaffing({
                id: task.id,
                projectId: task.project.id,
                action,
            }).unwrap();
            toast.success(action === 'RESOLVE' ? 'Đã xác nhận bổ sung nhân sự' : 'Đã từ chối yêu cầu');
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể xử lý yêu cầu');
        }
    };

    const handleCreateSubtask = async () => {
        const allocationPercent = Number(String(subtaskForm.allocationPercent).replace(',', '.'));
        const editingSubtask = subtasks.find(subtask => subtask.id === editingSubtaskId);
        const editablePercent = remainingPercent + getAllocationPercent(editingSubtask);
        if (!subtaskForm.name.trim() || !subtaskForm.assigneeId) {
            toast.error('Vui lòng nhập tên và chọn người thực hiện');
            return;
        }
        if (!Number.isFinite(allocationPercent) || allocationPercent <= 0 || allocationPercent > editablePercent) {
            toast.error(`% phân bổ phải lớn hơn 0 và không vượt quá ${editablePercent.toLocaleString('vi-VN')}%`);
            return;
        }

        try {
            const payload = {
                name: subtaskForm.name.trim(),
                assigneeId: subtaskForm.assigneeId,
                allocationPercent,
                description: subtaskForm.description.trim() || undefined,
            };
            if (editingSubtaskId) {
                await updateSubtask({
                    id: editingSubtaskId,
                    parentTaskId: task.id,
                    projectId: task.project.id,
                    ...payload,
                }).unwrap();
                toast.success('Đã cập nhật công việc con');
            } else {
                await createSubtask({
                    id: task.id,
                    projectId: task.project.id,
                    ...payload,
                }).unwrap();
                toast.success('Đã thêm subtask vào phương án phân bổ');
            }
            setSubtaskForm(emptySubtaskForm);
            setEditingSubtaskId(null);
            setIsSubtaskModalOpen(false);
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể tạo subtask');
        }
    };

    const openCreateSubtaskModal = () => {
        setEditingSubtaskId(null);
        setSubtaskForm(emptySubtaskForm);
        setIsSubtaskModalOpen(true);
    };

    const openEditSubtaskModal = subtask => {
        setEditingSubtaskId(subtask.id);
        setSubtaskForm({
            name: subtask.name || '',
            assigneeId: subtask.assigneeId || subtask.assignee?.id || '',
            allocationPercent: String(getAllocationPercent(subtask)),
            description: subtask.description || '',
        });
        setIsSubtaskModalOpen(true);
    };

    const closeSubtaskModal = () => {
        setIsSubtaskModalOpen(false);
        setEditingSubtaskId(null);
        setSubtaskForm(emptySubtaskForm);
    };

    const hasStaffingNotice = isPendingStaffingRequest || (task.supportRequestType === 'STAFFING' && task.isSupportAccepted);
    const hasSubtasks = subtasks.length > 0;

    return (
        <>
            {(hasStaffingNotice || hasSubtasks) && (
                <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm md:p-8">
                    {/* KHUNG PM DUYỆT / TỪ CHỐI BỔ SUNG NHÂN SỰ */}
                    {isPendingStaffingRequest && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="font-bold text-amber-900">Đang chờ PM bổ sung nhân sự</p>
                                    <p className="mt-1 text-sm text-amber-700">
                                        {task.supportRequestNote || 'Account chưa nhập ghi chú cho yêu cầu này.'}
                                    </p>
                                </div>
                                {canRespondStaffing && (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate(`/projects/${task.project.id}`)}
                                            className="border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
                                        >
                                            <Users className="mr-2 h-4 w-4" />
                                            Mở đội dự án
                                        </Button>
                                        <Button
                                            onClick={() => setIsAddStaffingMemberModalOpen(true)}
                                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Thêm người & xác nhận
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleRespondStaffing('REJECT')}
                                            disabled={isRespondingStaffing}
                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Từ chối
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {task.supportRequestType === 'STAFFING' && task.isSupportAccepted && (
                        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            PM đã xác nhận bổ sung nhân sự. Account có thể phân công subtask.
                        </div>
                    )}

                    {/* DANH SÁCH SUBTASK (CHỈ HIỆN KHI CÓ SUBTASK) */}
                    {hasSubtasks && (
                        <div className={hasStaffingNotice ? "mt-6" : ""}>
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900">Danh sách công việc con</h2>
                                {canDelegate && !subtaskBlockedReason && (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            onClick={openCreateSubtaskModal}
                                            className="bg-[#F38820] text-white hover:bg-[#D97010] focus:ring-orange-500"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Thêm subtask
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                {canViewAllocationPercent ? (
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                                        <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-orange-700">
                                            Đã phân bổ: {allocatedPercent.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%
                                        </span>
                                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-blue-700">
                                            Người làm task gốc: {remainingPercent.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%
                                        </span>
                                    </div>
                                ) : <div />}
                                <span className="text-sm font-semibold text-gray-400">{subtasks.length} công việc</span>
                            </div>

                            <div className="space-y-3.5">
                        {subtasks.map(subtask => {
                            const percent = getAllocationPercent(subtask);

                            return (
                                <div
                                    key={subtask.id}
                                    className="group relative rounded-2xl border border-slate-200/90 bg-white p-4 transition-all duration-200 hover:border-orange-300 hover:shadow-md hover:shadow-orange-500/5"
                                >
                                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12 md:items-center">
                                        {/* TÊN CÔNG VIỆC CON & NGƯỜI THỰC HIỆN */}
                                        <div className={`min-w-0 ${canViewAllocationPercent ? 'md:col-span-5' : 'md:col-span-8'}`}>
                                            <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                TÊN CÔNG VIỆC CON
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/tasks/${subtask.id}`)}
                                                className="text-left group-hover:text-[#F38820] transition-colors block w-full"
                                            >
                                                <p className="truncate font-bold text-gray-900 text-sm">{subtask.name}</p>
                                            </button>
                                            <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[9px] font-black text-orange-700">
                                                    {(subtask.assignee?.fullName || 'U').charAt(0).toUpperCase()}
                                                </span>
                                                <span className="truncate font-medium text-gray-600">
                                                    {subtask.assignee?.fullName || 'Chưa phân công'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* TRỌNG SỐ (%) - ẨN KHI LÀ STAFF */}
                                        {canViewAllocationPercent && (
                                            <div className="md:col-span-3">
                                                <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                    TRỌNG SỐ
                                                </span>
                                                <span className="inline-block rounded-xl bg-orange-50 px-2.5 py-1 text-xs font-black text-orange-700 border border-orange-100/50">
                                                    {percent.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%
                                                </span>
                                            </div>
                                        )}

                                        {/* TRẠNG THÁI & HẠN */}
                                        <div className="md:col-span-3">
                                            <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                TRẠNG THÁI
                                            </span>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold text-gray-700">
                                                    {TASK_STATUS_LABELS[subtask.status] || subtask.status}
                                                </span>
                                                {subtask.dueDate && (
                                                    <span className="text-[10px] font-semibold text-gray-400">
                                                        Hạn: {formatDate(subtask.dueDate)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end md:col-span-1">
                                            {canDelegate && !isSubtaskDefinitionLocked(subtask) && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => openEditSubtaskModal(subtask)}
                                                    className="rounded-xl border-orange-200 p-2 text-orange-700 hover:bg-orange-50"
                                                    title="Chỉnh sửa công việc con"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    )}

    <Modal
                isOpen={isStaffingModalOpen}
                onClose={() => setIsStaffingModalOpen(false)}
                title="Yêu cầu PM bổ sung nhân sự"
                className="max-w-lg"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        PM sẽ nhận thông báo và thêm người vào đội dự án. Sau đó Account có thể chọn người này khi tạo subtask.
                    </p>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-gray-700">Nhu cầu nhân sự</label>
                        <textarea
                            value={staffingNote}
                            onChange={event => setStaffingNote(event.target.value)}
                            rows={4}
                            maxLength={1000}
                            placeholder="Ví dụ: Cần thêm 01 designer và 01 editor..."
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsStaffingModalOpen(false)}>Hủy</Button>
                        <Button
                            onClick={handleRequestStaffing}
                            isLoading={isRequestingStaffing}
                            className="bg-[#F38820] text-white hover:bg-[#D97010] focus:ring-orange-500"
                        >
                            Gửi cho PM
                        </Button>
                    </div>
                </div>
            </Modal>

            <ResolveStaffingRequestModal
                isOpen={isAddStaffingMemberModalOpen}
                onClose={() => setIsAddStaffingMemberModalOpen(false)}
                task={task}
                team={team}
            />

            <Modal
                isOpen={isSubtaskModalOpen}
                onClose={closeSubtaskModal}
                title={editingSubtaskId ? 'Chỉnh sửa công việc con' : 'Tạo công việc trong phương án'}
                className="max-w-xl"
            >
                <div className="space-y-4">
                    <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
                        Tỷ trọng có thể phân bổ: {(remainingPercent + getAllocationPercent(
                            subtasks.find(subtask => subtask.id === editingSubtaskId)
                        )).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-gray-700">Tên subtask</label>
                        <input
                            value={subtaskForm.name}
                            onChange={event => setSubtaskForm(current => ({ ...current, name: event.target.value }))}
                            maxLength={255}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            placeholder="Nhập phần công việc cần thực hiện"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-gray-700">Người thực hiện</label>
                        <select
                            value={subtaskForm.assigneeId}
                            onChange={event => setSubtaskForm(current => ({ ...current, assigneeId: event.target.value }))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        >
                            <option value="">Chọn thành viên đội dự án</option>
                            {assignableMembers.map(member => (
                                <option key={member.id} value={member.user.id}>
                                    {member.user.fullName}{member.role === 'ACCOUNT' ? ' (Account)' : ''}
                                </option>
                            ))}
                        </select>
                        {assignableMembers.length === 0 && (
                            <p className="mt-2 text-xs font-semibold text-amber-600">PM cần thêm nhân sự vào đội dự án trước.</p>
                        )}
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-gray-700">% phân bổ công việc</label>
                        <input
                            inputMode="decimal"
                            value={subtaskForm.allocationPercent}
                            onChange={event => {
                                const rawValue = event.target.value
                                    .replace(',', '.')
                                    .replace(/[^0-9.]/g, '')
                                    .replace(/(\..*)\./g, '$1');
                                const [integerPart, decimalPart] = rawValue.split('.');
                                const normalizedValue = decimalPart === undefined
                                    ? integerPart
                                    : `${integerPart}.${decimalPart.slice(0, 2)}`;
                                setSubtaskForm(current => ({ ...current, allocationPercent: normalizedValue }));
                            }}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            placeholder="Ví dụ: 25"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-gray-700">Mô tả</label>
                        <textarea
                            value={subtaskForm.description}
                            onChange={event => setSubtaskForm(current => ({ ...current, description: event.target.value }))}
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            placeholder="Yêu cầu và kết quả cần bàn giao"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={closeSubtaskModal}>Hủy</Button>
                        <Button
                            onClick={handleCreateSubtask}
                            isLoading={isCreatingSubtask || isUpdatingSubtask}
                            disabled={assignableMembers.length === 0}
                            className="bg-[#F38820] text-white hover:bg-[#D97010] focus:ring-orange-500"
                        >
                            {editingSubtaskId ? 'Lưu thay đổi' : 'Thêm vào phương án'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <SubtaskRoadmapModal
                isOpen={isRoadmapModalOpen}
                onClose={() => setIsRoadmapModalOpen(false)}
                task={task}
                assignableMembers={assignableMembers}
                initialSubtasks={subtasks}
                onSave={(updatedSubtasks) => {
                    toast.success('Đã lưu lộ trình công việc con');
                    setIsRoadmapModalOpen(false);
                }}
            />
        </>
    );
};
