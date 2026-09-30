/**
 * Một nơi duy nhất quyết định "trạng thái ván" hiển thị cho người chơi, dùng chung cho
 * sảnh chờ, ván online và luyện tập. Hàm thuần: nhận dữ kiện, trả về {tone, icon, title, detail}.
 *   tone: turn | wait | danger | warn | info | success | neutral
 */

// Lý do kết thúc, viết theo góc nhìn người chơi. won: true / false / null (hòa, hủy).
const REASON_TEXT = {
  checkmate: (won, opp) => (won ? `Bạn chiếu bí ${opp}` : 'Bạn bị chiếu bí'),
  stalemate: (won, opp) => (won ? `${cap(opp)} hết nước đi` : 'Bạn hết nước đi'),
  resign: (won, opp) => (won ? `${cap(opp)} xin thua` : 'Bạn đã xin thua'),
  timeout: (won, opp) => (won ? `${cap(opp)} hết giờ` : 'Bạn hết giờ'),
  disconnect: (won, opp) => (won ? `${cap(opp)} mất kết nối` : 'Bạn mất kết nối quá lâu'),
  perpetual_check: (won, opp) => (won ? `${cap(opp)} chiếu liên tục` : 'Bạn chiếu liên tục'),
  agreement: () => 'Hai bên thỏa thuận hòa',
  repetition: () => 'Lặp thế 3 lần',
  insufficient_material: () => 'Không còn đủ lực lượng để chiếu bí',
  no_first_move: () => 'Không ai đi nước đầu tiên trong 30 giây',
  server_restart: () => 'Máy chủ khởi động lại',
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const reasonText = (reason, won, opp = 'đối thủ') => (REASON_TEXT[reason] ? REASON_TEXT[reason](won, opp) : reason);

/** Kết quả ván -> trạng thái cuối. `o = {result, reason}`; `myColor` là 'r' | 'b'. */
export function deriveOverStatus(o, myColor, opp = 'đối thủ') {
  if (o.result === 'aborted') return { tone: 'neutral', icon: 'flag', title: 'Ván đã hủy', detail: `${reasonText(o.reason, null, opp)}. Không tính rating.`, final: true };
  if (o.result === 'draw') return { tone: 'neutral', icon: 'handshake', title: 'Ván hòa', detail: reasonText(o.reason, null, opp), final: true };
  const won = (o.result === 'red') === (myColor === 'r');
  return { tone: won ? 'success' : 'danger', icon: won ? 'crown' : 'flag', title: won ? 'Bạn thắng!' : 'Bạn thua', detail: reasonText(o.reason, won, opp), final: true };
}

/** Sảnh chờ (chưa có ván). */
export function deriveLobbyStatus({ connected, queue, error }) {
  if (!connected) return { tone: 'warn', icon: 'wifiOff', title: 'Đang kết nối máy chủ…', detail: 'Chưa thể ghép trận cho tới khi kết nối xong.' };
  if (error) return { tone: 'danger', icon: 'shield', title: 'Không thể thực hiện', detail: error };
  if (queue?.queued) return { tone: 'info', icon: 'loader', title: 'Đang tìm đối thủ…', detail: `Rating của bạn ${queue.rating}, khoảng ghép ±${queue.ratingWindow} và sẽ tự mở rộng dần.` };
  return { tone: 'neutral', icon: 'swords', title: 'Sẵn sàng thi đấu', detail: 'Chọn thời gian mỗi bên rồi bấm "Tìm đối thủ".' };
}

/**
 * Ván online. Thứ tự ưu tiên: kết thúc > mất kết nối > lời mời hòa > đối thủ rớt mạng
 * > bị chiếu > sắp hết giờ > lượt đi.  `myMs` chỉ truyền khi đồng hồ đang chạy.
 */
export function deriveOnlineStatus({ connected, game, gameOver, myColor, opponentOnline, opponentGraceLeftMs, drawOfferedToMe, myMs }) {
  const over = gameOver || (game.over ? { result: game.result, reason: game.reason } : null);
  if (over) return deriveOverStatus(over, myColor);

  const mine = game.turn === myColor;
  if (!connected) return { tone: 'warn', icon: 'wifiOff', title: 'Bạn đang mất kết nối', detail: 'Đang tự kết nối lại. Đồng hồ vẫn chạy trên máy chủ; rớt quá 45 giây sẽ bị xử thua.' };
  if (drawOfferedToMe) return { tone: 'info', icon: 'handshake', title: 'Đối thủ xin hòa', detail: 'Chấp nhận hoặc từ chối ở khung bên dưới. Đi một nước cờ cũng được tính là từ chối.' };
  if (!opponentOnline) {
    const s = opponentGraceLeftMs != null ? ` (còn ${Math.max(0, Math.ceil(opponentGraceLeftMs / 1000))}s)` : '';
    return { tone: 'warn', icon: 'wifiOff', title: 'Đối thủ mất kết nối', detail: `Nếu không quay lại kịp, bạn sẽ được xử thắng${s}.` };
  }
  if (game.drawOffer === myColor) return { tone: 'info', icon: 'handshake', title: 'Đã gửi lời xin hòa', detail: 'Đang chờ đối thủ phản hồi.' };
  if (game.inCheck && mine) return { tone: 'danger', icon: 'shield', title: 'Bạn đang bị chiếu!', detail: 'Hãy hóa giải: di chuyển tướng, chặn đường hoặc ăn quân đang chiếu.' };
  if (game.inCheck) return { tone: 'success', icon: 'shield', title: 'Bạn đang chiếu tướng', detail: 'Đối thủ buộc phải hóa giải nước chiếu.' };
  if (mine && myMs != null && myMs < 30000) return { tone: 'danger', icon: 'clock', title: 'Sắp hết giờ!', detail: `Bạn còn ${Math.max(0, Math.ceil(myMs / 1000))} giây.` };
  const early = game.moves.length < 2 ? 'Hai nước đầu chưa tính giờ, nhưng không đi trong 30 giây ván sẽ bị hủy.' : undefined;
  return mine
    ? { tone: 'turn', icon: 'swords', title: 'Đến lượt bạn', detail: early }
    : { tone: 'wait', icon: 'loader', title: 'Đối thủ đang nghĩ…', detail: early };
}

/** Luyện tập với máy. `over` là {result, reason} hoặc null. */
export function derivePracticeStatus({ over, busy, turn, inCheck }) {
  if (over) return deriveOverStatus(over, 'r', 'máy');
  if (busy || turn === 'b') return { tone: 'wait', icon: 'bot', title: 'Máy đang nghĩ…', detail: inCheck ? 'Máy đang bị chiếu.' : undefined };
  if (inCheck) return { tone: 'danger', icon: 'shield', title: 'Bạn đang bị chiếu!', detail: 'Hãy hóa giải nước chiếu của máy.' };
  return { tone: 'turn', icon: 'swords', title: 'Đến lượt bạn (quân Đỏ)' };
}
