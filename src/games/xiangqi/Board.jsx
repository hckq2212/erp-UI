import { useEffect, useMemo, useRef, useState } from 'react';
import { PIECE_NAME } from './material';

const CELL = 56, PAD = 32, W = 8 * CELL + 2 * PAD, H = 9 * CELL + 2 * PAD;
const ZH = { rK: '帥', rA: '仕', rE: '相', rR: '俥', rH: '傌', rC: '炮', rP: '兵', bK: '將', bA: '士', bE: '象', bR: '車', bH: '馬', bC: '砲', bP: '卒' };
const C = { line: '#C2410C', board: '#FFF7ED', piece: '#FFFFFF', red: '#C2260C', black: '#3B2A20', brand: '#F38820', check: '#E5484D' };

function Piece({ p, x, y, vietnamese, stroke, sw }) {
  const col = p[0] === 'r' ? C.red : C.black;
  return (
    <>
      <circle cx={x} cy={y + 2.5} r="24" fill="#000" opacity=".12" />
      <circle cx={x} cy={y} r="24" fill={C.piece} stroke={stroke || col} strokeWidth={sw || 2.5} />
      <circle cx={x} cy={y} r="19" fill="none" stroke={col} strokeWidth="1" />
      {vietnamese
        ? <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={col}>{PIECE_NAME[p[1]]}</text>
        : <text x={x} y={y + 8} textAnchor="middle" fontSize="24" fontWeight="700" fill={col} fontFamily="'Noto Serif SC','Songti SC',serif">{ZH[p]}</text>}
    </>
  );
}

/**
 * Bàn cờ SVG thuần trình bày: chỉ nhận state và vẽ, không chứa luật.
 * props: board, flip, last {fr,fc,tr,tc}, ply (số nước đã đi, để phát hiệu ứng khi có nước mới),
 *        selected [r,c], targets [{tr,tc}], checkedKing [r,c], vietnamese, disabled, onCell(r,c)
 * Hiệu ứng: quân trượt tới ô mới, quân bị ăn mờ dần + vòng nổ, tướng bị chiếu nhấp nháy đỏ,
 * quân đang chọn nổi lên, chấm nước đi bật ra. Tự tắt khi người dùng bật "giảm chuyển động".
 */
