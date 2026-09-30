import { useEffect } from 'react';
import { useXiangqiStore } from './useXiangqiStore';

/**
 * Game Hub gọi hook này cho thẻ Cờ tướng:
 *  - kết nối socket khi vào hub, để ván đang dở tự được nối lại sau khi tải lại trang
 *    (server xử thua nếu rớt mạng quá 45 giây);
 *  - trả về huy hiệu trạng thái để hiện trên thẻ, hoặc null khi không có gì.
 */
export function useXiangqiPresence() {
  const connect = useXiangqiStore((s) => s.connect);
  useEffect(() => { connect(); }, [connect]);
  const text = useXiangqiStore((s) => (s.game && !s.game.over ? 'Đang có ván dở' : s.queue.queued ? 'Đang tìm đối thủ' : null));
  return text ? { live: true, text } : null;
}
