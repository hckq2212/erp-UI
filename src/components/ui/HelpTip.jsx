import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

const SEEN_PREFIX = 'helptip:seen:';

const readSeen = (id) => {
  if (!id) return true;
  try {
    return window.localStorage.getItem(`${SEEN_PREFIX}${id}`) === '1';
  } catch {
    return false;
  }
};

const writeSeen = (id) => {
  if (!id) return;
  try {
    window.localStorage.setItem(`${SEEN_PREFIX}${id}`, '1');
  } catch {
    return;
  }
};

const SIZES = {
  sm: 'w-4 h-4 text-[10px]',
  md: 'w-5 h-5 text-[11px]',
  lg: 'w-6 h-6 text-xs',
};

export const Kbd = ({ children, className }) => (
  <kbd
    className={cn(
      'inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-semibold text-slate-700 shadow-[0_1px_0_rgba(0,0,0,0.08)]',
      className
    )}
  >
    {children}
  </kbd>
);

export const KeyCombo = ({ keys = [] }) => (
  <span className="inline-flex flex-wrap items-center gap-1">
    {keys.map((key, index) => (
      <span key={`${key}-${index}`} className="inline-flex items-center gap-1">
        {index > 0 && <span className="text-slate-400 text-[10px]">+</span>}
        <Kbd>{key}</Kbd>
      </span>
    ))}
  </span>
);

export const HelpTip = ({ id, title, children, className, size = 'md', align = 'center', label = 'Xem hướng dẫn' }) => {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [seen, setSeen] = useState(() => readSeen(id));
  const [pos, setPos] = useState({ top: 0, left: 0, width: 300 });
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const closeTimer = useRef(null);

  const place = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 16);
    const height = panelRef.current?.offsetHeight || 160;
    let left = rect.left + rect.width / 2 - width / 2;
    if (align === 'start') left = rect.left;
    if (align === 'end') left = rect.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    let top = rect.bottom + 8;
    if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 8);
    setPos({ top, left, width });
  }, [align]);

  const openTip = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
    if (!seen) {
      writeSeen(id);
      setSeen(true);
    }
  }, [id, seen]);

  const scheduleClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (buttonRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      setOpen(false);
      setPinned(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setOpen(false);
      setPinned(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          if (open && pinned) {
            setOpen(false);
            setPinned(false);
          } else {
            openTip();
            setPinned(true);
          }
        }}
        onMouseEnter={openTip}
        onMouseLeave={() => {
          if (!pinned) scheduleClose();
        }}
        onFocus={openTip}
        onBlur={() => {
          if (!pinned) scheduleClose();
        }}
        className={cn(
          'inline-flex items-center justify-center shrink-0 rounded-full bg-blue-600 text-white font-bold leading-none shadow-sm ring-2 ring-blue-200 hover:bg-blue-700 focus:outline-none focus:ring-blue-400',
          SIZES[size] || SIZES.md,
          !seen && 'animate-pulse',
          className
        )}
      >
        ?
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="tooltip"
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
            onMouseEnter={openTip}
            onMouseLeave={() => {
              if (!pinned) scheduleClose();
            }}
            className="z-[100] rounded-xl border border-blue-200 bg-white shadow-xl p-3 text-xs leading-relaxed text-slate-600 space-y-1.5"
          >
            {title && <div className="text-[13px] font-bold text-slate-800">{title}</div>}
            {children}
          </div>,
          document.body
        )}
    </>
  );
};
