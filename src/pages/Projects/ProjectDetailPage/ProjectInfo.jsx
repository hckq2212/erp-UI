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
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Mã hợp đồng</p>
                        <p className="text-sm font-medium text-gray-700">{project.contract.contractCode}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Tên hợp đồng</p>
                        <p className="text-sm font-medium text-gray-700">{project.contract.name}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Đội thực hiện</p>
                        <p className="text-sm font-medium text-gray-700">{project.team.name}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
