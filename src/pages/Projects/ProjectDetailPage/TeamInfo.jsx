import { useMemo, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGetMeQuery } from '../../../api/auth';
import { useGetUsersQuery } from '../../../api/users';
import {
    useAddTeamMemberMutation,
    useGetTeamMembersQuery,
    useRemoveTeamMemberMutation,
    useUpdateTeamMemberRolesMutation,
} from '../../../api/teams';
import { TEAM_MEMBER_ROLE, TEAM_MEMBER_ROLE_LABELS, USER_ROLE } from '../../../utils/enums';
import { getCurrentUserId, getUserAccountRole, isSameUser } from '../../../utils/authUser';
import { formatWorkloadLabel, getWorkloadColor, getWorkloadDisplayPercent } from '../../../utils/workload';

const prioritizeLeadRole = (roles) => [
    TEAM_MEMBER_ROLE.ACCOUNT,
    ...roles.filter(role => role !== TEAM_MEMBER_ROLE.ACCOUNT),
];

const ROLE_DISPLAY_ORDER = [
    TEAM_MEMBER_ROLE.PROJECT_MANAGER,
    TEAM_MEMBER_ROLE.ACCOUNT,
    TEAM_MEMBER_ROLE.EDITOR,
    TEAM_MEMBER_ROLE.GRAPHIC_DESIGNER,
    TEAM_MEMBER_ROLE.CONTENT_CREATOR,
    TEAM_MEMBER_ROLE.CAMERAMAN,
    TEAM_MEMBER_ROLE.SCRIPTER,
    TEAM_MEMBER_ROLE.SOCIAL_MEDIA_MANAGER,
    TEAM_MEMBER_ROLE.SEO_SPECIALIST,
];

const sortRoles = (roles) => [...roles].sort(
    (a, b) => ROLE_DISPLAY_ORDER.indexOf(a) - ROLE_DISPLAY_ORDER.indexOf(b)
);

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

