import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { TagInput } from '../../components/ui/TagInput';
import { Button } from '../../components/ui/Button';
import { UploadCloud } from 'lucide-react';
import { useUploadDocumentMutation } from '../../api/documentLibrary';

export const UploadDocumentModal = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !displayName.trim()) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('displayName', displayName.trim());
    if (description) formData.append('description', description);
    if (tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }

    await uploadDocument(formData).unwrap();
    setFile(null);
    setDisplayName('');
    setDescription('');
    setTags([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tải lên biểu mẫu">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600">
            {file ? file.name : 'Chọn file để tải lên'}
          </span>
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>

        <Input
          label="Tên hiển thị *"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Tên biểu mẫu"
          required
        />

        <Input
          label="Mô tả"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả ngắn (tùy chọn)"
        />

        <TagInput
          label="Tags"
          value={tags}
          onChange={setTags}
          placeholder="Nhập tag rồi nhấn Enter"
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!file || !displayName.trim()}>
            Tải lên
          </Button>
        </div>
      </form>
    </Modal>
  );
};
