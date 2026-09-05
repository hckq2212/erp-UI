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
import { PROJECT_MANAGEMENT_ROLES, TEAM_MEMBER_ROLE, TEAM_MEMBER_ROLE_LABELS, USER_ROLE } from '../../../utils/enums';
import { getCurrentUserId, getUserAccountRole, isSameUser } from '../../../utils/authUser';

export const TeamInfo = ({ team }) => {
    const { data: currentUser } = useGetMeQuery();
    const { data: users = [] } = useGetUsersQuery();
    const { data: members = [] } = useGetTeamMembersQuery(team?.id, { skip: !team?.id });
    const [addMember, { isLoading: isAdding }] = useAddTeamMemberMutation();
    const [updateMember] = useUpdateTeamMemberMutation();
    const [removeMember] = useRemoveTeamMemberMutation();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState(TEAM_MEMBER_ROLE.EDITOR);

    const currentUserId = getCurrentUserId(currentUser);
    const canManageTeam = PROJECT_MANAGEMENT_ROLES.includes(currentUser?.role) &&
        (currentUser?.role === 'ADMIN' || currentUser?.role === 'BOD' || isSameUser(currentUserId, team?.teamLead?.id));
    const memberUserIds = useMemo(() => new Set(members.map(member => member.user?.id)), [members]);
    const availableUsers = users.filter(user => !memberUserIds.has(user.id));

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

                {team.teamLead && (
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
                )}

                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Thành viên</p>
                    <div className="space-y-2">
                        {members.map((member) => {
                            const isLead = isSameUser(member.user?.id, team.teamLead?.id);
                            const accountRole = getUserAccountRole(member.user);
                            return (
                                <div key={member.id} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-gray-900">{member.user?.fullName}</p>
                                        <p className="text-xs text-gray-500">{USER_ROLE[accountRole] || accountRole || 'Nhân sự'}</p>
                                    </div>
                                    {canManageTeam && !isLead ? (
                                        <select
                                            value={member.role}
                                            onChange={(event) => handleUpdateRole(member.id, event.target.value)}
                                            className="max-w-[150px] rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-700"
                                        >
                                            {Object.values(TEAM_MEMBER_ROLE).map((role) => (
                                                <option key={role} value={role}>{TEAM_MEMBER_ROLE_LABELS[role] || role}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="rounded-lg bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700">
                                            {TEAM_MEMBER_ROLE_LABELS[member.role] || member.role}
                                        </span>
                                    )}
                                    {canManageTeam && !isLead && (
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
                                        {item.fullName} - {USER_ROLE[getUserAccountRole(item)] || getUserAccountRole(item) || 'Nhân sự'}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedRole}
                                onChange={(event) => setSelectedRole(event.target.value)}
                                className="w-full rounded-lg border border-purple-100 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                            >
                                {Object.values(TEAM_MEMBER_ROLE).map((role) => (
                                    <option key={role} value={role}>{TEAM_MEMBER_ROLE_LABELS[role] || role}</option>
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
