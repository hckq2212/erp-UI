import axios from 'axios';
import { BASE_URL } from '../store/api';

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
        // 1. Get signature from our backend
        const response = await axios.get(`${BASE_URL}/cloudinary/signature`, {
            params: { folder },
            withCredentials: true // Required to send auth cookies to the backend
        });

        const { signature, timestamp, api_key, cloud_name, folder: signedFolder } = response.data;
        console.log('Cloudinary Config received:', { cloud_name, api_key, timestamp, folder: signedFolder });

        // 2. Prepare Form Data for Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signature);
        formData.append('timestamp', timestamp);
        formData.append('api_key', api_key);
        formData.append('folder', signedFolder);

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
            name: file.name,
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
 * Get a preview URL for a file using Google Docs Viewer
 * 
 * @param {string} url - The original file URL
 * @param {string} type - File type ('FILE' or 'LINK')
 * @returns {string} - The preview URL or the original URL
 */
export const getFilePreviewUrl = (url, type = 'FILE') => {
    if (!url) return '';
    
    const normalizedType = String(type).toUpperCase();
    if (normalizedType === 'LINK') return url;

    // Check if it's already a Google Docs Viewer link
    if (url.includes('docs.google.com/viewer')) return url;

    // For images, we might not want to wrap them in Google Viewer (optional but better)
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    if (isImage) return url;

    // Wrap with Google Docs Viewer
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
};
