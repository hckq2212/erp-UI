import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { TaskCalendar } from './TaskCalendar';
import { MemberProjectList } from './MemberProjectList';
import { WorkloadChart } from './WorkloadChart';
import { getRemainingTime } from '../../utils/format';
import { TASK_STATUS_LABELS } from '../../utils/enums';

export const MemberView = ({ dashboard, navigate, isViewingMember, selectedMemberId, teamMembers }) => {
    return (
        <div className="space-y-10 pb-12">
            {/* Middle Row: Calendar & Deadlines */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
                <div className="lg:col-span-8">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm h-fit">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Deadline sắp tới</h3>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {dashboard.member?.upcomingDeadlines?.length > 0 ? dashboard.member.upcomingDeadlines.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 hover:bg-white transition-all group w-full"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="text-left min-w-0">
                                            <h4 className="text-gray-900 font-bold truncate">{task.name}</h4>
                                            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-tighter truncate">
                                                Dự án: <span className="text-gray-600">{task.projectName || 'Công việc nội bộ'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <p className={`text-[10px] font-black uppercase leading-tight ${getRemainingTime(task.deadline, task.status).color}`}>
                                            {getRemainingTime(task.deadline, task.status).text}
                                        </p>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border mt-1 inline-block ${task.status === 'DOING' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                                            }`}>
                                            {TASK_STATUS_LABELS[task.status]}
                                        </span>
                                    </div>
                                </button>
                            )) : (
                                <div className="text-center py-12 text-gray-400 italic text-sm">Chưa có deadline nào sắp tới</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-4">
                    <TaskCalendar tasks={dashboard.member?.calendarTasks} />
                </div>
            </motion.div>

            {/* Bottom Row: Projects & Productivity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
                <div className="lg:col-span-4">
                    <MemberProjectList projects={dashboard.member?.participatingProjects} />
                </div>
                <div className="lg:col-span-8">
                    <WorkloadChart data={dashboard.member?.completionStats} />
                </div>
            </motion.div>
        </div>
    );
};
