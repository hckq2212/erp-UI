import { useMemo, useState, useEffect } from 'react';
import { Check, Plus, Trash2, Users, UserPlus, X } from 'lucide-react';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { useGetMeQuery } from '../../../api/auth';
import { useGetUsersQuery } from '../../../api/users';
import { useGetMyNotificationsQuery, useMarkAsReadMutation } from '../../../api/notifications';
import { useRespondTaskStaffingMutation } from '../../../api/tasks';
import {
    useAddTeamMemberMutation,
    useGetTeamMembersQuery,
    useRemoveTeamMemberMutation,
    useUpdateTeamMemberRolesMutation,
} from '../../../api/teams';
import {
    PROJECT_MEMBER_EXCLUDED_ACCOUNT_ROLES,
    TEAM_MEMBER_ROLE,
    TEAM_MEMBER_ROLE_LABELS,
    USER_ROLE,
} from '../../../utils/enums';
import { getCurrentUserId, getUserAccountRole, isSameUser } from '../../../utils/authUser';
import { formatWorkloadLabel, getWorkloadColor, getWorkloadDisplayPercent } from '../../../utils/workload';
import { getTeamMemberRoles, hasTeamMemberRole } from '../../../utils/teamMember';

const prioritizeLeadRole = (roles) => [
    TEAM_MEMBER_ROLE.ACCOUNT,
    ...roles.filter(role => role !== TEAM_MEMBER_ROLE.ACCOUNT),
];

const ROLE_DISPLAY_ORDER = [
    TEAM_MEMBER_ROLE.PROJECT_MANAGER,
    TEAM_MEMBER_ROLE.ACCOUNT,
    TEAM_MEMBER_ROLE.EDITOR,
    TEAM_MEMBER_ROLE.DESIGNER,
    TEAM_MEMBER_ROLE.CONTENT_CREATOR,
    TEAM_MEMBER_ROLE.CAMERAMAN,
    TEAM_MEMBER_ROLE.VIDEO_EDITOR,
    TEAM_MEMBER_ROLE.SOCIAL_MEDIA_MANAGER,
];

const USER_ROLE_GROUP_ORDER = [
    'CONTENT_D',
    'CONTENT_C',
    'CONTENT_B',
    'CONTENT_A',
    'EDITOR_D',
    'EDITOR_C',
    'EDITOR_B',
    'EDITOR_A',
    'DESIGNER_D',
    'DESIGNER_C',
    'DESIGNER_B',
    'DESIGNER_A',
    'STAFF_D',
    'STAFF_C',
    'STAFF_B',
    'STAFF_A',
    'OTHER',
];

const getAccountRoleLevelRank = (role) => {
    const rank = USER_ROLE_GROUP_ORDER.indexOf(role);
    return rank === -1 ? USER_ROLE_GROUP_ORDER.indexOf('OTHER') : rank;
};

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

