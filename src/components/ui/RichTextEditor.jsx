import { useEffect, useRef, useState, useCallback } from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link2, Quote, RemoveFormatting, Image as ImageIcon, Video, AtSign, Loader2, Users } from 'lucide-react';
import { sanitizeHtml } from '../../utils/html';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { useGetUsersQuery } from '../../api/users';

const TOOLBAR_ITEMS = [
  { command: 'bold', icon: Bold, label: 'Đậm' },
  { command: 'italic', icon: Italic, label: 'Nghiêng' },
  { command: 'underline', icon: Underline, label: 'Gạch chân' },
  { command: 'strikeThrough', icon: Strikethrough, label: 'Gạch ngang' },
  { command: 'insertUnorderedList', icon: List, label: 'Danh sách' },
  { command: 'insertOrderedList', icon: ListOrdered, label: 'Danh sách số' },
  { command: 'formatBlock:blockquote', icon: Quote, label: 'Trích dẫn' },
];

const EVERYONE_MENTION = { id: 'everyone', fullName: 'Everyone', isEveryone: true };

const buildMentionChip = (mention) => {
  const span = document.createElement('span');
  span.setAttribute('contenteditable', 'false');
  span.setAttribute('data-mention', 'true');
  span.setAttribute('data-mention-id', mention.id);
  span.className = mention.isEveryone
    ? 'mention-chip mention-chip-everyone'
    : 'mention-chip mention-chip-user';
  span.textContent = `@${mention.fullName}`;
  return span;
};

export const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const isInternalUpdate = useRef(false);
  const fileInputRef = useRef(null);
  const mentionAnchorRef = useRef(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  const { data: users = [] } = useGetUsersQuery();

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

  const insertNodeAtSelection = (node) => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editorRef.current?.appendChild(node);
      emitChange();
      return;
    }
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    selection.removeAllRanges();
    selection.addRange(range);
    emitChange();
  };

  const handlePickMedia = () => {
    fileInputRef.current?.click();
  };

  const handleMediaSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingMedia(true);
    try {
      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const uploaded = await uploadToCloudinary(file, 'GETVINI/ERP/announcements/media');
        const node = document.createElement(isVideo ? 'video' : 'img');
        node.setAttribute('src', uploaded.url);
        node.setAttribute('class', isVideo ? 'editor-media editor-video' : 'editor-media editor-image');
        node.setAttribute('data-media-type', isVideo ? 'video' : 'image');
        if (isVideo) {
          node.setAttribute('controls', 'true');
          node.setAttribute('muted', 'true');
        } else {
          node.setAttribute('alt', file.name || '');
        }
        insertNodeAtSelection(node);
        editorRef.current?.appendChild(document.createElement('br'));
      }
    } catch (error) {
      window.alert(error.message || 'Không thể tải lên tệp');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const filteredMentions = useCallback(() => {
    const lower = mentionQuery.toLowerCase();
    const matchedUsers = users.filter(u => u.fullName?.toLowerCase().includes(lower));
    const everyoneMatches = 'everyone'.includes(lower) || mentionQuery === '';
    return [
      ...(everyoneMatches ? [EVERYONE_MENTION] : []),
      ...matchedUsers,
    ];
  }, [users, mentionQuery]);

  const closeMentionMenu = () => {
    setMentionOpen(false);
    setMentionQuery('');
    setMentionIndex(0);
    mentionAnchorRef.current = null;
  };

  const updateMentionFromCaret = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      closeMentionMenu();
      return;
    }
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) {
      closeMentionMenu();
      return;
    }
    const text = node.textContent.slice(0, range.startOffset);
    const atIndex = text.lastIndexOf('@');
    if (atIndex === -1) {
      closeMentionMenu();
      return;
    }
    const query = text.slice(atIndex + 1);
    if (/\s/.test(query)) {
      closeMentionMenu();
      return;
    }
    mentionAnchorRef.current = { node, offset: atIndex };
    setMentionOpen(true);
    setMentionQuery(query);
    setMentionIndex(0);
  };

  const selectMention = (mention) => {
    const anchor = mentionAnchorRef.current;
    const selection = window.getSelection();
    editorRef.current?.focus();
    if (anchor && selection && selection.rangeCount > 0) {
      const currentRange = selection.getRangeAt(0);
      const range = document.createRange();
      try {
        range.setStart(anchor.node, anchor.offset);
        range.setEnd(currentRange.endContainer, currentRange.endOffset);
      } catch {
        closeMentionMenu();
        return;
      }
      range.deleteContents();
      const chip = buildMentionChip(mention);
      range.insertNode(chip);
      const space = document.createTextNode('\u00A0');
      chip.after(space);
      const newRange = document.createRange();
      newRange.setStartAfter(space);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      emitChange();
    }
    closeMentionMenu();
  };

  const handleKeyDown = (e) => {
    if (mentionOpen) {
      const options = filteredMentions();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % Math.max(options.length, 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + Math.max(options.length, 1)) % Math.max(options.length, 1));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (options[mentionIndex]) selectMention(options[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMentionMenu();
        return;
      }
    }
  };

  const handleInput = () => {
    emitChange();
    updateMentionFromCaret();
  };

  const mentionOptions = mentionOpen ? filteredMentions() : [];

  return (
    <div className="relative">
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
          title="Chèn ảnh/video"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handlePickMedia}
          disabled={isUploadingMedia}
          className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
        >
          {isUploadingMedia ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-3.5 h-3.5" />
              <Video className="w-3.5 h-3.5" />
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleMediaSelected}
        />
        <button
          type="button"
          title="Gắn thẻ (@)"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            editorRef.current?.focus();
            document.execCommand('insertText', false, '@');
            emitChange();
            updateMentionFromCaret();
          }}
          className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
        >
          <AtSign className="w-3.5 h-3.5" />
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
        onInput={handleInput}
        onBlur={() => { emitChange(); setTimeout(() => closeMentionMenu(), 150); }}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="rich-editor px-4 py-2.5 max-h-64 overflow-y-auto"
        suppressContentEditableWarning
      />
    </div>

      {mentionOpen && (
        <div className="absolute left-3 top-full mt-1 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="max-h-56 overflow-y-auto py-1">
            {mentionOptions.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-gray-400 font-bold">Không tìm thấy</div>
            )}
            {mentionOptions.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectMention(option); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-all ${index === mentionIndex ? 'bg-gray-50' : ''}`}
              >
                {option.isEveryone ? (
                  <>
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-black text-amber-600 uppercase">Everyone</span>
                  </>
                ) : (
                  <>
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">
                      {(option.fullName || '?').charAt(0).toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-gray-700">{option.fullName}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
