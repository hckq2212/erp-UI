import { FileText, ExternalLink, Download, Eye } from 'lucide-react';
import { getFilePreviewUrl } from '../../../utils/cloudinary';

export const AttachmentsList = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  const getDisplayName = (attachment) => {
    if (attachment.type === 'FILE') {
      return attachment.name;
    }
    // For LINK, try to show domain or shortened URL
    try {
      const url = new URL(attachment.url);
      if (url.hostname.includes('drive.google.com')) {
        return 'Google Drive';
      } else if (url.hostname.includes('docs.google.com')) {
        return 'Google Docs';
      } else if (url.hostname.includes('sheets.google.com')) {
        return 'Google Sheets';
      } else if (url.hostname.includes('dropbox.com')) {
        return 'Dropbox';
      } else if (url.hostname.includes('onedrive')) {
        return 'OneDrive';
      }
      return url.hostname.replace('www.', '');
    } catch {
      return attachment.name;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <FileText className="w-5 h-5 text-cyan-600" />
        <h2 className="font-semibold text-gray-900">Tài liệu đính kèm</h2>
        <span className="text-sm text-gray-500">({attachments.length})</span>
      </div>
      <div className="space-y-3">
        {attachments.map((attachment, index) => (
          <a
            key={index}
            href={getFilePreviewUrl(attachment.url, attachment.type)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {attachment.type === 'LINK' ? (
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-blue-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {getDisplayName(attachment)}
                </p>
                {attachment.type === 'LINK' && (
                  <p className="text-xs text-gray-500 truncate max-w-md">{attachment.url}</p>
                )}
                {attachment.size && (
                  <p className="text-xs text-gray-500">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>
            {attachment.type === 'FILE' ? (
              <Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            ) : (
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            )}
          </a>
        ))}
      </div>
    </div>
  );
};
