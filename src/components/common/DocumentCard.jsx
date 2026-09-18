import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Download, 
  Eye, 
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';
import { detectFileType, getFileNameFromUrl, getFileMeta, isValidFileUrl, FILE_TYPES } from '../../utils/fileDetector';
import { DocumentPreviewModal } from './DocumentPreviewModal';

/**
 * Chip hiển thị gọn cho các link KHÔNG phải file thật (không có đuôi file hợp lệ,
 * ví dụ link web thường, route nội bộ...). Không có nút Xem trước/Tải về vì
 * không áp dụng được cho loại link này — chỉ mở trong tab mới khi bấm.
 */
const LinkChip = ({ url, label, className = '' }) => {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-blue-300 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-600 shadow-xs transition-all cursor-pointer w-fit group ${className}`}
      title={url}
    >
      <LinkIcon className="w-3.5 h-3.5 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
      <span className="truncate">{label}</span>
      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors" />
    </a>
  );
};

/**
 * Thẻ hiển thị tệp tin tông sáng (Light theme) hiện đại, gọn gàng
 * 
 * @param {string} url - Đường dẫn Cloudinary hoặc URL file
 * @param {string} fileName - Tên file hiển thị (nếu không có sẽ tự parse từ URL)
 * @param {string} fileSize - Dung lượng file (tùy chọn, ví dụ "2.4 MB")
 * @param {string} className - Class tùy biến thêm
 * @param {function} onPreview - Callback khi bấm Xem trước (nếu không truyền, card sẽ tự mở DocumentPreviewModal)
 */
export const DocumentCard = ({
  url,
  fileName = '',
  fileSize = '',
  className = '',
  onPreview
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cleanFileName = getFileNameFromUrl(url, fileName);
  const fileType = detectFileType(url, cleanFileName);
  const meta = getFileMeta(fileType);
  const fileIsValid = isValidFileUrl(url);

  const handleOpenPreview = () => {
    if (onPreview) {
      onPreview({ url, fileName: cleanFileName, fileType });
    } else {
      setIsModalOpen(true);
    }
  };

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Render Icon đại diện theo chuẩn Word / Excel / PDF
  const renderAppIcon = () => {
    switch (fileType) {
      case FILE_TYPES.DOCX:
      case FILE_TYPES.DOC:
        return (
          <div className="w-10 h-10 rounded-lg bg-[#2b579a] flex items-center justify-center text-white font-bold shadow-xs select-none shrink-0">
            <span className="text-sm font-black tracking-tighter">W</span>
          </div>
        );
      case FILE_TYPES.PDF:
        return (
          <div className="w-10 h-10 rounded-lg bg-[#ea4335] flex items-center justify-center text-white font-bold shadow-xs select-none shrink-0">
            <span className="text-[11px] font-black tracking-tighter">PDF</span>
          </div>
        );
      case FILE_TYPES.EXCEL:
        return (
          <div className="w-10 h-10 rounded-lg bg-[#107c41] flex items-center justify-center text-white font-bold shadow-xs select-none shrink-0">
            <span className="text-sm font-black tracking-tighter">X</span>
          </div>
        );
      case FILE_TYPES.IMAGE:
        return (
          <div className="w-10 h-10 rounded-lg bg-[#8e44ad] flex items-center justify-center text-white shadow-xs shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
        );
      case FILE_TYPES.VIDEO:
        return (
          <div className="w-10 h-10 rounded-lg bg-[#e74c3c] flex items-center justify-center text-white shadow-xs shrink-0">
            <VideoIcon className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        );
    }
  };

  // Nếu url không phải file thật (không có đuôi hợp lệ) -> chỉ hiển thị chip liên kết gọn
  if (!fileIsValid) {
    let displayLabel = cleanFileName;
    if (!displayLabel || displayLabel === 'Tài liệu') {
      displayLabel = 'Xem liên kết';
    } else if (!displayLabel.toLowerCase().startsWith('xem ')) {
      displayLabel = `Xem ${displayLabel}`;
    }

    return (
      <LinkChip
        url={url}
        label={displayLabel}
        className={className}
      />
    );
  }

  return (
    <>
      <div 
        className={`group relative flex items-center justify-between gap-3 px-3.5 py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${className}`}
      >
        {/* Left: App Icon & File Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {renderAppIcon()}

          <div className="flex flex-col min-w-0 pr-2">
            <span 
              onClick={handleOpenPreview}
              title={cleanFileName}
              className="text-sm font-semibold text-slate-800 hover:text-blue-600 cursor-pointer truncate select-none transition-colors"
            >
              {cleanFileName}
            </span>
            <span className="text-xs text-slate-500 font-normal truncate mt-0.5">
              {fileSize ? `${meta.label} • ${fileSize}` : meta.label}
            </span>
          </div>
        </div>

        {/* Right: Cụm nút thao tác [Xem trước] [Tải về] */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Nút Xem trước */}
          <button
            type="button"
            onClick={handleOpenPreview}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
            title="Xem trước tài liệu"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Xem trước</span>
          </button>

          {/* Nút Tải về */}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
            title="Tải tệp về máy"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Tải về</span>
          </button>
        </div>
      </div>

      {/* Tích hợp DocumentPreviewModal nếu không dùng custom onPreview */}
      {!onPreview && (
        <DocumentPreviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          url={url}
          fileName={cleanFileName}
        />
      )}
    </>
  );
};