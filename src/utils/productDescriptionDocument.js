import { sanitizeHtml } from './html';
import { beautifyExtractedHtml, EXTRACTED_LAYOUT_CSS } from './extractedLayout';

// Dựng một tài liệu HTML khổ A4 hoàn chỉnh cho "Thông tin chuẩn sản phẩm".
// Cùng một tài liệu này vừa được hiển thị trong khung xem trước, vừa là thứ trình duyệt in ra PDF,
// nên bản xem trước luôn đúng với file được lưu.
//
// Vì sao không dùng jsPDF như trước: jsPDF chỉ vẽ được ký tự có trong font nhúng (DejaVu), nên mọi chữ
// ngoài bảng chữ Latin (tên món tiếng Hán/Nhật/Hàn trong ngoặc...) bị mất âm thầm. Trình duyệt tự chọn font hệ
// thống cho từng ký tự nên không mất chữ, đồng thời cho bố cục thật (bảng, lưới nhãn - mục, ngắt trang).

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

const FONT_STACK = [
    '"Segoe UI"', '"Noto Sans"', 'Roboto', '"Helvetica Neue"', 'Arial',
    '"Noto Sans CJK SC"', '"Microsoft YaHei"', '"PingFang SC"', '"Hiragino Sans"', '"Yu Gothic"', '"Malgun Gothic"',
    'sans-serif',
].join(', ');

const PRINT_CSS = `
@page { size: A4; margin: 16mm 14mm 18mm; @bottom-right { content: counter(page) " / " counter(pages); font-size: 8pt; color: #64748b; } }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: ${FONT_STACK}; color: #0f172a; font-size: 10.5pt; line-height: 1.55; -webkit-print-color-adjust: exact; print-color-adjust: exact; word-break: break-word; }
@media screen {
  body { background: #cbd5e1; padding: 20px 12px; }
  .sheet { width: 210mm; max-width: 100%; min-height: 297mm; margin: 0 auto; background: #fff; padding: 16mm 14mm 18mm; box-shadow: 0 1px 3px rgba(15,23,42,.25), 0 10px 30px rgba(15,23,42,.12); }
}
@media print { .sheet { width: auto; padding: 0; margin: 0; box-shadow: none; } }
.doc-head { padding-bottom: 10pt; margin-bottom: 14pt; border-bottom: 2px solid #0f172a; }
.doc-title { margin: 0 0 4pt; font-size: 19pt; line-height: 1.25; font-weight: 700; }
.doc-meta { margin: 0; color: #475569; font-size: 9pt; }
.toc { margin: 0 0 16pt; padding: 8pt 12pt; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4pt; break-inside: avoid; }
.toc-title { margin: 0 0 4pt; font-size: 9pt; font-weight: 700; color: #475569; }
.toc ol { margin: 0; padding-left: 1.6em; columns: 2; column-gap: 24pt; font-size: 9.5pt; }
.toc li { break-inside: avoid; margin: 0 0 2pt; }
.product { margin: 0 0 20pt; }
.product-title { display: flex; gap: 8pt; align-items: baseline; margin: 0 0 8pt; padding: 5pt 9pt; font-size: 13pt; line-height: 1.35; font-weight: 700; background: #f1f5f9; border-left: 4px solid #059669; border-radius: 0 3pt 3pt 0; break-after: avoid; page-break-after: avoid; }
.product-no { color: #059669; }
.source-file { margin: -2pt 0 8pt; color: #64748b; font-size: 8.5pt; }
.empty { color: #94a3b8; font-style: italic; }
.extracted-doc ul, .extracted-doc ol { margin: .4em 0 .8em; padding-left: 1.5em; }
.extracted-doc ul { list-style: disc; }
.extracted-doc ol { list-style: decimal; }
.extracted-doc li { margin: .15em 0; }
.extracted-doc blockquote { margin: .5em 0; padding-left: .8em; border-left: 3px solid #cbd5e1; color: #475569; }
.extracted-doc a { color: #1d4ed8; text-decoration: underline; }
.extracted-doc p { margin: 0 0 .6em; }
.media-note { color: #94a3b8; font-style: italic; }
.note { margin-top: 10pt; padding: 6pt 10pt; background: #fffbeb; border-left: 3px solid #f59e0b; break-inside: avoid; page-break-inside: avoid; font-size: 10pt; }
.note-label { margin: 0 0 2pt; font-size: 8.5pt; font-weight: 700; color: #b45309; }
.docs { margin: 10pt 0 0; font-size: 9pt; color: #475569; break-inside: avoid; page-break-inside: avoid; }
.docs-label { margin: 0 0 2pt; font-weight: 700; }
.docs ul { margin: 0; padding-left: 1.3em; }
`;

