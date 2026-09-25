import { useEffect, useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRespondTaskStaffingMutation } from '../../api/tasks';
import { useAddTeamMemberMutation, useGetTeamMembersQuery } from '../../api/teams';
import { useGetUsersQuery } from '../../api/users';
import { TEAM_MEMBER_ROLE, TEAM_MEMBER_ROLE_LABELS, USER_ROLE } from '../../utils/enums';
import { getUserAccountRole, isSameUser } from '../../utils/authUser';
import { formatWorkloadLabel } from '../../utils/workload';
import { getTeamMemberRoles } from '../../utils/teamMember';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

const prioritizeLeadRole = (roles) => [
    TEAM_MEMBER_ROLE.ACCOUNT,
    ...roles.filter(role => role !== TEAM_MEMBER_ROLE.ACCOUNT),
];

export const ResolveStaffingRequestModal = ({
    isOpen,
    onClose,
    onSuccess,
    task,
    project,
    team: providedTeam,
    projectId: providedProjectId,
}) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([TEAM_MEMBER_ROLE.EDITOR]);
    const [memberAddedAwaitingResolve, setMemberAddedAwaitingResolve] = useState(false);
    const [addTeamMember, { isLoading: isAddingTeamMember }] = useAddTeamMemberMutation();
    const [respondTaskStaffing, { isLoading: isRespondingTaskStaffing }] = useRespondTaskStaffingMutation();

    const workloadDate = useMemo(() => {
        const now = new Date();
        return {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
        };
    }, []);

    const team = providedTeam || project?.team || task?.project?.team;
    const projectId = providedProjectId || project?.id || task?.project?.id || task?.projectId;
    const isPendingRequest = (
        task?.supportRequestType === 'STAFFING' &&
        task?.isSupportRequested &&
        !task?.isSupportAccepted
    ) || Boolean(project?.isStaffingRequested);

    const { data: users = [] } = useGetUsersQuery(workloadDate, { skip: !isOpen });
    const { data: fetchedMembers = [] } = useGetTeamMembersQuery(
        team?.id ? { teamId: team.id, ...workloadDate } : undefined,
        { skip: !isOpen || !team?.id }
    );

    const effectiveMembers = fetchedMembers.length > 0 ? fetchedMembers : (team?.members || []);

    const assignableMemberRoles = useMemo(
        () => prioritizeLeadRole(Object.values(TEAM_MEMBER_ROLE).filter(role => role !== TEAM_MEMBER_ROLE.PROJECT_MANAGER)),
        []
    );

    const getRolesOfUser = (userId) => new Set(
        effectiveMembers
            .filter(member => isSameUser(member.user?.id || member.userId, userId))
            .flatMap(getTeamMemberRoles)
    );

    const availableUsers = useMemo(() => {
        return users.filter(user => {
            const assignedRoles = getRolesOfUser(user.id);
            return !assignedRoles.has(TEAM_MEMBER_ROLE.PROJECT_MANAGER)
                && assignableMemberRoles.some(role => !assignedRoles.has(role));
        });
    }, [users, effectiveMembers, assignableMemberRoles]);

    const selectedUserRoles = useMemo(() => getRolesOfUser(selectedUserId), [selectedUserId, effectiveMembers]);
    const availableRolesForSelectedUser = useMemo(
        () => assignableMemberRoles.filter(role => !selectedUserRoles.has(role)),
        [assignableMemberRoles, selectedUserRoles]
    );

    useEffect(() => {
        setSelectedUserId('');
        setSelectedRoles([TEAM_MEMBER_ROLE.EDITOR]);
        setMemberAddedAwaitingResolve(false);
    }, [task?.id]);

    useEffect(() => {
        if (isPendingRequest) return;
        setMemberAddedAwaitingResolve(false);
    }, [isPendingRequest]);

    const handleSelectUser = (userId) => {
        setSelectedUserId(userId);
        const assignedRoles = getRolesOfUser(userId);
        const validSelectedRoles = selectedRoles.filter(role => !assignedRoles.has(role));
        setSelectedRoles(
            validSelectedRoles.length > 0
                ? validSelectedRoles
                : [assignableMemberRoles.find(role => !assignedRoles.has(role))].filter(Boolean)
        );
    };

    const toggleSelectedRole = (role) => {
        setSelectedRoles(current =>
            current.includes(role)
                ? current.filter(item => item !== role)
                : [...current, role]
        );
    };

    const handleClose = () => {
        onClose();
        if (!memberAddedAwaitingResolve) {
            setSelectedUserId('');
            setSelectedRoles([TEAM_MEMBER_ROLE.EDITOR]);
        }
    };

    const handleAddMemberAndResolve = async () => {
        if (!task?.id && !projectId) {
            toast.error('Không đủ thông tin công việc hoặc dự án');
            return;
        }

        if (!team?.id) {
            toast.error('Không tìm thấy thông tin đội dự án');
            return;
        }

        if (!memberAddedAwaitingResolve && (!selectedUserId || selectedRoles.length === 0)) {
            toast.error('Vui lòng chọn nhân sự và ít nhất một vai trò');
            return;
        }

        if (!memberAddedAwaitingResolve) {
            try {
                await addTeamMember({
                    id: team.id,
                    userId: selectedUserId,
                    role: selectedRoles[0],
                    roles: selectedRoles,
                }).unwrap();
                setMemberAddedAwaitingResolve(true);
            } catch (error) {
                toast.error(error?.data?.message || 'Không thể thêm nhân sự vào đội dự án');
                return;
            }
        }

        try {
            if (task?.id) {
                await respondTaskStaffing({
                    id: task.id,
                    projectId,
                    action: 'RESOLVE',
                }).unwrap();
            }
            toast.success('Đã thêm nhân sự và hoàn tất yêu cầu');
            setMemberAddedAwaitingResolve(false);
            setSelectedUserId('');
            setSelectedRoles([TEAM_MEMBER_ROLE.EDITOR]);
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (error) {
            const detail = error?.data?.message || 'Vui lòng thử lại.';
            toast.error(`Đã thêm nhân sự nhưng chưa thể hoàn tất yêu cầu. ${detail}`);
        }
    };

    const isResponding = isRespondingTaskStaffing;
    const requestNote = task?.supportRequestNote || project?.staffingRequestNote;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={task ? 'Bổ sung nhân sự theo yêu cầu' : 'Bổ sung nhân sự cho dự án'}
            className="max-w-lg"
        >
            <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <p className="font-bold">Nhu cầu từ Account</p>
                    <p className="mt-1">{requestNote || 'Không có ghi chú cụ thể.'}</p>
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
                                onChange={event => handleSelectUser(event.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            >
                                <option value="">
                                    {availableUsers.length ? 'Chọn nhân sự' : 'Mọi nhân sự đã có đủ vai trò trong project'}
                                </option>
                                {availableUsers.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.fullName} - {USER_ROLE[getUserAccountRole(item)] || getUserAccountRole(item) || 'Nhân sự'} - {formatWorkloadLabel(item.workload)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">Vai trò trong đội</label>
                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                                <p className="mb-2 text-xs font-semibold text-gray-500">Chọn một hoặc nhiều vai trò</p>
                                {availableRolesForSelectedUser.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                        {availableRolesForSelectedUser.map(role => (
                                            <label
                                                key={role}
                                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRoles.includes(role)}
                                                    onChange={() => toggleSelectedRole(role)}
                                                    className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                                                />
                                                <span>{TEAM_MEMBER_ROLE_LABELS[role] || role}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500">Nhân sự này đã có đủ các vai trò trong dự án.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={handleClose}>Hủy</Button>
                    <Button
                        onClick={handleAddMemberAndResolve}
                        isLoading={isAddingTeamMember || isResponding}
                        disabled={
                            isAddingTeamMember ||
                            isResponding ||
                            (!memberAddedAwaitingResolve && (!selectedUserId || selectedRoles.length === 0))
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
