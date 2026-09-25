import { useState } from 'react';
import { Download, RotateCcw, Eye } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import {
  useGetDocumentVersionsQuery,
  useDownloadDocumentVersionMutation,
  useRestoreDocumentVersionMutation,
} from '../../api/documentLibrary';
import { formatDateTime } from '../../utils/format';

export const VersionHistoryModal = ({ isOpen, onClose, document }) => {
  const [previewTarget, setPreviewTarget] = useState(null);
  const { data: versions = [], isLoading } = useGetDocumentVersionsQuery(document?.id, {
    skip: !isOpen || !document,
  });
  const [downloadVersion] = useDownloadDocumentVersionMutation();
  const [restoreVersion] = useRestoreDocumentVersionMutation();

  const handleDownload = async (versionId) => {
    const result = await downloadVersion({ id: document.id, versionId }).unwrap();
    window.open(result.downloadUrl, '_blank');
  };

  const handleRestore = async (versionId) => {
    if (!window.confirm('Khôi phục phiên bản này thành phiên bản mới nhất?')) return;
    await restoreVersion({ id: document.id, versionId }).unwrap();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Lịch sử phiên bản - ${document?.displayName || ''}`}>
        <div className="space-y-3">
          {isLoading && <p className="text-sm text-gray-400 text-center py-4">Đang tải...</p>}
          {!isLoading && versions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Chưa có phiên bản nào</p>
          )}
          {versions.map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-900">
                  Phiên bản {version.versionNumber}
                  {version.versionNumber === document?.currentVersion && (
                    <span className="ml-2 text-xs text-blue-600 font-semibold">Hiện tại</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{version.originalFileName}</p>
                <p className="text-xs text-gray-400">
                  {formatDateTime(version.createdAt)} • {version.uploadedBy?.username || '-'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTarget({ url: version.fileUrl, fileName: version.originalFileName || document?.displayName })}
                  className="p-2 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-[#ea580c] transition-colors"
                  title="Xem trước phiên bản này"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(version.id)}
                  className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Tải về"
                >
                  <Download className="w-4 h-4" />
                </button>
                {version.versionNumber !== document?.currentVersion && (
                  <button
                    type="button"
                    onClick={() => handleRestore(version.id)}
                    className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                    title="Khôi phục phiên bản"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <DocumentPreviewModal
        isOpen={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        fileUrl={previewTarget?.url}
        fileName={previewTarget?.fileName}
      />
    </>
  );
};
