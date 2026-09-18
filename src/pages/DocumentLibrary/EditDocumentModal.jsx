import { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { TagInput } from '../../components/ui/TagInput';
import { Button } from '../../components/ui/Button';
import { useUpdateDocumentMutation } from '../../api/documentLibrary';

export const EditDocumentModal = ({ isOpen, onClose, document }) => {
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [updateDocument, { isLoading }] = useUpdateDocumentMutation();

  useEffect(() => {
    if (document) {
      setDisplayName(document.displayName || '');
      setDescription(document.description || '');
      setTags(document.tags || []);
    }
  }, [document]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!document || !displayName.trim()) return;

    await updateDocument({
      id: document.id,
      displayName: displayName.trim(),
      description,
      tags,
    }).unwrap();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa tài liệu">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit" isLoading={isLoading} disabled={!displayName.trim()}>
            Lưu
          </Button>
        </div>
      </form>
    </Modal>
  );
};
