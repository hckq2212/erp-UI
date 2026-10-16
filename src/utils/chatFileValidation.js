/**
 * Quy chuẩn kiểm tra và giới hạn tệp tải lên trong hệ thống Chat ERP
 * - Giới hạn dung lượng: Tối đa 15MB
 * - Danh mục cho phép: Văn phòng (PDF, Word, Excel, PPT, Text), Tệp nén (ZIP, RAR, 7Z), Hình ảnh, Âm thanh, Video ngắn
 * - Chặn tuyệt đối: Các tệp thực thi / script độc hại (.exe, .bat, .cmd, .sh, .msi, .apk, .vbs, .ps1, ...)
 */

export const MAX_CHAT_FILE_SIZE_MB = 15;
export const MAX_CHAT_FILE_SIZE = MAX_CHAT_FILE_SIZE_MB * 1024 * 1024; // 15MB in bytes

// Danh mục định dạng được phép
export const ALLOWED_EXTENSIONS_MAP = {
    document: [
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "csv",
        "ppt",
        "pptx",
        "txt",
        "log",
        "md",
        "json"
    ],
    archive: [
        "zip",
        "rar",
        "7z",
        "tar",
        "gz"
    ],
    image: [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif",
        "svg"
    ],
    audio: [
        "mp3",
        "wav",
        "ogg",
        "m4a",
        "webm"
    ],
    video: [
        "mp4",
        "mov",
        "webm"
    ]
};

// Tập hợp tất cả các đuôi tệp hợp lệ
export const ALL_ALLOWED_EXTENSIONS = [
    ...ALLOWED_EXTENSIONS_MAP.document,
    ...ALLOWED_EXTENSIONS_MAP.archive,
    ...ALLOWED_EXTENSIONS_MAP.image,
    ...ALLOWED_EXTENSIONS_MAP.audio,
    ...ALLOWED_EXTENSIONS_MAP.video
];

// Danh sách các định dạng bị cấm tuyệt đối vì lý do an toàn thông tin
export const BANNED_EXTENSIONS = [
    "exe", "bat", "cmd", "sh", "bin", "msi", "apk", "vbs", "ps1",
    "scr", "jar", "com", "pif", "reg", "dll", "sys", "app", "deb", "rpm"
];

// Chuỗi accept cho input file html
export const CHAT_FILE_ACCEPT = ALL_ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(",");
export const CHAT_IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.svg";

/**
 * Lấy đuôi mở rộng của tệp
 * @param {string} fileName 
 * @returns {string} extension viết thường (không gồm dấu chấm)
 */
export const getFileExtension = (fileName = "") => {
    if (!fileName || typeof fileName !== "string") return "";
    const cleanName = fileName.split("?")[0].split("#")[0];
    const match = cleanName.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : "";
};

/**
 * Định dạng dung lượng theo MB/KB
 * @param {number} bytes 
 * @returns {string}
 */
export const formatBytes = (bytes) => {
    if (!bytes || isNaN(bytes)) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Phân loại tệp dựa trên đuôi mở rộng và MIME type
 * @param {string} ext - Phần mở rộng (không gồm dấu chấm)
 * @param {string} mimeType - MIME type của tệp
 * @returns {"IMAGE" | "DOCUMENT" | "ARCHIVE" | "AUDIO" | "VIDEO" | "UNKNOWN"}
 */
export const getFileCategory = (ext = "", mimeType = "") => {
    const extLower = (ext || "").toLowerCase();
    if (ALLOWED_EXTENSIONS_MAP.image.includes(extLower) || (mimeType && mimeType.startsWith("image/"))) {
        return "IMAGE";
    }
    if (
        ALLOWED_EXTENSIONS_MAP.document.includes(extLower) ||
        (mimeType && (mimeType.startsWith("application/pdf") || mimeType.startsWith("text/") || mimeType.includes("officedocument") || mimeType.includes("word") || mimeType.includes("excel") || mimeType.includes("powerpoint")))
    ) {
        return "DOCUMENT";
    }
    if (
        ALLOWED_EXTENSIONS_MAP.archive.includes(extLower) ||
        (mimeType && (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("compressed") || mimeType.includes("archive")))
    ) {
        return "ARCHIVE";
    }
    if (ALLOWED_EXTENSIONS_MAP.audio.includes(extLower) || (mimeType && mimeType.startsWith("audio/"))) {
        return "AUDIO";
    }
    if (ALLOWED_EXTENSIONS_MAP.video.includes(extLower) || (mimeType && mimeType.startsWith("video/"))) {
        return "VIDEO";
    }
    return "UNKNOWN";
};

/**
 * Kiểm tra tệp trước khi cho phép tải lên Cloudinary
 * @param {File} file - Đối tượng File từ browser
 * @param {Object} options - Tùy chọn kiểm tra (ví dụ { requireImage: true })
 * @returns {{ valid: boolean, error: string | null, ext: string, category: string, isImage: boolean }}
 */
export const validateChatFile = (file, options = {}) => {
    if (!file) {
        return { valid: false, error: "Vui lòng chọn tệp hợp lệ.", ext: "", category: "UNKNOWN", isImage: false };
    }

    const fileName = file.name || "Tệp";
    const ext = getFileExtension(fileName);
    const category = getFileCategory(ext, file.type);
    const isImage = category === "IMAGE";

    // 1. Kiểm tra dung lượng rỗng
    if (file.size === 0) {
        return {
            valid: false,
            error: `Tệp "${fileName}" bị rỗng (0 bytes), vui lòng kiểm tra lại.`,
            ext,
            category,
            isImage
        };
    }

    // 2. Kiểm tra giới hạn dung lượng tối đa 15MB
    if (file.size > MAX_CHAT_FILE_SIZE) {
        const currentSizeStr = formatBytes(file.size);
        return {
            valid: false,
            error: `Tệp "${fileName}" (${currentSizeStr}) vượt quá dung lượng tối đa cho phép là ${MAX_CHAT_FILE_SIZE_MB}MB.`,
            ext,
            category,
            isImage
        };
    }

    // 3. Kiểm tra danh sách đen nguy hiểm (Executable / Script)
    if (BANNED_EXTENSIONS.includes(ext)) {
        return {
            valid: false,
            error: `Định dạng ".${ext}" của tệp "${fileName}" tiềm ẩn rủi ro bảo mật và bị chặn trong hệ thống.`,
            ext,
            category,
            isImage: false
        };
    }

    // 4. Nếu chỉ cho phép hình ảnh
    if (options.requireImage && !isImage) {
        return {
            valid: false,
            error: `Tệp "${fileName}" không phải là định dạng hình ảnh hợp lệ (chỉ chấp nhận JPG, PNG, WEBP, GIF, SVG).`,
            ext,
            category,
            isImage: false
        };
    }

    // 5. Kiểm tra trong danh sách cho phép chung
    if (!ALL_ALLOWED_EXTENSIONS.includes(ext) && category === "UNKNOWN") {
        return {
            valid: false,
            error: `Hệ thống không hỗ trợ định dạng ".${ext || 'không xác định'}" của tệp "${fileName}". Chỉ chấp nhận tài liệu văn phòng (PDF, Word, Excel, PPT), tệp nén (ZIP, RAR), hình ảnh, âm thanh hoặc video ngắn.`,
            ext,
            category,
            isImage
        };
    }

    return {
        valid: true,
        error: null,
        ext,
        category,
        isImage
    };
};