export const TeamInfo = ({ team, isOnHold = false }) => {
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
    const [updateMemberRoles, { isLoading: isUpdatingRoles }] = useUpdateTeamMemberRolesMutation();
    const [removeMember] = useRemoveTeamMemberMutation();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([TEAM_MEMBER_ROLE.EDITOR]);
    const [editingUserId, setEditingUserId] = useState('');
    const [draftRoles, setDraftRoles] = useState([]);

    const currentUserId = getCurrentUserId(currentUser);
    const currentMembership = members.find(member => isSameUser(member.user?.id, currentUserId));
    const isCurrentProjectManager = currentUser?.role === 'PM' && currentMembership?.role === TEAM_MEMBER_ROLE.PROJECT_MANAGER;
    const isCurrentTeamLead = isSameUser(currentUserId, team?.teamLead?.id);
    const canManageTeam = !isOnHold && (currentUser?.role === 'ADMIN' || isCurrentProjectManager);
    const canAddMember = canManageTeam;
    const assignableMemberRoles = useMemo(
        () => prioritizeLeadRole(Object.values(TEAM_MEMBER_ROLE).filter(role => role !== TEAM_MEMBER_ROLE.PROJECT_MANAGER)),
        []
    );
    const memberUserIds = useMemo(() => new Set(members.map(member => member.user?.id)), [members]);
    const getRolesOfUser = (userId) => new Set(
        members.filter(member => isSameUser(member.user?.id, userId)).map(member => member.role)
    );
    const availableUsers = users.filter(user => {
        const assignedRoles = getRolesOfUser(user.id);
        return !assignedRoles.has(TEAM_MEMBER_ROLE.PROJECT_MANAGER)
            && assignableMemberRoles.some(role => !assignedRoles.has(role));
    });
    const selectedUserRoles = getRolesOfUser(selectedUserId);
    const availableRolesForSelectedUser = assignableMemberRoles.filter(role => !selectedUserRoles.has(role));
    const editableRoleOptions = useMemo(
        () => sortRoles(Object.values(TEAM_MEMBER_ROLE).filter(role => role !== TEAM_MEMBER_ROLE.PROJECT_MANAGER)),
        []
    );
    const groupedMembers = useMemo(() => {
        const groups = new Map();
        members.forEach(member => {
            const userId = member.user?.id;
            if (!userId) return;
            const group = groups.get(userId) || { userId, user: member.user, memberships: [], roles: [] };
            group.memberships.push(member);
            group.roles.push(member.role);
            if (!group.user?.workload && member.user?.workload) group.user = member.user;
            groups.set(userId, group);
        });

        const getPriority = (group) => {
            if (group.roles.includes(TEAM_MEMBER_ROLE.PROJECT_MANAGER)) return 0;
            if (isSameUser(group.userId, team?.teamLead?.id) || group.roles.includes(TEAM_MEMBER_ROLE.ACCOUNT)) return 1;
            return 2;
        };

        return [...groups.values()].map(group => ({
            ...group,
            roles: sortRoles([...new Set(group.roles)])
        })).sort((a, b) => {
            const priorityDiff = getPriority(a) - getPriority(b);
            if (priorityDiff !== 0) return priorityDiff;
            return (a.user?.fullName || '').localeCompare(b.user?.fullName || '', 'vi');
        });
    }, [members, team?.teamLead?.id]);

    if (!team) return null;

    const handleAddMember = async () => {
        if (!selectedUserId || selectedRoles.length === 0) return;
        try {
            await addMember({ id: team.id, userId: selectedUserId, roles: selectedRoles }).unwrap();
            toast.success('Đã thêm nhân sự vào đội dự án');
            setSelectedUserId('');
            setSelectedRoles([TEAM_MEMBER_ROLE.EDITOR]);
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể thêm nhân sự');
        }
    };

    const handleSelectUser = (userId) => {
        setSelectedUserId(userId);
        const assignedRoles = getRolesOfUser(userId);
        const validSelectedRoles = selectedRoles.filter(role => !assignedRoles.has(role));
        setSelectedRoles(validSelectedRoles.length > 0
            ? validSelectedRoles
            : [assignableMemberRoles.find(role => !assignedRoles.has(role))].filter(Boolean));
    };

    const toggleSelectedRole = (role) => {
        setSelectedRoles(current => current.includes(role)
            ? current.filter(item => item !== role)
            : [...current, role]);
    };

    const openRoleEditor = (group) => {
        setEditingUserId(group.userId);
        setDraftRoles(group.roles);
    };

    const toggleDraftRole = (role) => {
        setDraftRoles(current => current.includes(role)
            ? current.filter(item => item !== role)
            : sortRoles([...current, role]));
    };

    const handleUpdateRoles = async (userId) => {
        if (draftRoles.length === 0) return;
        try {
            await updateMemberRoles({ teamId: team.id, userId, roles: draftRoles }).unwrap();
            toast.success('Đã cập nhật các vai trò');
            setEditingUserId('');
            setDraftRoles([]);
        } catch (error) {
            toast.error(error?.data?.message || 'Không thể cập nhật các vai trò');
        }
    };

    const handleRemoveMember = async (group) => {
        try {
            for (const membership of group.memberships) {
                await removeMember({ memberId: membership.id, teamId: team.id }).unwrap();
            }
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

                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Thành viên</p>
                    <div className="space-y-2">
                        {groupedMembers.map((group) => {
                            const isLead = isSameUser(group.userId, team.teamLead?.id);
                            const isProjectManager = group.roles.includes(TEAM_MEMBER_ROLE.PROJECT_MANAGER);
                            const accountRole = getUserAccountRole(group.user);
                            const canEditRoles = canManageTeam && !isProjectManager;
                            const isEditing = editingUserId === group.userId;
                            return (
                                <div key={group.userId} className="rounded-xl border border-gray-100 bg-white p-2">
                                    <div className="flex items-center gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                                                <p className="text-sm font-bold text-gray-900">
                                                    <span>{group.user?.fullName}</span>
                                                    {group.roles.map(role => (
                                                        <span key={role}> - {TEAM_MEMBER_ROLE_LABELS[role] || role}</span>
                                                    ))}
                                                </p>
                                                <WorkloadBadge workload={group.user?.workload} />
                                            </div>
                                            <p className="text-xs text-gray-500">{USER_ROLE[accountRole] || accountRole || 'Nhân sự'}</p>
                                        </div>
                                        {canEditRoles && (
                                            <button
                                                type="button"
                                                onClick={() => isEditing ? setEditingUserId('') : openRoleEditor(group)}
                                                className="shrink-0 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100"
                                            >
                                                {isEditing ? 'Đóng' : 'Cập nhật vai trò'}
                                            </button>
                                        )}
                                        {canManageTeam && !isLead && !isProjectManager && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMember(group)}
                                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                title="Xóa khỏi đội"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    {isEditing && (
                                        <div className="mt-2 rounded-lg border border-purple-100 bg-purple-50/40 p-3">
                                            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                                {editableRoleOptions.map(role => (
                                                    <label key={role} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-white">
                                                        <input
                                                            type="checkbox"
                                                            checked={draftRoles.includes(role)}
                                                            onChange={() => toggleDraftRole(role)}
                                                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                        />
                                                        <span>{TEAM_MEMBER_ROLE_LABELS[role] || role}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="mt-3 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingUserId('')}
                                                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateRoles(group.userId)}
                                                    disabled={draftRoles.length === 0 || isUpdatingRoles}
                                                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white disabled:bg-gray-300"
                                                >
                                                    Lưu vai trò
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {canAddMember && (
                    <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50/40 p-3">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-700">Thêm nhân sự</p>
                        <div className="space-y-2">
                            <select
                                value={selectedUserId}
                                onChange={(event) => handleSelectUser(event.target.value)}
                                className="w-full rounded-lg border border-purple-100 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                            >
                                <option value="">{availableUsers.length ? 'Chọn nhân sự' : 'Mọi nhân sự đã có đủ vai trò trong project'}</option>
                                {availableUsers.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.fullName} - {USER_ROLE[getUserAccountRole(item)] || getUserAccountRole(item) || 'Nhân sự'} - {formatWorkloadLabel(item.workload)}
                                    </option>
                                ))}
                            </select>
                            <div className="rounded-lg border border-purple-100 bg-white p-2">
                                <p className="mb-2 text-xs font-semibold text-gray-500">Chọn một hoặc nhiều vai trò</p>
                                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                    {availableRolesForSelectedUser.map((role) => (
                                        <label key={role} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-purple-50">
                                            <input
                                                type="checkbox"
                                                checked={selectedRoles.includes(role)}
                                                onChange={() => toggleSelectedRole(role)}
                                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span>{TEAM_MEMBER_ROLE_LABELS[role] || role}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddMember}
                                disabled={!selectedUserId || selectedRoles.length === 0 || isAdding}
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
