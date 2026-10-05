// Làm đẹp bố cục khi HIỂN THỊ nội dung trích xuất (khung xem trước trong app và bản PDF).
//
// Chỉ đổi cách trình bày: HTML được lưu trong DB và gửi cho QC KHÔNG bị thay đổi, chữ không bị thêm/bớt/sửa.
// Nhận diện theo từng dòng (các dòng trong cùng một <p> tách nhau bởi <br>):
//   - "NHÃN: mục 1; mục 2; mục 3"  -> hàng nhãn + các mục xếp theo hàng, mỗi mục không bị xé giữa chừng
//   - dòng CHỮ HOA ngắn            -> tiêu đề nhóm
//   - dòng "a | b | c" liền nhau   -> bảng (đây là cách service trích xuất ghi bảng)
//   - các dòng bị ngắt giữa câu    -> nối lại thành một đoạn
// Gặp bất kỳ lỗi nào thì trả nguyên HTML gốc.

const HEADING_MAX_CHARS = 90;
const KV_LABEL_MAX_WORDS = 7;
const KV_STACKED_LABEL_CHARS = 28; // nhãn dài hơn mức này thì xếp nhãn phía trên, không dùng cột nhãn cố định
const UPPER_RATIO = 0.8;
const KV_RE = /^(.{1,60}?):\s+(.+)$/u;
const SENTENCE_END_RE = /[.!?;…:。]$/u;
const LOWERCASE_START_RE = /^\p{Ll}/u;

const INLINE_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'A', 'SPAN', 'IMG', 'VIDEO', 'BR']);
const BLOCK_TAGS = new Set(['P', 'DIV', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'TABLE']);

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

export const EXTRACTED_LAYOUT_CSS = `
.extracted-doc .pd-heading { font-weight: 700; margin: 1.1em 0 .35em; padding-left: .6em; border-left: 3px solid #059669; line-height: 1.4; break-after: avoid; page-break-after: avoid; }
.extracted-doc > .pd-heading:first-child { margin-top: 0; }
.extracted-doc .pd-line { margin: 0 0 .6em; }
.extracted-doc .pd-kv { display: grid; grid-template-columns: 11em minmax(0, 1fr); column-gap: .9em; margin: 0 0 .4em; break-inside: avoid; page-break-inside: avoid; }
.extracted-doc .pd-kv-wide { display: block; }
.extracted-doc .pd-kv-label { font-weight: 600; color: #475569; }
.extracted-doc .pd-kv-wide .pd-kv-label { display: block; margin-bottom: .1em; }
.extracted-doc .pd-items { display: flex; flex-wrap: wrap; gap: .1em 1.6em; min-width: 0; }
.extracted-doc .pd-item { white-space: normal; }
.extracted-doc .pd-item::before { content: "•"; color: #94a3b8; margin-right: .45em; }
.extracted-doc .pd-value { min-width: 0; }
.extracted-doc .pd-table-wrap { overflow-x: auto; margin: .5em 0 .9em; }
.extracted-doc .pd-table { border-collapse: collapse; width: 100%; font-size: .95em; }
.extracted-doc .pd-table th, .extracted-doc .pd-table td { border: 1px solid #cbd5e1; padding: .3em .55em; text-align: left; vertical-align: top; }
.extracted-doc .pd-table th { background: #f1f5f9; font-weight: 600; }
.extracted-doc .pd-table tr { break-inside: avoid; page-break-inside: avoid; }
@media (max-width: 520px) { .extracted-doc .pd-kv { display: block; } }
`;

const STYLE_ELEMENT_ID = 'extracted-layout-css';

// Gắn CSS một lần cho cả app (nhiều ExtractedDocument cùng dùng chung).
export const ensureExtractedLayoutStyles = () => {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ELEMENT_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    style.textContent = EXTRACTED_LAYOUT_CSS;
    document.head.appendChild(style);
};

const cleanText = (nodes) => nodes.map((node) => node.textContent || '').join('').replace(/\s+/g, ' ').trim();

// Chữ không phân biệt hoa/thường (Hán, Nhật, Hàn, số, ký hiệu) không tính vào tỷ lệ.
const isUpperHeavy = (text) => {
    const cased = [...text].filter((ch) => ch.toLowerCase() !== ch.toUpperCase());
    if (cased.length < 3) return false;
    const upper = cased.filter((ch) => ch === ch.toUpperCase()).length;
    return upper / cased.length >= UPPER_RATIO;
};

const classifyLine = (nodes) => {
    const text = cleanText(nodes);

    if (text.includes(' | ')) {
        const cells = text.split(/\s+\|\s+/).map((cell) => cell.trim()).filter(Boolean);
        if (cells.length >= 2) return { type: 'row', cells, text };
    }

    const hasMarkup = nodes.some((node) => node.nodeType === ELEMENT_NODE);
    if (!hasMarkup) {
        const match = text.match(KV_RE);
        if (match && !match[1].includes(';') && match[1].trim().split(' ').length <= KV_LABEL_MAX_WORDS) {
            return { type: 'kv', label: match[1].trim(), value: match[2].trim(), text };
        }
    }

    if (text.length <= HEADING_MAX_CHARS && !text.includes(';') && isUpperHeavy(text)) {
        return { type: 'heading', nodes, text };
    }
    return { type: 'text', nodes, text };
};

