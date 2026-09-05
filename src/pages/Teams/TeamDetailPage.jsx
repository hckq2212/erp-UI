import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    UserPlus,
    UserMinus,
    Shield,
    User,
    Mail,
    MoreVertical,
    Trash2,
    Trash,
    Phone
} from 'lucide-react';
import {
    useGetTeamQuery,
    useAddTeamMemberMutation,
    useRemoveTeamMemberMutation,
    useUpdateTeamMemberMutation,
    useChangeLeadMutation
} from '../../api/teams';
import { useGetUsersQuery } from '../../api/users';
import { PROJECT_MANAGEMENT_ROLES, TEAM_MEMBER_ROLE, TEAM_MEMBER_ROLE_LABELS, USER_ROLE } from '../../utils/enums';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'react-toastify';
import { useGetMeQuery } from '../../api/auth';
import { getCurrentUserId, getUserAccountRole, isSameUser } from '../../utils/authUser';

export const TeamDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: team, isLoading, error } = useGetTeamQuery(id);
    const { data: users } = useGetUsersQuery();
    const { data: currentUser } = useGetMeQuery();

    const [addMember, { isLoading: isAddingMember }] = useAddTeamMemberMutation();
    const [removeMember] = useRemoveTeamMemberMutation();
    const [updateMember] = useUpdateTeamMemberMutation();
    const [changeLead, { isLoading: isChangingLead }] = useChangeLeadMutation();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState(TEAM_MEMBER_ROLE.EDITOR);
    const currentUserId = getCurrentUserId(currentUser);
    const canChangeLead = currentUser?.role === 'ADMIN' || currentUser?.role === 'BOD';
    const canManageTeam = PROJECT_MANAGEMENT_ROLES.includes(currentUser?.role) &&
        (canChangeLead || isSameUser(currentUserId, team?.teamLead?.id));

    // Filter out users who are already members of this team
    const availableUsers = useMemo(() => {
        if (!users || !team?.members) return users;
        const memberUserIds = new Set(team.members.map(m => m.user?.id));
        return users.filter(user => !memberUserIds.has(user.id));
    }, [users, team?.members]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedUserId) return;

        try {
            await addMember({ id, userId: selectedUserId, role: selectedRole }).unwrap();
            toast.success('Thêm thành viên thành công');
            setIsAddModalOpen(false);
            setSelectedUserId('');
        } catch (err) {
            toast.error(err?.data?.message || 'Không thể thêm thành viên');
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi đội?')) return;
        try {
            await removeMember({ memberId, teamId: id }).unwrap();
            toast.success('Đã xóa thành viên');
        } catch (err) {
            toast.error(err?.data?.message || 'Không thể xóa thành viên');
        }
    };

    const handleUpdateRole = async (memberId, role) => {
        try {
            await updateMember({ memberId, teamId: id, role }).unwrap();
            toast.success('Đã cập nhật vai trò');
        } catch (err) {
            toast.error(err?.data?.message || 'Không thể cập nhật vai trò');
        }
    };

    const handleChangeLead = async (newLeadId) => {
        if (!window.confirm('Bạn có chắc chắn muốn thay đổi Lead cho đội này?')) return;
        try {
            await changeLead({ id, newLeadId }).unwrap();
            toast.success('Thay đổi Lead thành công');
        } catch (err) {
            toast.error(err?.data?.message || 'Không thể thay đổi Lead');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !team) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Không tìm thấy thông tin đội dự án</p>
                <Button onClick={() => navigate('/teams')} variant="outline" className="mt-4">
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl py-2 mx-auto space-y-6">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate('/teams')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Quay lại danh sách đội</span>
                </button>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
                    {canManageTeam && (
                        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            Thêm Thành Viên
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Team Summary & Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Thông tin đội
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Trưởng nhóm (Lead)</label>
                                {team.teamLead ? (
                                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="font-semibold text-blue-900">{team.teamLead.fullName}</div>
                                        <div className="text-xs text-blue-700 mt-0.5">{team.teamLead.phoneNumber}</div>
                                    </div>
                                ) : (
                                    <div className="mt-2 text-sm text-gray-500 italic">Chưa có Lead</div>
                                )}
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Tổng thành viên</span>
                                    <span className="font-semibold text-gray-900">{team.members?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Members List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                            <h2 className="font-semibold text-gray-900">Danh sách thành viên</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thành viên</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {team.members?.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 border border-gray-200">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div
                                                        onClick={() => navigate(`/users/${member.user?.id}`)}
                                                        className="font-medium text-gray-900 flex items-center gap-2">
                                                        {member.user?.fullName || member.user?.username}
                                                        {isSameUser(team.teamLead?.id, member.user?.id) && (
                                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">LEAD</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {USER_ROLE[getUserAccountRole(member.user)] || getUserAccountRole(member.user) || 'Nhân sự'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {member.user?.phoneNumber || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {canManageTeam && !isSameUser(team.teamLead?.id, member.user?.id) ? (
                                                    <select
                                                        value={member.role}
                                                        onChange={(event) => handleUpdateRole(member.id, event.target.value)}
                                                        className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-700"
                                                    >
                                                        {Object.values(TEAM_MEMBER_ROLE).map((role) => (
                                                            <option key={role} value={role}>{TEAM_MEMBER_ROLE_LABELS[role] || role}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    TEAM_MEMBER_ROLE_LABELS[member.role] || member.role
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {canChangeLead && !isSameUser(team.teamLead?.id, member.user?.id) && (
                                                        <button
                                                            onClick={() => handleChangeLead(member.user?.id)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Đặt làm Lead"
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {canManageTeam && !isSameUser(team.teamLead?.id, member.user?.id) && (
                                                        <button
                                                            onClick={() => handleRemoveMember(member.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Xóa thành viên"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!team.members || team.members.length === 0) && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">
                                                Chưa có thành viên nào trong đội này.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Member Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Thêm Thành Viên Vào Đội"
            >
                <form onSubmit={handleAddMember} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Chọn nhân viên
                        </label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="">-- Chọn thành viên --</option>
                            {availableUsers?.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.fullName || user.username} - {USER_ROLE[getUserAccountRole(user)] || getUserAccountRole(user) || 'Nhân sự'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vai trò
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                            {Object.keys(TEAM_MEMBER_ROLE).map(roleKey => (
                                <option key={roleKey} value={TEAM_MEMBER_ROLE[roleKey]}>
                                    {TEAM_MEMBER_ROLE_LABELS[TEAM_MEMBER_ROLE[roleKey]]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" isLoading={isAddingMember} disabled={!selectedUserId}>
                            Thêm
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
