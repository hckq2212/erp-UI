import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// API Hooks
import { useGetMeQuery } from '../../api/auth';
import { useGetDashboardDataQuery } from '../../api/dashboard';
import { useGetTasksQuery } from '../../api/tasks';
import { useGetTeamsQuery, useGetTeamMembersQuery } from '../../api/teams';

// Components
import { MemberSelector } from '../../components/dashboard/MemberSelector';
import { MonthSelector } from '../../components/dashboard/MonthSelector';
import { AdminView } from '../../components/dashboard/AdminView';
import { TeamLeadView } from '../../components/dashboard/TeamLeadView';
import { BDView } from '../../components/dashboard/BDView';
import { MemberView } from '../../components/dashboard/MemberView';
import { ReviewQueueView } from '../../components/dashboard/ReviewQueueView';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { data: user } = useGetMeQuery();
    const [selectedMemberId, setSelectedMemberId] = useState(null);
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const { data: dashboard, isLoading: isDashboardLoading } = useGetDashboardDataQuery({
        userId: selectedMemberId,
        month: selectedDate.month,
        year: selectedDate.year
    });
    const { data: awaitingReviewTasks, isLoading: isTasksLoading } = useGetTasksQuery({ status: 'AWAITING_REVIEW' });

    // Identify if the user is a lead of any team
    const { data: teams } = useGetTeamsQuery();
    const myTeam = teams?.find(t => t.teamLeadId === user?.id || t.teamLead?.id === user?.id);
    const { data: teamMembers = [] } = useGetTeamMembersQuery(myTeam?.id, { skip: !myTeam?.id });

    const isViewingMember = !!selectedMemberId;
    const isTeamLead = !!myTeam;

    const isLoading = isDashboardLoading || isTasksLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!dashboard) return null;

    return (
        <div className="relative min-h-screen pb-20">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-indigo-50/50 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] left-[20%] w-[25%] h-[25%] bg-purple-50/30 rounded-full blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="space-y-10 max-w-[1600px] mx-auto pt-6 px-4 md:px-0"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-3 mb-2"
                        >
                            <p className="text-gray-400 font-bold text-[11px] uppercase tracking-widest leading-none">
                                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </motion.div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                            {isViewingMember ? (
                                <>Dashboard của <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-black">{teamMembers.find(m => m.user.id === selectedMemberId)?.user?.fullName}</span></>
                            ) : (
                                <>Chào buổi chiều, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-black">{user?.fullName?.split(' ').pop() || 'bạn'}</span> 👋</>
                            )}
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">
                            {isViewingMember ? 'Bạn đang xem tiến độ và công việc của thành viên này.' : 'Chúc bạn một ngày làm việc hiệu quả và năng động!'}
                        </p>
                    </div>

                    {isTeamLead && (
                        <div className="flex items-center gap-4">
                            <MonthSelector
                                selectedDate={selectedDate}
                                onChange={setSelectedDate}
                            />
                            <MemberSelector
                                members={teamMembers.filter(m => m.user.id !== user?.id)}
                                selectedId={selectedMemberId}
                                onSelect={setSelectedMemberId}
                            />
                        </div>
                    )}

                    {!isTeamLead && (
                        <div className="flex items-center gap-4">
                            <MonthSelector
                                selectedDate={selectedDate}
                                onChange={setSelectedDate}
                            />
                        </div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key="dashboard-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-12 pb-12"
                    >
                        {!isViewingMember && (
                            <ReviewQueueView
                                awaitingReviewTasks={awaitingReviewTasks}
                                user={user}
                                navigate={navigate}
                            />
                        )}

                        {/* {dashboard.admin && !isViewingMember && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Hệ thống & Tài chính</h2>
                                </div>
                                <AdminView dashboard={dashboard} />
                            </div>
                        )} */}
                        {/* 
                        {(['BD', 'SALE', 'ADMIN', 'BOD'].includes(user?.role)) && !isViewingMember && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Kinh doanh</h2>
                                </div>
                                <BDView dashboard={dashboard} navigate={navigate} />
                            </div>
                        )} */}

                        {dashboard.teamLead && !isViewingMember && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Dự án</h2>
                                </div>
                                <TeamLeadView dashboard={dashboard} navigate={navigate} />
                            </div>
                        )}

                        {(dashboard.member || isViewingMember) && user?.role !== 'BD' && user?.role !== 'SALE' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">
                                        {isViewingMember ? `Dashboard của ${teamMembers.find(m => m.user.id === selectedMemberId)?.user?.fullName}` : 'Công việc'}
                                    </h2>
                                </div>
                                <MemberView
                                    dashboard={dashboard}
                                    navigate={navigate}
                                    isViewingMember={isViewingMember}
                                    selectedMemberId={selectedMemberId}
                                    teamMembers={teamMembers}
                                />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

