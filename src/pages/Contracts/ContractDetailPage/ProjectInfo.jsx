import { Briefcase, ExternalLink } from 'lucide-react';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../../../utils/enums';

export const ProjectInfo = ({ project, formatDate, navigate }) => {
  if (!project) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-indigo-600" />
        Dự án liên kết
      </h2>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{project.name}</h3>
          </div>
          <button
            onClick={() => navigate(`/projects/${project.id}`)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Xem
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Trạng thái</label>
            <p className="mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                PROJECT_STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-800'
              }`}>
                {PROJECT_STATUS_LABELS[project.status] || project.status}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Đội ngũ</label>
            <p className="text-gray-900 mt-1 text-sm">
              {project.team ? project.team.name || project.team : 'Chưa phân công'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