// Ảnh/video không được nhúng vào PDF (tránh tải tài nguyên ngoài, và bản in vốn không cần): thay bằng chú thích.
const prepareHtml = (html, { beautify }) => {
    const clean = sanitizeHtml(html || '');
    if (!clean.trim()) return '';
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    doc.querySelectorAll('img, video').forEach((node) => {
        const note = doc.createElement('span');
        note.className = 'media-note';
        note.textContent = node.tagName === 'VIDEO' ? '[Video đính kèm]' : '[Hình ảnh đính kèm]';
        node.replaceWith(note);
    });
    return beautify ? beautifyExtractedHtml(doc.body.innerHTML) : doc.body.innerHTML;
};

const renderProduct = (item, index) => {
    const body = prepareHtml(item.extractedText, { beautify: true });
    const note = prepareHtml(item.note, { beautify: false });
    const documents = (Array.isArray(item.documents) ? item.documents : []).filter((doc) => doc?.url || doc?.name);

    return `
<section class="product" id="product-${index + 1}">
  <h2 class="product-title"><span class="product-no">${index + 1}.</span><span>${escapeHtml(item.productName || 'Chưa có tên sản phẩm')}</span></h2>
  ${item.fileName ? `<p class="source-file">Tệp nguồn: ${escapeHtml(item.fileName)}</p>` : ''}
  <div class="extracted-doc">${body || '<p class="empty">Chưa có nội dung trích xuất</p>'}</div>
  ${note ? `<div class="note"><p class="note-label">Ghi chú</p><div class="extracted-doc">${note}</div></div>` : ''}
  ${documents.length ? `<div class="docs"><p class="docs-label">Tài liệu bổ sung</p><ul>${documents
        .map((doc) => `<li>${escapeHtml(doc.name || doc.url)}</li>`).join('')}</ul></div>` : ''}
</section>`;
};

export const buildProductDescriptionDocument = ({ title, projectName, items, exportedAt = new Date() }) => {
    const safeTitle = title || 'Thông tin chuẩn sản phẩm';
    const products = (Array.isArray(items) ? items : []).filter(Boolean);
    const meta = [
        projectName ? `Dự án: ${escapeHtml(projectName)}` : '',
        `Ngày xuất: ${escapeHtml(exportedAt.toLocaleString('vi-VN'))}`,
        `${products.length} sản phẩm`,
    ].filter(Boolean).join(' &nbsp;·&nbsp; ');

    const toc = products.length > 1
        ? `<nav class="toc"><p class="toc-title">Danh mục sản phẩm</p><ol>${products
            .map((item) => `<li>${escapeHtml(item.productName || 'Chưa có tên sản phẩm')}</li>`).join('')}</ol></nav>`
        : '';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>${escapeHtml(safeTitle)}</title>
<style>${PRINT_CSS}${EXTRACTED_LAYOUT_CSS}</style>
</head>
<body>
<main class="sheet">
  <header class="doc-head">
    <h1 class="doc-title">${escapeHtml(safeTitle)}</h1>
    <p class="doc-meta">${meta}</p>
  </header>
  ${toc}
  ${products.map(renderProduct).join('')}
</main>
</body>
</html>`;
};
