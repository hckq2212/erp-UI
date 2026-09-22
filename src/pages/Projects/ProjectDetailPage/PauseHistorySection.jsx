import { useState } from 'react';
import { X, Check, Ban, History, MessageSquare, User } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  useGetPauseHistoryQuery,
  useApprovePauseRequestMutation,
  useRejectPauseRequestMutation,
  useApproveCloseRequestMutation,
  useRejectCloseRequestMutation,
} from '../../../api/projects';
import {
  PAUSE_REQUEST_STATUS_LABELS,
  PAUSE_REQUEST_STATUS_COLORS,
  PAUSE_MODE_LABELS,
  CLOSE_MODE_LABELS,
  formatDateTimeVN,
  canApprovePause,
  canApproveClose,
} from '../../../utils/projectPause';

const RejectModal = ({ isOpen, onClose, onSubmit, title, isSubmitting }) => {
  const [feedback, setFeedback] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase">
            Lý do từ chối <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none text-sm resize-none"
            rows="3"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Nhập lý do..."
            autoFocus
          />
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              if (!feedback.trim()) {
                toast.error('Vui lòng nhập lý do từ chối');
                return;
              }
              onSubmit(feedback.trim());
            }}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:bg-red-300 text-sm"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Lịch sử tạm dừng / đóng dự án.
 * BOD/ADMIN thấy thêm nút Duyệt / Từ chối cho các đơn đang PENDING.
 */
export const PauseHistorySection = ({ projectId, currentUser }) => {
  const { data: history = [], isLoading } = useGetPauseHistoryQuery(projectId, {
    skip: !projectId,
  });

  const [approvePause, { isLoading: isApprovingPause }] = useApprovePauseRequestMutation();
  const [rejectPause, { isLoading: isRejectingPause }] = useRejectPauseRequestMutation();
  const [approveClose, { isLoading: isApprovingClose }] = useApproveCloseRequestMutation();
  const [rejectClose, { isLoading: isRejectingClose }] = useRejectCloseRequestMutation();

  const [rejectTarget, setRejectTarget] = useState(null); // { requestId, kind }

  const isBusy = isApprovingPause || isRejectingPause || isApprovingClose || isRejectingClose;

  const handleApprove = async (request) => {
    const isCloseRequest = Boolean(request.closeMode);
    try {
      if (isCloseRequest) {
        await approveClose(request.id).unwrap();
        toast.success('Đã duyệt đóng dự án');
      } else {
        await approvePause(request.id).unwrap();
        toast.success('Đã duyệt tạm dừng dự án');
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể duyệt yêu cầu');
    }
  };

  const handleReject = async (feedback) => {
    if (!rejectTarget) return;
    try {
      if (rejectTarget.kind === 'CLOSE') {
        await rejectClose({ requestId: rejectTarget.requestId, feedback }).unwrap();
        toast.success('Đã từ chối đề nghị đóng dự án');
      } else {
        await rejectPause({ requestId: rejectTarget.requestId, feedback }).unwrap();
        toast.success('Đã từ chối yêu cầu tạm dừng');
      }
      setRejectTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể từ chối yêu cầu');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/40 py-14 text-center">
        <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-gray-500">Chưa có lần tạm dừng nào</p>
        <p className="text-xs text-gray-400 mt-1">Lịch sử tạm dừng và đóng dự án sẽ hiển thị ở đây.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {history.map((item) => {
          const isPending = item.status === 'PENDING';
          const isCloseRequest = Boolean(item.closeMode);
          const showActions = isPending
            && (isCloseRequest ? canApproveClose(currentUser) : canApprovePause(currentUser));

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    PAUSE_REQUEST_STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {PAUSE_REQUEST_STATUS_LABELS[item.status] || item.status}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                    {isCloseRequest ? 'Đóng dự án' : 'Tạm dừng'}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {isCloseRequest
                      ? CLOSE_MODE_LABELS[item.closeMode] || item.closeMode
                      : PAUSE_MODE_LABELS[item.pauseMode] || item.pauseMode}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">
                  {formatDateTimeVN(item.requestedAt || item.createdAt)}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700 font-medium">{item.reason}</p>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-400" />
                  Người gửi: <b className="text-gray-700">{item.requester?.fullName || '—'}</b>
                  {item.requesterRole && <span className="text-gray-400">({item.requesterRole})</span>}
                </span>
                {item.approver?.fullName && (
                  <span>Người duyệt: <b className="text-gray-700">{item.approver.fullName}</b></span>
                )}
                {item.closedBy?.fullName && (
                  <span>Người đóng: <b className="text-gray-700">{item.closedBy.fullName}</b></span>
                )}
                {item.closedByType === 'SYSTEM' && (
                  <span className="text-slate-500 font-semibold">Hệ thống tự đóng (D+37)</span>
                )}
              </div>

              {item.feedback && (
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-2.5">
                  <p className="text-[11px] text-red-800">
                    <b>Lý do từ chối:</b> {item.feedback}
                  </p>
                </div>
              )}

              {item.status === 'CLOSED' && (
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-2.5 text-[11px] text-gray-600 font-medium">
                  Kết quả: <b className="text-green-700">{item.acceptedTaskCount || 0}</b> công việc nghiệm thu ·{' '}
                  <b className="text-red-600">{item.cancelledTaskCount || 0}</b> công việc hủy
                </div>
              )}

              {item.resumedAt && (
                <div className="text-[11px] text-emerald-700 font-medium">
                  Đã làm tiếp lúc {formatDateTimeVN(item.resumedAt)}
                  {item.resumeReason && ` — ${item.resumeReason}`}
                </div>
              )}

              {showActions && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleApprove(item)}
                    disabled={isBusy}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:bg-emerald-300 transition-all active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isCloseRequest ? 'Duyệt đóng dự án' : 'Duyệt tạm dừng'}
                  </button>
                  <button
                    onClick={() => setRejectTarget({
                      requestId: item.id,
                      kind: isCloseRequest ? 'CLOSE' : 'PAUSE',
                    })}
                    disabled={isBusy}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <RejectModal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onSubmit={handleReject}
        isSubmitting={isBusy}
        title={rejectTarget?.kind === 'CLOSE'
          ? 'Từ chối đề nghị đóng dự án'
          : 'Từ chối yêu cầu tạm dừng'}
      />
    </>
  );
};
