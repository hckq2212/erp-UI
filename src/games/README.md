# Game Hub

Mỗi game nằm trong một thư mục riêng `games/<id>/`; Game Hub (`/games`) chỉ đọc `registry.js`.

```
games/
  registry.js        danh sách game (nơi duy nhất cần sửa khi thêm game)
  GameHubPage.jsx    /games — lưới thẻ game, bấm thẻ mới vào chơi
  GameShell.jsx      /games/:gameId — breadcrumb "Game Hub / <tên>" + tải game theo yêu cầu
  xiangqi/           game mẫu: màn hình, store, luật, thành phần riêng
```

## Thêm một game mới
1. Tạo `games/<id>/<Ten>Game.jsx`, **export default** component màn hình game. Component tự quản layout bên trong
   (khung chung chỉ thêm thanh quay về hub phía trên) và nên dọn dẹp trong `useEffect` cleanup khi rời trang.
2. Khai báo trong `registry.js`:
   ```js
   {
     id: 'ten-game', name: 'Tên game', tagline: 'Mô tả ngắn.', tags: ['1 người'],
     emblem: '🎲', accent: ['#60A5FA', '#1D4ED8'],
     Component: lazy(() => import('./ten-game/TenGame')),
   }
   ```
   Route `/games/ten-game` tự có, không cần sửa `App.jsx` hay Sidebar.
3. (Tuỳ chọn) Muốn thẻ hiện huy hiệu như "Đang có ván dở": viết hook trong `games/<id>/presence.js`
   trả về `{ live, text }` hoặc `null`, rồi gán `usePresence` trong registry (xem `xiangqi/presence.js`).
4. Game cần server: tạo module riêng ở `ERP/src/modules/<id>` và gắn vào `ERP/src/socket.ts` hoặc routes, giống `xiangqi`.

Quy ước: state/store, luật, component riêng của game để trong thư mục game đó; chỉ đưa vào `src/utils`,
`src/components` những thứ dùng chung nhiều game. Game chỉ được import từ thư mục của chính nó và từ `src/utils|components|store` chung.
