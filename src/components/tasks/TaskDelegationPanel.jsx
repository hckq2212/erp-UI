import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Coins, Plus, UserPlus, Users, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import {
    useCreateSubtaskMutation,
    useRequestTaskStaffingMutation,
    useRespondTaskStaffingMutation,
} from '../../api/tasks';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { formatNumber, parseNumber } from '../../utils/format';
import { getCurrentUserId, isSameUser } from '../../utils/authUser';
import { TASK_STATUS_LABELS } from '../../utils/enums';

const emptySubtaskForm = {
    name: '',
    assigneeId: '',
    vinicoinAllocation: '',
    description: '',
};

export const TaskDelegationPanel = ({ task, currentUser }) => {
    const navigate = useNavigate();
    const [isStaffingModalOpen, setIsStaffingModalOpen] = useState(false);
    const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
    const [staffingNote, setStaffingNote] = useState('');
    const [subtaskForm, setSubtaskForm] = useState(emptySubtaskForm);
    const [requestStaffing, { isLoading: isRequestingStaffing }] = useRequestTaskStaffingMutation();
    const [respondStaffing, { isLoading: isRespondingStaffing }] = useRespondTaskStaffingMutation();
    const [createSubtask, { isLoading: isCreatingSubtask }] = useCreateSubtaskMutation();

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

    const assignableMembers = useMemo(() => (
        (team?.members || []).filter(member =>
            member.user?.id && !['ACCOUNT', 'PROJECT_MANAGER'].includes(member.role)
        )
    ), [team?.members]);

    const subtasks = task?.subtasks || [];
    const budget = Number(task?.vinicoinBudget ?? task?.job?.vinicoin ?? 0);
    const allocated = subtasks.reduce(
        (total, subtask) => total + Number(subtask.vinicoinAllocation || 0),
        0
    );
    const remaining = Math.max(0, budget - allocated);

    if (!task?.project) return null;

    if (task.parentTaskId) {
        return (
            <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Coins className="h-5 w-5 text-[#F38820]" />
                            <h2 className="text-lg font-bold text-gray-900">Phân bổ Vinicoin của subtask</h2>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Thuộc công việc: {task.parentTask?.nickname || task.parentTask?.name || 'Task gốc'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-orange-50 px-4 py-2 font-black text-orange-700">
                            {formatNumber(task.vinicoinAllocation || 0)} Vinicoin
                        </span>
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
        const vinicoinAllocation = parseNumber(subtaskForm.vinicoinAllocation);
        if (!subtaskForm.name.trim() || !subtaskForm.assigneeId) {
            toast.error('Vui lòng nhập tên và chọn người thực hiện');
            return;
        }
        if (vinicoinAllocation < 0 || vinicoinAllocation > remaining) {
            toast.error(`Vinicoin phân bổ không được vượt quá ${formatNumber(remaining)}`);
            return;
        }

        try {
            await createSubtask({
                id: task.id,
                projectId: task.project.id,
                name: subtaskForm.name.trim(),
                assigneeId: subtaskForm.assigneeId,
                vinicoinAllocation,
                description: subtaskForm.description.trim() || undefined,
            }).unwrap();
            toast.success('Đã tạo và phân công subtask');
            setSubtaskForm(emptySubtaskForm);
            setIsSubtaskModalOpen(false);
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể tạo subtask');
        }
    };

    return (
        <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[#F38820]">
                        <Coins className="h-5 w-5" />
                        <h2 className="text-lg font-bold text-gray-900">Phân chia công việc và Vinicoin</h2>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                        Subtask nhận phần được phân bổ; người thực hiện task chính nhận phần quỹ còn lại.
                    </p>
                </div>

                {canDelegate && (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsStaffingModalOpen(true)}
                            disabled={isPendingStaffingRequest}
                            className="border-orange-200 text-orange-700 hover:bg-orange-50"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            {isPendingStaffingRequest ? 'Đang chờ PM' : 'Yêu cầu thêm người'}
                        </Button>
                        <Button
                            onClick={() => setIsSubtaskModalOpen(true)}
                            className="bg-[#F38820] text-white hover:bg-[#D97010] focus:ring-orange-500"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm subtask
                        </Button>
                    </div>
                )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tổng quỹ</p>
                    <p className="mt-1 text-xl font-black text-slate-900">{formatNumber(budget)} Vinicoin</p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-500">Đã phân bổ</p>
                    <p className="mt-1 text-xl font-black text-orange-700">{formatNumber(allocated)} Vinicoin</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-500">Task chính nhận</p>
                    <p className="mt-1 text-xl font-black text-emerald-700">{formatNumber(remaining)} Vinicoin</p>
                </div>
            </div>

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
                                    onClick={() => handleRespondStaffing('RESOLVE')}
                                    isLoading={isRespondingStaffing}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Đã thêm người
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
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Danh sách subtask</h3>
                    <span className="text-sm font-semibold text-gray-400">{subtasks.length} công việc</span>
                </div>

                {subtasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-gray-500">Chưa có subtask</p>
                        <p className="mt-1 text-xs text-gray-400">Account có thể chia công việc sau khi PM bổ sung đủ nhân sự.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {subtasks.map(subtask => (
                            <button
                                key={subtask.id}
                                type="button"
                                onClick={() => navigate(`/tasks/${subtask.id}`)}
                                className="grid w-full grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-slate-50 p-4 text-left transition-colors hover:border-orange-200 hover:bg-orange-50/40 md:grid-cols-[1fr_auto_auto] md:items-center"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-bold text-gray-900">{subtask.name}</p>
                                    <p className="mt-1 text-xs text-gray-500">{subtask.assignee?.fullName || 'Chưa phân công'}</p>
                                </div>
                                <span className="text-xs font-bold text-gray-500">
                                    {TASK_STATUS_LABELS[subtask.status] || subtask.status}
                                </span>
                                <span className="font-black text-orange-700">
                                    {formatNumber(subtask.vinicoinAllocation || 0)} Vinicoin
                                </span>
                            </button>
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

            <Modal
                isOpen={isSubtaskModalOpen}
                onClose={() => setIsSubtaskModalOpen(false)}
                title="Tạo và phân công subtask"
                className="max-w-xl"
            >
                <div className="space-y-4">
                    <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
                        Quỹ còn lại: {formatNumber(remaining)} Vinicoin
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
                                <option key={member.id} value={member.user.id}>{member.user.fullName}</option>
                            ))}
                        </select>
                        {assignableMembers.length === 0 && (
                            <p className="mt-2 text-xs font-semibold text-amber-600">PM cần thêm nhân sự vào đội dự án trước.</p>
                        )}
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-gray-700">Vinicoin phân bổ</label>
                        <input
                            inputMode="numeric"
                            value={formatNumber(subtaskForm.vinicoinAllocation)}
                            onChange={event => {
                                const rawValue = event.target.value.replace(/[^0-9]/g, '');
                                setSubtaskForm(current => ({ ...current, vinicoinAllocation: rawValue }));
                            }}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            placeholder="0"
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
                        <Button variant="outline" onClick={() => setIsSubtaskModalOpen(false)}>Hủy</Button>
                        <Button
                            onClick={handleCreateSubtask}
                            isLoading={isCreatingSubtask}
                            disabled={assignableMembers.length === 0}
                            className="bg-[#F38820] text-white hover:bg-[#D97010] focus:ring-orange-500"
                        >
                            Tạo subtask
                        </Button>
                    </div>
                </div>
            </Modal>
        </section>
    );
};
