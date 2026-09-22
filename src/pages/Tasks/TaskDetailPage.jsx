import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, User, Users, UserPlus, FileText, CheckCircle2, Clock, AlertCircle, Upload, Link as LinkIcon, X, ListChecks, Bell, History, MessageSquare, Paperclip, Plus } from 'lucide-react';
import { useGetTaskQuery, useSubmitTaskResultMutation, useSubmitTaskResultFileMutation, useRequestReworkMutation, useApproveByCustomerMutation, useRequestSupportMutation, useRespondToSupportMutation, useReturnSupportMutation, useRequestReturnSupportMutation, useSendTaskReminderMutation, useUpdateTaskMutation } from '../../api/tasks';
import { useGetTaskReviewsQuery } from '../../api/taskReviews';
import { useGetTaskResultCheckQuery } from '../../api/taskResultChecks';
import { ConfirmedCheckErrors } from '../../components/tasks/ConfirmedCheckErrors';
import { useGetMeQuery } from '../../api/auth';
import { formatDate, formatDateTime } from '../../utils/format';
import { toast } from 'react-toastify';
import { useState, useRef, useEffect } from 'react';
import { JOB_PERFORMER_TYPE, PROJECT_MANAGEMENT_ROLES, TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../utils/enums';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';
import { getFilePreviewUrl } from '../../utils/cloudinary';
import { ResultSheetSelectorPanel } from '../../components/tasks/ResultSheetSelectorPanel';
import { PanelErrorBoundary } from '../../components/shared/PanelErrorBoundary';
import { ReworkTaskModal } from '../../components/tasks/ReworkTaskModal';
import { TaskAssignModal } from '../Projects/ProjectDetailPage/TaskAssignModal';
import { getTaskDisplayName } from '../../utils/taskName';
import { getCurrentUserId, isSameUser } from '../../utils/authUser';
import { TaskDelegationPanel } from '../../components/tasks/TaskDelegationPanel';

const COMPLETED_SUBTASK_STATUSES = new Set(['INTERNAL_COMPLETED', 'COMPLETED', 'ACCEPTED']);

export const TaskDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: user } = useGetMeQuery();
    const { data: task, isLoading: isTaskLoading, error } = useGetTaskQuery(id);
    const { data: reviews } = useGetTaskReviewsQuery(id);
    const { data: resultCheck } = useGetTaskResultCheckQuery(id, { skip: !id });
    const [submitResult, { isLoading: isSubmittingResult }] = useSubmitTaskResultMutation();
    const [submitResultFile, { isLoading: isSubmittingResultFile }] = useSubmitTaskResultFileMutation();
    const [requestRework, { isLoading: isRequestingRework }] = useRequestReworkMutation();
    const [approveByCustomer, { isLoading: isApprovingByCustomer }] = useApproveByCustomerMutation();
    const [sendReminder, { isLoading: isSendingReminder }] = useSendTaskReminderMutation();
    const [updateTask, { isLoading: isUpdatingTask }] = useUpdateTaskMutation();
    const [requestSupport] = useRequestSupportMutation();
    const [respondToSupport] = useRespondToSupportMutation();
    const [returnSupport] = useReturnSupportMutation();
    const [requestReturnSupport] = useRequestReturnSupportMutation();

    const isLoading = isTaskLoading || !user;
    const currentUserId = getCurrentUserId(user);
    const isProjectLead = isSameUser(currentUserId, task?.project?.team?.teamLead?.id);
    const canManageProjectTask = PROJECT_MANAGEMENT_ROLES.includes(user?.role) || isProjectLead;
    const isVideoDemoTask = Boolean(task?.opportunityId && task?.opportunityServiceJob?.isBriefVideo);
    const isAssigneeOrHelper = isSameUser(currentUserId, task?.assigneeId) ||
        isSameUser(currentUserId, task?.assignee?.id) ||
        isSameUser(currentUserId, task?.helperId) ||
        isSameUser(currentUserId, task?.helper?.id);
    const isAssigner = isSameUser(currentUserId, task?.assignerId) || isSameUser(currentUserId, task?.assigner?.id);
    const canSubmitResult = isAssigneeOrHelper || isAssigner || canManageProjectTask || ['ADMIN', 'BOD'].includes(user?.role);
    const isReviewerForThisTask = canManageProjectTask && !isAssigneeOrHelper;
    const canEditDescription = canManageProjectTask;
    const incompleteSubtasks = (task?.subtasks || []).filter(
        subtask => !COMPLETED_SUBTASK_STATUSES.has(subtask.status)
    );
    const isParentBlockedBySubtasks = !task?.parentTaskId && incompleteSubtasks.length > 0;

    const [isReworkModalOpen, setIsReworkModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isStaffingModalOpen, setIsStaffingModalOpen] = useState(false);
    const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [submissionType, setSubmissionType] = useState('file');
    const [resultLink, setResultLink] = useState('');
    const [resultFile, setResultFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isPreparingSpellCheck, setIsPreparingSpellCheck] = useState(false);
    const [isSpellCheckStage, setIsSpellCheckStage] = useState(false);
    const [spellCheckFile, setSpellCheckFile] = useState(null);
    const [spellCheckUrl, setSpellCheckUrl] = useState(null);
    const [spellCheckFileName, setSpellCheckFileName] = useState(null);
    const [selectedSheets, setSelectedSheets] = useState([]);
    const [selectedScenarios, setSelectedScenarios] = useState([]);
    const [selectedScenarioLabels, setSelectedScenarioLabels] = useState([]);
    const [whitelist, setWhitelist] = useState([]);
    const [isLoadingResultSheets, setIsLoadingResultSheets] = useState(false);

    const isTaskAssigned = Boolean(task?.assigneeId || task?.assignee?.id || task?.vendorId);
    const canAssignUnassignedTask = canManageProjectTask &&
        !isTaskAssigned &&
        !['COMPLETED', 'ACCEPTED', 'DONE', 'INTERNAL_COMPLETED', 'AWAITING_REVIEW', 'CANCELLED'].includes(task?.status);
    const fileInputRef = useRef(null);

    const isResultReady = submissionType === 'file'
        ? Boolean(resultFile)
        : Boolean(resultLink.trim());

    const team = task?.project?.team;
    const currentMembership = team?.members?.find(member => isSameUser(member.user?.id, currentUserId));
    const isPM = currentMembership?.role === 'PROJECT_MANAGER' || isSameUser(task?.project?.projectManager?.id, currentUserId);
    const isAccount = isSameUser(team?.teamLead?.id, currentUserId) || currentMembership?.role === 'ACCOUNT';
    const isAdminOverride = ['ADMIN', 'BOD'].includes(user?.role);
    const isTeamLead = isSameUser(team?.teamLead?.id, currentUserId);
    const canDelegate = isAccount || isPM || isAdminOverride || isTeamLead;
    const canAddSubtask = canDelegate &&
        !task?.parentTaskId &&
        (!task?.subtasks || task?.subtasks?.length === 0) &&
        task?.performerType === 'INTERNAL' &&
        ['PENDING', 'DOING', 'REWORKING', 'OVERDUE', 'AWAITING_SUPPORT'].includes(task?.status);

    useEffect(() => {
        if (isResultModalOpen) {
            setIsSpellCheckStage(false);
            setSpellCheckFile(null);
            setSpellCheckUrl(null);
            setSpellCheckFileName(null);
            setSelectedSheets([]);
            setSelectedScenarios([]);
            setSelectedScenarioLabels([]);
            setWhitelist([]);
            setIsLoadingResultSheets(false);
        }
    }, [isResultModalOpen, task?.id]);

    const getStatusBadge = status => {
        const label = TASK_STATUS_LABELS[status] || status;
        const icon = ['COMPLETED', 'ACCEPTED', 'DONE', 'INTERNAL_COMPLETED'].includes(status)
            ? <CheckCircle2 className="w-3 h-3" />
            : ['DOING', 'REWORKING', 'SUPPORT_AWAITING_RETURN'].includes(status)
                ? <Clock className="w-3 h-3" />
                : <AlertCircle className="w-3 h-3" />;

        return (
            <span className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border shadow-sm",
                TASK_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 border-gray-200'
            )}>
                {icon}
                {label}
            </span>
        );
    };

    const handleStartEditDescription = () => {
        setEditedDescription(task?.description || '');
        setIsEditingDescription(true);
    };

    const handleSaveDescription = async () => {
        try {
            await updateTask({
                id,
                description: editedDescription,
                projectId: task?.project?.id
            }).unwrap();
            toast.success('Cập nhật mô tả thành công!');
            setIsEditingDescription(false);
        } catch (err) {
            toast.error(err?.data?.message || err?.message || 'Có lỗi xảy ra khi cập nhật mô tả');
        }
    };

    const handleFileChange = e => {
        const file = e.target.files?.[0];
        if (!file) return;
        setResultFile(file);
        setResultLink('');
    };

    const handleLinkChange = e => {
        const value = e.target.value;
        setResultLink(value);
        setResultFile(null);
        setSpellCheckFile(null);
        setSpellCheckUrl(null);
        setSpellCheckFileName(null);
        setIsSpellCheckStage(false);
        setSelectedSheets([]);
        setSelectedScenarios([]);
        setSelectedScenarioLabels([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getFileNameFromUrl = url => {
        try {
            const pathname = new URL(url).pathname;
            const name = pathname.split('/').filter(Boolean).pop();
            return name || 'result-file';
        } catch {
            return 'result-file';
        }
    };

    const resolveSpellCheckLinkSource = rawUrl => {
        try {
            const parsed = new URL(rawUrl);
            const sheetsMatch = parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
            if (parsed.hostname.includes('docs.google.com') && sheetsMatch) {
                const fileId = sheetsMatch[1];
                // format=xlsx always exports the full workbook (all tabs);
                // adding gid here makes Google export only that single tab, so it's intentionally omitted.
                const exportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
                return { url: exportUrl, fileName: `google-sheet-${fileId}.xlsx` };
            }
            return { url: rawUrl, fileName: getFileNameFromUrl(rawUrl) };
        } catch {
            return { url: rawUrl, fileName: getFileNameFromUrl(rawUrl) };
        }
    };

    const fetchLinkAsFile = async url => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Không thể tải file từ link');
        const blob = await response.blob();
        const fileName = getFileNameFromUrl(url);
        const extension = blob.type?.split('/')[1] || 'bin';
        return new File(
            [blob],
            fileName.includes('.') ? fileName : `${fileName}.${extension}`,
            { type: blob.type || 'application/octet-stream' }
        );
    };

    const handleStartSpellCheck = async () => {
        if (!isResultReady) return;

        if (submissionType === 'link') {
            const { url, fileName } = resolveSpellCheckLinkSource(resultLink.trim());
            setSpellCheckUrl(url);
            setSpellCheckFileName(fileName);
            setSpellCheckFile(null);
            setIsSpellCheckStage(true);
            return;
        }

        setSpellCheckFile(resultFile);
        setSpellCheckUrl(null);
        setSpellCheckFileName(null);
        setIsSpellCheckStage(true);
    };

    const handleSubmitAfterSpellCheck = async () => {
        if (isLoadingResultSheets) return;
        try {
            let resultData = null;

            if (submissionType === 'file' && resultFile) {
                setIsUploading(true);

                await submitResultFile({ id, file: resultFile, projectId: task.project?.id, sheetNames: selectedSheets, whitelist, scenarioIds: selectedScenarios, scenarioLabels: selectedScenarioLabels }).unwrap();

                setIsUploading(false);
                toast.success('Gửi kết quả thành công!');
                setIsResultModalOpen(false);
                setIsSpellCheckStage(false);
                setSpellCheckFile(null);
                setSpellCheckUrl(null);
                setSpellCheckFileName(null);
                setSelectedSheets([]);
                setSelectedScenarios([]);
                setSelectedScenarioLabels([]);
                setWhitelist([]);
                setResultFile(null);
                setResultLink('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            } else if (submissionType === 'link' && resultLink.trim()) {
                resultData = {
                    type: 'LINK',
                    url: resultLink.trim(),
                    name: resultLink.trim()
                };
            }

            await submitResult({
                id,
                result: resultData,
                projectId: task.project?.id,
                sheetNames: selectedSheets,
                whitelist,
                scenarioIds: selectedScenarios,
                scenarioLabels: selectedScenarioLabels,
                checkFileUrl: submissionType === 'link' ? spellCheckUrl : undefined,
                checkFileName: submissionType === 'link' ? spellCheckFileName : undefined
            }).unwrap();

            toast.success('Gửi kết quả thành công!');
            setIsResultModalOpen(false);
            setIsSpellCheckStage(false);
            setSpellCheckFile(null);
            setSpellCheckUrl(null);
            setSpellCheckFileName(null);
            setSelectedSheets([]);
            setSelectedScenarios([]);
            setSelectedScenarioLabels([]);
            setWhitelist([]);
            setResultFile(null);
            setResultLink('');

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setIsUploading(false);
            toast.error(err?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi kết quả');
        }
    };

    const handleCustomerApprove = async () => {
        try {
            await approveByCustomer({ id, projectId: task.project?.id }).unwrap();
            toast.success(isVideoDemoTask
                ? 'Đã nghiệm thu demo 0 đồng và cộng Vinicoin!'
                : 'Khách hàng đã duyệt công việc!');
        } catch (err) {
            toast.error(err?.data?.message || 'Lỗi khi duyệt công việc');
        }
    };

    const handleRequestSupport = async () => {
        try {
            await requestSupport({ id, note: 'Yêu cầu hỗ trợ từ thành viên', projectId: task.project?.id }).unwrap();
            toast.success('Đã gửi yêu cầu hỗ trợ!');
        } catch (err) {
            toast.error(err?.data?.message || 'Lỗi khi gửi yêu cầu');
        }
    };

    const handleRespondSupport = async action => {
        try {
            await respondToSupport({ id, action, projectId: task.project?.id }).unwrap();
            toast.success(action === 'ACCEPT' ? 'Đã chấp nhận hỗ trợ' : 'Đã từ chối hỗ trợ');
        } catch (err) {
            toast.error(err?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleReturnSupport = async () => {
        try {
            await returnSupport({ id, projectId: task.project?.id }).unwrap();
            toast.success('Đã trả lại task cho team gốc');
            navigate(-1);
        } catch (err) {
            toast.error(err?.data?.message || 'Lỗi khi trả lại task');
        }
    };

    const handleRequestReturnSupport = async () => {
        try {
            await requestReturnSupport({ id, note: 'Yêu cầu trả lại task', projectId: task.project?.id }).unwrap();
            toast.success('Đã gửi yêu cầu hỗ trợ task!');
        } catch (err) {
            toast.error(err?.data?.message || 'Lỗi khi gửi yêu cầu');
        }
    };

    const handleSendReminder = async () => {
        try {
            await sendReminder(id).unwrap();
            toast.success('Đã gửi nhắc nhở thành công!');
        } catch (err) {
            toast.error(err?.data?.message || 'Lỗi khi gửi nhắc nhở');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Đang tải thông tin công việc...</p>
                </div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50/50 p-6">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Lỗi tải dữ liệu</h2>
                    <p className="text-gray-500 mb-6 font-medium">Không tìm thấy thông tin công việc hoặc có lỗi xảy ra.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => task.project?.id ? navigate(`/projects/${task.project.id}`) : navigate('/tasks')}
                        className="group flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>{task.project?.id ? `Quay lại dự án: ${task.project.name}` : 'Quay lại danh sách công việc'}</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-4">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{getTaskDisplayName(task)}</h1>
                        {getStatusBadge(task.status)}
                        {task.customerDecision === 'APPROVED' && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-emerald-200">
                                Khách hàng duyệt
                            </span>
                        )}
                        {task.customerDecision === 'NOT_PURCHASED' && (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase text-amber-700 ring-1 ring-amber-200">
                                Khách hàng không mua
                            </span>
                        )}
                    </div>

                    <p className="text-gray-500 font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg inline-block">{task.code}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
                    {canAssignUnassignedTask && (
                        <Button
                            onClick={() => setIsAssignModalOpen(true)}
                            className="w-full justify-center rounded-2xl py-2.5 sm:py-3 px-4 sm:px-6 shadow-lg shadow-blue-100 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 whitespace-nowrap text-sm"
                        >
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                            <span>Phân công</span>
                        </Button>
                    )}
                    {task.status === 'AWAITING_REVIEW' && isReviewerForThisTask && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsReworkModalOpen(true)}
                                className="w-full justify-center rounded-2xl py-2.5 sm:py-3 px-4 sm:px-6 shadow-sm border-purple-200 text-purple-600 hover:bg-purple-50 flex items-center gap-2 whitespace-nowrap text-sm"
                            >
                                <History className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                <span>Yêu cầu làm lại</span>
                            </Button>

                            <Button
                                onClick={() => navigate(`/tasks/${id}/review`)}
                                disabled={isParentBlockedBySubtasks}
                                title={isParentBlockedBySubtasks ? 'Cần hoàn tất tất cả subtask trước khi duyệt task chính' : undefined}
                                className="w-full justify-center rounded-2xl py-2.5 sm:py-3 px-4 sm:px-6 shadow-lg shadow-blue-100 flex items-center gap-2 whitespace-nowrap text-sm"
                            >
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                <span>Đánh giá & Duyệt</span>
                            </Button>
                        </>
                    )}

                    {task.status === 'INTERNAL_COMPLETED' && canManageProjectTask && !isVideoDemoTask && (
                        <Button
                            onClick={handleCustomerApprove}
                            isLoading={isApprovingByCustomer}
                            disabled={isParentBlockedBySubtasks}
                            title={isParentBlockedBySubtasks ? 'Cần hoàn tất tất cả subtask trước khi hoàn thành task chính' : undefined}
                            className="w-full justify-center rounded-2xl py-2.5 sm:py-3 px-4 sm:px-6 shadow-lg shadow-emerald-100 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 whitespace-nowrap text-sm"
                        >
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                            <span>Khách hàng duyệt</span>
                        </Button>
                    )}

                    {(task.status === 'DONE' || task.status === 'COMPLETED' || task.status === 'INTERNAL_COMPLETED') && canManageProjectTask && !isVideoDemoTask && (
                        <Button
                            variant="outline"
                            onClick={() => setIsReworkModalOpen(true)}
                            className="w-full justify-center rounded-2xl py-2.5 sm:py-3 px-4 sm:px-6 shadow-sm border-purple-200 text-purple-600 hover:bg-purple-50 flex items-center gap-2 whitespace-nowrap text-sm"
                        >
                            <History className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                            <span>Yêu cầu làm lại</span>
                        </Button>
                    )}

                    {(task.status === 'DOING' || task.status === 'REWORKING' || task.status === 'OVERDUE') &&
                        (isSameUser(currentUserId, task.assigneeId) || isSameUser(currentUserId, task.helperId)) &&
                        !task.isSupportRequested && (
                            <Button
                                variant="outline"
                                onClick={handleRequestSupport}
                                className="w-full justify-center rounded-2xl py-2.5 sm:py-3 px-4 sm:px-6 border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2 whitespace-nowrap text-sm"
                            >
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                <span>Nhờ hỗ trợ</span>
                            </Button>
                        )}

                    {/* Deprecated cross-team support buttons */}
                    {/*
                    {task.status === 'SUPPORT_PENDING' && isSameUser(task.supportLeadId, currentUserId) && (
                        <div className="flex gap-3">
                            <Button
                                onClick={() => handleRespondSupport('ACCEPT')}
                                className="rounded-2xl py-3 px-6 shadow-lg shadow-green-100 bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Đồng ý hỗ trợ
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => handleRespondSupport('REJECT')}
                                className="rounded-2xl py-3 px-6 shadow-sm border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <X className="w-5 h-5" />
                                Từ chối
                            </Button>
                        </div>
                    )}

                    {(task.status === 'DOING' || task.status === 'REWORKING' || task.status === 'OVERDUE') && isSameUser(currentUserId, task.helperId) && (
                        <Button
                            variant="outline"
                            onClick={handleRequestReturnSupport}
                            className="rounded-2xl py-3 px-6 border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <AlertCircle className="w-5 h-5" />
                            Hỗ trợ
                        </Button>
                    )}

                    {task.isSupportAccepted &&
                        isSameUser(task.supportLeadId, currentUserId) &&
                        task.isSupportReturnRequested &&
                        (task.status === 'DOING' || task.status === 'REWORKING' || task.status === 'SUPPORT_AWAITING_RETURN') && (
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsAssignModalOpen(true)}
                                    className="rounded-2xl py-3 px-6 border-amber-200 text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                >
                                    <Users className="w-5 h-5" />
                                    Phân công lại
                                </Button>

                                <Button
                                    onClick={handleReturnSupport}
                                    className="rounded-2xl py-3 px-6 shadow-lg shadow-red-100 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Trả lại
                                </Button>
                            </div>
                        )}
                    */}

                    {canManageProjectTask &&
                        (task.assigneeId || task.helperId) &&
                        !['COMPLETED', 'ACCEPTED', 'DONE', 'INTERNAL_COMPLETED', 'AWAITING_REVIEW'].includes(task.status) && (
                            <Button
                                onClick={handleSendReminder}
                                isLoading={isSendingReminder}
                                className="rounded-2xl py-3 px-6 shadow-lg shadow-blue-100 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                            >
                                <Bell className="w-5 h-5" />
                                Nhắc việc
                            </Button>
                        )}

                    {task?.performerType === 'INTERNAL' &&
                        ['PENDING', 'DOING', 'REWORKING', 'OVERDUE'].includes(task?.status) &&
                        task?.project?.team &&
                        (isProjectLead || isTeamLead) && (
                            <Button
                                variant="outline"
                                onClick={() => setIsStaffingModalOpen(true)}
                                disabled={task?.supportRequestType === 'STAFFING' && task?.isSupportRequested && !task?.isSupportAccepted}
                                className="w-full justify-center rounded-2xl py-2.5 sm:py-3 px-4 sm:px-6 border-orange-200 text-orange-700 hover:bg-orange-50 flex items-center gap-2 whitespace-nowrap text-sm disabled:opacity-60"
                            >
                                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#F38820]" />
                                <span>
                                    {task?.supportRequestType === 'STAFFING' && task?.isSupportRequested && !task?.isSupportAccepted
                                        ? 'Đang chờ PM'
                                        : 'Yêu cầu thêm người'}
                                </span>
                            </Button>
                        )}

                    {canAddSubtask && (
                        <Button
                            variant="outline"
                            onClick={() => setIsSubtaskModalOpen(true)}
                            className="w-full justify-center rounded-2xl py-2.5 sm:py-3 px-4 sm:px-6 border-orange-200 text-orange-700 hover:bg-orange-50 flex items-center gap-2 whitespace-nowrap text-sm"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#F38820]" />
                            <span>Thêm subtask</span>
                        </Button>
                    )}
                </div>
            </div>

            <TaskDelegationPanel
                task={task}
                currentUser={user}
                isStaffingModalOpen={isStaffingModalOpen}
                setIsStaffingModalOpen={setIsStaffingModalOpen}
                isSubtaskModalOpen={isSubtaskModalOpen}
                setIsSubtaskModalOpen={setIsSubtaskModalOpen}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Mô tả & Ghi chú</h2>
                            </div>

                            {canEditDescription && !isEditingDescription && (
                                <button
                                    onClick={handleStartEditDescription}
                                    className="flex items-center gap-1.5 py-1.5 px-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                                    title="Chỉnh sửa mô tả"
                                >
                                    <Edit className="w-4 h-4" />
                                    Chỉnh sửa
                                </button>
                            )}
                        </div>

                        {isEditingDescription ? (
                            <div className="space-y-4">
                                <textarea
                                    rows={6}
                                    className="w-full p-4 bg-slate-50/50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-50/50 resize-y min-h-[120px]"
                                    placeholder="Nhập mô tả chi tiết hoặc lưu ý cho người thực hiện..."
                                    value={editedDescription}
                                    onChange={e => setEditedDescription(e.target.value)}
                                />

                                <div className="flex gap-3 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditingDescription(false)}
                                        className="rounded-xl py-2 px-4 text-xs font-bold uppercase tracking-wider"
                                    >
                                        Hủy
                                    </Button>

                                    <Button
                                        onClick={handleSaveDescription}
                                        isLoading={isUpdatingTask}
                                        className="rounded-xl py-2 px-4 text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                                    >
                                        Lưu thay đổi
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-blue max-w-none">
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {task.description || 'Không có mô tả cho công việc này.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {reviews && reviews.length > 0 && task.status !== 'AWAITING_REVIEW' && (() => {
                        const renderReviewItem = review => (
                            <div
                                key={review.id}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                                    review.isPassed ? "bg-green-50/30 border-green-100" : "bg-gray-50/50 border-gray-100"
                                )}
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded-md border flex items-center justify-center shrink-0",
                                    review.isPassed ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-300 text-transparent"
                                )}>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className={cn(
                                        "text-sm font-bold truncate",
                                        review.isPassed ? "text-green-800" : "text-gray-700"
                                    )}>
                                        {review.criteria?.name}
                                    </p>
                                    {review.note && (
                                        <p className="text-xs text-red-600 mt-1 whitespace-pre-wrap">{review.note}</p>
                                    )}
                                </div>
                            </div>
                        );

                        return (
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                                <div className="flex items-center gap-3 mb-6 justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                            <ListChecks className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Kết quả đánh giá</h2>
                                    </div>

                                    <div>
                                        <p className="text-sm">
                                            {reviews.filter(r => r.isPassed).length === reviews.length
                                                ? <span className="text-green-500 font-semibold bg-green-100 px-2 py-1 rounded-lg">Đạt</span>
                                                : <span className="text-red-500 font-semibold bg-red-100 px-2 py-1 rounded-lg">Không đạt</span>}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Team Lead đánh giá</p>
                                            {reviews.filter(r => r.reviewerType === 'TEAM_LEAD').length > 0
                                                ? reviews.filter(r => r.reviewerType === 'TEAM_LEAD').map(renderReviewItem)
                                                : <p className="text-xs text-gray-400 italic ml-1">Chưa có đánh giá từ Team Lead</p>}
                                        </div>
                                    </div>

                                    {task.reviewNote && (
                                        <p className="text-md pl-2 text-gray-500 mt-1 italic border-t border-gray-50 pt-4">
                                            Ghi chú: {task.reviewNote}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {resultCheck?.finalizedAt && (((resultCheck.reviewedSpellErrors || []).length > 0) || ((resultCheck.reviewedQcMismatches || []).length > 0)) && (
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                            <ConfirmedCheckErrors
                                title="Lỗi đã chốt ở kết quả đã nộp"
                                spellErrors={(resultCheck.reviewedSpellErrors || []).filter(e => e.confirmed !== false)}
                                qcMismatches={(resultCheck.reviewedQcMismatches || []).filter(m => m.confirmed !== false)}
                            />
                        </div>
                    )}

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 overflow-hidden">
                        {isParentBlockedBySubtasks && (
                            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                                Task chính chưa thể nộp kết quả hoặc hoàn thành vì còn {incompleteSubtasks.length} subtask chưa hoàn tất.
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Kết quả</h2>
                            </div>

                            {(task.status === 'DOING' || task.status === 'REJECTED' || task.status === 'REWORKING' || task.status === 'OVERDUE') &&
                                canSubmitResult &&
                                !isParentBlockedBySubtasks && (
                                    <button
                                        onClick={() => setIsResultModalOpen(true)}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-bold uppercase transition-colors cursor-pointer"
                                    >
                                        {task.result ? 'Cập nhật kết quả' : 'Thêm kết quả'}
                                    </button>
                                )}
                        </div>

                        {task.result ? (
                            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 bg-white rounded-2xl border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                                            {task.result.type === 'CHECKLIST' || task.result.type === 'CONFIRMATION'
                                                ? <ListChecks className="w-6 h-6" />
                                                : <FileText className="w-6 h-6" />}
                                        </div>

                                        <div className="min-w-0 overflow-hidden">
                                            <p className="text-sm font-bold text-gray-900">{task.result.name}</p>

                                            {task.result.note && (
                                                <p className="text-xs text-gray-500 mt-1">{task.result.note}</p>
                                            )}

                                            {task.lastSubmittedBy && (
                                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">
                                                    Người làm: {task.lastSubmittedBy.fullName}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {task.result.url && (
                                        <a
                                            href={getFilePreviewUrl(task.result.url, task.result.type)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all shrink-0"
                                        >
                                            Xem ngay
                                        </a>
                                    )}
                                </div>

                                {task.result.type === 'CHECKLIST' && task.result.checklist?.length > 0 && (
                                    <div className="grid gap-2 pt-2 border-t border-blue-100">
                                        {task.result.checklist.map((item, idx) => (
                                            <div key={item.criteriaId || idx} className="flex items-start gap-2 text-xs text-gray-700">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="font-bold">{item.label}</p>
                                                    {item.description && <p className="text-gray-400 mt-0.5">{item.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                                <p className="text-gray-400 font-medium">Chưa có kết quả nào được tải lên</p>
                            </div>
                        )}
                    </div>

                    {task.iterations && task.iterations.length > 0 && (
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                                    <History className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Lịch sử làm lại</h2>
                            </div>

                            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                {task.iterations.slice().sort((a, b) => b.version - a.version).map(iteration => (
                                    <div key={iteration.id} className="relative pl-12">
                                        <div className="absolute left-0 top-1.5 w-10 h-10 bg-white border-2 border-purple-500 rounded-full flex items-center justify-center text-purple-600 z-10 shadow-sm">
                                            <span className="text-xs font-black">v{iteration.version}</span>
                                        </div>

                                        <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 space-y-4">
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-lg">Đợt {iteration.version}</span>
                                                    <span className="text-[10px] font-bold text-gray-400">{formatDate(iteration.createdAt)}</span>

                                                    {iteration.submittedBy && (
                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                                                            Người làm: {iteration.submittedBy.fullName}
                                                        </span>
                                                    )}
                                                </div>

                                                {iteration.deadlineAt && (
                                                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                                                        Deadline mới: {formatDate(iteration.deadlineAt)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Phản hồi của Lead</span>
                                                </div>

                                                <p className="text-sm text-gray-700 font-medium italic border-l-2 border-purple-200 pl-3 py-1">
                                                    "{iteration.leadFeedback}"
                                                </p>
                                            </div>

                                            <ConfirmedCheckErrors spellErrors={iteration.confirmedSpellErrors} qcMismatches={iteration.confirmedQcMismatches} />

                                            {iteration.feedbackAttachments && iteration.feedbackAttachments.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <Paperclip className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Tài liệu đính kèm</span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {iteration.feedbackAttachments.map((file, fIdx) => (
                                                            file.type === 'FILE' ? (
                                                                <a
                                                                    key={fIdx}
                                                                    href={getFilePreviewUrl(file.url, file.type)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 hover:border-blue-200 transition-all"
                                                                >
                                                                    <FileText className="w-3 h-3 text-blue-500" />
                                                                    <span className="max-w-[120px] truncate">{file.name}</span>
                                                                </a>
                                                            ) : file.type === 'LINK' ? (
                                                                <a
                                                                    key={fIdx}
                                                                    href={file.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 hover:border-blue-200 transition-all"
                                                                >
                                                                    <LinkIcon className="w-3 h-3 text-blue-500" />
                                                                    <span className="max-w-[120px] truncate">{file.name}</span>
                                                                </a>
                                                            ) : null
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {iteration.submittedResult && (
                                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Kết quả đã nộp cũ</span>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4 p-3 bg-white rounded-2xl border border-gray-100">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <p className="text-xs font-bold text-gray-700 truncate">{iteration.submittedResult.name}</p>
                                                        </div>

                                                        <a
                                                            href={iteration.submittedResult.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] font-black text-blue-600 hover:underline uppercase"
                                                        >
                                                            Xem lại
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="space-y-8">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
                                Nhân sự thực hiện
                            </h2>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-100">
                                    {task.assignee?.fullName?.charAt(0) || <User className="w-6 h-6" />}
                                </div>

                                <div>
                                    <p className="text-gray-900 font-bold">{task.assignee?.fullName || task.assignee?.name || 'Chưa có người thực hiện'}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                        {JOB_PERFORMER_TYPE[task.performerType] || 'INTERNAL'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Kế hoạch</h2>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Deadline</p>
                                <p className="text-md font-bold text-gray-700">{formatDateTime(task.plannedEndDate)}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-500" />
                                    Tài liệu
                                </h3>

                                <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {task.attachments?.length || 0}
                                </span>
                            </div>

                            {task.attachments && task.attachments.length > 0 ? (
                                <div className="space-y-3">
                                    {task.attachments.map((file, idx) => (
                                        <a
                                            key={idx}
                                            href={getFilePreviewUrl(file.url, file.type)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 hover:bg-white transition-all"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                                <FileText className="w-4 h-4" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-700 truncate">{file.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">{file.type}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic text-center py-4">Không có tài liệu đính kèm</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                title={isSpellCheckStage ? 'Chọn sheet kiểm tra' : 'Gửi kết quả công việc'}
                className={isSpellCheckStage ? "max-w-4xl" : "max-w-md"}
            >
                {!isSpellCheckStage ? (
                    <div className="space-y-6">
                        <div className="flex p-1 bg-gray-100 rounded-2xl">
                            <button
                                onClick={() => setSubmissionType('file')}
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                                    submissionType === 'file' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <Upload className="w-4 h-4" />
                                Tải file lên
                            </button>

                            <button
                                onClick={() => setSubmissionType('link')}
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                                    submissionType === 'link' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <LinkIcon className="w-4 h-4" />
                                Gửi link
                            </button>
                        </div>

                        {submissionType === 'file' ? (
                            <div className="space-y-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                                >
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />

                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-3 group-hover:scale-110 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                        <Upload className="w-6 h-6" />
                                    </div>

                                    <p className="text-sm font-bold text-gray-900 mb-1">
                                        {resultFile ? resultFile.name : 'Nhấn để chọn file'}
                                    </p>

                                    <p className="text-xs text-gray-400 font-medium text-center">
                                        Chấp nhận file hình ảnh, PDF, Excel, Word...
                                    </p>

                                    {resultFile && (
                                        <p className="text-[10px] text-blue-500 font-bold mt-3">
                                            File sẽ được kiểm tra chính tả trước khi nộp
                                        </p>
                                    )}

                                    {isUploading && (
                                        <div className="mt-4 text-[10px] font-bold text-blue-600">
                                            Đang tải lên...
                                        </div>
                                    )}
                                </div>

                                {resultFile && (
                                    <button
                                        onClick={() => {
                                            setResultFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="text-red-500 text-xs font-bold uppercase flex items-center gap-1 mx-auto hover:text-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                        Gỡ bỏ file
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                        Đường dẫn kết quả
                                    </label>

                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                                        <input
                                            type="url"
                                            placeholder="https://example.com/file.docx"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                                            value={resultLink}
                                            onChange={handleLinkChange}
                                        />
                                    </div>

                                    <div className="ml-2 mt-2 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-[11px] font-semibold">
                                        ⚠️ Link file phải để ở chế độ <span className="font-bold">Public</span> để hệ thống có thể kiểm định.
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-2xl py-4"
                                onClick={() => setIsResultModalOpen(false)}
                            >
                                Hủy
                            </Button>

                            <Button
                                className="flex-1 rounded-2xl py-4 shadow-lg shadow-blue-200"
                                onClick={handleStartSpellCheck}
                                isLoading={isPreparingSpellCheck}
                                disabled={isPreparingSpellCheck || !isResultReady}
                            >
                                {isPreparingSpellCheck ? 'Đang chuẩn bị...' : 'Tiếp tục'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                            <p className="text-sm font-bold text-blue-800">Chọn sheet để kiểm tra chính tả &amp; QC</p>
                            <p className="text-xs text-blue-600 mt-1">Kết quả kiểm tra sẽ được xử lý sau khi nộp và hiển thị cho người duyệt.</p>
                        </div>

                        <PanelErrorBoundary resetKey={spellCheckFile || spellCheckUrl} fallbackMessage="Không thể chuẩn bị kiểm tra lúc này">
                            <ResultSheetSelectorPanel
                                file={spellCheckFile}
                                fileUrl={spellCheckUrl}
                                fileName={spellCheckFileName || undefined}
                                projectId={task?.project?.id}
                                selectedSheets={selectedSheets}
                                onSelectedSheetsChange={setSelectedSheets}
                                selectedScenarios={selectedScenarios}
                                onSelectedScenariosChange={setSelectedScenarios}
                                onSelectedScenarioLabelsChange={setSelectedScenarioLabels}
                                whitelist={whitelist}
                                onWhitelistChange={setWhitelist}
                                onLoadingChange={setIsLoadingResultSheets}
                            />
                        </PanelErrorBoundary>

                        <div className="pt-4 flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-2xl py-4"
                                onClick={() => {
                                    setIsSpellCheckStage(false);
                                    setSpellCheckFile(null);
                                    setSpellCheckUrl(null);
                                    setSpellCheckFileName(null);
                                    setSelectedSheets([]);
                                    setSelectedScenarios([]);
                                    setSelectedScenarioLabels([]);
                                    setWhitelist([]);
                                    setIsLoadingResultSheets(false);
                                }}
                            >
                                Quay lại
                            </Button>

                            <Button
                                className="flex-1 rounded-2xl py-4 shadow-lg shadow-blue-200"
                                onClick={handleSubmitAfterSpellCheck}
                                isLoading={isSubmittingResult || isSubmittingResultFile || isUploading}
                                disabled={isSubmittingResult || isSubmittingResultFile || isUploading || isLoadingResultSheets}
                            >
                                {isUploading ? 'Đang tải lên...' : isLoadingResultSheets ? 'Đang đọc danh sách sheet...' : 'Nộp kết quả'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <ReworkTaskModal
                isOpen={isReworkModalOpen}
                onClose={() => setIsReworkModalOpen(false)}
                taskName={getTaskDisplayName(task)}
                isLoading={isRequestingRework}
                onSubmit={async data => {
                    try {
                        await requestRework({
                            id,
                            projectId: task.project?.id,
                            ...data
                        }).unwrap();
                        toast.success('Gửi yêu cầu làm lại thành công');
                        setIsReworkModalOpen(false);
                    } catch (err) {
                        toast.error(err?.data?.message || 'Lỗi khi gửi yêu cầu làm lại');
                    }
                }}
            />

            <TaskAssignModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                task={task}
                project={task.project}
            />
        </div>
    );
};

export default TaskDetailPage;