const splitLines = (nodes) => {
    const lines = [[]];
    nodes.forEach((node) => {
        if (node.nodeType === ELEMENT_NODE && node.tagName === 'BR') {
            lines.push([]);
        } else {
            lines[lines.length - 1].push(node);
        }
    });
    return lines.filter((line) => cleanText(line) || line.some((node) => node.nodeType === ELEMENT_NODE && /^(IMG|VIDEO)$/.test(node.tagName)));
};

const create = (doc, tag, className, text) => {
    const element = doc.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
};

const appendClones = (parent, nodes) => nodes.forEach((node) => parent.appendChild(node.cloneNode(true)));

const renderKv = (doc, { label, value }) => {
    const row = create(doc, 'div', label.length > KV_STACKED_LABEL_CHARS ? 'pd-kv pd-kv-wide' : 'pd-kv');
    row.appendChild(create(doc, 'span', 'pd-kv-label', `${label}:`));
    const parts = value.split(/\s*;\s*/).map((part) => part.trim()).filter(Boolean);
    if (parts.length > 1) {
        const wrap = create(doc, 'span', 'pd-items');
        parts.forEach((part) => wrap.appendChild(create(doc, 'span', 'pd-item', part)));
        row.appendChild(wrap);
    } else {
        row.appendChild(create(doc, 'span', 'pd-value', value));
    }
    return row;
};

const renderTable = (doc, rows) => {
    const wrap = create(doc, 'div', 'pd-table-wrap');
    const table = create(doc, 'table', 'pd-table');
    rows.forEach((row, index) => {
        const tr = doc.createElement('tr');
        row.cells.forEach((cell) => tr.appendChild(create(doc, rows.length > 1 && index === 0 ? 'th' : 'td', undefined, cell)));
        table.appendChild(tr);
    });
    wrap.appendChild(table);
    return wrap;
};

const renderLines = (doc, out, lineNodes) => {
    const items = lineNodes.map(classifyLine);
    let i = 0;
    while (i < items.length) {
        const item = items[i];

        if (item.type === 'row') {
            const rows = [];
            while (i < items.length && items[i].type === 'row') rows.push(items[i++]);
            out.appendChild(renderTable(doc, rows));
            continue;
        }

        if (item.type === 'text') {
            const group = [item];
            while (i + group.length < items.length) {
                const next = items[i + group.length];
                const prev = group[group.length - 1];
                if (next.type === 'text' && !SENTENCE_END_RE.test(prev.text) && LOWERCASE_START_RE.test(next.text)) {
                    group.push(next);
                } else {
                    break;
                }
            }
            const paragraph = create(doc, 'p', 'pd-line');
            group.forEach((entry, index) => {
                if (index > 0) paragraph.appendChild(doc.createTextNode(' '));
                appendClones(paragraph, entry.nodes);
            });
            out.appendChild(paragraph);
            i += group.length;
            continue;
        }

        if (item.type === 'heading') {
            const heading = create(doc, 'div', 'pd-heading');
            appendClones(heading, item.nodes);
            out.appendChild(heading);
        } else {
            out.appendChild(renderKv(doc, item));
        }
        i += 1;
    }
};

const hasBlockChild = (element) => [...element.children].some((child) => BLOCK_TAGS.has(child.tagName));

const renderContainer = (doc, container, out) => {
    let inlineRun = [];
    const flush = () => {
        if (inlineRun.length) renderLines(doc, out, splitLines(inlineRun));
        inlineRun = [];
    };

    [...container.childNodes].forEach((node) => {
        if (node.nodeType === TEXT_NODE) {
            inlineRun.push(node);
            return;
        }
        if (node.nodeType !== ELEMENT_NODE) return;

        if (INLINE_TAGS.has(node.tagName)) {
            inlineRun.push(node);
            return;
        }

        flush();
        if (node.tagName === 'P' || (node.tagName === 'DIV' && !hasBlockChild(node))) {
            renderLines(doc, out, splitLines([...node.childNodes]));
        } else if (node.tagName === 'DIV') {
            renderContainer(doc, node, out);
        } else {
            out.appendChild(node.cloneNode(true)); // UL/OL/BLOCKQUOTE...: giữ nguyên
        }
    });
    flush();
};

export const beautifyExtractedHtml = (html) => {
    if (!html || typeof DOMParser === 'undefined') return html || '';
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const out = doc.createElement('div');
        renderContainer(doc, doc.body, out);
        return out.innerHTML || html;
    } catch {
        return html;
    }
};
