/**
 * Bộ nhận diện loại file và metadata hỗ trợ xem trước cho các tệp từ Cloudinary hoặc URL ngoài
 */

export const FILE_TYPES = {
  DOCX: 'DOCX',
  DOC: 'DOC',
  PDF: 'PDF',
  EXCEL: 'EXCEL',
  POWERPOINT: 'POWERPOINT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  TEXT: 'TEXT',
  GDOCS: 'GDOCS',
  GSHEETS: 'GSHEETS',
  GSLIDES: 'GSLIDES',
  GDRIVE: 'GDRIVE',
  UNKNOWN: 'UNKNOWN'
};

// Các đuôi file được app hỗ trợ xem trước / tải về
const SUPPORTED_EXTENSIONS = [
  'docx', 'doc', 'pdf', 'xlsx', 'xls', 'csv',
  'pptx', 'ppt', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp',
  'mp4', 'webm', 'mov', 'avi', 'txt', 'md', 'json', 'xml'
];

/**
 * Các hàm nhận diện và trích xuất link Google Docs, Sheets, Slides, Drive
 */
export const getGoogleDocId = (url = '') => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/docs\.google\.com\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
};

export const getGoogleSheetId = (url = '') => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/docs\.google\.com\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
};

export const getGoogleSlideId = (url = '') => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/docs\.google\.com\/presentation\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
};

export const getGoogleDriveFileId = (url = '') => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/drive\.google\.com\/(?:file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)|(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+))/i);
  return match ? (match[1] || match[2]) : null;
};

export const isGoogleDocUrl = (url = '') => !!getGoogleDocId(url);
export const isGoogleSheetUrl = (url = '') => !!getGoogleSheetId(url);
export const isGoogleSlideUrl = (url = '') => !!getGoogleSlideId(url);
export const isGoogleDriveUrl = (url = '') => !!getGoogleDriveFileId(url);
export const isGoogleUrl = (url = '') => (
  isGoogleDocUrl(url) || isGoogleSheetUrl(url) || isGoogleSlideUrl(url) || isGoogleDriveUrl(url)
);

/**
 * Trả về embed link cho phép nhúng iframe xem trước trực tiếp các file từ Google
 */
export const getGoogleEmbedUrl = (url = '') => {
  const docId = getGoogleDocId(url);
  if (docId) return `https://docs.google.com/document/d/${docId}/preview`;

  const sheetId = getGoogleSheetId(url);
  if (sheetId) return `https://docs.google.com/spreadsheets/d/${sheetId}/preview`;

  const slideId = getGoogleSlideId(url);
  if (slideId) return `https://docs.google.com/presentation/d/${slideId}/preview`;

  const driveId = getGoogleDriveFileId(url);
  if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;

  return null;
};

/**
 * Kiểm tra xem URL có phải link PDF trực tiếp không
 */
export const isPdfUrl = (url = '') => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  if (clean.endsWith('.pdf')) return true;
  if (url.toLowerCase().includes('.pdf?') || url.toLowerCase().includes('.pdf#')) return true;
  return false;
};

/**
 * Kiểm tra xem URL có phải link Excel / Spreadsheet trực tiếp không
 */
export const isExcelUrl = (url = '') => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  if (clean.endsWith('.xlsx') || clean.endsWith('.xls') || clean.endsWith('.csv')) return true;
  return isGoogleSheetUrl(url);
};

/**
 * Tách lấy tên file sạch từ URL hoặc chuỗi tên truyền vào
 */
export const getFileNameFromUrl = (url, fallbackName = '') => {
  if (fallbackName && fallbackName.trim()) return fallbackName.trim();
  if (!url) return 'Tài liệu';

  if (isGoogleDocUrl(url)) return 'Tài liệu Google Docs';
  if (isGoogleSheetUrl(url)) return 'Bảng tính Google Sheets';
  if (isGoogleSlideUrl(url)) return 'Bản trình bày Google Slides';
  if (isGoogleDriveUrl(url)) return 'Tệp Google Drive';

  try {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/');
    let lastSegment = decodeURIComponent(segments[segments.length - 1] || '');

    // Loại bỏ prefix timestamp hoặc hash do Cloudinary sinh ra nếu có dạng 1234567890_name.docx
    if (/^\d{10,}_/.test(lastSegment)) {
      lastSegment = lastSegment.replace(/^\d{10,}_/, '');
    }
    return lastSegment || 'Tài liệu';
  } catch (error) {
    return 'Tài liệu';
  }
};

