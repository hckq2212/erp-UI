import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, AlertCircle, Link as LinkIcon, MessageSquare, XCircle } from 'lucide-react';
import { useGetTaskQuery } from '../../api/tasks';
import { useGetTaskReviewsQuery, useToggleTaskReviewPassedMutation, useFinalizeTaskMutation, useRejectTaskMutation } from '../../api/taskReviews';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

export const TaskReviewPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Fetch task details
    const { data: task, isLoading: isTaskLoading, error: taskError } = useGetTaskQuery(id);

    // Fetch task reviews (criterias)
    const { data: reviews, isLoading: isReviewsLoading } = useGetTaskReviewsQuery(id);

    const [toggleReview] = useToggleTaskReviewPassedMutation();
    const [finalizeTask, { isLoading: isFinalizing }] = useFinalizeTaskMutation();
    const [rejectTask, { isLoading: isRejecting }] = useRejectTaskMutation();

    const [note, setNote] = useState('');
    const [isAllPassed, setIsAllPassed] = useState(false);

    useEffect(() => {
        if (reviews) {
            const allPassed = reviews.length > 0 && reviews.every(r => r.isPassed);
            setIsAllPassed(allPassed);
        }
    }, [reviews]);

    const handleToggle = async (review) => {
        try {
            await toggleReview({
                id: review.id,
                isPassed: !review.isPassed,
                note: review.note // Keep existing note if any
            }).unwrap();
        } catch (err) {
            toast.error('Không thể cập nhật trạng thái tiêu chí');
        }
    };

    const handleApprove = async () => {
        try {
            await finalizeTask(id).unwrap();
            toast.success('Duyệt công việc thành công!');
            navigate(`/tasks/${id}`);
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
            await rejectTask({ taskId: id, note }).unwrap();
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
                        <p className="text-gray-500 font-medium">{task.name}</p>
                    </div>
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
                        <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 bg-white rounded-2xl border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                                    <LinkIcon className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <a
                                        href={task.result.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-lg font-bold text-blue-600 hover:underline break-all"
                                    >
                                        {task.code}
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
                            Chưa có kết quả để đánh giá
                        </div>
                    )}
                </div>

                {/* Criteria Section */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tiêu chí đánh giá</h2>
                    </div>

                    <div className="space-y-4">
                        {reviews && reviews.length > 0 ? (
                            reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className={cn(
                                        "flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer group",
                                        review.isPassed
                                            ? "bg-green-50/50 border-green-100"
                                            : "bg-gray-50/50 border-gray-100 hover:border-blue-200 hover:bg-white"
                                    )}
                                    onClick={() => handleToggle(review)}
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                                        review.isPassed
                                            ? "bg-green-500 border-green-500 text-white"
                                            : "border-gray-300 group-hover:border-blue-400"
                                    )}>
                                        {review.isPassed && <CheckCircle2 className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={cn(
                                            "font-bold text-sm",
                                            review.isPassed ? "text-green-700" : "text-gray-700"
                                        )}>
                                            {review.criteria?.name || 'Tiêu chí'}
                                        </p>
                                        {review.criteria?.description && (
                                            <p className="text-xs text-gray-500 mt-1">{review.criteria.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 italic text-center py-4">Không có tiêu chí đánh giá cho loại công việc này.</p>
                        )}
                    </div>
                </div>

                {/* Approval Note */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Ghi chú duyệt</h2>
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
