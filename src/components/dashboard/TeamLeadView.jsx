import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../../utils/enums';
import { MemberSelector } from './MemberSelector';

export const TeamLeadView = ({
    dashboard,
    navigate,
    teamMembers,
    selectedMemberId,
    onSelectMember,
    currentUserId
}) => {
    if (!dashboard?.teamLead) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
            {/* Tầng 1: Grid Projects  */}
            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboard.teamLead?.map((project, idx) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * idx }}
                        whileHover={{ y: -4 }}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group flex flex-col justify-between"
                    >
                        <div className="relative">
                            <div className="flex justify-between items-start gap-3 mb-4">
                                <h3 className="font-black text-slate-800 text-[13px] group-hover:text-indigo-600 transition-colors line-clamp-1 tracking-tight leading-tight">{project.name}</h3>
                                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-lg border tracking-[0.1em] shrink-0 ${PROJECT_STATUS_COLORS[project.status] || 'bg-gray-50 text-gray-500 border-gray-100'
                                    }`}>
                                    {PROJECT_STATUS_LABELS[project.status]}
                                </span>
                            </div>

                            <div className="space-y-1.5 mb-4">
                                <div className="flex justify-between items-center px-0.5">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tiến độ</span>
                                    <span className="text-[10px] font-black text-slate-900">{project.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${project.progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="bg-indigo-500 h-full rounded-full shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)]" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                        {project.completedServiceCount}/{project.serviceCount} đã nghiệm thu
                                    </span>
                                </div>
                                <button
                                    className="text-indigo-600 font-black text-[9px] uppercase tracking-widest hover:text-indigo-700 transition-colors py-1"
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                >
                                    Chi tiết
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>


        </div>
    );
};
