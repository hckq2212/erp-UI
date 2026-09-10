import { useState } from 'react';
import { ListPlus, X, ChevronDown, ChevronUp } from 'lucide-react';

export const SpellCheckWhitelist = ({ whitelist, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  const addWord = () => {
    const value = input.trim();
    if (!value) return;
    if (!whitelist.includes(value)) onChange([...whitelist, value]);
    setInput('');
  };

  const removeWord = (word) => {
    onChange(whitelist.filter((w) => w !== word));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addWord();
    }
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 disabled:opacity-50"
      >
        <ListPlus className="w-3.5 h-3.5" />
        Whitelist{whitelist.length > 0 ? ` (${whitelist.length})` : ''}
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="p-2 border border-slate-200 rounded-xl bg-white space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {whitelist.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1 pl-2 pr-1 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full"
              >
                {word}
                <button
                  type="button"
                  onClick={() => removeWord(word)}
                  disabled={disabled}
                  className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-slate-300 disabled:opacity-50"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            {whitelist.length === 0 && (
              <span className="text-xs text-slate-400">Chưa có từ nào trong whitelist</span>
            )}
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Nhập từ rồi nhấn Enter..."
            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      )}
    </div>
  );
};