/**
 * Trích xuất đuôi file hợp lệ từ một chuỗi (url hoặc fileName).
 * Trả về '' nếu không tìm được đuôi hợp lệ (vd: chuỗi là tên hiển thị không có
 * đuôi file, hoặc là một route nội bộ như "/contracts/01M2...").
 */
const extractExt = (str) => {
  if (!str || typeof str !== 'string') return '';
  const clean = str.split('?')[0].split('#')[0];
  const lastDot = clean.lastIndexOf('.');
  if (lastDot === -1 || lastDot === clean.length - 1) return '';

  const ext = clean.substring(lastDot + 1).toLowerCase();

  // Chặn các trường hợp không phải đuôi file thật:
  // - chứa dấu / hoặc khoảng trắng (vd: phần sau dấu chấm là 1 đoạn path/câu)
  // - quá dài (đuôi file thật thường <= 5 ký tự)
  // - chứa ký tự không phải chữ/số
  if (/[\/\s]/.test(ext) || ext.length > 5 || !/^[a-z0-9]+$/.test(ext)) {
    return '';
  }
  return ext;
};

/**
 * Phân tích phần mở rộng (extension) từ URL hoặc tên file.
 * Ưu tiên đuôi lấy được từ URL thật (đáng tin cậy hơn), fallback sang fileName
 * chỉ khi URL không có đuôi hợp lệ.
 */
export const getFileExtension = (url = '', fileName = '') => {
  const fromUrl = extractExt(url);
  if (fromUrl) return fromUrl;

  const fromFileName = extractExt(fileName);
  if (fromFileName) return fromFileName;

  return '';
};

/**
 * Kiểm tra url có phải là một link file hợp lệ để xem trước/tải về hay không.
 * Chặn các trường hợp:
 * - url rỗng / không phải string
 * - url là route nội bộ của app (không có đuôi file nhận diện được)
 * - url không phải absolute http(s) URL
 */
export const isValidFileUrl = (url, fileName = '') => {
  if (!url || typeof url !== 'string') return false;

  // Phải là absolute URL (http/https), không chấp nhận route tương đối kiểu /contracts/...
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

  // Các liên kết Google Docs, Google Sheets, Google Slides, Google Drive đều hỗ trợ xem trước
  if (isGoogleUrl(url)) return true;

  // Link PDF (kể cả có query param)
  if (isPdfUrl(url)) return true;

  // Phải có đuôi file nằm trong danh sách hỗ trợ
  const ext = extractExt(url) || extractExt(fileName);
  if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) return false;

  return true;
};

/**
 * Nhận diện loại file (FILE_TYPES)
 */
export const detectFileType = (url = '', fileName = '') => {
  if (isGoogleDocUrl(url)) return FILE_TYPES.GDOCS;
  if (isGoogleSheetUrl(url)) return FILE_TYPES.GSHEETS;
  if (isGoogleSlideUrl(url)) return FILE_TYPES.GSLIDES;
  if (isGoogleDriveUrl(url)) return FILE_TYPES.GDRIVE;

  if (isPdfUrl(url)) return FILE_TYPES.PDF;

  const ext = getFileExtension(url, fileName);

  switch (ext) {
    case 'docx':
      return FILE_TYPES.DOCX;
    case 'doc':
      return FILE_TYPES.DOC;
    case 'pdf':
      return FILE_TYPES.PDF;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return FILE_TYPES.EXCEL;
    case 'pptx':
    case 'ppt':
      return FILE_TYPES.POWERPOINT;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
    case 'gif':
    case 'svg':
    case 'bmp':
      return FILE_TYPES.IMAGE;
    case 'mp4':
    case 'webm':
    case 'mov':
    case 'avi':
      return FILE_TYPES.VIDEO;
    case 'txt':
    case 'md':
    case 'json':
    case 'xml':
      return FILE_TYPES.TEXT;
    default:
      if (url.includes('/image/upload/')) return FILE_TYPES.IMAGE;
      if (url.includes('/video/upload/')) return FILE_TYPES.VIDEO;
      return FILE_TYPES.UNKNOWN;
  }
};

