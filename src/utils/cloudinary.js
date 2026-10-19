import axios from 'axios';
import { BASE_URL } from '../store/api';

/**
 * Chuẩn hóa tên file: loại bỏ dấu tiếng Việt, ký tự đặc biệt, thay khoảng trắng bằng dấu gạch dưới
 * @param {string} originalName 
 * @returns {string} Tên file an toàn
 */
export const sanitizeFileName = (originalName) => {
    if (!originalName || typeof originalName !== 'string') return `file_${Date.now()}`;

    const lastDotIndex = originalName.lastIndexOf('.');
    const ext = lastDotIndex !== -1 ? originalName.slice(lastDotIndex + 1).toLowerCase() : '';
    const baseName = lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName;

    const safeBase = baseName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'))
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');

    const finalBase = safeBase || `file_${Date.now()}`;
    return ext ? `${finalBase}.${ext}` : finalBase;
};

/**
 * Upload a file directly to Cloudinary from the client side
 * 
 * @param {File} file - The file object to upload
 * @param {string} folder - The Cloudinary folder to upload to
 * @param {function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<object>} - Cloudinary response with secure_url, public_id, etc.
 */
export const uploadToCloudinary = async (file, folder = 'GETVINI/ERP/others', onProgress) => {
    try {
        const sanitizedFileName = sanitizeFileName(file.name);
        const fileToUpload = new File([file], sanitizedFileName, { type: file.type });

        // 1. Get signature from our backend
        const response = await axios.get(`${BASE_URL}/cloudinary/signature`, {
            params: { folder, use_filename: true },
            withCredentials: true // Required to send auth cookies to the backend
        });

        const { signature, timestamp, api_key, cloud_name, folder: signedFolder } = response.data;

        // 2. Prepare Form Data for Cloudinary
        const formData = new FormData();
        formData.append('file', fileToUpload, sanitizedFileName);
        formData.append('signature', signature);
        formData.append('timestamp', timestamp);
        formData.append('api_key', api_key);
        formData.append('folder', signedFolder);
        formData.append('use_filename', 'true');


        // 3. Upload to Cloudinary
        const uploadResponse = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percentCompleted);
                    }
                },
            }
        );

        const result = uploadResponse.data;

        // Return standardized metadata
        return {
            type: 'FILE',
            name: sanitizedFileName,
            originalName: file.name,
            url: result.secure_url,
            publicId: result.public_id,
            size: result.bytes,
            format: result.format,
            resource_type: result.resource_type
        };
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new Error(error.response?.data?.error?.message || 'Lỗi khi tải tệp lên Cloudinary');
    }
};
/**
 * Get a preview URL for a file.
 *
 * @param {string} url - The original file URL
 * @param {string} type - File type ('FILE' or 'LINK')
 * @returns {string} - The preview URL or the original URL
 */
export const getFilePreviewUrl = (url, type = 'FILE') => {
    if (!url) return '';
    
    const normalizedType = String(type).toUpperCase();
    if (normalizedType === 'LINK') return url;

    // Google Docs Viewer integration is temporarily disabled.
    return url;
};
