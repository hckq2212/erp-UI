import { describe, it, expect } from "vitest";
import { validateChatFile, MAX_CHAT_FILE_SIZE, getFileCategory } from "../chatFileValidation";

describe("validateChatFile", () => {
    it("chấp nhận tệp hình ảnh hợp lệ dưới 15MB và trả về category IMAGE", () => {
        const file = new File(["dummy content"], "photo.png", { type: "image/png" });
        const res = validateChatFile(file);
        expect(res.valid).toBe(true);
        expect(res.category).toBe("IMAGE");
        expect(res.isImage).toBe(true);
        expect(res.ext).toBe("png");
    });

    it("chấp nhận ảnh với requireImage: true", () => {
        const file = new File(["dummy content"], "images (1).jpg", { type: "image/jpeg" });
        const res = validateChatFile(file, { requireImage: true });
        expect(res.valid).toBe(true);
        expect(res.category).toBe("IMAGE");
        expect(res.isImage).toBe(true);
    });

    it("từ chối tệp không phải ảnh khi requireImage: true", () => {
        const pdfFile = {
            name: "doc.pdf",
            size: 1024,
            type: "application/pdf"
        };
        const res = validateChatFile(pdfFile, { requireImage: true });
        expect(res.valid).toBe(false);
        expect(res.category).toBe("DOCUMENT");
        expect(res.isImage).toBe(false);
        expect(res.error).toContain("hình ảnh hợp lệ");
    });

    it("từ chối tệp vượt quá 15MB", () => {
        const bigFile = {
            name: "huge.pdf",
            size: MAX_CHAT_FILE_SIZE + 1024,
            type: "application/pdf"
        };
        const res = validateChatFile(bigFile);
        expect(res.valid).toBe(false);
        expect(res.error).toContain("15MB");
    });

    it("chặn tệp thực thi nguy hiểm (.exe, .bat)", () => {
        const exeFile = {
            name: "malware.exe",
            size: 1024,
            type: "application/x-msdownload"
        };
        const res = validateChatFile(exeFile);
        expect(res.valid).toBe(false);
        expect(res.error).toContain("bị chặn");
    });

    it("chấp nhận tệp tài liệu văn phòng (PDF, Word, Excel) với category DOCUMENT", () => {
        const docFile = {
            name: "report.docx",
            size: 2 * 1024 * 1024,
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        };
        const res = validateChatFile(docFile);
        expect(res.valid).toBe(true);
        expect(res.category).toBe("DOCUMENT");
        expect(res.isImage).toBe(false);
    });
});

