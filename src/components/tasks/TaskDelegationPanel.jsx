import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Pencil, Percent, Plus, Send, UserPlus, Users, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import {
    useCreateSubtaskMutation,
    useRequestTaskStaffingMutation,
    useRespondSubtaskPlanMutation,
    useRespondTaskStaffingMutation,
    useSubmitSubtaskPlanMutation,
    useUpdateSubtaskMutation,
} from '../../api/tasks';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ResolveStaffingRequestModal } from './ResolveStaffingRequestModal';
import { formatNumber } from '../../utils/format';
import { getCurrentUserId, isSameUser } from '../../utils/authUser';
import { TASK_STATUS_LABELS } from '../../utils/enums';

const emptySubtaskForm = {
    name: '',
    assigneeId: '',
    allocationPercent: '',
    description: '',
};

const SPLITTABLE_TASK_STATUSES = new Set(['PENDING', 'DOING', 'REWORKING', 'OVERDUE']);
const SPLITTABLE_STATUS_TEXT = 'Chờ thực hiện, Đang thực hiện, Đang làm lại hoặc Quá hạn';

const getAllocationPercent = (subtask, rewardPool) => {
    const percent = Number(subtask?.allocationPercent || 0);
    if (percent > 0) return percent;
    const legacyAllocation = Number(subtask?.vinicoinAllocation || 0);
    return rewardPool > 0 && legacyAllocation > 0
        ? (legacyAllocation / rewardPool) * 100
        : 0;
};

