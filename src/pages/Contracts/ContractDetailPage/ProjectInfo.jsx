import { Briefcase, ExternalLink, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../../../utils/enums';
import { useGetTeamsQuery } from '../../../api/teams';
import { useAssignProjectMutation } from '../../../api/projects';
import { toast } from 'react-toastify';

export const ProjectInfo = ({ project, formatDate, navigate, contractId }) => {
  const { data: teams = [] } = useGetTeamsQuery();
  const [assignProject, { isLoading }] = useAssignProjectMutation();
  const [selectedTeamId, setSelectedTeamId] = useState(project?.team?.id || '');

  if (!project) return null;

  const handleTeamChange = (e) => {
    setSelectedTeamId(e.target.value);
  };

  const handleAssign = async () => {
    const teamId = selectedTeamId ? Number(selectedTeamId) : null;
    try {
      await assignProject({ contractId, teamId }).unwrap();
      toast.success('Phân công thành công');
    } catch (err) {
      toast.error(err?.data?.message || 'Phân công thất bại');
    }
  };

  const hasChanged = selectedTeamId !== (project?.team?.id || '');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-indigo-600" />
        Dự án của hợp đồng
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
            <div className="flex gap-2 mt-1">
              <select
                value={selectedTeamId}
                onChange={handleTeamChange}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chưa phân công</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={!hasChanged || isLoading}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                Phân công
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