export const TeamInfo = ({ team, isOnHold = false, isClosed = false, project }) => {
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
    const { data: notifications = [] } = useGetMyNotificationsQuery();
    const [markAsRead] = useMarkAsReadMutation();
    const [updateMemberRoles, { isLoading: isUpdatingRoles }] = useUpdateTeamMemberRolesMutation();
    const [removeMember] = useRemoveTeamMemberMutation();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([TEAM_MEMBER_ROLE.EDITOR]);
    const [editingUserId, setEditingUserId] = useState('');
    const [draftRoles, setDraftRoles] = useState([]);

    const currentUserId = getCurrentUserId(currentUser);
    const isCurrentProjectManager = currentUser?.role === 'PM' && members.some(member =>
        isSameUser(member.user?.id, currentUserId) && hasTeamMemberRole(member, TEAM_MEMBER_ROLE.PROJECT_MANAGER)
    );
    const isProjectLead = isSameUser(currentUserId, team?.teamLead?.id) ||
        isSameUser(currentUserId, team?.teamLeadId) ||
        members.some(member =>
            hasTeamMemberRole(member, TEAM_MEMBER_ROLE.ACCOUNT) && isSameUser(member.user?.id, currentUserId)
        );
    const isProjectClosed = isClosed || ['COMPLETED', 'CANCELLED'].includes(project?.status);
    const isProjectOnHold = isOnHold || project?.status === 'ON_HOLD' || Boolean(project?.isOnHold);
    const canManageTeam = !isProjectClosed && !isProjectOnHold && (currentUser?.role === 'ADMIN' || isCurrentProjectManager);
    const canAddMember = canManageTeam;
    const assignableMemberRoles = useMemo(
        () => prioritizeLeadRole(Object.values(TEAM_MEMBER_ROLE).filter(role => role !== TEAM_MEMBER_ROLE.PROJECT_MANAGER)),
        []
    );
    const memberUserIds = useMemo(() => new Set(members.map(member => member.user?.id)), [members]);
    const getRolesOfUser = (userId) => new Set(
        members.filter(member => isSameUser(member.user?.id, userId)).flatMap(getTeamMemberRoles)
    );
    const availableUsers = users.filter(user => {
        const hasExcludedAccountRole = user.accounts?.some(account =>
            PROJECT_MEMBER_EXCLUDED_ACCOUNT_ROLES.includes(account.role)
        ) || PROJECT_MEMBER_EXCLUDED_ACCOUNT_ROLES.includes(getUserAccountRole(user));
        const assignedRoles = getRolesOfUser(user.id);
        return !hasExcludedAccountRole
            && !assignedRoles.has(TEAM_MEMBER_ROLE.PROJECT_MANAGER)
            && assignableMemberRoles.some(role => !assignedRoles.has(role));
    });
    const availableUserOptions = useMemo(() => {
        const groupMap = new Map(USER_ROLE_GROUP_ORDER.map(role => [role, []]));

        availableUsers.forEach(item => {
            const accountRole = getUserAccountRole(item);
            const groupKey = USER_ROLE_GROUP_ORDER.includes(accountRole) ? accountRole : 'OTHER';
            const option = {
                value: item.id,
                role: accountRole,
                levelRank: getAccountRoleLevelRank(accountRole),
                label: `${item.fullName} - ${USER_ROLE[accountRole] || accountRole || 'Nhân sự'} - ${formatWorkloadLabel(item.workload)}`,
            };
            groupMap.get(groupKey)?.push(option);
        });

        return USER_ROLE_GROUP_ORDER
            .map(role => ({
                label: USER_ROLE[role] || 'Khác',
                options: groupMap.get(role)
                    .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
            }))
            .filter(group => group.options.length > 0);
    }, [availableUsers]);
    const flatAvailableUserOptions = useMemo(
        () => availableUserOptions.flatMap(group => group.options),
        [availableUserOptions]
    );
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
            group.roles.push(...getTeamMemberRoles(member));
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

    const [respondTaskStaffing, { isLoading: isRespondingTaskStaffing }] = useRespondTaskStaffingMutation();

    const [localStaffingRequests, setLocalStaffingRequests] = useState(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(`project_staffing_requests_${project?.id}`) || '[]');
            if (Array.isArray(stored) && stored.length > 0) return stored;
            const single = localStorage.getItem(`project_staffing_req_${project?.id}`);
            return single ? [{ id: 'legacy_1', note: single, createdAt: new Date().toISOString() }] : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(`project_staffing_requests_${project?.id}`) || '[]');
            if (Array.isArray(stored) && stored.length > 0) {
                setLocalStaffingRequests(stored);
            } else {
                const single = localStorage.getItem(`project_staffing_req_${project?.id}`);
                setLocalStaffingRequests(single ? [{ id: 'legacy_1', note: single, createdAt: new Date().toISOString() }] : []);
            }
        } catch {
            setLocalStaffingRequests([]);
        }
    }, [project?.id]);

    const allStaffingRequests = useMemo(() => {
        const list = [];
        const seenKeys = new Set();
        const projectTasks = project?.tasks || [];

        // 1. Task-level staffing requests from project.tasks
        projectTasks.forEach(t => {
            if (t.supportRequestType === 'STAFFING' && t.isSupportRequested && !t.isSupportAccepted) {
                const key = `task_${t.id}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    list.push({
                        uniqueKey: key,
                        type: 'TASK',
                        taskId: t.id,
                        task: t,
                        targetName: `${t.code ? `[${t.code}] ` : ''}${t.nickname || t.name || 'Công việc'}`,
                        note: t.supportRequestNote || '',
                        createdAt: t.updatedAt || t.createdAt,
                    });
                }
            }
        });

        // 2. Project-level staffing requests from unread notifications
        notifications.forEach(n => {
            if (n.type === 'TASK_STAFFING_REQUEST' && !n.isRead) {
                const isProjectLevel = String(n.relatedEntityId) === String(project?.id) ||
                    n.link === `/projects/${project?.id}` ||
                    n.link?.endsWith(`/projects/${project?.id}`);
                if (isProjectLevel) {
                    const key = `notif_${n.id}`;
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        const note = n.content ? n.content.replace(/^.*?Ghi chú:\s*/, '') : '';
                        list.push({
                            uniqueKey: key,
                            type: 'PROJECT',
                            notifId: n.id,
                            targetName: 'Yêu cầu cho toàn dự án',
                            note: note || project?.staffingRequestNote || '',
                            createdAt: n.createdAt,
                        });
                    }
                }
            }
        });

        // 3. Local requests from localStorage
        localStaffingRequests.forEach(req => {
            if (req.note && !list.some(item => item.note === req.note)) {
                const key = `local_${req.id}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    list.push({
                        uniqueKey: key,
                        type: 'PROJECT',
                        localId: req.id,
                        targetName: 'Yêu cầu cho toàn dự án',
                        note: req.note,
                        createdAt: req.createdAt,
                    });
                }
            }
        });

        // 4. Fallback legacy project.isStaffingRequested
        if (project?.isStaffingRequested && !list.some(item => item.type === 'PROJECT')) {
            list.push({
                uniqueKey: `project_${project.id}`,
                type: 'PROJECT',
                targetName: 'Yêu cầu cho toàn dự án',
                note: project.staffingRequestNote || '',
            });
        }

        return list;
    }, [project?.tasks, notifications, project, localStaffingRequests]);

    const handleResolveStaffingRequest = async (req) => {
        try {
            if (req.type === 'TASK' && req.taskId) {
                await respondTaskStaffing({
                    id: req.taskId,
                    projectId: project?.id,
                    action: 'RESOLVE'
                }).unwrap();
            }
            if (req.notifId) {
                try {
                    await markAsRead(req.notifId).unwrap();
                } catch {}
            }
            if (req.localId || req.type === 'PROJECT') {
                try {
                    const key = `project_staffing_requests_${project?.id}`;
                    const existing = JSON.parse(localStorage.getItem(key) || '[]');
                    const filtered = existing.filter(item => item.id !== req.localId && item.note !== req.note);
                    localStorage.setItem(key, JSON.stringify(filtered));
                    setLocalStaffingRequests(filtered);
                    localStorage.removeItem(`project_staffing_req_${project?.id}`);
                } catch {}
            }
            toast.success('Đã xác nhận xử lý yêu cầu bổ sung nhân sự');
        } catch (error) {
            toast.error(error?.data?.message || 'Có lỗi xảy ra khi xác nhận yêu cầu');
        }
    };

    const handleRejectStaffingRequest = async (req) => {
        if (!window.confirm(`Bạn có chắc chắn muốn từ chối yêu cầu bổ sung nhân sự cho "${req.targetName}"?`)) return;
        try {
            if (req.type === 'TASK' && req.taskId) {
                await respondTaskStaffing({
                    id: req.taskId,
                    projectId: project?.id,
                    action: 'REJECT'
                }).unwrap();
            }
            if (req.notifId) {
                try {
                    await markAsRead(req.notifId).unwrap();
                } catch {}
            }
            if (req.localId || req.type === 'PROJECT') {
                try {
                    const key = `project_staffing_requests_${project?.id}`;
                    const existing = JSON.parse(localStorage.getItem(key) || '[]');
                    const filtered = existing.filter(item => item.id !== req.localId && item.note !== req.note);
                    localStorage.setItem(key, JSON.stringify(filtered));
                    setLocalStaffingRequests(filtered);
                    localStorage.removeItem(`project_staffing_req_${project?.id}`);
                } catch {}
            }
            toast.success('Đã từ chối yêu cầu bổ sung nhân sự');
        } catch (error) {
            toast.error(error?.data?.message || 'Có lỗi xảy ra khi từ chối yêu cầu');
        }
    };

    if (!team) return null;

    const handleAddMember = async () => {
        if (isProjectClosed) {
            toast.warning('Dự án đã hoàn tất hoặc đã đóng, không thể thêm nhân sự.');
            return;
        }
        if (isProjectOnHold) {
            toast.warning('Dự án đang tạm dừng, không thể thêm nhân sự.');
            return;
        }
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
        if (isProjectClosed) {
            toast.warning('Dự án đã hoàn tất hoặc đã đóng, không thể chỉnh sửa vai trò.');
            return;
        }
        if (isProjectOnHold) {
            toast.warning('Dự án đang tạm dừng, không thể chỉnh sửa vai trò.');
            return;
        }
        setEditingUserId(group.userId);
        setDraftRoles(group.roles);
    };

    const toggleDraftRole = (role) => {
        if (role === TEAM_MEMBER_ROLE.ACCOUNT && draftRoles.includes(role)) {
            const otherAccountsCount = groupedMembers.filter(g =>
                g.userId !== editingUserId && g.roles.includes(TEAM_MEMBER_ROLE.ACCOUNT)
            ).length;
            if (otherAccountsCount === 0) {
                toast.warning('Đội dự án phải có ít nhất 1 nhân sự giữ vai trò Account. Không thể gỡ bỏ vai trò này.');
                return;
            }
        }
        setDraftRoles(current => current.includes(role)
            ? current.filter(item => item !== role)
            : sortRoles([...current, role]));
    };

    const handleUpdateRoles = async (userId) => {
        if (isProjectClosed) {
            toast.warning('Dự án đã hoàn tất hoặc đã đóng, không thể cập nhật vai trò.');
            return;
        }
        if (isProjectOnHold) {
            toast.warning('Dự án đang tạm dừng, không thể cập nhật vai trò.');
            return;
        }
        if (draftRoles.length === 0) return;

        const currentEditingGroup = groupedMembers.find(g => g.userId === userId);
        const hadAccount = currentEditingGroup?.roles?.includes(TEAM_MEMBER_ROLE.ACCOUNT);
        if (hadAccount && !draftRoles.includes(TEAM_MEMBER_ROLE.ACCOUNT)) {
            const otherAccountsCount = groupedMembers.filter(g =>
                g.userId !== userId && g.roles.includes(TEAM_MEMBER_ROLE.ACCOUNT)
            ).length;
            if (otherAccountsCount === 0) {
                toast.warning('Đội dự án phải có ít nhất 1 nhân sự giữ vai trò Account. Không thể gỡ bỏ vai trò này.');
                return;
            }
        }

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
        if (isProjectClosed) {
            toast.warning('Dự án đã hoàn tất hoặc đã đóng, không thể xóa nhân sự.');
            return;
        }
        if (isProjectOnHold) {
            toast.warning('Dự án đang tạm dừng, không thể xóa nhân sự.');
            return;
        }

        const hasAccount = group.roles.includes(TEAM_MEMBER_ROLE.ACCOUNT) || isSameUser(group.userId, team?.teamLead?.id);
        if (hasAccount) {
            const otherAccountsCount = groupedMembers.filter(g =>
                !isSameUser(g.userId, group.userId) && (g.roles.includes(TEAM_MEMBER_ROLE.ACCOUNT) || isSameUser(g.userId, team?.teamLead?.id))
            ).length;
            if (otherAccountsCount === 0) {
                toast.warning('Không thể xóa nhân sự này vì đây là người duy nhất giữ vai trò Account trong dự án.');
                return;
            }
        }

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
            <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900">Đội thực hiện</h2>
            </div>

            {canManageTeam && allStaffingRequests.length > 0 && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 shadow-sm">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-2.5 pb-2 border-b border-amber-200/60">
                        <UserPlus className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Yêu cầu bổ sung nhân sự ({allStaffingRequests.length})</span>
                    </div>

                    <div className="space-y-2.5">
                        {allStaffingRequests.map(req => (
                            <div
                                key={req.uniqueKey}
                                className="bg-white rounded-lg p-2.5 border border-amber-200/80 shadow-xs flex flex-col gap-2"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                req.type === 'TASK'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-orange-100 text-orange-800'
                                            }`}>
                                                {req.type === 'TASK' ? 'Công việc' : 'Toàn dự án'}
                                            </span>
                                            <span className="font-bold text-gray-800 text-xs truncate">
                                                {req.targetName}
                                            </span>
                                        </div>
                                        {req.note ? (
                                            <p className="mt-1 text-gray-600 font-medium italic text-[11px] leading-relaxed">
                                                "{req.note}"
                                            </p>
                                        ) : (
                                            <p className="mt-1 text-gray-400 italic text-[11px]">
                                                (Không có ghi chú chi tiết)
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => handleResolveStaffingRequest(req)}
                                        disabled={isRespondingTaskStaffing}
                                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all border border-emerald-300 shadow-2xs cursor-pointer disabled:opacity-50"
                                        title="Xác nhận đã giải quyết yêu cầu này (không cần thêm nhân sự mới)"
                                    >
                                        <Check className="h-3 w-3 shrink-0" />
                                        <span>Đã xử lý</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRejectStaffingRequest(req)}
                                        disabled={isRespondingTaskStaffing}
                                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 active:scale-95 transition-all border border-red-200 shadow-2xs cursor-pointer disabled:opacity-50"
                                        title="Từ chối yêu cầu bổ sung nhân sự này"
                                    >
                                        <X className="h-3 w-3 shrink-0" />
                                        <span>Từ chối</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                            <Select
                                aria-label="Tìm và chọn nhân sự"
                                options={availableUserOptions}
                                value={flatAvailableUserOptions.find(option => option.value === selectedUserId) || null}
                                onChange={option => handleSelectUser(option?.value || '')}
                                placeholder={availableUsers.length ? 'Tìm và chọn nhân sự' : 'Không còn nhân sự phù hợp'}
                                noOptionsMessage={() => 'Không tìm thấy nhân sự'}
                                isSearchable
                                isClearable
                                className="text-sm"
                                classNamePrefix="project-member-select"
                            />
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
