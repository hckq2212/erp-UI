import { useEffect, useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRespondTaskStaffingMutation } from '../../api/tasks';
import { useAddTeamMemberMutation } from '../../api/teams';
import { useGetUsersQuery } from '../../api/users';
import { TEAM_MEMBER_ROLE, TEAM_MEMBER_ROLE_LABELS } from '../../utils/enums';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const ResolveStaffingRequestModal = ({
    isOpen,
    onClose,
    task,
    team: providedTeam,
    projectId: providedProjectId,
}) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState(TEAM_MEMBER_ROLE.EDITOR);
    const [memberAddedAwaitingResolve, setMemberAddedAwaitingResolve] = useState(false);
    const [addTeamMember, { isLoading: isAddingTeamMember }] = useAddTeamMemberMutation();
    const [respondStaffing, { isLoading: isRespondingStaffing }] = useRespondTaskStaffingMutation();
    const { data: users = [] } = useGetUsersQuery(undefined, { skip: !isOpen });

    const team = providedTeam || task?.project?.team;
    const projectId = providedProjectId || task?.project?.id || task?.projectId;
    const isPendingRequest = task?.supportRequestType === 'STAFFING' &&
        task?.isSupportRequested &&
        !task?.isSupportAccepted;

    useEffect(() => {
        setSelectedUserId('');
        setSelectedRole(TEAM_MEMBER_ROLE.EDITOR);
        setMemberAddedAwaitingResolve(false);
    }, [task?.id]);

    useEffect(() => {
        if (isPendingRequest) return;
        setMemberAddedAwaitingResolve(false);
    }, [isPendingRequest]);

    const availableUsers = useMemo(() => {
        const existingUserIds = new Set(
            (team?.members || [])
                .map(member => member.user?.id || member.userId)
                .filter(Boolean)
                .map(String)
        );

        return users.filter(user => !existingUserIds.has(String(user.id)));
    }, [team?.members, users]);

    const memberRoles = useMemo(
        () => Object.values(TEAM_MEMBER_ROLE).filter(
            role => role !== TEAM_MEMBER_ROLE.PROJECT_MANAGER
        ),
        []
    );

    const handleClose = () => {
        onClose();
        if (!memberAddedAwaitingResolve) {
            setSelectedUserId('');
            setSelectedRole(TEAM_MEMBER_ROLE.EDITOR);
        }
    };

    const handleAddMemberAndResolve = async () => {
        if (!task?.id || !projectId || !team?.id) {
            toast.error('Không đủ thông tin task hoặc đội dự án');
            return;
        }

        if (!memberAddedAwaitingResolve && !selectedUserId) {
            toast.error('Vui lòng chọn nhân sự cần thêm');
            return;
        }

        if (!memberAddedAwaitingResolve) {
            try {
                await addTeamMember({
                    id: team.id,
                    userId: selectedUserId,
                    role: selectedRole,
                }).unwrap();
                setMemberAddedAwaitingResolve(true);
            } catch (error) {
                toast.error(error?.data?.message || 'Không thể thêm nhân sự vào đội dự án');
                return;
            }
        }

        try {
            await respondStaffing({
                id: task.id,
                projectId,
                action: 'RESOLVE',
            }).unwrap();
            toast.success('Đã thêm nhân sự và hoàn tất yêu cầu');
            setMemberAddedAwaitingResolve(false);
            setSelectedUserId('');
            setSelectedRole(TEAM_MEMBER_ROLE.EDITOR);
            onClose();
        } catch (error) {
            const detail = error?.data?.message || 'Vui lòng thử lại.';
            toast.error(`Đã thêm nhân sự nhưng chưa thể hoàn tất yêu cầu. ${detail}`);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Bổ sung nhân sự theo yêu cầu"
            className="max-w-lg"
        >
            <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <p className="font-bold">Nhu cầu từ Account</p>
                    <p className="mt-1">{task?.supportRequestNote || 'Không có ghi chú cụ thể.'}</p>
                </div>

                {memberAddedAwaitingResolve ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                        Nhân sự đã được thêm vào đội. Hãy thử xác nhận hoàn tất yêu cầu lại.
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">Nhân sự</label>
                            <select
                                value={selectedUserId}
                                onChange={event => setSelectedUserId(event.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            >
                                <option value="">
                                    {availableUsers.length ? 'Chọn nhân sự' : 'Không còn nhân sự có thể thêm'}
                                </option>
                                {availableUsers.map(user => (
                                    <option key={user.id} value={user.id}>{user.fullName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">Vai trò trong đội</label>
                            <select
                                value={selectedRole}
                                onChange={event => setSelectedRole(event.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            >
                                {memberRoles.map(role => (
                                    <option key={role} value={role}>
                                        {TEAM_MEMBER_ROLE_LABELS[role] || role}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={handleClose}>Hủy</Button>
                    <Button
                        onClick={handleAddMemberAndResolve}
                        isLoading={isAddingTeamMember || isRespondingStaffing}
                        disabled={
                            isAddingTeamMember ||
                            isRespondingStaffing ||
                            (!memberAddedAwaitingResolve && !selectedUserId)
                        }
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {memberAddedAwaitingResolve ? 'Thử xác nhận lại' : 'Thêm và xác nhận'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
