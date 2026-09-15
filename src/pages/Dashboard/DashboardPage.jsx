import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// API Hooks
import { useGetMeQuery } from '../../api/auth';
import { useGetDashboardDataQuery } from '../../api/dashboard';
import { useGetTasksQuery } from '../../api/tasks';
import { useGetTeamsQuery, useGetTeamMembersQuery } from '../../api/teams';
import { useGetUsersQuery } from '../../api/users';

// Components
import { MemberSelector } from '../../components/dashboard/MemberSelector';
import { MonthSelector } from '../../components/dashboard/MonthSelector';
import { ProjectSelector } from '../../components/dashboard/ProjectSelector';
import { AdminView } from '../../components/dashboard/AdminView';
import { TeamLeadView } from '../../components/dashboard/TeamLeadView';
import { BDView } from '../../components/dashboard/BDView';
import { MemberView } from '../../components/dashboard/MemberView';
import { ReviewQueueView } from '../../components/dashboard/ReviewQueueView';
import { getCurrentUserId, isSameUser } from '../../utils/authUser';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { data: user } = useGetMeQuery();
    const currentUserId = getCurrentUserId(user);
    const userRole = user?.role || user?.account?.role;
    const isAdminOrBod = userRole === 'ADMIN' || userRole === 'BOD';
    const [selectedMemberId, setSelectedMemberId] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const { data: dashboardData, isLoading: isDashboardLoading } = useGetDashboardDataQuery({
        userId: selectedMemberId,
        month: selectedDate.month,
        year: selectedDate.year,
        projectId: selectedProjectId
    });
    const dashboard = dashboardData || {};
    const { data: awaitingReviewTasks, isLoading: isTasksLoading } = useGetTasksQuery(
        { status: 'AWAITING_REVIEW' },
        { skip: isAdminOrBod }
    );

    const { data: allUsers = [] } = useGetUsersQuery();

    // Identify teams where the user is a lead OR a member (ACCOUNT, PM, or team member)
    const { data: teams = [] } = useGetTeamsQuery();

    const myTeams = useMemo(() => {
        if (!teams || teams.length === 0) return [];
        return teams.filter(t =>
            isSameUser(t.teamLeadId, currentUserId) ||
            isSameUser(t.teamLead?.id, currentUserId) ||
            t.members?.some(m => isSameUser(m.user?.id || m.userId, currentUserId))
        );
    }, [teams, currentUserId]);

    const primaryTeam = myTeams[0];
    const { data: fetchedTeamMembers = [] } = useGetTeamMembersQuery(primaryTeam?.id, { skip: !primaryTeam?.id });

    const canSelectMember = isAdminOrBod || userRole === 'PM';

    // Consolidate team members across all relevant teams (for ADMIN/BOD/PM only)
    const effectiveTeamMembers = useMemo(() => {
        if (!canSelectMember) return [];
        const memberMap = new Map();

        teams.forEach(t => {
            if (t.teamLead && t.teamLead.id) {
                if (!memberMap.has(t.teamLead.id)) {
                    memberMap.set(t.teamLead.id, {
                        id: `lead-${t.teamLead.id}`,
                        role: t.teamLead.role || 'ACCOUNT',
                        user: t.teamLead
                    });
                }
            }
            t.members?.forEach(m => {
                if (m.user && m.user.id && !memberMap.has(m.user.id)) {
                    memberMap.set(m.user.id, m);
                }
            });
        });

        fetchedTeamMembers.forEach(m => {
            if (m.user && m.user.id && !memberMap.has(m.user.id)) {
                memberMap.set(m.user.id, m);
            }
        });

        if (Array.isArray(allUsers)) {
            allUsers.forEach(u => {
                if (u && u.id && !memberMap.has(u.id)) {
                    memberMap.set(u.id, {
                        id: `user-${u.id}`,
                        role: u.role || 'MEMBER',
                        user: u
                    });
                }
            });
        }

        return Array.from(memberMap.values());
    }, [teams, fetchedTeamMembers, allUsers, canSelectMember]);

    const availableProjects = useMemo(() => {
        const map = new Map();
        (dashboard?.member?.participatingProjects || []).forEach(p => {
            if (p && p.id && !map.has(p.id)) map.set(p.id, p);
        });
        (dashboard?.teamLead || []).forEach(p => {
            if (p && p.id && !map.has(p.id)) map.set(p.id, p);
        });
        (dashboard?.sale?.projects || []).forEach(p => {
            if (p && p.id && !map.has(p.id)) map.set(p.id, p);
        });
        (dashboard?.admin?.currentProjects || []).forEach(p => {
            if (p && p.id && !map.has(p.id)) map.set(p.id, p);
        });
        return Array.from(map.values());
    }, [dashboard]);

    const isViewingMember = !!selectedMemberId;
    const isTeamLead = myTeams.length > 0 || ['ADMIN', 'BOD', 'PM', 'ACCOUNT', 'ADMIN_SALE'].includes(userRole);

    const isLoading = isDashboardLoading || isTasksLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-20">
            {/* Background Decorative Elements */}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="space-y-6 max-w-[1600px] mx-auto px-4 md:px-0"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 mb-2">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 "
                        >
                            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                Bảng điều khiển
                            </h1>
                        </motion.div>
                        <p className="text-sm text-gray-500 font-medium">
                            Chào mừng trở lại, <span className="text-orange-600 font-bold">{user?.fullName || user?.username}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <MonthSelector
                            selectedDate={selectedDate}
                            onChange={setSelectedDate}
                        />
                        {/* Member Selector (chỉ hiển thị cho PM, ADMIN, BOD) */}
                        {canSelectMember && (
                            <div className="h-full flex mt-0">
                                <MemberSelector
                                    members={effectiveTeamMembers}
                                    selectedId={selectedMemberId}
                                    onSelect={setSelectedMemberId}
                                    currentUserId={currentUserId}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key="dashboard-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-6 pb-12"
                    >
                        {!isViewingMember && !isAdminOrBod && !isTeamLead && (
                            <ReviewQueueView
                                awaitingReviewTasks={awaitingReviewTasks}
                                user={user}
                                navigate={navigate}
                            />
                        )}

                        {!isViewingMember && isAdminOrBod && (
                            <AdminView
                                dashboard={dashboard}
                                navigate={navigate}
                            />
                        )}

                        {!isViewingMember && user?.role === 'BD' && (
                            <BDView
                                dashboard={dashboard}
                                navigate={navigate}
                            />
                        )}

                        {user?.role !== 'BD' && (!isAdminOrBod || isViewingMember) && (
                            <div className="">
                                <MemberView
                                    dashboard={dashboard}
                                    navigate={navigate}
                                    isViewingMember={isViewingMember}
                                    selectedMemberId={selectedMemberId}
                                    selectedProjectId={selectedProjectId}
                                    onSelectProject={setSelectedProjectId}
                                    availableProjects={availableProjects}
                                    teamMembers={effectiveTeamMembers}
                                    isTeamLead={isTeamLead}
                                    onSelectMember={setSelectedMemberId}
                                    currentUserId={currentUserId}
                                    awaitingReviewTasks={awaitingReviewTasks}
                                    user={user}
                                />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

