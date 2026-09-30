import { lazy } from 'react';
import { useXiangqiPresence } from './xiangqi/presence';

/**
 * Danh sách game của Game Hub. Thêm game mới = thêm một mục vào GAMES (xem README.md).
 *
 *  id           định danh, cũng là đường dẫn: /games/<id>
 *  name         tên hiển thị
 *  tagline      mô tả ngắn trên thẻ
 *  tags         nhãn nhỏ trên thẻ (số người chơi, chế độ…)
 *  emblem       ký tự/emoji làm biểu tượng thẻ
 *  accent       [màu đầu, màu cuối] của nền thẻ
 *  Component    màn hình game, tải theo yêu cầu (chỉ tải khi người dùng bấm vào chơi)
 *  usePresence  (tuỳ chọn) hook trả về { live, text } | null để hiện huy hiệu như "Đang có ván dở"
 */
export const GAMES = [
  {
    id: 'xiangqi',
    name: 'Cờ tướng',
    tagline: 'Đấu 1-1 với đồng nghiệp theo rating Elo, hoặc luyện tập với máy.',
    tags: ['2 người', 'Xếp hạng', 'Luyện tập với máy'],
    emblem: '帥',
    accent: ['#FB923C', '#C2260C'],
    Component: lazy(() => import('./xiangqi/XiangqiGame')),
    usePresence: useXiangqiPresence,
  },
];

export const getGame = (id) => GAMES.find((g) => g.id === id);
