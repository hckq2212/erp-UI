import jsPDF from 'jspdf';
import { DEJAVUSANS_BASE64 } from '../assets/fonts/DejaVuSans_b64';
import { DEJAVUSANS_BOLD_BASE64 } from '../assets/fonts/DejaVuSans_Bold_b64';

const VN_FONT = 'DejaVuSans';

const ensureVnFont = (pdf) => {
    pdf.addFileToVFS('DejaVuSans.ttf', DEJAVUSANS_BASE64);
    pdf.addFont('DejaVuSans.ttf', VN_FONT, 'normal');
    pdf.addFileToVFS('DejaVuSans-Bold.ttf', DEJAVUSANS_BOLD_BASE64);
    pdf.addFont('DejaVuSans-Bold.ttf', VN_FONT, 'bold');
    pdf.addFont('DejaVuSans.ttf', VN_FONT, 'italic');
};

const stripHtml = (html) => {
    if (!html) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || '';
};

export const generateProductDescriptionPdf = ({ title, projectName, items }) => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    ensureVnFont(pdf);

    const marginX = 40;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const maxWidth = pageWidth - marginX * 2;
    let cursorY = 50;

    const ensureSpace = (needed) => {
        if (cursorY + needed > pageHeight - 40) {
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
        const nameLines = pdf.splitTextToSize(`${index + 1}. ${item.productName || ''}`, maxWidth);
        nameLines.forEach((line) => {
            ensureSpace(16);
            pdf.text(line, marginX, cursorY);
            cursorY += 16;
        });

        const descriptionText = stripHtml(item.extractedText).trim();
        if (descriptionText) {
            ensureSpace(14);
            pdf.setFont(VN_FONT, 'normal');
            pdf.setFontSize(10);
            const descLines = pdf.splitTextToSize(descriptionText, maxWidth - 10);
            descLines.forEach((line) => {
                ensureSpace(14);
                pdf.text(line, marginX + 10, cursorY);
                cursorY += 14;
            });
            cursorY += 4;
        }

        const noteText = stripHtml(item.note).trim();
        if (noteText) {
            ensureSpace(14);
            pdf.setFont(VN_FONT, 'italic');
            pdf.setFontSize(10);
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