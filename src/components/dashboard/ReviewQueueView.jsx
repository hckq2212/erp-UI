import React from 'react';
import { getTaskDisplayName } from '../../utils/taskName';
import { motion } from 'framer-motion';
import { Zap, ArrowUpRight } from 'lucide-react';
import { PROJECT_MANAGEMENT_ROLES } from '../../utils/enums';
import { getCurrentUserId, isSameUser } from '../../utils/authUser';

export const ReviewQueueView = ({ awaitingReviewTasks, user, navigate }) => {
    const currentUserId = getCurrentUserId(user);
    const canManageProjectTasks = PROJECT_MANAGEMENT_ROLES.includes(user?.role);
    const myReviewTasks = awaitingReviewTasks?.data?.filter(task =>
        canManageProjectTasks ||
        isSameUser(currentUserId, task.assignerId) ||
        isSameUser(currentUserId, task.project?.team?.teamLead?.id)
    ) || [];

    if (myReviewTasks.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Việc cần duyệt</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Bạn đang có {myReviewTasks.length} công việc cần phản hồi</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myReviewTasks.map(task => (
                    <motion.div
                        key={task.id}
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-md border border-amber-100 shadow-sm hover:shadow-xl hover:shadow-amber-50 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-110 transition-transform" />
                        <div className="relative">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 uppercase tracking-tighter">
                                    {task.code}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                    {task.project?.name}
                                </span>
                            </div>
                            <h3 className="text-gray-900 font-black mb-4 line-clamp-1 group-hover:text-amber-600 transition-colors">{getTaskDisplayName(task)}</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 border border-white shadow-sm shrink-0 uppercase">
                                        {task.assignee?.fullName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] text-gray-400 font-black uppercase leading-none mb-1">Thành viên</p>
                                        <p className="text-xs text-gray-800 font-bold truncate">{task.assignee?.fullName || 'N/A'}</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => navigate(`/tasks/${task.id}/review`)}
                                    className="w-10 h-10 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-100 flex items-center justify-center transition-all"
                                >
                                    <ArrowUpRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
