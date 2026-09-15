import React, { useState } from 'react';
import { ChevronDown, Briefcase, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProjectSelector = ({ projects = [], selectedId, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Find the selected project object
    const selectedProject = projects.find(p => p.id === selectedId);

    const getProjectAvatar = (name) => {
        if (!name) return '?';
        const cleanName = name.replace(/^Dự án\s+/i, '').trim();
        return cleanName.charAt(0).toUpperCase();
    };

    return (
        <div className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-3 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group w-full min-w-[170px]"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F38820] flex items-center justify-center group-hover:bg-[#F38820] group-hover:text-white transition-colors uppercase font-bold text-xs">
                        {selectedId ? getProjectAvatar(selectedProject?.name) : <Briefcase className="w-4 h-4" />}
                    </div>
                    <div className="text-left hidden md:block">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Dự án</p>
                        <p className="text-sm font-bold text-gray-900 leading-none truncate max-w-[130px]">
                            {selectedId ? (selectedProject?.name || 'Chi tiết dự án') : 'Tất cả dự án'}
                        </p>
                    </div>
                </div>

                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-72 bg-white rounded-sm shadow-2xl shadow-gray-200/50 border border-gray-100 p-3 z-50 overflow-hidden"
                    >
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    onSelect(null);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-xs transition-all ${!selectedId ? 'bg-orange-50 text-[#F38820]' : 'hover:bg-gray-50 text-gray-600'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!selectedId ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-left">Tất cả dự án</span>
                                </div>
                                {!selectedId && <Check className="w-4 h-4" />}
                            </button>

                            <div className="h-px bg-gray-50 my-2 mx-2" />

                            <p className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Danh sách dự án</p>

                            <div className="max-h-[280px] overflow-y-auto pr-1 custom-scrollbar space-y-1">
                                {projects.length > 0 ? projects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => {
                                            onSelect(project.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedId === project.id ? 'bg-orange-50 text-[#F38820]' : 'hover:bg-gray-50 text-gray-600'}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 font-bold text-xs uppercase shrink-0 ${selectedId === project.id ? 'bg-white shadow-sm text-[#F38820]' : ''}`}>
                                                {getProjectAvatar(project.name)}
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-sm font-bold truncate max-w-[160px] leading-tight">{project.name}</p>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                                                    {project.clientName || 'Hệ thống'}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedId === project.id && <Check className="w-4 h-4 shrink-0" />}
                                    </button>
                                )) : (
                                    <div className="px-3 py-4 text-center text-xs text-gray-400 italic font-medium">
                                        Chưa có dự án nào
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