export const TaskDelegationPanel = ({ task, currentUser }) => {
    const navigate = useNavigate();
    const [isStaffingModalOpen, setIsStaffingModalOpen] = useState(false);
    const [isAddStaffingMemberModalOpen, setIsAddStaffingMemberModalOpen] = useState(false);
    const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
    const [editingSubtaskId, setEditingSubtaskId] = useState(null);
    const [staffingNote, setStaffingNote] = useState('');
    const [subtaskForm, setSubtaskForm] = useState(emptySubtaskForm);
    const [requestStaffing, { isLoading: isRequestingStaffing }] = useRequestTaskStaffingMutation();
    const [respondStaffing, { isLoading: isRespondingStaffing }] = useRespondTaskStaffingMutation();
    const [createSubtask, { isLoading: isCreatingSubtask }] = useCreateSubtaskMutation();
    const [updateSubtask, { isLoading: isUpdatingSubtask }] = useUpdateSubtaskMutation();
    const [submitSubtaskPlan, { isLoading: isSubmittingPlan }] = useSubmitSubtaskPlanMutation();
    const [respondSubtaskPlan, { isLoading: isRespondingPlan }] = useRespondSubtaskPlanMutation();

    const currentUserId = getCurrentUserId(currentUser);
    const team = task?.project?.team;
    const currentMembership = team?.members?.find(member => isSameUser(member.user?.id, currentUserId));
    const isAccount = isSameUser(team?.teamLead?.id, currentUserId) || currentMembership?.role === 'ACCOUNT';
    const isAdminOverride = ['ADMIN', 'BOD'].includes(currentUser?.role);
    const canDelegate = isAccount || isAdminOverride;
    const isPendingStaffingRequest = task?.supportRequestType === 'STAFFING' &&
        task?.isSupportRequested &&
        !task?.isSupportAccepted;
    const canRespondStaffing = isPendingStaffingRequest &&
        (isSameUser(task?.supportLeadId, currentUserId) || isAdminOverride);
    const isSubtaskPlanLocked = ['PENDING_APPROVAL', 'APPROVED'].includes(task?.subtaskPlanStatus);
    const canRespondSubtaskPlan = task?.subtaskPlanStatus === 'PENDING_APPROVAL' &&
        (isSameUser(task?.subtaskPlanReviewerId, currentUserId) || isAdminOverride);

    const assignableMembers = useMemo(() => (
        (team?.members || []).filter(member =>
            member.user?.id && member.role !== 'PROJECT_MANAGER'
        )
    ), [team?.members]);

    const subtasks = task?.subtasks || [];
    const rewardPool = Number(task?.vinicoinBudget ?? task?.job?.vinicoin ?? 0);
    const allocatedPercent = subtasks.reduce(
        (total, subtask) => total + getAllocationPercent(subtask, rewardPool),
        0
    );
    const remainingPercent = Math.max(0, 100 - allocatedPercent);
    const parentAssigneeHasSubtask = subtasks.some(subtask =>
        isSameUser(subtask.assigneeId || subtask.assignee?.id, task?.assigneeId)
    );
    const reviewerHasSubtask = subtasks.some(subtask =>
        isSameUser(subtask.assigneeId || subtask.assignee?.id, currentUserId)
    );
    const canSubmitSubtaskPlan = canDelegate &&
        subtasks.length > 0 &&
        Math.round(allocatedPercent * 100) === 10_000 &&
        parentAssigneeHasSubtask &&
        !isSubtaskPlanLocked;
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

    const staffingBlockedReason = sharedActionBlockedReason || (
        !projectManager ? 'Dự án chưa có PM phụ trách để nhận yêu cầu.' : ''
    );
    const subtaskBlockedReason = sharedActionBlockedReason || (
        isSubtaskPlanLocked
            ? 'Phương án phân bổ đang chờ duyệt hoặc đã được duyệt.'
            : !task?.job
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
                            <Percent className="h-5 w-5 text-[#F38820]" />
                            <h2 className="text-lg font-bold text-gray-900">Tỷ trọng công việc của subtask</h2>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Thuộc công việc: {task.parentTask?.nickname || task.parentTask?.name || 'Task gốc'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-xl bg-orange-50 px-4 py-2 font-black text-orange-700">
                            {getAllocationPercent(
                                task,
                                Number(task.parentTask?.vinicoinBudget ?? task.job?.vinicoin ?? 0)
                            ).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%
                        </span>
                        {task.subtaskPlanStatus && task.subtaskPlanStatus !== 'APPROVED' && (
                            <span className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
                                {task.subtaskPlanStatus === 'PENDING_APPROVAL' ? 'Chờ PM duyệt' : 'Bản nháp phân bổ'}
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
        const editablePercent = remainingPercent + getAllocationPercent(editingSubtask, rewardPool);
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
                toast.success('Đã cập nhật subtask trong phương án phân bổ');
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
            allocationPercent: String(getAllocationPercent(subtask, rewardPool)),
            description: subtask.description || '',
        });
        setIsSubtaskModalOpen(true);
    };

    const closeSubtaskModal = () => {
        setIsSubtaskModalOpen(false);
        setEditingSubtaskId(null);
        setSubtaskForm(emptySubtaskForm);
    };

    const handleSubmitSubtaskPlan = async () => {
        try {
            await submitSubtaskPlan({ id: task.id, projectId: task.project.id }).unwrap();
            toast.success('Đã gửi phương án phân bổ cho PM duyệt');
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể gửi phương án phân bổ');
        }
    };

    const handleRespondSubtaskPlan = async action => {
        const note = action === 'REJECT'
            ? window.prompt('Nhập lý do cần điều chỉnh phương án:')
            : undefined;
        if (action === 'REJECT' && note === null) return;

        try {
            await respondSubtaskPlan({
                id: task.id,
                projectId: task.project.id,
                action,
                note: note?.trim() || undefined,
            }).unwrap();
            toast.success(action === 'APPROVE' ? 'Đã duyệt và kích hoạt các subtask' : 'Đã yêu cầu điều chỉnh phương án');
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể xử lý phương án phân bổ');
        }
    };

    return (
        <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-bold text-gray-900">Danh sách công việc con</h2>
                {canDelegate && (!staffingBlockedReason || !subtaskBlockedReason) && (
                    <div className="flex flex-wrap gap-2">
                        {!staffingBlockedReason && (
                            <Button
                                variant="outline"
                                onClick={() => setIsStaffingModalOpen(true)}
                                disabled={isPendingStaffingRequest}
                                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                {isPendingStaffingRequest ? 'Đang chờ PM' : 'Yêu cầu thêm người'}
                            </Button>
                        )}
                        {!subtaskBlockedReason && (
                            <Button
                                onClick={openCreateSubtaskModal}
                                className="bg-[#F38820] text-white hover:bg-[#D97010] focus:ring-orange-500"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm subtask
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {task.subtaskPlanStatus === 'PENDING_APPROVAL' && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="font-bold text-amber-900">Phương án 100% đang chờ PM duyệt</p>
                            <p className="mt-1 text-sm text-amber-700">Các subtask chưa được kích hoạt và chưa thể nộp kết quả.</p>
                        </div>
                        {canRespondSubtaskPlan && (
                            <div className="flex flex-col items-start gap-2 md:items-end">
                                {reviewerHasSubtask && !isAdminOverride && (
                                    <p className="max-w-sm text-xs font-semibold text-amber-700 md:text-right">
                                        Bạn có phần việc trong phương án nên ADMIN/BOD phải duyệt thay.
                                    </p>
                                )}
                                <div className="flex gap-2">
                                <Button
                                    onClick={() => handleRespondSubtaskPlan('APPROVE')}
                                    isLoading={isRespondingPlan}
                                    disabled={reviewerHasSubtask && !isAdminOverride}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Duyệt phương án
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleRespondSubtaskPlan('REJECT')}
                                    disabled={isRespondingPlan}
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Yêu cầu sửa
                                </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {task.subtaskPlanStatus === 'APPROVED' && (
                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    PM đã duyệt phương án. Các subtask đã được kích hoạt.
                </div>
            )}

            {task.subtaskPlanStatus === 'DRAFT' && task.subtaskPlanReviewNote && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <span className="font-bold">PM yêu cầu điều chỉnh:</span> {task.subtaskPlanReviewNote}
                </div>
            )}

            {isPendingStaffingRequest && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
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
                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    PM đã xác nhận bổ sung nhân sự. Account có thể phân công subtask.
                </div>
            )}

            <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-end gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-400">{subtasks.length} công việc</span>
                        {canSubmitSubtaskPlan && (
                            <Button
                                onClick={handleSubmitSubtaskPlan}
                                isLoading={isSubmittingPlan}
                                className="bg-[#F38820] text-white hover:bg-[#D97010]"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Gửi PM duyệt
                            </Button>
                        )}
                    </div>
                </div>

                {Math.round(allocatedPercent * 100) === 10_000 && !parentAssigneeHasSubtask && !isSubtaskPlanLocked && (
                    <p className="mb-3 text-sm font-semibold text-amber-700">
                        Người chịu trách nhiệm task cha cần nhận ít nhất một subtask trước khi gửi PM duyệt.
                    </p>
                )}

                {subtasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-gray-500">Chưa có subtask</p>
                        <p className="mt-1 text-xs text-gray-400">Account có thể chia công việc sau khi PM bổ sung đủ nhân sự.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {subtasks.map(subtask => (
                            <div key={subtask.id} className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/tasks/${subtask.id}`)}
                                    className="grid min-w-0 flex-1 grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-slate-50 p-4 text-left transition-colors hover:border-orange-200 hover:bg-orange-50/40 md:grid-cols-[1fr_auto_auto] md:items-center"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-bold text-gray-900">{subtask.name}</p>
                                        <p className="mt-1 text-xs text-gray-500">{subtask.assignee?.fullName || 'Chưa phân công'}</p>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500">
                                        {task.subtaskPlanStatus === 'PENDING_APPROVAL'
                                            ? 'Chờ PM duyệt'
                                            : TASK_STATUS_LABELS[subtask.status] || subtask.status}
                                    </span>
                                    <span className="font-black text-orange-700">
                                        {getAllocationPercent(subtask, rewardPool).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%
                                    </span>
                                </button>
                                {canDelegate && !isSubtaskPlanLocked && (
                                    <Button
                                        variant="outline"
                                        onClick={() => openEditSubtaskModal(subtask)}
                                        className="shrink-0 border-orange-200 px-3 text-orange-700 hover:bg-orange-50"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
                title={editingSubtaskId ? 'Chỉnh sửa subtask' : 'Tạo subtask trong phương án'}
                className="max-w-xl"
            >
                <div className="space-y-4">
                    <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
                        Tỷ trọng có thể phân bổ: {(remainingPercent + getAllocationPercent(
                            subtasks.find(subtask => subtask.id === editingSubtaskId),
                            rewardPool
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
        </section>
    );
};
