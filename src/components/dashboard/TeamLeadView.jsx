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
                    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-indigo-50 transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-110 transition-transform" />

                    <div className="relative">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-black text-gray-900 text-xl group-hover:text-indigo-600 transition-colors line-clamp-1">{project.name}</h3>
                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border mt-2 inline-block tracking-tighter ${project.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                                    }`}>
                                    {PROJECT_STATUS_LABELS[project.status]}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-gray-900 leading-none">{project.progress}%</div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Tiến độ</p>
                            </div>
                        </div>

                        <div className="w-full bg-gray-100 h-3 rounded-full mb-8 overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${project.progress}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="bg-gradient-to-r from-indigo-500 to-blue-600 h-full rounded-full"
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-bold text-gray-600">Đã nghiệm thu {project.completedServiceCount}/{project.serviceCount}</span>
                            </div>
                            <motion.button
                                whileHover={{ x: 3 }}
                                className="text-indigo-600 font-black text-[11px] uppercase tracking-[0.1em] flex items-center gap-2 hover:text-indigo-700 transition-colors"
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                Xem
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
