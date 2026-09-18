import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Paperclip, CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import { useGetAnnouncementQuery, useMarkAnnouncementAsReadMutation } from '../../api/announcements';
import { formatDateTime } from '../../utils/format';
import { sanitizeHtml } from '../../utils/html';

export const AnnouncementDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetAnnouncementQuery(id, { skip: !id });
  const [markAsRead] = useMarkAnnouncementAsReadMutation();
  const [isRecipientsOpen, setIsRecipientsOpen] = useState(false);

  useEffect(() => {
    if (id) markAsRead(id);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 min-h-screen bg-gray-50/30">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/announcements')}
            className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-gray-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <div className="p-6 bg-red-50 text-red-500 rounded-2xl font-bold text-sm border border-red-100">
            {error?.data?.message || 'Không thể tải thông báo'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50/30">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/announcements')}
          className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{data.title}</h1>
            <div
              className="rich-content mt-3"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content) }}
            />
          </div>

          {data.eventStartAt && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-700 uppercase">
                <Calendar className="w-4 h-4" /> {formatDateTime(data.eventStartAt)}
                {data.eventEndAt ? ` — ${formatDateTime(data.eventEndAt)}` : ''}
              </div>
              {data.eventLocation && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <MapPin className="w-3.5 h-3.5" /> {data.eventLocation}
                </div>
              )}
            </div>
          )}

          {data.attachmentUrl && (
            <a
              href={data.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs font-black text-blue-600 uppercase hover:bg-blue-100 transition-all w-fit"
            >
              <Paperclip className="w-4 h-4" /> Xem tài liệu đính kèm
            </a>
          )}

          <div className="flex items-center gap-4 text-[10px] text-gray-400 font-black uppercase pt-2 border-t border-gray-50">
            <span>{data.createdBy?.fullName || 'N/A'}</span>
            <span>{formatDateTime(data.createdAt)}</span>
          </div>

          {Array.isArray(data.recipients) && (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <div className="text-xl font-black text-gray-900">{data.totalRecipients}</div>
                  <div className="text-[10px] font-black text-gray-400 uppercase">Người nhận</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-center">
                  <div className="text-xl font-black text-emerald-700">{data.readCount}</div>
                  <div className="text-[10px] font-black text-emerald-500 uppercase">Đã đọc</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-center">
                  <div className="text-xl font-black text-amber-700">{data.unreadCount}</div>
                  <div className="text-[10px] font-black text-amber-500 uppercase">Chưa đọc</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Tỷ lệ đã xem</span>
                  <span className="text-[10px] font-black text-gray-600">{data.readRate ?? 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${data.readRate ?? 0}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => setIsRecipientsOpen(prev => !prev)}
                className="w-full flex items-center justify-between text-xs font-black text-gray-500 uppercase mb-2"
              >
                <span>Danh sách người nhận</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isRecipientsOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {isRecipientsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 border border-gray-100 rounded-xl">
                      {(data.recipients || []).map((r) => (
                        <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-sm font-bold text-gray-700">{r.recipient?.fullName}</span>
                          {r.isRead ? (
                            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã đọc{r.readAt ? ` · ${formatDateTime(r.readAt)}` : ''}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase">
                              <Circle className="w-3.5 h-3.5" /> Chưa đọc
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
