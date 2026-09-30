import { create } from "zustand";
import { io } from "socket.io-client";
import axios from "axios";
import { API_ORIGIN, BASE_URL } from "../../store/api";

const configuredSocketUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SOCKET_URL = configuredSocketUrl || API_ORIGIN;

export const tftApi = axios.create({ baseURL: BASE_URL, withCredentials: true });

const emitAck = (socket, event, data) =>
    new Promise((resolve) => {
        if (!socket) return resolve({ ok: false, error: "Chưa kết nối máy chủ" });
        socket.timeout(8000).emit(event, data, (err, res) =>
            resolve(err ? { ok: false, error: "Máy chủ không phản hồi" } : res || { ok: false, error: "Lỗi không xác định" }));
    });

/**
 * Toàn bộ luật nằm ở máy chủ; client chỉ gửi ý định (mua/bán/di chuyển/chiến đấu) và hiển thị state nhận về.
 * Catalog (quân, trait, hằng số) cũng do máy chủ gửi qua tft:sync nên không có bản sao số liệu ở đây.
 */
export const useTftStore = create((set, get) => ({
    socket: null,
    connected: false,
    catalog: null,
    unitMap: {},
    traitMap: {},
    state: null,     // trạng thái lượt chơi (view() từ server)
    battle: null,    // { battle, win, income, finished, state } — giữ cho tới khi xem xong để không lộ kết quả sớm
    error: "",

    connect: () => {
        if (get().socket) return;
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
            const res = await emitAck(socket, "tft:sync");
            if (!res.ok) return set({ error: res.error });
            const catalog = res.catalog;
            set({
                catalog,
                unitMap: Object.fromEntries(catalog.units.map((u) => [u.key, u])),
                traitMap: Object.fromEntries(catalog.traits.map((t) => [t.id, t])),
                // đang xem trận đấu thì không ghi đè state để khỏi nhảy màn hình giữa chừng
                ...(get().battle ? {} : { state: res.state }),
            });
        });
        socket.on("disconnect", () => set({ connected: false }));
        socket.on("connect_error", () => set({ connected: false }));
        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) socket.disconnect();
        set({ socket: null, connected: false });
    },

    /** Gửi 1 thao tác; thành công thì thay state bằng state server trả về. */
    act: async (event, data) => {
        const res = await emitAck(get().socket, event, data);
        if (res.ok && res.state) set({ state: res.state, error: "" });
        else if (!res.ok) set({ error: res.error });
        return res;
    },

    start: () => get().act("tft:start"),
    abandon: async () => {
        const res = await emitAck(get().socket, "tft:abandon");
        if (res.ok) set({ state: null, battle: null, error: "" });
        else set({ error: res.error });
        return res;
    },
    buy: (slot) => get().act("tft:buy", { slot }),
    /**
     * Kéo-thả cần phản hồi tức thì: áp thay đổi lên state cục bộ ngay, rồi để máy chủ xác nhận.
     * Máy chủ vẫn là nguồn sự thật: thành công thì state của nó ghi đè, thất bại thì hoàn tác.
     */
    sell: async (at) => {
        const prev = get().state;
        if (prev) {
            const key = at.z === "bench" ? "bench" : "board";
            const list = [...prev[key]]; list[at.i] = null;
            set({ state: { ...prev, [key]: list } });
        }
        const res = await get().act("tft:sell", { at });
        if (!res.ok && prev) set({ state: prev });
        return res;
    },
    move: async (from, to) => {
        const prev = get().state;
        if (prev) {
            const bench = [...prev.bench], board = [...prev.board];
            const list = (z) => (z === "bench" ? bench : board);
            const a = list(from.z), b = list(to.z);
            [a[from.i], b[to.i]] = [b[to.i], a[from.i]];
            set({ state: { ...prev, bench, board } });
        }
        const res = await get().act("tft:move", { from, to });
        if (!res.ok && prev) set({ state: prev });
        return res;
    },
    reroll: () => get().act("tft:reroll"),
    buyXp: () => get().act("tft:xp"),

    fight: async () => {
        const res = await emitAck(get().socket, "tft:fight");
        if (!res.ok) { set({ error: res.error }); return res; }
        set({ battle: res, error: "" }); // state mới chỉ áp dụng sau khi xem xong trận (finishBattle)
        return res;
    },
    finishBattle: () => {
        const b = get().battle;
        set({ state: b ? b.state : get().state, battle: null });
    },
    clearError: () => set({ error: "" }),
}));
