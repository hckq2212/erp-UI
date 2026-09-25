import { useState } from 'react';
import {
  Upload, Search, Download, Trash2, FileText, Pencil, History, RefreshCcw,
  FileSpreadsheet, FileImage, File as FileIcon, Eye
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TagFilterDropdown } from '../../components/ui/TagFilterDropdown';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { useGetMeQuery } from '../../api/auth';
import {
  useGetDocumentsQuery,
  useGetDocumentTagsQuery,
  useDeleteDocumentMutation,
  useDownloadDocumentMutation,
} from '../../api/documentLibrary';
import { UploadDocumentModal } from './UploadDocumentModal';
import { EditDocumentModal } from './EditDocumentModal';
import { UpdateFileVersionModal } from './UpdateFileVersionModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import { formatDateTime } from '../../utils/format';

const MANAGE_ROLES = ['BOD', 'ADMIN', 'ADMIN_SALE'];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'document', label: 'Văn bản' },
  { value: 'spreadsheet', label: 'Bảng tính' },
  { value: 'presentation', label: 'Thuyết trình' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Hình ảnh' },
  { value: 'video', label: 'Video' },
  { value: 'archive', label: 'Nén' },
  { value: 'other', label: 'Khác' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'displayName', label: 'Tên A-Z' },
  { value: 'mostDownloaded', label: 'Tải nhiều nhất' },
];

const getFileIcon = (extension) => {
  const ext = (extension || '').toLowerCase();
  if (['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return FileImage;
  if (['doc', 'docx', 'pdf', 'txt'].includes(ext)) return FileText;
  return FileIcon;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

export const DocumentLibraryPage = () => {
  const { data: me } = useGetMeQuery();
  const canManage = MANAGE_ROLES.includes(me?.role);

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState('newest');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [versioningDocument, setVersioningDocument] = useState(null);
  const [historyDocument, setHistoryDocument] = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);

  const { data: documents = [], isLoading } = useGetDocumentsQuery({
    search: searchTerm || undefined,
    category: category !== 'all' ? category : undefined,
    tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    sort,
  });

  const { data: allTags = [] } = useGetDocumentTagsQuery();

  const [deleteDocument] = useDeleteDocumentMutation();
  const [downloadDocument] = useDownloadDocumentMutation();

  const handleDownload = async (doc) => {
    const result = await downloadDocument(doc.id).unwrap();
    window.open(result.downloadUrl, '_blank');
  };

  const handleDeleteDocument = async (doc) => {
    if (!window.confirm(`Xóa "${doc.displayName}"?`)) return;
    await deleteDocument(doc.id).unwrap();
  };

  const handleReset = () => {
    setSearchTerm('');
    setCategory('all');
    setSelectedTags([]);
    setFromDate('');
    setToDate('');
    setSort('newest');
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Kho tài liệu</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và tải về các biểu mẫu nội bộ</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Tải lên
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm biểu mẫu..."
            className="pl-9"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <TagFilterDropdown
          tags={allTags}
          selected={selectedTags}
          onChange={setSelectedTags}
        />

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Từ</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Đến</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 md:col-span-6 justify-between items-center">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-widest rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-all"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Làm mới
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên biểu mẫu</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Người tải lên</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tải lên</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dung lượng</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phiên bản</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">Đang tải...</td>
              </tr>
            )}
            {!isLoading && documents.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">Chưa có biểu mẫu nào</td>
              </tr>
            )}
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.fileExtension);
              return (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <p className="font-medium text-gray-900 truncate" title={doc.displayName}>{doc.displayName}</p>
                        <p className="text-xs text-gray-400 truncate" title={doc.originalFileName}>{doc.originalFileName}</p>
                        {doc.description && (
                          <p className="text-xs text-gray-500 truncate" title={doc.description}>{doc.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-nowrap items-center gap-1 max-w-[180px] overflow-x-auto pb-1">
                      {(doc.tags || []).map((t) => (
                        <span key={t} className="shrink-0 whitespace-nowrap px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full" title={t}>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-[140px] truncate" title={doc.uploadedBy?.username}>{doc.uploadedBy?.username || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(doc.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(doc.fileSizeBytes)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">v{doc.currentVersion}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewTarget({ url: doc.fileUrl, fileName: doc.originalFileName || doc.displayName })}
                        className="p-2 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-[#ea580c] transition-colors"
                        title="Xem trước"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Tải về"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistoryDocument(doc)}
                        className="p-2 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
                        title="Lịch sử phiên bản"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => setEditingDocument(doc)}
                            className="p-2 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setVersioningDocument(doc)}
                            className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
      <EditDocumentModal
        isOpen={!!editingDocument}
        onClose={() => setEditingDocument(null)}
        document={editingDocument}
      />
      <UpdateFileVersionModal
        isOpen={!!versioningDocument}
        onClose={() => setVersioningDocument(null)}
        document={versioningDocument}
      />
      <VersionHistoryModal
        isOpen={!!historyDocument}
        onClose={() => setHistoryDocument(null)}
        document={historyDocument}
      />
      <DocumentPreviewModal
        isOpen={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        fileUrl={previewTarget?.url}
        fileName={previewTarget?.fileName}
      />
    </div>
  );
};
