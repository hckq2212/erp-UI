import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Megaphone, Search, Plus, Calendar, MapPin, Users as UsersIcon, ChevronLeft, ChevronRight, Inbox, Eye, Trash2, PlayCircle, Images } from 'lucide-react';
import { useGetAnnouncementsQuery, useDeleteAnnouncementMutation, useMarkAnnouncementAsReadMutation } from '../../api/announcements';
import { selectCurrentUser } from '../../store/authSlice';
import { formatDateTime } from '../../utils/format';
import { AnnouncementComposeModal } from './AnnouncementComposeModal';
import { toast } from 'react-toastify';
import { htmlToPlainText } from '../../utils/html';

const MANAGE_ROLES = ['ADMIN', 'BOD', 'PM'];

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

const STATUS_LABELS = {
  DRAFT: 'Nháp',
  SCHEDULED: 'Đã lên lịch',
  SENT: 'Đã gửi',
  CANCELLED: 'Đã huỷ',
};

const SCOPE_LABELS = {
  ALL: 'Toàn công ty',
  ROLE: 'Theo vai trò',
  TEAM: 'Theo đội dự án',
  USER: 'Chọn riêng người dùng',
};

const MediaPreviewGrid = ({ media, onClick }) => {
  if (!Array.isArray(media) || media.length === 0) return null;
  const visible = media.slice(0, 4);
  const extraCount = media.length - visible.length;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`grid gap-1.5 mb-3 rounded-2xl overflow-hidden ${visible.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
    >
      {visible.map((item, index) => {
        const isLast = index === visible.length - 1 && extraCount > 0;
        return (
          <div key={item.url + index} className={`relative bg-gray-100 ${visible.length === 1 ? 'aspect-video' : 'aspect-square'} overflow-hidden`}>
            {item.type === 'video' ? (
              <video src={item.url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={item.url} alt="" className="w-full h-full object-cover" />
            )}
            {item.type === 'video' && !isLast && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <PlayCircle className="w-8 h-8 text-white drop-shadow" />
              </div>
            )}
            {isLast && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-lg font-black">+{extraCount}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const AnnouncementsPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isManager = MANAGE_ROLES.includes(user?.role);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [scopeType, setScopeType] = useState('');
  const [page, setPage] = useState(1);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const [markAsRead] = useMarkAnnouncementAsReadMutation();

  const handleOpenDetail = (item) => {
    if (!item.isRead) markAsRead(item.id);
    navigate(`/announcements/${item.id}`);
  };

  const queryParams = useMemo(() => ({
    page,
    limit: 10,
    search: searchTerm || undefined,
    category: category || undefined,
    status: status || undefined,
    scopeType: scopeType || undefined,
  }), [page, searchTerm, category, status, scopeType]);

  const { data, isLoading, error } = useGetAnnouncementsQuery(queryParams);
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();

  const announcements = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn thu hồi/xoá thông báo này?')) return;
    try {
      await deleteAnnouncement(id).unwrap();
      toast.success('Đã xử lý thông báo');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể xử lý thông báo');
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50/30">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-blue-600" /> Tin tức nội bộ
            </h1>
            <p className="text-sm text-gray-400 font-bold mt-1 uppercase tracking-wide">
              {data?.total || 0} thông báo
            </p>
          </div>

          {isManager && (
            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              <Plus className="w-4 h-4" /> Soạn thông báo
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, nội dung..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black text-gray-600"
            >
              <option value="">Tất cả loại</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black text-gray-600"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={scopeType}
              onChange={(e) => { setScopeType(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black text-gray-600"
            >
              <option value="">Tất cả phạm vi</option>
              {Object.entries(SCOPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center">
              <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : error ? (
            <div className="p-16 text-center text-red-500 font-bold text-sm">Không thể tải dữ liệu</div>
          ) : announcements.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <Inbox className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-black uppercase text-sm">Chưa có thông báo nào</h3>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {announcements.map((item) => (
                <div key={item.id} className="transition-all group">
                  <div
                    onClick={() => handleOpenDetail(item)}
                    className="p-6 hover:bg-gray-50/80 cursor-pointer flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-600'}`}>
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-gray-100 text-gray-500">
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-indigo-50 text-indigo-500 flex items-center gap-1">
                          <UsersIcon className="w-3 h-3" /> {SCOPE_LABELS[item.scopeType] || item.scopeType}
                        </span>
                        {item.eventStartAt && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDateTime(item.eventStartAt)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-gray-900 tracking-tight mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500 font-medium mb-2 line-clamp-2">
                        {htmlToPlainText(item.content)}
                      </p>
                      <MediaPreviewGrid media={item.mediaUrls} onClick={() => navigate(`/announcements/${item.id}`)} />
                      {item.mediaUrls?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase mb-2">
                          <Images className="w-3 h-3" /> {item.mediaUrls.length} tệp đính kèm
                        </span>
                      )}
                      {item.eventLocation && (
                        <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" /> {item.eventLocation}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-[10px] text-gray-400 font-black uppercase">
                        <span>{item.createdBy?.fullName || 'N/A'}</span>
                        <span>{formatDateTime(item.createdAt)}</span>
                        <span>{item.recipientCount || 0} người nhận</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenDetail(item); }}
                        className="p-2.5 text-gray-300 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-blue-100 opacity-0 group-hover:opacity-100 transition-all"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {isManager && item.status !== 'CANCELLED' && (
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-red-100 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === i + 1
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 disabled:opacity-30 shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {isManager && (
        <AnnouncementComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
      )}
    </div>
  );
};
