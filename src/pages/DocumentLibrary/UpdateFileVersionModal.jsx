import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { UploadCloud } from 'lucide-react';
import { useUploadDocumentVersionMutation } from '../../api/documentLibrary';

export const UpdateFileVersionModal = ({ isOpen, onClose, document }) => {
  const [file, setFile] = useState(null);
  const [uploadDocumentVersion, { isLoading }] = useUploadDocumentVersionMutation();

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !document) return;

    const formData = new FormData();
    formData.append('file', file);

    await uploadDocumentVersion({ id: document.id, formData }).unwrap();
    setFile(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cập nhật file mới">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          Tải lên file mới cho "{document?.displayName}". Phiên bản hiện tại sẽ được lưu lại trong lịch sử.
        </p>

        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600">
            {file ? file.name : 'Chọn file để thay thế'}
          </span>
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!file}>
            Cập nhật
          </Button>
        </div>
      </form>
    </Modal>
  );
};
