import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Tag } from 'lucide-react';

export const TagFilterDropdown = ({ tags = [], selected = [], onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = tags.filter((t) => t.toLowerCase().includes(search.toLowerCase()));

  const toggleTag = (tag) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const buttonLabel =
    selected.length === 0
      ? 'Tags'
      : selected.length === 1
      ? selected[0]
      : `${selected.length} tags`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-left focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
      >
        <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="flex-1 truncate text-gray-700">{buttonLabel}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-64 rounded-lg bg-white border border-gray-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tag..."
              className="w-full pl-7 pr-2 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredTags.length === 0 && (
              <p className="px-3 py-4 text-xs text-gray-400 text-center">Không có tag nào</p>
            )}
            {filteredTags.map((tag) => (
              <label
                key={tag}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(tag)}
                  onChange={() => toggleTag(tag)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="truncate">{tag}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full text-xs font-semibold text-gray-500 hover:text-blue-600 py-1"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
