import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useGetProjectQuery, useDeleteProjectMutation, useUpdateProjectMutation, useConfirmProjectMutation } from '../../../api/projects';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../../../utils/enums';
import { useState } from 'react';
import { TaskStatistics } from './TaskStatistics';
import { TaskTable } from './TaskTable';
import { ProjectInfo } from './ProjectInfo';
import { ContractInfo } from './ContractInfo';
import { TeamInfo } from './TeamInfo';
import { toast } from 'react-toastify';

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useGetProjectQuery(id);
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [confirmProject, { isLoading: isConfirming }] = useConfirmProjectMutation();
  const [showEditModal, setShowEditModal] = useState(false);


  const handleConfirm = async () => {
    if (window.confirm('Bạn có chắc chắn muốn chấp nhận dự án này?')) {
      try {
        await confirmProject(id).unwrap();
        toast.success('Chấp nhận dự án thành công');
      } catch (err) {
        toast.error(err?.data?.message || 'Có lỗi xảy ra khi chấp nhận dự án');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa xác định';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-gray-500 mb-4">Không tìm thấy dự án</p>
        <button
          onClick={() => navigate('/projects')}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại danh sách dự án</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs font-medium px-3 py-1 rounded-full border ${PROJECT_STATUS_COLORS[project.status]}`}>
                {PROJECT_STATUS_LABELS[project.status] || project.status}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 mt-2 max-w-2xl">{project.description}</p>
            )}
          </div>

          <div className="flex gap-3">
            {project.status === 'PENDING_CONFIRMATION' && (
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isConfirming ? 'Đang xử lý...' : 'Chấp nhận'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task Statistics */}
      <TaskStatistics tasks={project.tasks} />

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ">
          <div className="space-y-6">
            <ProjectInfo project={project} formatDate={formatDate} />
          </div>
          <div className="space-y-6">
            <TeamInfo team={project.team} />
          </div>
        </div>
        <TaskTable tasks={project.tasks} project={project} />


        <ContractInfo contract={project.contract} projectId={project.id} />
      </div>
    </div >
  );
};

export default ProjectDetailPage;