/**
 * Trả về thông tin hiển thị (nhãn, màu nền, màu chữ, icon key) theo loại file
 */
export const getFileMeta = (fileType) => {
  switch (fileType) {
    case FILE_TYPES.GDOCS:
      return {
        label: 'Tài liệu Google Docs',
        shortType: 'DOC',
        badgeBg: 'bg-blue-600',
        badgeText: 'text-white',
        borderHover: 'hover:border-blue-500',
        color: '#4285F4',
        iconType: 'word'
      };
    case FILE_TYPES.GSHEETS:
      return {
        label: 'Bảng tính Google Sheets',
        shortType: 'SHEET',
        badgeBg: 'bg-emerald-600',
        badgeText: 'text-white',
        borderHover: 'hover:border-emerald-500',
        color: '#0F9D58',
        iconType: 'excel'
      };
    case FILE_TYPES.GSLIDES:
      return {
        label: 'Bản trình bày Google Slides',
        shortType: 'SLIDE',
        badgeBg: 'bg-amber-500',
        badgeText: 'text-white',
        borderHover: 'hover:border-amber-500',
        color: '#FBBC05',
        iconType: 'powerpoint'
      };
    case FILE_TYPES.GDRIVE:
      return {
        label: 'Tệp Google Drive',
        shortType: 'DRIVE',
        badgeBg: 'bg-blue-500',
        badgeText: 'text-white',
        borderHover: 'hover:border-blue-400',
        color: '#4285F4',
        iconType: 'generic'
      };
    case FILE_TYPES.DOCX:
    case FILE_TYPES.DOC:
      return {
        label: fileType === FILE_TYPES.DOCX ? 'Word Document (.docx)' : 'Word Document (.doc)',
        shortType: 'DOCX',
        badgeBg: 'bg-blue-600',
        badgeText: 'text-white',
        borderHover: 'hover:border-blue-500',
        color: '#2b579a',
        iconType: 'word'
      };
    case FILE_TYPES.PDF:
      return {
        label: 'PDF Document (.pdf)',
        shortType: 'PDF',
        badgeBg: 'bg-red-600',
        badgeText: 'text-white',
        borderHover: 'hover:border-red-500',
        color: '#ea4335',
        iconType: 'pdf'
      };
    case FILE_TYPES.EXCEL:
      return {
        label: 'Excel Spreadsheet (.xlsx)',
        shortType: 'XLSX',
        badgeBg: 'bg-emerald-600',
        badgeText: 'text-white',
        borderHover: 'hover:border-emerald-500',
        color: '#107c41',
        iconType: 'excel'
      };
    case FILE_TYPES.POWERPOINT:
      return {
        label: 'PowerPoint Presentation (.pptx)',
        shortType: 'PPTX',
        badgeBg: 'bg-amber-600',
        badgeText: 'text-white',
        borderHover: 'hover:border-amber-500',
        color: '#d24726',
        iconType: 'powerpoint'
      };
    case FILE_TYPES.IMAGE:
      return {
        label: 'Hình ảnh',
        shortType: 'IMG',
        badgeBg: 'bg-purple-600',
        badgeText: 'text-white',
        borderHover: 'hover:border-purple-500',
        color: '#8e44ad',
        iconType: 'image'
      };
    case FILE_TYPES.VIDEO:
      return {
        label: 'Video',
        shortType: 'VIDEO',
        badgeBg: 'bg-rose-600',
        badgeText: 'text-white',
        borderHover: 'hover:border-rose-500',
        color: '#e74c3c',
        iconType: 'video'
      };
    default:
      return {
        label: 'Tệp tin',
        shortType: 'FILE',
        badgeBg: 'bg-gray-600',
        badgeText: 'text-white',
        borderHover: 'hover:border-gray-500',
        color: '#555555',
        iconType: 'generic'
      };
  }
};