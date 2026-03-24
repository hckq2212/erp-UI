import React from 'react';
import { Briefcase, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PROJECT_STATUS_LABELS } from '../../utils/enums';

export const MemberProjectList = ({ projects = [] }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-gray-900 leading-tight">Dự án tham gia</h3>
            </div>

            <div className="space-y-4 flex-1">
                {projects.length > 0 ? projects.map(project => (
                    <div 
                        key={project.id} 
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="p-5 bg-gray-50 rounded-[2rem] border border-transparent hover:border-gray-100 hover:bg-white transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                                    {project.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                                        project.status === 'IN_PROGRESS' || project.status === 'CONFIRMED' 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                        {PROJECT_STATUS_LABELS[project.status] || project.status}
                                    </span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 group-hover:text-emerald-500 group-hover:scale-110 transition-all">
                                <ArrowUpRight className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <CheckCircle2 className="w-6 h-6 text-gray-200" />
                        </div>
                        <p className="text-gray-400 italic text-xs font-medium">Bạn chưa tham gia dự án nào</p>
                    </div>
                )}
            </div>

            {projects.length > 5 && (
                <button className="w-full mt-6 py-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 rounded-xl transition-all border border-emerald-50">
                    Xem tất cả ({projects.length})
                </button>
            )}
        </div>
    );
};
