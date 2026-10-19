export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (
      url.pathname === "/api" || url.pathname.startsWith("/api/") ||
      url.pathname === "/socket.io" || url.pathname.startsWith("/socket.io/")
    ) {
      const backend = new URL(env.VITE_API_URL);
      const target = new URL(url.pathname + url.search, backend.origin);

      const headers = new Headers(request.headers);
      headers.set("Origin", backend.origin);
      headers.delete("Sec-WebSocket-Extensions");

      const res = await fetch(new Request(target, {
        method: request.method,
        headers,
        body: request.body,
        redirect: "manual",
      }));

      if (!res.webSocket && request.headers.get("Upgrade")) {
        console.log("WS upgrade failed", res.status, target.toString());
      }
      return res;
    }

    return env.ASSETS.fetch(request);
  },
};
