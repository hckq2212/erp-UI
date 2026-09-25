import jsPDF from 'jspdf';
import { DEJAVUSANS_BASE64 } from '../assets/fonts/DejaVuSans_b64';
import { DEJAVUSANS_BOLD_BASE64 } from '../assets/fonts/DejaVuSans_Bold_b64';

const VN_FONT = 'DejaVuSans';
const COLOR_TEXT = '#1e293b';
const COLOR_LINK = '#2563eb';
const COLOR_QUOTE = '#64748b';
const COLOR_MUTED = '#94a3b8';

const ensureVnFont = (pdf) => {
    pdf.addFileToVFS('DejaVuSans.ttf', DEJAVUSANS_BASE64);
    pdf.addFont('DejaVuSans.ttf', VN_FONT, 'normal');
    pdf.addFileToVFS('DejaVuSans-Bold.ttf', DEJAVUSANS_BOLD_BASE64);
    pdf.addFont('DejaVuSans-Bold.ttf', VN_FONT, 'bold');
    pdf.addFont('DejaVuSans.ttf', VN_FONT, 'italic');
};

const createRichHtmlRenderer = (pdf) => {
    const parser = new DOMParser();

    return (html, opts) => {
        const { startX, width, fontSize = 10, lineHeight = 14, pageBottom = 800, pageTop = 50 } = opts;
        let cursorY = opts.cursorY;
        let indent = 0;
        let cursorX = startX;

        const newLine = (extra = 0) => {
            cursorY += lineHeight + extra;
            cursorX = startX + indent;
            if (cursorY > pageBottom) {
                pdf.addPage();
                cursorY = pageTop;
                cursorX = startX + indent;
            }
        };

        const setStyle = (bold, color) => {
            pdf.setFont(VN_FONT, bold ? 'bold' : 'normal');
            pdf.setFontSize(fontSize);
            pdf.setTextColor(color || COLOR_TEXT);
        };

        const writeRun = (text, style) => {
            if (!text) return;
            const tokens = text.split(/(\s+)/).filter((t) => t.length > 0);
            setStyle(style.bold, style.color);
            tokens.forEach((token) => {
                if (/^\s+$/.test(token)) {
                    const spaceWidth = pdf.getTextWidth(' ');
                    if (cursorX + spaceWidth > startX + width) {
                        newLine();
                    } else {
                        cursorX += spaceWidth;
                    }
                    return;
                }
                setStyle(style.bold, style.color);
                const wordWidth = pdf.getTextWidth(token);
                if (cursorX + wordWidth > startX + width && cursorX > startX + indent) {
                    newLine();
                }
                pdf.text(token, cursorX, cursorY);
                if (style.underline) {
                    pdf.setDrawColor(style.color || COLOR_TEXT);
                    pdf.line(cursorX, cursorY + 1.5, cursorX + wordWidth, cursorY + 1.5);
                }
                if (style.strike) {
                    pdf.setDrawColor(style.color || COLOR_TEXT);
                    pdf.line(cursorX, cursorY - fontSize * 0.3, cursorX + wordWidth, cursorY - fontSize * 0.3);
                }
                cursorX += wordWidth;
            });
        };

        const walk = (node, style) => {
            node.childNodes.forEach((child) => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const text = (child.textContent || '').replace(/\s+/g, ' ');
                    writeRun(text, style);
                    return;
                }
                if (child.nodeType !== Node.ELEMENT_NODE) return;

                const tag = child.tagName.toUpperCase();
                switch (tag) {
                    case 'B':
                    case 'STRONG':
                        walk(child, { ...style, bold: true });
                        break;
                    case 'I':
                    case 'EM':
                        walk(child, style);
                        break;
                    case 'U':
                        walk(child, { ...style, underline: true });
                        break;
                    case 'S':
                    case 'STRIKE':
                        walk(child, { ...style, strike: true });
                        break;
                    case 'A':
                        walk(child, { ...style, color: COLOR_LINK, underline: true });
                        break;
                    case 'BLOCKQUOTE':
                        newLine(2);
                        indent += 14;
                        cursorX = startX + indent;
                        walk(child, { ...style, color: COLOR_QUOTE });
                        indent -= 14;
                        newLine(2);
                        break;
                    case 'UL':
                    case 'OL': {
                        newLine(2);
                        const listType = tag === 'OL' ? 'ol' : 'ul';
                        let counter = 0;
                        indent += 14;
                        Array.from(child.childNodes).forEach((li) => {
                            if (li.nodeType === Node.ELEMENT_NODE && li.tagName.toUpperCase() === 'LI') {
                                counter += 1;
                                cursorX = startX + indent;
                                const bullet = listType === 'ol' ? `${counter}. ` : '•  ';
                                writeRun(bullet, style);
                                walk(li, style);
                                newLine();
                            }
                        });
                        indent -= 14;
                        break;
                    }
                    case 'LI':
                        walk(child, style);
                        break;
                    case 'P':
                    case 'DIV':
                        cursorX = startX + indent;
                        walk(child, style);
                        newLine(4);
                        break;
                    case 'BR':
                        newLine();
                        break;
                    case 'IMG':
                        newLine();
                        setStyle(false, COLOR_MUTED);
                        pdf.text('[Hình ảnh đính kèm]', cursorX, cursorY);
                        newLine(4);
                        break;
                    case 'VIDEO':
                        newLine();
                        setStyle(false, COLOR_MUTED);
                        pdf.text('[Video đính kèm]', cursorX, cursorY);
                        newLine(4);
                        break;
                    default:
                        walk(child, style);
                }
            });
        };

        const root = parser.parseFromString(html || '', 'text/html').body;
        walk(root, { bold: false, underline: false, strike: false, color: COLOR_TEXT });
        newLine(0);
        return cursorY;
    };
};

