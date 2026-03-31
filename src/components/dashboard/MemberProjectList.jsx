import React from 'react';
import { Briefcase, ArrowUpRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, PROJECT_CARD_THEMES } from '../../utils/enums';
import { motion } from 'framer-motion';

export const MemberProjectList = ({ projects = [] }) => {
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {projects.length > 0 ? projects.map((project, index) => {
                    const theme = (project.status === 'IN_PROGRESS' || project.status === 'CONFIRMED')
                        ? PROJECT_CARD_THEMES.ACTIVE
                        : PROJECT_CARD_THEMES.INACTIVE;
                    return (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * index }}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className={`group relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 cursor-pointer w-full bg-white hover:bg-slate-50 border-slate-100 hover:border-blue-100 hover:shadow-sm`}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-1 h-9 rounded-full ${theme.accent} opacity-40 group-hover:opacity-100 transition-opacity`} />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[12px] font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                        {project.name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500 transition-colors`}>
                                            {PROJECT_STATUS_LABELS[project.status] || project.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-blue-500 transition-colors shrink-0" />
                        </motion.div>
                    );
                }) : (
                    <div className="h-full flex items-center justify-center italic text-[9px] text-slate-300 uppercase tracking-widest py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-100">
                        Chưa có dự án
                    </div>
                )}
            </div>
        </div>
    );
};
