import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateTeamMutation, useAddTeamMemberMutation, useChangeLeadMutation } from '../../api/teams';
import { useGetUsersQuery } from '../../api/users';
import { TEAM_MEMBER_ROLE, TEAM_MEMBER_ROLE_LABELS } from '../../utils/enums';
import { toast } from 'react-toastify';
import { Plus, Trash2, User, Shield } from 'lucide-react';
import { useState } from 'react';

export const TeamModal = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [leadId, setLeadId] = useState('');
    const [members, setMembers] = useState([]); // [{ userId, role }]

    const { data: users } = useGetUsersQuery();
    const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
    const [addMember] = useAddTeamMemberMutation();
    const [changeLead] = useChangeLeadMutation();

    const handleAddMemberRow = () => {
        setMembers([...members, { userId: '', role: TEAM_MEMBER_ROLE.EDITOR }]);
    };

    const handleRemoveMemberRow = (index) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const handleMemberChange = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        setMembers(newMembers);
    };

    // Users available for Lead selection (not already in members)
    const availableForLead = users?.filter(u =>
        !members.some(m => m.userId === u.id.toString())
    );

    // Get all selected IDs to filter member dropdowns
    const selectedUserIds = new Set([
        leadId,
        ...members.map(m => m.userId).filter(id => id !== '')
    ]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            const team = await createTeam({ name }).unwrap();

            // If Lead is selected, they MUST be added as a member first
            if (leadId) {
                // Add as Project Manager by default if they are Lead
                await addMember({
                    id: team.id,
                    userId: Number(leadId),
                    role: TEAM_MEMBER_ROLE.PROJECT_MANAGER
                }).unwrap();

                // Then promote to Lead
                await changeLead({ id: team.id, newLeadId: Number(leadId) }).unwrap();
            }

            // Add other Members
            const validMembers = members.filter(m => m.userId);
            for (const member of validMembers) {
                await addMember({
                    id: team.id,
                    userId: Number(member.userId),
                    role: member.role
                }).unwrap();
            }

            toast.success('Tạo đội dự án thành công');
            setName('');
            setLeadId('');
            setMembers([]);
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || 'Không thể tạo đội dự án hoàn chỉnh');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tạo Đội Dự Án Mới" className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên Đội
                        </label>
                        <Input
                            placeholder="Nhập tên đội dự án..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <Shield className="w-4 h-4 text-blue-600" />
                            Trưởng Nhóm (Lead)
                        </label>
                        <select
                            value={leadId}
                            onChange={(e) => setLeadId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="">-- Chọn Lead --</option>
                            {availableForLead?.map(user => (
                                <option key={user.id} value={user.id}>{user.fullName || user.username}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Thành viên đội</label>
                        <button
                            type="button"
                            onClick={handleAddMemberRow}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" />
                            Thêm thành viên
                        </button>
                    </div>

                    <div className="space-y-3">
                        {members.map((member, index) => (
                            <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-100 relative group">
                                <div className="flex-1">
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Thành viên</label>
                                    <select
                                        value={member.userId}
                                        onChange={(e) => handleMemberChange(index, 'userId', e.target.value)}
                                        className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-md text-sm outline-none"
                                        required
                                    >
                                        <option value="">-- Chọn --</option>
                                        {users?.filter(u =>
                                            u.id.toString() === member.userId || !selectedUserIds.has(u.id.toString())
                                        ).map(user => (
                                            <option key={user.id} value={user.id}>{user.fullName || user.username}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Vai trò</label>
                                    <select
                                        value={member.role}
                                        onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                                        className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-md text-sm outline-none"
                                        required
                                    >
                                        {Object.keys(TEAM_MEMBER_ROLE).map(roleKey => (
                                            <option key={roleKey} value={TEAM_MEMBER_ROLE[roleKey]}>
                                                {TEAM_MEMBER_ROLE_LABELS[TEAM_MEMBER_ROLE[roleKey]]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMemberRow(index)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {members.length === 0 && (
                            <div className="text-center py-4 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
                                Chưa có thành viên nào được thêm.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" isLoading={isCreating} disabled={!name.trim()}>
                        Tạo Đội
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
