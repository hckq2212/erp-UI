import { create } from "zustand";
import { io } from "socket.io-client";
import axios from "axios";
import { API_ORIGIN, BASE_URL } from "./api";
import { applyMove } from "../pages/Xiangqi/rules";

const configuredSocketUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SOCKET_URL = configuredSocketUrl || API_ORIGIN;

export const xiangqiApi = axios.create({ baseURL: BASE_URL, withCredentials: true });

const emitAck = (socket, event, data) =>
    new Promise((resolve) => {
        if (!socket) return resolve({ ok: false, error: "Chưa kết nối máy chủ" });
        socket.timeout(8000).emit(event, data, (err, res) =>
            resolve(err ? { ok: false, error: "Máy chủ không phản hồi" } : res || { ok: false, error: "Lỗi không xác định" }));
    });

export const useXiangqiStore = create((set, get) => ({
    socket: null,
    connected: false,
    accountId: null,
    queue: { queued: false },
    game: null,          // snapshot ván đang chơi (hoặc vừa kết thúc)
    receivedAt: 0,       // thời điểm nhận đồng hồ, dùng để đếm ngược mượt ở client
    gameOver: null,      // { result, reason, ratings }
    drawOfferedToMe: false,
    opponentOnline: true,
    opponentGraceEndsAt: null, // thời điểm đối thủ bị xử thua nếu chưa quay lại (từ graceMs của server)
    error: "",

    connect: () => {
        if (get().socket) return;
        // Dùng cookie accessToken như chat (withCredentials); server đọc token từ handshake.
        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 500,
            reconnectionDelayMax: 5000,
            timeout: 10000,
        });

        socket.on("connect", async () => {
            set({ connected: true, error: "" });
            const res = await emitAck(socket, "xq:sync"); // lấy lại ván/hàng đợi sau khi rớt mạng
            if (res?.accountId) set({ accountId: res.accountId });
        });
        socket.on("disconnect", () => set({ connected: false }));
        socket.on("connect_error", () => set({ connected: false }));

        socket.on("xq:queue:status", (q) => set({ queue: q || { queued: false } }));
        socket.on("xq:match:found", () => set({ queue: { queued: false }, gameOver: null }));
        socket.on("xq:game:state", (g) => set({
            game: g, receivedAt: Date.now(), opponentOnline: true, opponentGraceEndsAt: null,
            drawOfferedToMe: !!g.drawOffer && g.drawOffer !== (g.red.accountId === get().accountId ? "r" : "b"),
            gameOver: g.over ? (get().gameOver || { result: g.result, reason: g.reason }) : null,
        }));
        socket.on("xq:game:move", (m) => {
            const g = get().game;
            if (!g || g.gameId !== m.gameId) return;
            if (g.moves.length + 1 !== m.ply) { emitAck(socket, "xq:sync"); return; } // lệch nước -> đồng bộ lại
            set({
                game: { ...g, board: applyMove(g.board, m.move), moves: [...g.moves, m.move], turn: m.turn, inCheck: m.inCheck, clocks: m.clocks, drawOffer: null },
                receivedAt: Date.now(), drawOfferedToMe: false,
            });
        });
        socket.on("xq:game:over", (o) => set({ gameOver: o, drawOfferedToMe: false }));
        socket.on("xq:draw:offered", () => set({ drawOfferedToMe: true }));
        socket.on("xq:draw:declined", () => set({ drawOfferedToMe: false }));
        socket.on("xq:opponent", (o) => {
            if (o.accountId === get().accountId) return;
            set({ opponentOnline: o.online, opponentGraceEndsAt: o.online ? null : Date.now() + (o.graceMs || 45000) });
        });

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) socket.disconnect();
        set({ socket: null, connected: false, queue: { queued: false } });
    },

    joinQueue: async (tc) => {
        const res = await emitAck(get().socket, "xq:queue:join", { tc });
        set({ error: res.ok ? "" : res.error });
        return res;
    },
    leaveQueue: () => emitAck(get().socket, "xq:queue:leave"),
    move: async (move) => {
        const g = get().game;
        const res = await emitAck(get().socket, "xq:move", { gameId: g.gameId, move });
        if (!res.ok) set({ error: res.error });
        return res;
    },
    resign: () => emitAck(get().socket, "xq:resign", { gameId: get().game.gameId }),
    offerDraw: async () => {
        const res = await emitAck(get().socket, "xq:draw:offer", { gameId: get().game.gameId });
        if (!res.ok) set({ error: res.error });
        return res;
    },
    respondDraw: (accept) => emitAck(get().socket, "xq:draw:respond", { gameId: get().game.gameId, accept }),
    leaveFinishedGame: () => set({ game: null, gameOver: null, drawOfferedToMe: false, opponentGraceEndsAt: null }),
    clearError: () => set({ error: "" }),
}));
