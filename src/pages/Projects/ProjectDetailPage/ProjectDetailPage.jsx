import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, ExternalLink, FileSpreadsheet, RefreshCw } from 'lucide-react';
import {
  useGetProjectQuery,
  useConfirmProjectMutation,
  useRetryProjectGoogleSheetMutation,
} from '../../../api/projects';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../../../utils/enums';
import { TaskStatistics } from './TaskStatistics';
import { TaskTable } from './TaskTable';
import { ProjectInfo } from './ProjectInfo';
import { ContractInfo } from './ContractInfo';
import { TeamInfo } from './TeamInfo';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/authSlice';

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useGetProjectQuery(id);
  const [confirmProject, { isLoading: isConfirming }] = useConfirmProjectMutation();
  const [retryProjectGoogleSheet, { isLoading: isRetryingGoogleSheet }] = useRetryProjectGoogleSheetMutation();
  const user = useSelector(selectCurrentUser);
  const canRetryGoogleSheet = ['ADMIN', 'BOD'].includes(user?.role);

  const isCoreMember = project?.team?.teamLead?.id === user?.id ||
    project?.team?.members?.some(m => m.user?.id === user?.id) ||
    ['ADMIN', 'BOD'].includes(user?.role);


  const handleConfirm = async () => {
    try {
      await confirmProject(id).unwrap();
      toast.success('Chấp nhận dự án thành công');
    } catch (err) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi chấp nhận dự án');
    }
  };

  const handleRetryGoogleSheet = async () => {
    try {
      await retryProjectGoogleSheet(id).unwrap();
      toast.success('Tao lai Google Sheet thanh cong');
    } catch (err) {
      toast.error(err?.data?.message || 'Co loi xay ra khi tao lai Google Sheet');
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
    <div className="max-w-7xl mx-auto">
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
              <p className="text-gray-600 mt-2 max-w-2xl whitespace-pre-wrap">{project.description}</p>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Google Sheet</h2>
                {project.googleSheetStatus === 'CREATING' && (
                  <p className="text-sm text-amber-600 mt-1">Google Sheet đang được tạo, vui lòng quay lại sau.</p>
                )}
                {project.googleSheetStatus === 'FAILED' && (
                  <div className="flex items-start gap-2 text-sm text-red-600 mt-1">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{project.googleSheetError || 'Không thể tạo Google Sheet cho dự án này.'}</span>
                  </div>
                )}
                {(!project.googleSheetStatus || project.googleSheetStatus === 'NOT_CREATED') && (
                  <p className="text-sm text-gray-500 mt-1">Chưa tạo Google Sheet cho dự án này.</p>
                )}
                {project.googleSheetStatus === 'CREATED' && !project.googleSheetUrl && (
                  <p className="text-sm text-gray-500 mt-1">Google Sheet đã được tạo nhưng chưa có link hiển thị.</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {project.googleSheetStatus === 'CREATED' && project.googleSheetUrl && (
                <a
                  href={project.googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm transition-all active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở Google Sheet</span>
                </a>
              )}
              {project.googleSheetStatus === 'FAILED' && canRetryGoogleSheet && (
                <button
                  onClick={handleRetryGoogleSheet}
                  disabled={isRetryingGoogleSheet}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRetryingGoogleSheet ? 'animate-spin' : ''}`} />
                  <span>{isRetryingGoogleSheet ? 'Dang tao lai...' : 'Tao lai'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ">
          <div className="space-y-6">
            <ProjectInfo project={project} formatDate={formatDate} />
          </div>
          <div className="space-y-6">
            <TeamInfo team={project.team} />
          </div>
        </div>

        <TaskTable tasks={project.tasks} project={project} className="min-w-[2000px]" />


        {isCoreMember && (
          <ContractInfo contract={project.contract} projectId={project.id} />
        )}
      </div>
    </div >
  );
};

export default ProjectDetailPage;
