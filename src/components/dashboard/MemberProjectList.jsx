import React from 'react';
import { Briefcase, ArrowUpRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, PROJECT_CARD_THEMES } from '../../utils/enums';
import { motion } from 'framer-motion';

export const MemberProjectList = ({ projects = [] }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm h-full flex flex-col overflow-hidden relative">
            {/* Decorative Element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[3rem] -mr-12 -mt-12 pointer-events-none opacity-50" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Dự án tham gia</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Dự án đang triển khai</p>
                </div>
            </div>

            <div className="space-y-4 flex-1 relative z-10">
                {projects.length > 0 ? projects.map((project, index) => {
                    const theme = (project.status === 'IN_PROGRESS' || project.status === 'CONFIRMED') 
                        ? PROJECT_CARD_THEMES.ACTIVE 
                        : PROJECT_CARD_THEMES.INACTIVE;
                    return (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className={`group relative flex  items-center justify-between p-4 rounded-2xl border-2 ${theme.border} ${theme.bg} hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer w-full text-left`}
                        >
                            <div className="flex-1 min-w-0 pr-2 grid grid-cols-2">
                                <h4 className="text-blue-600 font-bold text-sm truncate  transition-colors uppercase tracking-tight">
                                    {project.name}
                                </h4>
                                <div className="shrink-0 flex justify-end">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border shadow-sm ${PROJECT_STATUS_COLORS[project.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {PROJECT_STATUS_LABELS[project.status] || project.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                }) : (
                    <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3">
                            <Briefcase className="w-6 h-6 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic text-center px-4">Bạn chưa tham gia dự án nào</p>
                    </div>
                )}
            </div>

            {projects.length > 5 && (
                <button className="w-full mt-6 py-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-600 hover:text-white rounded-xl transition-all border-2 border-emerald-100 shadow-sm relative z-10">
                    Mở rộng danh sách ({projects.length})
                </button>
            )}
        </div>
    );
};
