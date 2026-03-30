import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { PROJECT_STATUS_LABELS } from '../../utils/enums';

export const TeamLeadView = ({ dashboard, navigate }) => {
    if (!dashboard?.teamLead) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dashboard.teamLead?.map((project, idx) => (
                <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    whileHover={{ y: -8 }}
                    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100/60 hover:shadow-xl hover:shadow-indigo-50/40 transition-all duration-500 group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-110 transition-transform duration-700" />

                    <div className="relative">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-xl group-hover:text-indigo-600 transition-colors line-clamp-1 tracking-tight">{project.name}</h3>
                                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border mt-2 inline-block tracking-widest ${project.status === 'IN_PROGRESS' ? 'bg-indigo-50/80 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                    }`}>
                                    {PROJECT_STATUS_LABELS[project.status]}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-slate-900 leading-none">{project.progress}%</div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Tiến độ</p>
                            </div>
                        </div>

                        <div className="w-full bg-slate-100 h-2.5 rounded-full mb-8 overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${project.progress}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="bg-indigo-500 h-full rounded-full shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 bg-slate-50/80 px-4 py-2 rounded-2xl border border-slate-100">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-bold text-slate-600">Đã nghiệm thu {project.completedServiceCount}/{project.serviceCount}</span>
                            </div>
                            <motion.button
                                whileHover={{ x: 3 }}
                                className="text-indigo-600 font-bold text-[11px] uppercase tracking-[0.15em] flex items-center gap-2 hover:text-indigo-700 transition-colors"
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                Xem Chi tiết
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
