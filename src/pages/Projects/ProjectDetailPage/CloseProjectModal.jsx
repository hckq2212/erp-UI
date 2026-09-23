import { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Send, Archive, Ban, MinusCircle, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  useGetHoldSummaryQuery,
  useCloseProjectDirectMutation,
  useRequestCloseProjectMutation,
} from '../../../api/projects';
import { formatNumber } from '../../../utils/format';

/**
 * Modal đóng dự án.
 *
 * 2 chế độ theo role (backend kiểm tra lại):
 *  - `direct = false` → PM gửi ĐỀ NGHỊ, chờ BOD duyệt
 *  - `direct = true`  → BD/BOD/ADMIN đóng NGAY, không cần duyệt (LÝ DO BẮT BUỘC)
 *
 * Hiện trước `hold-summary` để người dùng biết hậu quả trước khi xác nhận.
 */
export const CloseProjectModal = ({ isOpen, onClose, project, direct = false }) => {
  const [reason, setReason] = useState('');
  const [closeDirect, { isLoading: isClosing }] = useCloseProjectDirectMutation();
  const [requestClose, { isLoading: isRequesting }] = useRequestCloseProjectMutation();
  const isLoading = isClosing || isRequesting;

  // Chỉ gọi summary khi modal đang mở
  const { data: summary, isLoading: isLoadingSummary } = useGetHoldSummaryQuery(
    project?.id,
    { skip: !isOpen || !project?.id }
  );

  if (!isOpen) return null;

  const trimmed = reason.trim();
  // direct = bắt buộc lý do; request = không bắt buộc nhưng khuyến khích
  const canSubmit = (direct ? trimmed.length >= 5 : true) && !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (direct && trimmed.length < 5) {
      toast.error('Vui lòng nhập lý do đóng dự án (tối thiểu 5 ký tự)');
      return;
    }

    try {
      if (direct) {
        await closeDirect({ id: project.id, reason: trimmed }).unwrap();
        toast.success('Đã đóng dự án');
      } else {
        await requestClose({ id: project.id, reason: trimmed || undefined }).unwrap();
        toast.success('Đã gửi đề nghị đóng dự án — đang chờ BOD duyệt');
      }
      setReason('');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể đóng dự án');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-100 to-gray-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-white">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 uppercase">
                {direct ? 'Đóng dự án' : 'Đề nghị đóng dự án'}
              </h3>
              <p className="text-sm text-gray-500 font-medium truncate max-w-[300px]">{project?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Xem trước hậu quả */}
          <div>
            <p className="text-sm font-bold text-gray-700 uppercase mb-2 ml-1">Hậu quả khi đóng</p>

            {isLoadingSummary ? (
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : summary ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-green-100 bg-green-50/60 p-3 text-center">
                  <ShieldCheck className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-black text-green-700">{summary.acceptedCount}</p>
                  <p className="text-[10px] font-bold text-green-700 uppercase leading-tight">
                    Nghiệm thu
                  </p>
                  <p className="text-[10px] text-green-600 mt-0.5">
                    +{formatNumber(summary.estimatedVinicoin || 0)} Vinicoin
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3 text-center">
                  <MinusCircle className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                  <p className="text-2xl font-black text-gray-600">{summary.unchangedCount}</p>
                  <p className="text-[10px] font-bold text-gray-600 uppercase leading-tight">
                    Giữ nguyên
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">không đổi, không thưởng</p>
                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50/60 p-3 text-center">
                  <Ban className="w-4 h-4 text-red-600 mx-auto mb-1" />
                  <p className="text-2xl font-black text-red-700">{summary.cancelledCount}</p>
                  <p className="text-[10px] font-bold text-red-700 uppercase leading-tight">
                    Hủy
                  </p>
                  <p className="text-[10px] text-red-500 mt-0.5">không thưởng</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-500">
                Không tải được thống kê trước khi đóng.
              </div>
            )}

            {summary?.debtsToLock?.count > 0 && (
              <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-3 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-amber-800">
                  <b>{summary.debtsToLock.count} khoản công nợ</b> chưa thu sẽ bị <b>KHÓA</b>
                  {' '}(tổng {formatNumber(summary.debtsToLock.totalAmount || 0)} VNĐ).
                  Sau khi khóa, không thể ghi nhận thanh toán cho các khoản này.
                </p>
              </div>
            )}

            <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50/60 p-3 space-y-1.5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Luật chốt công việc
              </p>
              <div className="text-[11px] text-gray-600 space-y-0.5 font-medium">
                <p>• <b>Hoàn thành</b> (khách đã nghiệm thu) → Nghiệm thu + Vinicoin</p>
                <p>• <b>Hoàn thành nội bộ</b> → giữ nguyên trạng thái, <b>không</b> Vinicoin</p>
                <p>• <b>Đang làm dở</b> → Hủy, <b>không</b> Vinicoin</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">
              Lý do đóng {direct && <span className="text-red-500">*</span>}
            </label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500 outline-none transition-all resize-none text-sm"
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={direct ? 'Ví dụ: Khách chốt dừng hẳn dự án...' : 'Ghi chú thêm (không bắt buộc)...'}
            />
            {direct && (
              <p className="mt-1 px-1 text-[11px] text-gray-400">
                Bắt buộc — vì đóng trực tiếp không qua duyệt, lý do là căn cứ duy nhất để truy vết.
              </p>
            )}
          </div>

          {/* Cảnh báo không thể hoàn tác */}
          <div className={`rounded-2xl border p-4 flex items-start gap-2 ${
            direct ? 'border-red-200 bg-red-50/70' : 'border-blue-100 bg-blue-50/60'
          }`}>
            {direct ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-red-800">
                  <b>Hành động này KHÔNG THỂ HOÀN TÁC.</b> Dự án chuyển sang <b>Hoàn thành</b>,
                  công việc bị chốt, Vinicoin được trả, công nợ bị khóa — tất cả <b>ngay lập tức</b>,
                  không cần ai duyệt.
                </p>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-blue-800">
                  Đề nghị sẽ được gửi tới <b>BOD/ADMIN</b> để duyệt.
                  {' '}Dự án <b>vẫn đang tạm dừng</b> cho tới khi được duyệt.
                </p>
              </>
            )}
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex-[2] px-4 py-3 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:shadow-none flex items-center justify-center gap-2 ${
              direct
                ? 'bg-red-600 hover:bg-red-700 shadow-red-100 disabled:bg-red-300'
                : 'bg-slate-700 hover:bg-slate-800 shadow-slate-100 disabled:bg-slate-300'
            }`}
          >
            {isLoading ? (
              'Đang xử lý...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{direct ? 'Đóng dự án ngay' : 'Gửi đề nghị đóng'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
