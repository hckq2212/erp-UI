import { useMemo, useState } from 'react';
import { Plus, Trash2, Users, Phone, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGetMeQuery } from '../../../api/auth';
import { useGetUsersQuery } from '../../../api/users';
import {
    useAddTeamMemberMutation,
    useGetTeamMembersQuery,
    useRemoveTeamMemberMutation,
    useUpdateTeamMemberMutation,
} from '../../../api/teams';
import { TEAM_MEMBER_ROLE, TEAM_MEMBER_ROLE_LABELS, USER_ROLE } from '../../../utils/enums';
import { getCurrentUserId, getUserAccountRole, isSameUser } from '../../../utils/authUser';
import { formatWorkloadLabel, getWorkloadColor, getWorkloadDisplayPercent } from '../../../utils/workload';

const prioritizeLeadRole = (roles) => [
    TEAM_MEMBER_ROLE.ACCOUNT,
    ...roles.filter(role => role !== TEAM_MEMBER_ROLE.ACCOUNT),
];

const getRoleSelectClassName = (role, baseClassName) => {
    if (role !== TEAM_MEMBER_ROLE.ACCOUNT) return baseClassName;
    return `${baseClassName} border-emerald-300 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100`;
};

const getRoleOptionClassName = (role) =>
    role === TEAM_MEMBER_ROLE.ACCOUNT ? 'bg-emerald-50 font-bold text-emerald-700' : '';

const WorkloadBadge = ({ workload }) => {
    const displayPercent = getWorkloadDisplayPercent(workload);

    return (
        <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black text-white shadow-sm"
            style={{ backgroundColor: getWorkloadColor(displayPercent) }}
        >
            {formatWorkloadLabel(workload)}
        </span>
    );
};

