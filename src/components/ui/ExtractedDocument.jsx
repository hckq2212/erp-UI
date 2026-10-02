import { useMemo } from 'react';
import { sanitizeHtml } from '../../utils/html';
import { beautifyExtractedHtml, ensureExtractedLayoutStyles } from '../../utils/extractedLayout';

// Hiển thị nội dung trích xuất như một trang tài liệu (nền giấy, chữ rõ, đoạn/danh sách tách bạch)
// thay vì một khối chữ dính liền, để người duyệt đọc và đối chiếu dễ hơn.
// `beautify` chỉ đổi cách trình bày (tiêu đề nhóm, hàng "nhãn: mục; mục", bảng); chữ được lưu không đổi.
export const ExtractedDocument = ({ html, maxHeight = 480, emptyText = 'Chưa có nội dung', beautify = true }) => {
  ensureExtractedLayoutStyles();
  const safeHtml = useMemo(() => {
    const clean = sanitizeHtml(html || '');
    return beautify ? beautifyExtractedHtml(clean) : clean;
  }, [html, beautify]);

  if (!safeHtml.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-100 p-2">
      <article
        className="rich-content extracted-doc mx-auto overflow-y-auto rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm"
        style={{ maxHeight }}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  );
};