export const generateProductDescriptionPdf = ({ title, projectName, items }) => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    ensureVnFont(pdf);
    const renderRichHtml = createRichHtmlRenderer(pdf);

    const marginX = 40;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const maxWidth = pageWidth - marginX * 2;
    const pageBottom = pageHeight - 40;
    let cursorY = 50;

    const ensureSpace = (needed) => {
        if (cursorY + needed > pageBottom) {
            pdf.addPage();
            cursorY = 50;
        }
    };

    pdf.setFont(VN_FONT, 'bold');
    pdf.setFontSize(16);
    pdf.text(title || 'Thông tin chuẩn sản phẩm', marginX, cursorY);
    cursorY += 22;

    if (projectName) {
        pdf.setFont(VN_FONT, 'normal');
        pdf.setFontSize(11);
        pdf.text(`Dự án: ${projectName}`, marginX, cursorY);
        cursorY += 20;
    }

    pdf.setFont(VN_FONT, 'normal');
    pdf.setFontSize(9);
    pdf.text(`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`, marginX, cursorY);
    cursorY += 24;

    (items || []).forEach((item, index) => {
        ensureSpace(24);
        pdf.setFont(VN_FONT, 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(COLOR_TEXT);
        const nameLines = pdf.splitTextToSize(`${index + 1}. ${item.productName || ''}`, maxWidth);
        nameLines.forEach((line) => {
            ensureSpace(16);
            pdf.text(line, marginX, cursorY);
            cursorY += 16;
        });

        if (item.extractedText && item.extractedText.trim()) {
            ensureSpace(14);
            cursorY = renderRichHtml(item.extractedText, {
                startX: marginX + 10,
                width: maxWidth - 10,
                fontSize: 10,
                lineHeight: 14,
                pageBottom,
                pageTop: 50,
                cursorY
            });
            cursorY += 4;
        }

        const noteText = (item.note || '').trim();
        if (noteText) {
            ensureSpace(14);
            pdf.setFont(VN_FONT, 'italic');
            pdf.setFontSize(10);
            pdf.setTextColor(COLOR_TEXT);
            pdf.text('Ghi chú:', marginX + 10, cursorY);
            cursorY += 14;
            pdf.setFont(VN_FONT, 'normal');
            const noteLines = pdf.splitTextToSize(noteText, maxWidth - 10);
            noteLines.forEach((line) => {
                ensureSpace(14);
                pdf.text(line, marginX + 10, cursorY);
                cursorY += 14;
            });
        }

        const documents = Array.isArray(item.documents) ? item.documents : [];
        if (documents.length > 0) {
            ensureSpace(14);
            pdf.setFont(VN_FONT, 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(COLOR_TEXT);
            documents.forEach((doc) => {
                ensureSpace(13);
                const docLine = `- Tài liệu: ${doc?.name || doc?.url || ''}`;
                pdf.text(docLine, marginX + 10, cursorY);
                cursorY += 13;
            });
        }

        cursorY += 12;
    });

    const fileName = (title || 'thong-tin-chuan-san-pham').replace(/\s+/g, '-').toLowerCase();
    pdf.save(`${fileName}.pdf`);
};
