import { Calendar, Tag } from 'lucide-react';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../../../utils/enums';

export const ProjectInfo = ({ project, formatDate }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Thông tin dự án</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Trạng thái</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${PROJECT_STATUS_COLORS[project.status]}`}>
                        {PROJECT_STATUS_LABELS[project.status] || project.status}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Dự kiến bắt đầu</p>
                        <p className="text-sm font-medium text-gray-700">{formatDate(project.plannedStartDate)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Dự kiến kết thúc</p>
                        <p className="text-sm font-medium text-gray-700">{formatDate(project.plannedEndDate)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Thực tế bắt đầu</p>
                        <p className="text-sm font-medium text-gray-700">{formatDate(project.actualStartDate)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Thực tế kết thúc</p>
                        <p className="text-sm font-medium text-gray-700">{formatDate(project.actualEndDate)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
