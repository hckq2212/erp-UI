import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Flame } from 'lucide-react';

export const HotProjectList = ({
    projects = [],
    navigate,
    title = 'Dự án đang tham gia',
    subtitle = 'Tiến độ dự án',
}) => {
    // Helper to get project avatar: first letter after "Dự án "
    const getProjectAvatar = (name) => {
        if (!name) return '?';
        const cleanName = name.replace(/^Dự án\s+/i, '').trim();
        return cleanName.charAt(0).toUpperCase();
    };

    return (
        <div className="bg-white p-4  rounded-[1rem] border border-slate-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                        <Flame size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">{title}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
                    </div>
                </div>
                <button className="text-[9px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest flex items-center gap-1">
                    Xem tất cả <ChevronRight size={10} />
                </button>
            </div>

            <div className="space-y-6">
                {projects.length > 0 ? (
                    projects.slice(0, 5).map((project, index) => {
                        // Use project.progress if available, else 0
                        const progress = project.progress || 0;
                        return (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={project.id}
                                className="group cursor-pointer ml-2"
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors uppercase">
                                            {getProjectAvatar(project.name)}
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-slate-800 group-hover:text-rose-600 transition-colors uppercase tracking-tight">
                                                {project.name}
                                            </h4>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">
                                                {project.clientName || 'Hệ thống'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-900">{progress}%</span>
                                </div>
                                <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-orange-500 rounded-full"
                                    />
                                </div>
                                {/* <div className="flex justify-between items-center mt-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                        {project.completedServiceCount || 0}/{project.serviceCount || 0} đã nghiệm thu
                                    </span>
                                </div> */}
                            </motion.div>
                        );
                    })
                ) : (
                    <p className="text-center text-slate-300 italic text-xs py-10 uppercase tracking-widest font-bold">Chưa có dự án</p>
                )}
            </div>
        </div>
    );
};
