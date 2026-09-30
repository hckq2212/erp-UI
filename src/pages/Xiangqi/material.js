import { initialBoard, applyMove } from './rules';

// Giá trị quân theo quy ước phổ biến (trùng bảng điểm của bot). Tướng không tính.
export const PIECE_VALUE = { R: 9, C: 4.5, H: 4, E: 2, A: 2, P: 1 };
export const PIECE_ORDER = ['R', 'C', 'H', 'E', 'A', 'P'];
export const PIECE_NAME = { K: 'Tướng', A: 'Sĩ', E: 'Tượng', R: 'Xe', H: 'Mã', C: 'Pháo', P: 'Tốt' };
const START = { R: 2, C: 2, H: 2, E: 2, A: 2, P: 5 };

// Đỏ ở dưới (hàng 5-9), Đen ở trên (hàng 0-4); sông nằm giữa hàng 4 và 5.
const crossedRiver = (color, r) => (color === 'r' ? r <= 4 : r >= 5);

/** Tốt qua sông có giá trị 2 thay vì 1. */
export const pieceValue = (p, r) => {
  const t = p[1];
  if (t === 'K') return 0;
  return t === 'P' && crossedRiver(p[0], r) ? 2 : PIECE_VALUE[t];
};

const emptySide = () => ({
  score: 0, pieces: 0, crossed: 0,
  counts: Object.fromEntries(PIECE_ORDER.map((t) => [t, 0])),
  lost: Object.fromEntries(PIECE_ORDER.map((t) => [t, 0])), // quân của bên này đã bị ăn
});

/** Thống kê lực lượng từ một thế cờ. diff > 0: Đỏ hơn. */
export function analyzeMaterial(board) {
  const side = { r: emptySide(), b: emptySide() };
  board.forEach((row, r) => row.forEach((p, c) => {
    if (!p || p[1] === 'K') return;
    const s = side[p[0]];
    s.counts[p[1]] += 1;
    s.pieces += 1;
    s.score += pieceValue(p, r);
    if (p[1] === 'P' && crossedRiver(p[0], r)) s.crossed += 1;
  }));
  for (const col of ['r', 'b']) for (const t of PIECE_ORDER) side[col].lost[t] = START[t] - side[col].counts[t];
  return { ...side, diff: side.r.score - side.b.score };
}

/** Chênh lệch lực lượng (Đỏ - Đen) sau từng nước; phần tử 0 là thế xuất phát. */
export function balanceSeries(moves) {
  let b = initialBoard();
  const out = [analyzeMaterial(b).diff];
  for (const m of moves) { b = applyMove(b, m); out.push(analyzeMaterial(b).diff); }
  return out;
}

/** Nhãn mô tả mức chênh lệch (đã lấy góc nhìn của người xem: positive = mình hơn). */
export function advantageLabel(d) {
  const a = Math.abs(d);
  const level = a < 0.5 ? 0 : a < 2 ? 1 : a < 4 ? 2 : 3;
  if (level === 0) return 'Cân bằng';
  return ['', 'Nhỉnh hơn', 'Lợi thế rõ', 'Áp đảo'][level];
}
