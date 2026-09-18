import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Paperclip, CheckCircle2, Circle, ChevronDown, Megaphone, X, ChevronLeft, ChevronRight, Send, Trash2, MessageCircle } from 'lucide-react';
import {
  useGetAnnouncementQuery,
  useMarkAnnouncementAsReadMutation,
  useGetAnnouncementCommentsQuery,
  useAddAnnouncementCommentMutation,
  useDeleteAnnouncementCommentMutation,
} from '../../api/announcements';
import { selectCurrentUser } from '../../store/authSlice';
import { formatDateTime } from '../../utils/format';
import { toast } from 'react-toastify';
import { sanitizeHtml } from '../../utils/html';

const CATEGORY_LABELS = {
  GENERAL: 'Chung',
  HR: 'Nhân sự',
  POLICY: 'Chính sách',
  EVENT: 'Sự kiện',
  URGENT: 'Khẩn',
  FINANCE: 'Tài chính',
  SYSTEM: 'Hệ thống',
};

const CATEGORY_COLORS = {
  GENERAL: 'bg-gray-100 text-gray-600',
  HR: 'bg-purple-100 text-purple-600',
  POLICY: 'bg-amber-100 text-amber-600',
  EVENT: 'bg-emerald-100 text-emerald-600',
  URGENT: 'bg-red-100 text-red-600',
  FINANCE: 'bg-blue-100 text-blue-600',
  SYSTEM: 'bg-slate-100 text-slate-600',
};

const MediaGallery = ({ media }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!Array.isArray(media) || media.length === 0) return null;

  const gridClass = media.length === 1
    ? 'grid-cols-1'
    : media.length === 2
      ? 'grid-cols-2'
      : 'grid-cols-2 sm:grid-cols-3';

  const closeLightbox = () => setLightboxIndex(null);
  const showPrev = (e) => { e.stopPropagation(); setLightboxIndex(prev => (prev - 1 + media.length) % media.length); };
  const showNext = (e) => { e.stopPropagation(); setLightboxIndex(prev => (prev + 1) % media.length); };

  return (
    <>
      <div className={`grid gap-2 ${gridClass}`}>
        {media.map((item, index) => (
          <div
            key={item.url + index}
            onClick={() => setLightboxIndex(index)}
            className={`relative bg-gray-100 rounded-2xl overflow-hidden cursor-pointer ${media.length === 1 ? 'aspect-video' : 'aspect-square'}`}
          >
            {item.type === 'video' ? (
              <video src={item.url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={item.url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
          >
            <button
              onClick={closeLightbox}
              className="absolute top-5 right-5 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {media.length > 1 && (
              <button
                onClick={showPrev}
                className="absolute left-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {media[lightboxIndex].type === 'video' ? (
                <video src={media[lightboxIndex].url} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl" />
              ) : (
                <img src={media[lightboxIndex].url} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
              )}
            </div>

            {media.length > 1 && (
              <button
                onClick={showNext}
                className="absolute right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const MANAGE_ROLES = ['BOD', 'ADMIN', 'PM'];

const CommentsSection = ({ announcementId, currentUser }) => {
  const { data: comments = [], isLoading } = useGetAnnouncementCommentsQuery(announcementId, { skip: !announcementId });
  const [addComment, { isLoading: isSubmitting }] = useAddAnnouncementCommentMutation();
  const [deleteComment] = useDeleteAnnouncementCommentMutation();
  const [content, setContent] = useState('');

  const isManager = MANAGE_ROLES.includes(currentUser?.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await addComment({ id: announcementId, content: content.trim() }).unwrap();
      setContent('');
    } catch (error) {
      toast.error(error?.data?.message || 'Không thể gửi bình luận');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Xoá bình luận này?')) return;
    try {
      await deleteComment({ id: announcementId, commentId }).unwrap();
    } catch (error) {
      toast.error(error?.data?.message || 'Không thể xoá bình luận');
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase">
        <MessageCircle className="w-4 h-4" /> Bình luận ({comments.length})
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết bình luận..."
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 font-medium text-sm"
        />
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {isLoading ? (
        <div className="py-6 text-center">
          <div className="w-6 h-6 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400 font-bold text-center py-4">Chưa có bình luận nào</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const canDelete = isManager || comment.author?.id === currentUser?.id;
            return (
              <div key={comment.id} className="flex items-start gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-black text-xs shrink-0">
                  {(comment.author?.fullName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-2xl px-4 py-2.5">
                    <p className="text-xs font-black text-gray-800">{comment.author?.fullName || 'N/A'}</p>
                    <p className="text-sm text-gray-700 font-medium break-words">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-1">
                    <span className="text-[10px] text-gray-400 font-bold">{formatDateTime(comment.createdAt)}</span>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-[10px] text-gray-300 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Xoá
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const AnnouncementDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
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
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 text-sm truncate">{data.createdBy?.fullName || 'N/A'}</p>
              <p className="text-[11px] text-gray-400 font-bold">{formatDateTime(data.createdAt)}</p>
            </div>
            {data.category && (
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${CATEGORY_COLORS[data.category] || 'bg-gray-100 text-gray-600'}`}>
                {CATEGORY_LABELS[data.category] || data.category}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-black text-gray-900">{data.title}</h1>
            <div
              className="rich-content mt-3"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content) }}
            />
          </div>

          <MediaGallery media={(data.mediaUrls || []).filter(m => !(data.content || '').includes(m.url))} />

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

        <CommentsSection announcementId={id} currentUser={currentUser} />
      </div>
    </div>
  );
};