import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link2, Quote, RemoveFormatting } from 'lucide-react';
import { sanitizeHtml } from '../../utils/html';

const TOOLBAR_ITEMS = [
  { command: 'bold', icon: Bold, label: 'Đậm' },
  { command: 'italic', icon: Italic, label: 'Nghiêng' },
  { command: 'underline', icon: Underline, label: 'Gạch chân' },
  { command: 'strikeThrough', icon: Strikethrough, label: 'Gạch ngang' },
  { command: 'insertUnorderedList', icon: List, label: 'Danh sách' },
  { command: 'insertOrderedList', icon: ListOrdered, label: 'Danh sách số' },
  { command: 'formatBlock:blockquote', icon: Quote, label: 'Trích dẫn' },
];

export const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = sanitizeHtml(value || '');
    }
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    isInternalUpdate.current = true;
    onChange(sanitizeHtml(editorRef.current.innerHTML));
  };

  const runCommand = (command) => {
    editorRef.current?.focus();
    if (command.startsWith('formatBlock:')) {
      document.execCommand('formatBlock', false, command.split(':')[1]);
    } else {
      document.execCommand(command, false);
    }
    emitChange();
  };

  const handleLink = () => {
    const url = window.prompt('Nhập đường dẫn (URL):', 'https://');
    if (!url) return;
    editorRef.current?.focus();
    document.execCommand('createLink', false, url);
    emitChange();
  };

  const handleClearFormat = () => {
    editorRef.current?.focus();
    document.execCommand('removeFormat', false);
    document.execCommand('formatBlock', false, 'p');
    emitChange();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-1 flex-wrap p-1.5 bg-gray-50 border-b border-gray-200">
        {TOOLBAR_ITEMS.map(({ command, icon: Icon, label }) => (
          <button
            key={command}
            type="button"
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand(command)}
            className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <button
          type="button"
          title="Chèn liên kết"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLink}
          className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button
          type="button"
          title="Xoá định dạng"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClearFormat}
          className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder={placeholder}
        className="rich-editor px-4 py-2.5 max-h-64 overflow-y-auto"
        suppressContentEditableWarning
      />
    </div>
  );
};
