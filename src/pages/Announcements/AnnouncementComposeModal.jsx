import { useState, useMemo } from 'react';
import { Modal } from '../../components/ui/Modal';
import { useCreateAnnouncementMutation } from '../../api/announcements';
import { useGetUsersQuery } from '../../api/users';
import { useGetTeamsQuery } from '../../api/teams';
import { toast } from 'react-toastify';
import { Calendar, MapPin, Search, Paperclip, X } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { isHtmlEmpty } from '../../utils/html';

const CATEGORY_OPTIONS = [
  { value: 'GENERAL', label: 'Chung' },
  { value: 'HR', label: 'Nhân sự' },
  { value: 'POLICY', label: 'Chính sách' },
  { value: 'EVENT', label: 'Sự kiện' },
  { value: 'URGENT', label: 'Khẩn' },
  { value: 'FINANCE', label: 'Tài chính' },
  { value: 'SYSTEM', label: 'Hệ thống' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Thấp' },
  { value: 'NORMAL', label: 'Bình thường' },
  { value: 'HIGH', label: 'Cao' },
  { value: 'URGENT', label: 'Khẩn cấp' },
];

const ROLE_OPTIONS = ['BOD', 'ADMIN', 'ADMIN_SALE', 'BD', 'PM', 'STAFF_A', 'STAFF_B', 'STAFF_C', 'STAFF_D'];

const SCOPE_OPTIONS = [
  { value: 'ALL', label: 'Toàn công ty' },
  { value: 'ROLE', label: 'Theo vai trò' },
  { value: 'TEAM', label: 'Theo đội dự án' },
  { value: 'USER', label: 'Chọn riêng người dùng' },
];

const initialForm = {
  title: '',
  content: '',
  category: 'GENERAL',
  priority: 'NORMAL',
  scopeType: 'ALL',
  targetRoles: [],
  targetTeamIds: [],
  targetUserIds: [],
  hasEvent: false,
  eventStartAt: '',
  eventEndAt: '',
  eventLocation: '',
  attachmentUrl: '',
  attachmentName: '',
};

export const AnnouncementComposeModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState(initialForm);
  const [userSearch, setUserSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [createAnnouncement, { isLoading }] = useCreateAnnouncementMutation();
  const { data: users = [] } = useGetUsersQuery(undefined, { skip: form.scopeType !== 'USER' });
  const { data: teams = [] } = useGetTeamsQuery(undefined, { skip: form.scopeType !== 'TEAM' });

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const lower = userSearch.toLowerCase();
    return users.filter(u => u.fullName?.toLowerCase().includes(lower));
  }, [users, userSearch]);

  const handleClose = () => {
    setForm(initialForm);
    setUserSearch('');
    setUploadProgress(0);
    onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const uploaded = await uploadToCloudinary(file, 'GETVINI/ERP/announcements', setUploadProgress);
      setForm(prev => ({ ...prev, attachmentUrl: uploaded.url, attachmentName: uploaded.name }));
      toast.success('Đã tải lên tài liệu');
    } catch (error) {
      toast.error(error.message || 'Không thể tải lên tài liệu');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = () => {
    setForm(prev => ({ ...prev, attachmentUrl: '', attachmentName: '' }));
  };

  const toggleArrayValue = (field, value) => {
    setForm(prev => {
      const arr = prev[field];
      const exists = arr.includes(value);
      return {
        ...prev,
        [field]: exists ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const handleSubmit = async (status) => {
    if (!form.title.trim() || isHtmlEmpty(form.content)) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    if (form.scopeType === 'ROLE' && form.targetRoles.length === 0) {
      toast.error('Vui lòng chọn ít nhất một vai trò');
      return;
    }
    if (form.scopeType === 'TEAM' && form.targetTeamIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một đội dự án');
      return;
    }
    if (form.scopeType === 'USER' && form.targetUserIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người dùng');
      return;
    }
    if (form.hasEvent && form.eventStartAt && form.eventEndAt && form.eventEndAt < form.eventStartAt) {
      toast.error('Ngày kết thúc không được trước ngày bắt đầu');
      return;
    }

    try {
      await createAnnouncement({
        title: form.title,
        content: form.content,
        category: form.category,
        priority: form.priority,
        scopeType: form.scopeType,
        targetRoles: form.scopeType === 'ROLE' ? form.targetRoles : undefined,
        targetTeamIds: form.scopeType === 'TEAM' ? form.targetTeamIds : undefined,
        targetUserIds: form.scopeType === 'USER' ? form.targetUserIds : undefined,
        eventStartAt: form.hasEvent && form.eventStartAt ? form.eventStartAt : undefined,
        eventEndAt: form.hasEvent && form.eventEndAt ? form.eventEndAt : undefined,
        eventLocation: form.hasEvent ? form.eventLocation : undefined,
        attachmentUrl: form.attachmentUrl || undefined,
        status,
      }).unwrap();

      toast.success(status === 'DRAFT' ? 'Đã lưu nháp' : 'Đã gửi thông báo');
      handleClose();
    } catch (error) {
      toast.error(error?.data?.message || 'Không thể gửi thông báo');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Soạn thông báo nội bộ" className="max-w-3xl">
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Tiêu đề</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 font-medium text-sm"
            placeholder="Nhập tiêu đề thông báo"
          />
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Nội dung</label>
          <RichTextEditor
            value={form.content}
            onChange={(html) => setForm(prev => ({ ...prev, content: html }))}
            placeholder="Nhập nội dung thông báo..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Loại thông báo</label>
            <select
              value={form.category}
              onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 font-bold text-sm"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Mức độ ưu tiên</label>
            <select
              value={form.priority}
              onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 font-bold text-sm"
            >
              {PRIORITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase mb-2">Phạm vi gửi</label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {SCOPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, scopeType: opt.value }))}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${form.scopeType === opt.value
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {form.scopeType === 'ROLE' && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              {ROLE_OPTIONS.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleArrayValue('targetRoles', role)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${form.targetRoles.includes(role)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}

          {form.scopeType === 'TEAM' && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 max-h-40 overflow-y-auto">
              {teams.length === 0 && <span className="text-xs text-gray-400 font-bold">Không có đội dự án</span>}
              {teams.map(team => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => toggleArrayValue('targetTeamIds', team.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${form.targetTeamIds.includes(team.id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'
                    }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          )}

          {form.scopeType === 'USER' && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Tìm người dùng theo tên..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleArrayValue('targetUserIds', user.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${form.targetUserIds.includes(user.id)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'
                      }`}
                  >
                    {user.fullName}
                  </button>
                ))}
              </div>
              {form.targetUserIds.length > 0 && (
                <p className="mt-2 text-[11px] text-gray-400 font-bold">Đã chọn {form.targetUserIds.length} người</p>
              )}
            </div>
          )}
        </div>

        <div className="border border-gray-100 rounded-xl p-4">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={form.hasEvent}
              onChange={(e) => setForm(prev => ({ ...prev, hasEvent: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-xs font-black text-gray-600 uppercase flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Có sự kiện liên quan
            </span>
          </label>

          {form.hasEvent && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-1">Bắt đầu</label>
                <input
                  type="datetime-local"
                  value={form.eventStartAt}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    eventStartAt: e.target.value,
                    eventEndAt: prev.eventEndAt && prev.eventEndAt < e.target.value ? '' : prev.eventEndAt,
                  }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-4 focus:ring-blue-50 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-1">Kết thúc</label>
                <input
                  type="datetime-local"
                  value={form.eventEndAt}
                  min={form.eventStartAt || undefined}
                  onChange={(e) => setForm(prev => ({ ...prev, eventEndAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-4 focus:ring-blue-50 text-xs font-bold"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Địa điểm
                </label>
                <input
                  type="text"
                  value={form.eventLocation}
                  onChange={(e) => setForm(prev => ({ ...prev, eventLocation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-4 focus:ring-blue-50 text-xs font-bold"
                  placeholder="Địa điểm hoặc link online"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Tài liệu đính kèm (tuỳ chọn)</label>
          {form.attachmentUrl ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 truncate">
                <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{form.attachmentName || 'Tài liệu đính kèm'}</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveAttachment}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500">
                {isUploading ? `Đang tải lên... ${uploadProgress}%` : 'Chọn tệp để tải lên'}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-xs font-black text-gray-500 hover:bg-gray-100"
          >
            Huỷ
          </button>
          <button
            type="button"
            disabled={isLoading || isUploading}
            onClick={() => handleSubmit('DRAFT')}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            Lưu nháp
          </button>
          <button
            type="button"
            disabled={isLoading || isUploading}
            onClick={() => handleSubmit('SENT')}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
          >
            Gửi ngay
          </button>
        </div>
      </div>
    </Modal>
  );
};
