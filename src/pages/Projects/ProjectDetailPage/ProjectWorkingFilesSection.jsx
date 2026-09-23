import { useState } from 'react';
import {
  FileText,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Plus,
  UploadCloud,
  Loader2,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  FileCode,
  Paperclip,
  FolderGit2,
  AlertTriangle,
  Upload
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Modal } from '../../../components/ui/Modal';
import { DocumentCard } from '../../../components/common';
import { uploadToCloudinary, getFilePreviewUrl } from '../../../utils/cloudinary';
import { useUpdateProjectWorkingFilesMutation } from '../../../api/projects';
import { useGetMeQuery } from '../../../api/auth';
import { getCurrentUserId, getUserAccountRole, isSameUser } from '../../../utils/authUser';

const formatDateTime = (value) => {
  if (!value) return 'Chưa có';
  try {
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
};

const formatFileSize = (bytes) => {
  if (!bytes || typeof bytes !== 'number' || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'];
const ALLOWED_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const getFileIcon = (file) => {
  if (file?.type === 'LINK') {
    return LinkIcon;
  }
  const nameOrUrl = (file?.name || file?.url || '').toLowerCase();
  if (nameOrUrl.match(/\.(xlsx|xls|csv)$/)) return FileSpreadsheet;
  if (nameOrUrl.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return FileImage;
  if (nameOrUrl.match(/\.(zip|rar|7z|tar|gz)$/)) return FileArchive;
  if (nameOrUrl.match(/\.(js|jsx|ts|tsx|json|html|css|py)$/)) return FileCode;
  return FileText;
};

const getDomainFromUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return '';
  }
};

export const ProjectWorkingFilesSection = ({ project }) => {
  const { data: me } = useGetMeQuery();
  const [updateWorkingFilesMutation, { isLoading: isUpdating }] = useUpdateProjectWorkingFilesMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('LINK'); // 'LINK' | 'FILE'
  const [copiedId, setCopiedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For Link mode: support adding multiple links if needed
  const [linkRows, setLinkRows] = useState([{ name: '', url: '' }]);

  // For File mode: strictly single file
  const [singleFile, setSingleFile] = useState(null);
  const [singleFileName, setSingleFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const currentUserId = getCurrentUserId(me);
  const userRole = getUserAccountRole(me);
  const isOnHold = project?.status === 'ON_HOLD' || Boolean(project?.isOnHold);

  const workingFiles = Array.isArray(project?.workingFiles) ? project.workingFiles : [];

  const canManageAll = ['BOD', 'ADMIN', 'ADMIN_SALE', 'PM'].includes(userRole);
  const isTeamLead = project?.team?.teamLead?.id && isSameUser(project.team.teamLead.id, currentUserId);

  const canDeleteFile = (file) => {
    if (isOnHold) return false;
    if (canManageAll || isTeamLead) return true;
    return isSameUser(file?.createdById, currentUserId);
  };

  const handleCopyLink = (file) => {
    if (!file?.url) return;
    navigator.clipboard.writeText(file.url).then(() => {
      setCopiedId(file.id);
      toast.success('Đã sao chép đường dẫn');
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      toast.error('Không thể sao chép link');
    });
  };

  const handleDeleteFile = async (file) => {
    if (isOnHold) {
      toast.warning('Dự án đang tạm dừng, không thể xóa tài liệu.');
      return;
    }
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${file.name}" không?`);
    if (!confirmed) return;

    const updatedFiles = workingFiles.filter((item) => item.id !== file.id);
    try {
      await updateWorkingFilesMutation({
        id: project.id,
        workingFiles: updatedFiles,
      }).unwrap();
      toast.success(`Đã xóa tài liệu "${file.name}"`);
    } catch (error) {
      toast.error(error?.data?.message || 'Có lỗi xảy ra khi xóa tài liệu');
    }
  };

  const handleOpenModal = () => {
    if (isOnHold) {
      toast.warning('Dự án đang tạm dừng, không thể thêm tài liệu.');
      return;
    }
    setActiveTab('LINK');
    setLinkRows([{ name: '', url: '' }]);
    setSingleFile(null);
    setSingleFileName('');
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  // Link rows management
  const handleAddLinkRow = () => {
    setLinkRows((prev) => [...prev, { name: '', url: '' }]);
  };

  const handleRemoveLinkRow = (idx) => {
    setLinkRows((prev) => {
      if (prev.length <= 1) return [{ name: '', url: '' }];
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUpdateLinkRow = (idx, field, value) => {
    setLinkRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  // File selection: strictly 1 file, max 10MB, pdf, docx, doc, xls, xlsx, csv
  const handleSingleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      toast.warning('Chỉ chấp nhận các loại file: PDF, Word (.doc, .docx) và Excel (.xls, .xlsx, .csv)');
      e.target.value = '';
      setSingleFile(null);
      return;
    }

    // Validate size limit: max 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast.warning(`Kích thước file không được vượt quá 10MB (file của bạn: ${formatFileSize(file.size)})`);
      e.target.value = '';
      setSingleFile(null);
      return;
    }

    setSingleFile(file);
    if (!singleFileName.trim()) {
      setSingleFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOnHold) {
      toast.warning('Dự án đang tạm dừng, không thể lưu tài liệu.');
      return;
    }

    const newItems = [];

    if (activeTab === 'LINK') {
      // Validate link rows
      for (let i = 0; i < linkRows.length; i++) {
        const row = linkRows[i];
        if (!row.name.trim()) {
          toast.warning(`Dòng ${i + 1}: Vui lòng nhập tên tài liệu / link`);
          return;
        }
        if (!row.url.trim()) {
          toast.warning(`Dòng ${i + 1}: Vui lòng nhập đường dẫn URL`);
          return;
        }
      }

      linkRows.forEach((row) => {
        newItems.push({
          id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: row.name.trim(),
          url: row.url.trim(),
          type: 'LINK',
          createdAt: new Date().toISOString(),
          createdById: currentUserId,
          createdByName: me?.fullName || me?.name || 'Thành viên',
        });
      });
    } else {
      // File mode
      if (!singleFile) {
        toast.warning('Vui lòng chọn 1 tệp tin tải lên');
        return;
      }

      const extension = singleFile.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        toast.warning('Chỉ chấp nhận các loại file: PDF, Word (.doc, .docx) và Excel (.xls, .xlsx, .csv)');
        return;
      }

      if (singleFile.size > MAX_FILE_SIZE) {
        toast.warning(`Kích thước file không được vượt quá 10MB (file của bạn: ${formatFileSize(singleFile.size)})`);
        return;
      }

      if (!singleFileName.trim()) {
        toast.warning('Vui lòng nhập tên tài liệu');
        return;
      }

      setIsSubmitting(true);
      try {
        setUploadProgress(0);
        const uploadResult = await uploadToCloudinary(
          singleFile,
          'GETVINI/ERP/projects/working-files',
          setUploadProgress
        );

        newItems.push({
          id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: singleFileName.trim(),
          url: uploadResult.url,
          type: 'FILE',
          size: uploadResult.size || singleFile.size,
          createdAt: new Date().toISOString(),
          createdById: currentUserId,
          createdByName: me?.fullName || me?.name || 'Thành viên',
        });
      } catch (err) {
        setIsSubmitting(false);
        toast.error(`Lỗi tải tệp: ${err.message}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const mergedFiles = [...workingFiles, ...newItems];
      await updateWorkingFilesMutation({
        id: project.id,
        workingFiles: mergedFiles,
      }).unwrap();

      toast.success(
        activeTab === 'LINK'
          ? `Đã thêm ${newItems.length} link tài liệu thành công!`
          : `Đã tải lên tài liệu "${singleFileName}" thành công!`
      );
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 text-sm">Tài liệu làm việc (Working Files)</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                {workingFiles.length}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              Link Figma, Google Drive, tài liệu thiết kế hoặc file đính kèm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenModal}
            disabled={isOnHold}
            title={isOnHold ? 'Dự án đang tạm dừng' : 'Thêm tài liệu làm việc'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm tài liệu
          </button>
        </div>
      </div>

      {isOnHold && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Dự án đang tạm dừng. Các chức năng thêm hoặc xóa tài liệu làm việc tạm thời bị khóa.</span>
        </div>
      )}

      {/* Vertical Scrollable List */}
      {workingFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 mb-2">
            <Paperclip className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-700">Chưa có tài liệu làm việc nào</p>
          <p className="text-[11px] text-gray-500 max-w-sm mt-0.5 mb-3">
            Dán link Figma, Drive, Docs hoặc tải 1 file làm việc để cả nhóm cùng truy cập.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            disabled={isOnHold}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl text-orange-700 bg-orange-100 hover:bg-orange-200 disabled:opacity-50 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm tài liệu đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1.5 pt-1">
          {workingFiles.map((file) => {
            const domain = file.type === 'LINK' ? getDomainFromUrl(file.url) : '';
            const metaParts = [];
            if (domain) metaParts.push(domain);
            if (file.createdByName) metaParts.push(file.createdByName);
            metaParts.push(formatDateTime(file.createdAt));

            return (
              <DocumentCard
                key={file.id}
                url={file.url}
                fileName={file.name}
                fileSize={formatFileSize(file.size)}
                forceFullCard={true}
                metadata={metaParts.join(' • ')}
                onCopy={() => handleCopyLink(file)}
                onDelete={canDeleteFile(file) ? () => handleDeleteFile(file) : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Modal Thêm tài liệu làm việc */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Thêm tài liệu làm việc"
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Method Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('LINK')}
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'LINK'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              Dán link tài liệu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('FILE')}
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'FILE'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Tải file lên (1 file)
            </button>
          </div>

          {/* TAB 1: DÁN LINK */}
          {activeTab === 'LINK' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Dán đường dẫn trực tiếp từ Figma, Google Docs, Sheet, Drive hoặc trang web dự án.
              </p>

              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                {linkRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 relative group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-gray-500">
                        Link #{idx + 1}
                      </span>
                      {linkRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLinkRow(idx)}
                          disabled={isSubmitting}
                          className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa dòng link này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Tên tài liệu / link <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleUpdateLinkRow(idx, 'name', e.target.value)}
                          placeholder="VD: Figma UI/UX, Google Drive tài liệu,..."
                          disabled={isSubmitting}
                          className="w-full text-xs rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Đường dẫn URL <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="url"
                            value={row.url}
                            onChange={(e) => handleUpdateLinkRow(idx, 'url', e.target.value)}
                            placeholder="https://..."
                            disabled={isSubmitting}
                            className="w-full text-xs rounded-lg border border-gray-300 pl-8 pr-3 py-2 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddLinkRow}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm dòng link khác
              </button>
            </div>
          )}

          {/* TAB 2: TẢI FILE (1 FILE DUY NHẤT) */}
          {activeTab === 'FILE' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Chọn tệp tin tải lên (chỉ chọn 1 file) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept={ALLOWED_ACCEPT}
                    onChange={handleSingleFileChange}
                    disabled={isSubmitting}
                    className="w-full text-xs rounded-lg border border-gray-300 py-2 px-2.5 outline-none file:mr-2.5 file:rounded-md file:border-0 file:bg-purple-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-purple-700 bg-white"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Chỉ nhận định dạng: <span className="font-medium text-gray-600">PDF, Word (.doc, .docx), Excel (.xls, .xlsx, .csv)</span> • Dung lượng tối đa: <span className="font-semibold text-purple-700">10MB</span>
                </p>
                {singleFile && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500 bg-purple-50/60 border border-purple-100 px-2.5 py-1.5 rounded-lg">
                    <span className="truncate font-medium text-purple-900">{singleFile.name}</span>
                    <span className="shrink-0 ml-2 text-purple-700 font-bold">{formatFileSize(singleFile.size)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Tên hiển thị tài liệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={singleFileName}
                  onChange={(e) => setSingleFileName(e.target.value)}
                  placeholder="Tên tài liệu..."
                  disabled={isSubmitting}
                  className="w-full text-xs rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                  required
                />
              </div>

              {isSubmitting && uploadProgress > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-purple-700 font-medium">
                    <span>Đang tải lên Cloudinary...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Lưu tài liệu
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
