import { Briefcase, ExternalLink, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../../../utils/enums';
import { useGetMeQuery } from '../../../api/auth';
import { useGetUsersQuery } from '../../../api/users';
import { useAssignProjectMutation } from '../../../api/projects';
import { toast } from 'react-toastify';
import { hasTeamMemberRole } from '../../../utils/teamMember';

export const ProjectInfo = ({ project, formatDate, navigate, contractId }) => {
  const { data: user } = useGetMeQuery();
  const { data: pmUsers = [] } = useGetUsersQuery({ role: 'PM' });
  const [assignProject, { isLoading }] = useAssignProjectMutation();
  const projectManager = useMemo(() => (
    project?.team?.members?.find((member) => hasTeamMemberRole(member, 'PROJECT_MANAGER'))?.user || null
  ), [project?.team?.members]);
  const [selectedPmId, setSelectedPmId] = useState(projectManager?.id || '');

  useEffect(() => {
    setSelectedPmId(projectManager?.id || '');
  }, [projectManager?.id]);

  const isAdminOrBOD = user?.role === 'ADMIN' || user?.role === 'BOD';
  if (!project) return null;

  const handlePmChange = (e) => {
    setSelectedPmId(e.target.value);
  };

  const handleAssign = async () => {
    const pmId = selectedPmId || null;
    try {
      await assignProject({ contractId, pmId }).unwrap();
      toast.success('Phân công thành công');
    } catch (err) {
      toast.error(err?.data?.message || 'Phân công thất bại');
    }
  };

  const hasChanged = selectedPmId !== (projectManager?.id || '');

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
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PROJECT_STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-800'
                }`}>
                {PROJECT_STATUS_LABELS[project.status] || project.status}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">PM phụ trách</label>
            <div className="mt-1">
              {isAdminOrBOD ? (
                <>
                  <div className="flex gap-2">
                    <select
                      value={selectedPmId}
                      onChange={handlePmChange}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chưa phân công PM</option>
                      {pmUsers.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                          {pm.fullName}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedPmId || !hasChanged || isLoading}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
                    >
                      <UserPlus className="w-4 h-4" />
                      Phân công
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm font-semibold text-gray-700">{projectManager?.fullName || 'Chưa phân công PM'}</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Account</label>
            <p className="mt-1 text-sm font-semibold text-gray-700">{project.team?.teamLead?.fullName || 'PM chưa chọn lead'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
