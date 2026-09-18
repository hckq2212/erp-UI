import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, CheckCircle, RefreshCw, UserPlus } from 'lucide-react';
import {
  useGetProjectQuery,
  useAssignProjectMutation,
  useConfirmProjectMutation,
  useSyncProjectServiceJobsMutation,
} from '../../../api/projects';
import { PROJECT_MANAGEMENT_ROLES, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, USER_ROLE } from '../../../utils/enums';
import { useGetUsersQuery } from '../../../api/users';
import { TaskStatistics } from './TaskStatistics';
import { TaskTable } from './TaskTable';
import { ProjectInfo } from './ProjectInfo';
import { ContractInfo } from './ContractInfo';
import { TeamInfo } from './TeamInfo';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../store/authSlice';
import { CreateMonthlyWorkModal } from './CreateMonthlyWorkModal';
import { ExtraTasksSection } from './ExtraTasksSection';
import { getCurrentUserId, isSameUser } from '../../../utils/authUser';
import { cn } from '../../../utils/cn';

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useGetProjectQuery(id);
  const { data: pmUsers = [] } = useGetUsersQuery({ role: 'PM' });
  const [assignProject, { isLoading: isAssigningProject }] = useAssignProjectMutation();
  const [confirmProject, { isLoading: isConfirming }] = useConfirmProjectMutation();
  const [syncProjectServiceJobs, { isLoading: isSyncingServiceJobs }] = useSyncProjectServiceJobsMutation();
  const [isMonthlyWorkModalOpen, setIsMonthlyWorkModalOpen] = useState(false);
  const [selectedPmId, setSelectedPmId] = useState('');
  const [activeTab, setActiveTab] = useState('MAIN');
  const user = useSelector(selectCurrentUser);
  const currentUserId = getCurrentUserId(user);
  const canSyncServiceJobs = user?.role === 'ADMIN' || user?.role === 'PM';
  const projectManagerMember = project?.team?.members?.find(member => member.role === 'PROJECT_MANAGER');
  const hasProjectManager = Boolean(projectManagerMember?.user?.id);
  const canAssignPm = (user?.role === 'ADMIN' || user?.role === 'BOD') && !hasProjectManager;
  const canConfirmProject = project?.status === 'PENDING_CONFIRMATION' &&
    (user?.role === 'ADMIN' || isSameUser(project?.team?.teamLead?.id, currentUserId));

  const isCoreMember = isSameUser(project?.team?.teamLead?.id, currentUserId) ||
    project?.team?.members?.some(m => isSameUser(m.user?.id, currentUserId)) ||
    PROJECT_MANAGEMENT_ROLES.includes(user?.role);
  const canCreateProjectWork = user?.role === 'PM' || user?.role === 'ADMIN';


  const handleConfirm = async () => {
    try {
      await confirmProject(id).unwrap();
      toast.success('Chấp nhận dự án thành công');
    } catch (err) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi chấp nhận dự án');
    }
  };

  const handleAssignPm = async () => {
    if (!selectedPmId) return;
    if (!project?.contract?.id) {
      toast.error('Dự án chưa có hợp đồng để phân công PM');
      return;
    }

    try {
      await assignProject({ contractId: project.contract.id, pmId: selectedPmId }).unwrap();
      toast.success('Đã phân công PM cho dự án');
      setSelectedPmId('');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể phân công PM');
    }
  };

  const handleSyncServiceJobs = async () => {
    try {
      const result = await syncProjectServiceJobs(id).unwrap();
      toast.success(`Đồng bộ xong: tạo ${result.createdTasks || 0} task, cập nhật ${result.updatedOutputTasks || 0} task đầu ra, bổ sung ${result.backfilledResults || 0} kết quả.`);
    } catch (err) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi đồng bộ công việc');
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

  const extraTasks = project.tasks?.filter((task) => task.isExtra) || [];
  const taskCount = project.tasks?.length || 0;

  return (
    <div className="mx-6 mt-6">
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
            {projectManagerMember?.user && (
              <p className="mt-2 text-sm font-medium text-blue-700">
                PM phụ trách: {projectManagerMember.user.fullName}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            {canCreateProjectWork && (
              <button
                onClick={() => setIsMonthlyWorkModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Tạo công việc cho tháng mới</span>
              </button>
            )}
            {canSyncServiceJobs && (
              <button
                onClick={handleSyncServiceJobs}
                disabled={isSyncingServiceJobs}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingServiceJobs ? 'animate-spin' : ''}`} />
                <span>{isSyncingServiceJobs ? 'Đang đồng bộ...' : 'Đồng bộ công việc'}</span>
              </button>
            )}
            {canConfirmProject && (
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

        {canAssignPm && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-blue-700">
                  PM phụ trách
                </label>
                <select
                  value={selectedPmId}
                  onChange={(event) => setSelectedPmId(event.target.value)}
                  className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                >
                  <option value="">{pmUsers.length ? 'Chọn PM cho dự án' : 'Chưa có tài khoản PM'}</option>
                  {pmUsers.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.fullName} - {USER_ROLE.PM}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAssignPm}
                disabled={!selectedPmId || isAssigningProject}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <UserPlus className="h-4 w-4" />
                {isAssigningProject ? 'Đang phân công...' : 'Phân công PM'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="mb-6 flex w-fit max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-100/50 p-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab('MAIN')}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all",
            activeTab === 'MAIN' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
          )}
        >
          Thông tin chung
        </button>
        <button
          onClick={() => setActiveTab('TASKS')}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all",
            activeTab === 'TASKS' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
          )}
        >
          Công việc
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700">
            {taskCount}
          </span>
        </button>
        {isCoreMember && (
          <button
            onClick={() => setActiveTab('SERVICES')}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all",
              activeTab === 'SERVICES' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
            )}
          >
            Dịch vụ
          </button>
        )}
        <button
          onClick={() => setActiveTab('EXTRA')}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all",
            activeTab === 'EXTRA' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
          )}
        >
          Công việc phát sinh
          {extraTasks.length > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] text-orange-700">
              {extraTasks.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'MAIN' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <ProjectInfo project={project} formatDate={formatDate} />
          </div>
          <div className="space-y-6">
            <TeamInfo team={project.team} />
          </div>
        </div>
      )}

      {activeTab === 'TASKS' && (
        <div className="space-y-8">
          <TaskStatistics tasks={project.tasks} />
          <TaskTable tasks={project.tasks} project={project} className="min-w-[2000px]" />
        </div>
      )}

      {activeTab === 'SERVICES' && isCoreMember && (
        <ContractInfo contract={project.contract} projectId={project.id} />
      )}

      {activeTab === 'EXTRA' && (
        <ExtraTasksSection tasks={project.tasks} />
      )}

      <CreateMonthlyWorkModal
        isOpen={isMonthlyWorkModalOpen}
        onClose={() => setIsMonthlyWorkModalOpen(false)}
        projectId={project.id}
      />
    </div >
  );
};

export default ProjectDetailPage;