export function Board({ board, flip = false, last, ply = 0, selected, targets = [], checkedKing, vietnamese = false, disabled = false, onCell }) {
  const pos = (r, c) => (flip ? [PAD + (8 - c) * CELL, PAD + (9 - r) * CELL] : [PAD + c * CELL, PAD + r * CELL]);

  // Phát hiện "vừa có thêm đúng 1 nước" để biết có quân bị ăn (so với thế trước).
  const prev = useRef({ board, ply });
  const [fx, setFx] = useState(null);
  useEffect(() => {
    const p = prev.current;
    prev.current = { board, ply };
    if (!last || ply !== p.ply + 1) { setFx(null); return undefined; }
    const cap = p.board[last.tr]?.[last.tc] || null;
    setFx({ id: ply, cap, r: last.tr, c: last.tc });
    const t = setTimeout(() => setFx(null), 600);
    return () => clearTimeout(t);
  }, [board, ply, last]);

  const grid = useMemo(() => {
    const ln = (a, b, c, d, k) => <line key={k} x1={a} y1={b} x2={c} y2={d} />;
    const out = [];
    for (let r = 0; r < 10; r++) out.push(ln(PAD, PAD + r * CELL, PAD + 8 * CELL, PAD + r * CELL, 'h' + r));
    for (let c = 0; c < 9; c++) {
      const x = PAD + c * CELL;
      if (c % 8 === 0) out.push(ln(x, PAD, x, PAD + 9 * CELL, 'v' + c));
      else { out.push(ln(x, PAD, x, PAD + 4 * CELL, 'va' + c)); out.push(ln(x, PAD + 5 * CELL, x, PAD + 9 * CELL, 'vb' + c)); }
    }
    [[0, 3, 2, 5], [0, 5, 2, 3], [7, 3, 9, 5], [7, 5, 9, 3]].forEach(([a, b, c, d], i) =>
      out.push(ln(PAD + b * CELL, PAD + a * CELL, PAD + d * CELL, PAD + c * CELL, 'd' + i)));
    return out;
  }, []);

  const handleClick = (e) => {
    if (disabled || !onCell) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * W) / rect.width;
    const y = ((e.clientY - rect.top) * H) / rect.height;
    let c = Math.round((x - PAD) / CELL);
    let r = Math.round((y - PAD) / CELL);
    if (flip) { r = 9 - r; c = 8 - c; }
    if (r >= 0 && r < 10 && c >= 0 && c < 9) onCell(r, c);
  };

  // Độ lệch từ ô đi tới ô đến, dùng cho hiệu ứng trượt (đơn vị user-space của SVG).
  let slide = null;
  if (last && ply > 0) {
    const [fx0, fy0] = pos(last.fr, last.fc);
    const [tx0, ty0] = pos(last.tr, last.tc);
    slide = { '--dx': `${fx0 - tx0}px`, '--dy': `${fy0 - ty0}px` };
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} onClick={handleClick} role="img" aria-label="Bàn cờ tướng"
      className="w-full h-auto rounded-2xl shadow-lg shadow-primary/20 select-none touch-manipulation"
      style={{ background: C.board, cursor: disabled ? 'default' : 'pointer' }}>
      <g stroke={C.line} strokeWidth="1.6" fill="none">
        {grid}
        <rect x={PAD - 5} y={PAD - 5} width={8 * CELL + 10} height={9 * CELL + 10} strokeWidth="3" />
      </g>
      <text x={W / 2} y={PAD + 4.62 * CELL} textAnchor="middle" fontSize="22" fontWeight="700" fill={C.brand} letterSpacing="8">SÔNG · HÀ</text>

      {last && [[last.fr, last.fc, 0.14], [last.tr, last.tc, 0.28]].map(([r, c, o], i) => {
        const [x, y] = pos(r, c);
        return <rect key={'l' + i} x={x - 26} y={y - 26} width="52" height="52" rx="10" fill={C.brand} opacity={o} />;
      })}

      {checkedKing && (() => {
        const [x, y] = pos(checkedKing[0], checkedKing[1]);
        return <circle className="xq-fx xq-check" cx={x} cy={y} r="34" fill={C.check} />;
      })()}

      {/* Quân vừa bị ăn: mờ dần dưới quân đi tới */}
      {fx?.cap && (() => {
        const [x, y] = pos(fx.r, fx.c);
        return <g key={'g' + fx.id} className="xq-fx xq-ghost"><Piece p={fx.cap} x={x} y={y} vietnamese={vietnamese} /></g>;
      })()}

      {board.map((row, r) => row.map((p, c) => {
        if (!p) return null;
        const [x, y] = pos(r, c);
        const sel = selected && selected[0] === r && selected[1] === c;
        const chk = checkedKing && checkedKing[0] === r && checkedKing[1] === c;
        const moved = slide && last.tr === r && last.tc === c;
        return (
          <g key={moved ? `${r}-${c}-m${ply}` : `${r}-${c}`} className={moved ? 'xq-slide' : sel ? 'xq-fx xq-lift' : undefined} style={moved ? slide : undefined}>
            {sel && <circle cx={x} cy={y} r="31" fill="none" stroke={C.brand} strokeWidth="2" opacity=".45" />}
            <Piece p={p} x={x} y={y} vietnamese={vietnamese} stroke={chk ? C.check : sel ? C.brand : undefined} sw={sel || chk ? 5 : 2.5} />
          </g>
        );
      }))}

      {fx?.cap && (() => {
        const [x, y] = pos(fx.r, fx.c);
        return <circle key={'b' + fx.id} className="xq-fx xq-burst" cx={x} cy={y} r="26" fill="none" stroke={fx.cap[0] === 'r' ? C.red : C.black} strokeWidth="3" />;
      })()}

      {targets.map((m, i) => {
        const [x, y] = pos(m.tr, m.tc);
        const style = { animationDelay: `${Math.min(i, 12) * 12}ms` };
        return board[m.tr][m.tc]
          ? <circle key={'t' + i} className="xq-fx xq-target" style={style} cx={x} cy={y} r="28" fill="none" stroke={C.brand} strokeWidth="3" strokeDasharray="6 4" />
          : <circle key={'t' + i} className="xq-fx xq-target" style={style} cx={x} cy={y} r="8" fill={C.brand} />;
      })}
    </svg>
  );
}

export const pieceLabel = (p, vietnamese) => (vietnamese ? PIECE_NAME[p[1]] : ZH[p]);