export const TeamInfo = ({ team }) => {
    const { data: currentUser } = useGetMeQuery();
    const workloadDate = useMemo(() => {
        const now = new Date();
        return {
            month: now.getMonth() + 1,
            year: now.getFullYear()
        };
    }, []);
    const { data: users = [] } = useGetUsersQuery(workloadDate);
    const { data: members = [] } = useGetTeamMembersQuery(
        team?.id ? { teamId: team.id, ...workloadDate } : undefined,
        { skip: !team?.id }
    );
    const [addMember, { isLoading: isAdding }] = useAddTeamMemberMutation();
    const [updateMember] = useUpdateTeamMemberMutation();
    const [removeMember] = useRemoveTeamMemberMutation();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState(TEAM_MEMBER_ROLE.EDITOR);

    const currentUserId = getCurrentUserId(currentUser);
    const currentMembership = members.find(member => isSameUser(member.user?.id, currentUserId));
    const isCurrentProjectManager = currentUser?.role === 'PM' && currentMembership?.role === TEAM_MEMBER_ROLE.PROJECT_MANAGER;
    const isCurrentTeamLead = isSameUser(currentUserId, team?.teamLead?.id);
    const canManageTeam = currentUser?.role === 'ADMIN' || currentUser?.role === 'BOD'|| isCurrentProjectManager;
    const memberUserIds = useMemo(() => new Set(members.map(member => member.user?.id)), [members]);
    const availableUsers = users.filter(user => !memberUserIds.has(user.id));
    const assignableMemberRoles = useMemo(
        () => prioritizeLeadRole(Object.values(TEAM_MEMBER_ROLE).filter(role => role !== TEAM_MEMBER_ROLE.PROJECT_MANAGER)),
        []
    );
    const sortedMembers = useMemo(() => {
        const getPriority = (member) => {
            if (member.role === TEAM_MEMBER_ROLE.PROJECT_MANAGER) return 0;
            if (isSameUser(member.user?.id, team?.teamLead?.id) || member.role === TEAM_MEMBER_ROLE.ACCOUNT) return 1;
            return 2;
        };

        return [...members].sort((a, b) => {
            const priorityDiff = getPriority(a) - getPriority(b);
            if (priorityDiff !== 0) return priorityDiff;
            return (a.user?.fullName || '').localeCompare(b.user?.fullName || '', 'vi');
        });
    }, [members, team?.teamLead?.id]);

    if (!team) return null;

    const handleAddMember = async () => {
        if (!selectedUserId) return;
        try {
            await addMember({ id: team.id, userId: selectedUserId, role: selectedRole }).unwrap();
            toast.success('Đã thêm nhân sự vào đội dự án');
            setSelectedUserId('');
            setSelectedRole(TEAM_MEMBER_ROLE.EDITOR);
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể thêm nhân sự');
        }
    };

    const handleUpdateRole = async (memberId, role) => {
        try {
            await updateMember({ memberId, teamId: team.id, role }).unwrap();
            toast.success('Đã cập nhật vai trò');
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể cập nhật vai trò');
        }
    };

    const handleRemoveMember = async (memberId) => {
        try {
            await removeMember({ memberId, teamId: team.id }).unwrap();
            toast.success('Đã xóa nhân sự khỏi đội dự án');
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể xóa nhân sự');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
            <div className="flex items-center gap-2 mb-5">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900">Đội thực hiện</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Tên đội</p>
                    <p className="text-sm font-semibold text-purple-700">{team.name}</p>
                </div>

                {/* {team.teamLead && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">Trưởng nhóm</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{team.teamLead.fullName}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                    <Phone className="w-3 h-3" />
                                    <span>{team.teamLead.phoneNumber}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )} */}

                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Thành viên</p>
                    <div className="space-y-2">
                        {sortedMembers.map((member) => {
                            const isLead = isSameUser(member.user?.id, team.teamLead?.id);
                            const isProjectManager = member.role === TEAM_MEMBER_ROLE.PROJECT_MANAGER;
                            const accountRole = getUserAccountRole(member.user);
                            const memberRoleLabel = TEAM_MEMBER_ROLE_LABELS[member.role] || member.role;
                            return (
                                <div key={member.id} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <p className="truncate text-sm font-bold text-gray-900">
                                                {member.user?.fullName} - {memberRoleLabel}
                                            </p>
                                            <WorkloadBadge workload={member.user?.workload} />
                                            {member.role === TEAM_MEMBER_ROLE.PROJECT_MANAGER && (
                                                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-700">PM</span>
                                            )}
                                            {(isLead || member.role === TEAM_MEMBER_ROLE.ACCOUNT) && (
                                                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">ACCOUNT</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">{USER_ROLE[accountRole] || accountRole || 'Nhân sự'}</p>
                                    </div>
                                    {canManageTeam && !isLead && !isProjectManager ? (
                                        <select
                                            value={member.role}
                                            onChange={(event) => handleUpdateRole(member.id, event.target.value)}
                                            className={getRoleSelectClassName(
                                                member.role,
                                                'max-w-[150px] rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-700'
                                            )}
                                        >
                                            {assignableMemberRoles.map((role) => (
                                                <option key={role} value={role} className={getRoleOptionClassName(role)}>
                                                    {TEAM_MEMBER_ROLE_LABELS[role] || role}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="rounded-lg bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700">
                                            {TEAM_MEMBER_ROLE_LABELS[member.role] || member.role}
                                        </span>
                                    )}
                                    {canManageTeam && !isLead && !isProjectManager && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                            title="Xóa khỏi đội"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {canManageTeam && (
                    <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50/40 p-3">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-700">Thêm nhân sự</p>
                        <div className="space-y-2">
                            <select
                                value={selectedUserId}
                                onChange={(event) => setSelectedUserId(event.target.value)}
                                className="w-full rounded-lg border border-purple-100 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                            >
                                <option value="">{availableUsers.length ? 'Chọn nhân sự' : 'Tất cả nhân sự đã có trong project'}</option>
                                {availableUsers.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.fullName} - {USER_ROLE[getUserAccountRole(item)] || getUserAccountRole(item) || 'Nhân sự'} - {formatWorkloadLabel(item.workload)}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedRole}
                                onChange={(event) => setSelectedRole(event.target.value)}
                                className={getRoleSelectClassName(
                                    selectedRole,
                                    'w-full rounded-lg border border-purple-100 bg-white px-3 py-2 text-sm font-medium text-gray-700'
                                )}
                            >
                                {assignableMemberRoles.map((role) => (
                                    <option key={role} value={role} className={getRoleOptionClassName(role)}>
                                        {TEAM_MEMBER_ROLE_LABELS[role] || role}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleAddMember}
                                disabled={!selectedUserId || isAdding}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                <Plus className="h-4 w-4" />
                                Thêm vào đội
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
