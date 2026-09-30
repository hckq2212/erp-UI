import { cn } from '../../utils/cn';

// Class Tailwind phải viết đầy đủ (không ghép chuỗi) để bộ quét nhận ra.
export const COST_STYLE = {
  1: { ring: 'border-gray-300', bg: 'bg-gray-50', text: 'text-gray-600' },
  2: { ring: 'border-green-400', bg: 'bg-green-50', text: 'text-green-700' },
  3: { ring: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' },
  4: { ring: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-700' },
  5: { ring: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-700' },
};

export const STAR_TEXT = ['', '★', '★★', '★★★'];
const HP_STAR = [1, 1.8, 3.2];
const ATK_STAR = [1, 1.6, 2.6];

export function unitTip(def, star = 1) {
  const i = Math.min(3, Math.max(1, star)) - 1;
  return `${def.name} ${STAR_TEXT[star] || ''} — ${def.cost} vàng\n`
    + `Máu ${Math.round(def.hp * HP_STAR[i])} · Sát thương ${Math.round(def.atk * ATK_STAR[i])} · Tầm ${def.range}\n`
    + `Chiêu: ${def.spell.text}`;
}

/** Ô đại diện một quân: emoji + số sao. Dùng ở sân, hàng chờ, cửa hàng, xem trước đối thủ. */
export function UnitChip({ def, star = 1, selected, onClick, small, dim, className }) {
  if (!def) return null;
  const s = COST_STYLE[def.cost];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={unitTip(def, star)}
      className={cn(
        'relative flex items-center justify-center rounded-xl border-2 select-none',
        s.ring, s.bg,
        small ? 'h-9 w-9 text-lg' : 'h-full w-full text-2xl sm:text-3xl',
        selected && 'ring-4 ring-primary ring-offset-1',
        dim && 'opacity-50',
        onClick && 'transition hover:-translate-y-0.5',
        className,
      )}
    >
      <span>{def.emoji}</span>
      {star > 1 && (
        <span className={cn('absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-1 text-[10px] font-black leading-tight shadow', star === 3 ? 'text-amber-500' : 'text-blue-500')}>
          {STAR_TEXT[star]}
        </span>
      )}
    </Tag>
  );
}

/** Giá bán CHỈ để hiển thị; số vàng thực nhận do máy chủ quyết định (sellValue trong TftData.ts). */
export const sellPrice = (def, star = 1) => def.cost * 3 ** (star - 1) - (star > 1 ? 1 : 0);

export const btn = 'rounded-xl px-4 py-2 text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed';
export const btnPrimary = cn(btn, 'bg-primary text-white hover:bg-primary-hover');
export const btnGhost = cn(btn, 'border-2 border-primary text-primary-600 hover:bg-primary-50');
