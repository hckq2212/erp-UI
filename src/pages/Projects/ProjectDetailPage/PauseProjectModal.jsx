import { useState } from 'react';
import { PauseCircle, X, AlertTriangle, ShieldCheck, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  useRequestPauseProjectMutation,
  usePauseProjectDirectMutation,
} from '../../../api/projects';
import { PAUSE_DURATION_DAYS } from '../../../utils/projectPause';

/**
 * Modal xin tạm dừng dự án.
 *
 * 2 chế độ theo role (backend kiểm tra lại):
 *  - `direct = false` → PM/BD gửi yêu cầu, CHỜ BOD duyệt
 *  - `direct = true`  → BOD/ADMIN tạm dừng NGAY, không qua duyệt
 */
export const PauseProjectModal = ({ isOpen, onClose, project, direct = false }) => {
  const [reason, setReason] = useState('');
  const [requestPause, { isLoading: isRequesting }] = useRequestPauseProjectMutation();
  const [pauseDirect, { isLoading: isPausing }] = usePauseProjectDirectMutation();
  const isLoading = isRequesting || isPausing;

  if (!isOpen) return null;

  const trimmed = reason.trim();
  const canSubmit = trimmed.length >= 5 && !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trimmed) {
      toast.error('Vui lòng nhập lý do tạm dừng');
      return;
    }
    if (trimmed.length < 5) {
      toast.error('Lý do quá ngắn — vui lòng ghi rõ hơn để BOD có căn cứ duyệt');
      return;
    }

    try {
      if (direct) {
        await pauseDirect({ id: project.id, reason: trimmed }).unwrap();
        toast.success('Đã tạm dừng dự án');
      } else {
        await requestPause({ id: project.id, reason: trimmed }).unwrap();
        toast.success('Đã gửi yêu cầu tạm dừng — đang chờ BOD duyệt');
      }
      setReason('');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể tạm dừng dự án');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
              <PauseCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 uppercase">
                {direct ? 'Tạm dừng dự án' : 'Yêu cầu tạm dừng dự án'}
              </h3>
              <p className="text-sm text-gray-500 font-medium truncate max-w-[280px]">{project?.name}</p>
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
          <div>
            <label className="block text-sm font-bold text-gray-700 uppercase mb-2 ml-1">
              Lý do tạm dừng <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all resize-none text-sm"
              rows="4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Khách yêu cầu dừng chờ ngân sách quý 4..."
              autoFocus
            />
            <div className="mt-1 flex items-center justify-between px-1">
              <span className="text-[11px] text-gray-400">
                Lý do này được ghi vào lịch sử và làm căn cứ nghiệm thu sau này.
              </span>
              <span className={`text-[11px] font-bold ${trimmed.length >= 5 ? 'text-green-600' : 'text-amber-600'}`}>
                {trimmed.length}/5+
              </span>
            </div>
          </div>

          {/* Cảnh báo hậu quả */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-bold uppercase tracking-wide">Khi tạm dừng:</p>
                <ul className="list-disc list-inside space-y-0.5 font-medium">
                  <li>Toàn bộ công việc <b>dở dang</b> bị khóa, không nộp/sửa/phân công được</li>
                  <li>Công việc đã <b>hoàn thành</b> giữ nguyên trạng thái</li>
                  <li>Sau <b>{PAUSE_DURATION_DAYS} ngày</b> hệ thống <b>tự động đóng</b> dự án nếu không ai xử lý</li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 flex items-start gap-2 ${
            direct ? 'border-red-100 bg-red-50/60' : 'border-blue-100 bg-blue-50/60'
          }`}>
            {direct ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-red-800">
                  Bạn đang <b>tạm dừng trực tiếp</b> với quyền BOD/ADMIN — dự án dừng ngay,
                  <b> không cần ai duyệt</b>. Toàn bộ team sẽ nhận thông báo.
                </p>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-blue-800">
                  Yêu cầu sẽ được gửi tới <b>BOD/ADMIN</b> để duyệt. Dự án <b>vẫn chạy bình thường</b>
                  {' '}cho tới khi được duyệt.
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
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100 disabled:bg-amber-300'
                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-100 disabled:bg-orange-300'
            }`}
          >
            {isLoading ? (
              'Đang xử lý...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{direct ? 'Tạm dừng ngay' : 'Gửi yêu cầu tạm dừng'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
