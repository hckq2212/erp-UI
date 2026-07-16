import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, AlertCircle, Link as LinkIcon, MessageSquare, XCircle, ListChecks } from 'lucide-react';
import { useGetTaskQuery } from '../../api/tasks';
import { getTaskDisplayName } from '../../utils/taskName';
import { useGetTaskReviewsQuery, useToggleTaskReviewPassedMutation, useFinalizeTaskMutation, useRejectTaskMutation } from '../../api/taskReviews';
import { useGetMeQuery } from '../../api/auth';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';
import { getFilePreviewUrl } from '../../utils/cloudinary';

export const TaskReviewPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: user } = useGetMeQuery();
    // Fetch task details
    const { data: task, isLoading: isTaskLoading, error: taskError } = useGetTaskQuery(id);

    // Fetch task reviews (criterias)
    const { data: reviews, isLoading: isReviewsLoading } = useGetTaskReviewsQuery(id);

    const [toggleReview] = useToggleTaskReviewPassedMutation();
    const [finalizeTask, { isLoading: isFinalizing }] = useFinalizeTaskMutation();
    const [rejectTask, { isLoading: isRejecting }] = useRejectTaskMutation();

    const [note, setNote] = useState('');
    const [passedIds, setPassedIds] = useState([]);
    const [activeTab, setActiveTab] = useState(null); // 'TEAM_LEAD' or 'ASSIGNER'

    const isLead = user?.id === task?.project?.team?.teamLead?.id;
    const isAssigner = user?.id === task?.assignerId;

    const leadReviews = reviews?.filter(r => r.reviewerType === 'TEAM_LEAD') || [];
    const assignerReviews = reviews?.filter(r => r.reviewerType === 'ASSIGNER') || [];

    const isLeadPassed = leadReviews.length === 0 || leadReviews.every(r => passedIds.includes(r.id));
    const isAssignerPassed = assignerReviews.length === 0 || assignerReviews.every(r => passedIds.includes(r.id));

    const isAllPassed = isLeadPassed && isAssignerPassed;

    // Dual review happens if there's a lead AND an assigner, and they both have reviews to do
    const isDualReview = leadReviews.length > 0 && assignerReviews.length > 0;

    useEffect(() => {
        if (!activeTab && user && task) {
            if (isLead) setActiveTab('TEAM_LEAD');
            else if (isAssigner && !isDualReview) setActiveTab('ASSIGNER');
            else if (isDualReview) setActiveTab('TEAM_LEAD');
        }
    }, [user, task, isLead, isAssigner, isDualReview, activeTab]);

    useEffect(() => {
        if (reviews) {
            setPassedIds(reviews.filter(r => r.isPassed).map(r => r.id));
        }
    }, [reviews]);

    const handleToggle = (review) => {
        // Permission check: 
        // 1. If dual review: must match active tab role
        // 2. If single review: must be either lead or assigner
        let canToggle = false;
        if (isDualReview) {
            canToggle = (activeTab === 'TEAM_LEAD' && isLead) || (activeTab === 'ASSIGNER' && isAssigner);
        } else {
            canToggle = isLead || isAssigner;
        }

        if (!canToggle) {
            toast.warning('Bạn không có quyền đánh giá trong phần này');
            return;
        }

        setPassedIds(prev =>
            prev.includes(review.id)
                ? prev.filter(id => id !== review.id)
                : [...prev, review.id]
        );
    };

    const handleApprove = async () => {
        try {
            await finalizeTask({
                taskId: id,
                passedCriteriaIds: passedIds,
                reviewNote: note,
                projectId: task.project?.id
            }).unwrap();
            toast.success('Duyệt công việc thành công!');
            navigate(`/projects/${task.project?.id}`);
        } catch (err) {
            toast.error(err.data?.message || 'Có lỗi xảy ra khi duyệt công việc');
        }
    };

    const handleReject = async () => {
        if (!note) {
            toast.warning('Vui lòng nhập ghi chú lý do từ chối');
            return;
        }
        try {
            await rejectTask({
                taskId: id,
                passedCriteriaIds: passedIds,
                reviewNote: note,
                projectId: task.project?.id
            }).unwrap();
            toast.success('Đã từ chối kết quả công việc');
            navigate(`/tasks/${id}`);
        } catch (err) {
            toast.error(err.data?.message || 'Có lỗi xảy ra khi từ chối công việc');
        }
    };

    if (isTaskLoading || isReviewsLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Đang tải thông tin đánh giá...</p>
                </div>
            </div>
        );
    }

    if (taskError || !task) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Lỗi tải dữ liệu</h2>
                <p className="text-gray-500 mb-6">Không tìm thấy thông tin công việc.</p>
                <Button onClick={() => navigate(-1)}>Quay lại</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <button
                    onClick={() => navigate(`/tasks/${id}`)}
                    className="group flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Quay lại chi tiết công việc</span>
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Đánh giá công việc</h1>
                        <p className="text-gray-500 font-medium">{getTaskDisplayName(task)}</p>
                    </div>

                    {isDualReview && (
                        <div className="flex gap-4">
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Lead</span>
                                {isLeadPassed ?
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-lg border border-green-200 uppercase">Đã duyệt xong</span> :
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg border border-amber-200 uppercase">Đang đợi</span>
                                }
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigner</span>
                                {isAssignerPassed ?
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-lg border border-green-200 uppercase">Đã duyệt xong</span> :
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg border border-amber-200 uppercase">Đang đợi</span>
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Result Section */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Kết quả công việc</h2>
                    </div>
                    {task.result ? (
                        <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 bg-white rounded-2xl border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                                        {task.result.type === 'CHECKLIST' || task.result.type === 'CONFIRMATION' ? <ListChecks className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-lg font-bold text-gray-900 break-all">{task.result.name || task.code}</p>
                                        {task.result.note && <p className="text-sm text-gray-500 mt-1">{task.result.note}</p>}
                                    </div>
                                </div>
                                {task.result.url && (
                                    <a
                                        href={getFilePreviewUrl(task.result.url, task.result.type)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all shrink-0"
                                    >
                                        Xem kết quả
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
                            {task.result.type === 'CONFIRMATION' && (
                                <div className="pt-2 border-t border-blue-100 text-xs font-bold text-emerald-600 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Đã xác nhận hoàn thành
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
                            Chưa có kết quả để đánh giá
                        </div>
                    )}
                </div>

                {/* Criteria Section */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tiêu chí đánh giá</h2>
                        </div>
                    </div>

                    {isDualReview ? (
                        <div className="space-y-8">
                            <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100">
                                <button
                                    onClick={() => setActiveTab('TEAM_LEAD')}
                                    className={cn(
                                        "flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all",
                                        activeTab === 'TEAM_LEAD' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    Team Lead đánh giá
                                </button>
                                <button
                                    onClick={() => setActiveTab('ASSIGNER')}
                                    className={cn(
                                        "flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all",
                                        activeTab === 'ASSIGNER' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    Người giao việc đánh giá
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(activeTab === 'TEAM_LEAD' ? leadReviews : assignerReviews)
                                    .filter((r, idx, self) =>
                                        self.findIndex(t => t.criteria?.id === r.criteria?.id && t.reviewerType === r.reviewerType) === idx
                                    )
                                    .map((review) => (
                                        <div
                                            key={review.id}
                                            className={cn(
                                                "flex items-center gap-4 p-5 rounded-3xl border transition-all group",
                                                passedIds.includes(review.id) ? "bg-green-50/50 border-green-100" : "bg-gray-50/20 border-gray-50",
                                                ((activeTab === 'TEAM_LEAD' && isLead) || (activeTab === 'ASSIGNER' && isAssigner)) ? "cursor-pointer hover:border-blue-200 hover:bg-white" : "opacity-70"
                                            )}
                                            onClick={() => handleToggle(review)}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                                                passedIds.includes(review.id) ? "bg-green-500 border-green-500 text-white" : "border-gray-200"
                                            )}>
                                                {passedIds.includes(review.id) && <CheckCircle2 className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className={cn("font-bold text-sm", passedIds.includes(review.id) ? "text-green-700" : "text-gray-700")}>
                                                    {review.criteria?.name}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">{review.criteria?.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                {(activeTab === 'TEAM_LEAD' ? leadReviews : assignerReviews).length === 0 && (
                                    <p className="text-gray-400 italic text-center py-8">Không có tiêu chí cho phần này</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews && reviews.length > 0 ? (
                                reviews
                                    .filter((r, idx, self) =>
                                        self.findIndex(t => t.criteria?.id === r.criteria?.id && t.reviewerType === r.reviewerType) === idx
                                    )
                                    .map((review) => (
                                        <div
                                            key={review.id}
                                            className={cn(
                                                "flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer group",
                                                passedIds.includes(review.id)
                                                    ? "bg-green-50/50 border-green-100"
                                                    : "bg-gray-50/50 border-gray-100 hover:border-blue-200 hover:bg-white"
                                            )}
                                            onClick={() => handleToggle(review)}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                                                passedIds.includes(review.id)
                                                    ? "bg-green-500 border-green-500 text-white"
                                                    : "border-gray-300 group-hover:border-blue-400"
                                            )}>
                                                {passedIds.includes(review.id) && <CheckCircle2 className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className={cn(
                                                        "font-bold text-sm",
                                                        passedIds.includes(review.id) ? "text-green-700" : "text-gray-700"
                                                    )}>
                                                        {review.criteria?.name || 'Tiêu chí'}
                                                    </p>
                                                </div>
                                                {review.criteria?.description && (
                                                    <p className="text-xs text-gray-400 mt-1">{review.criteria.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-gray-400 italic text-center py-4">Không có tiêu chí đánh giá cho loại công việc này.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Approval Note */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Ghi chú</h2>
                    </div>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Nhập ghi chú hoặc phản hồi về kết quả công việc..."
                        className="w-full h-32 p-6 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium resize-none shadow-inner"
                    />
                </div>

                {/* Final Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-[1.5rem] py-4 font-bold border-red-200 text-red-600 hover:bg-red-50"
                        onClick={handleReject}
                        disabled={isRejecting || isFinalizing}
                        isLoading={isRejecting}
                    >
                        <XCircle className="w-5 h-5 mr-2" />
                        Từ chối
                    </Button>
                    <Button
                        className="flex-[2] rounded-[1.5rem] py-4 font-bold shadow-lg shadow-blue-200"
                        onClick={handleApprove}
                        disabled={!isAllPassed || isFinalizing || isRejecting}
                        isLoading={isFinalizing}
                    >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Duyệt hoàn thành
                    </Button>
                </div>
                {!isAllPassed && reviews?.length > 0 && (
                    <p className="text-center text-xs text-amber-600 font-bold uppercase tracking-wider animate-pulse">
                        * Bạn cần xác nhận tất cả các tiêu chí trước khi duyệt
                    </p>
                )}
            </div>
        </div>
    );
};

export default TaskReviewPage;
