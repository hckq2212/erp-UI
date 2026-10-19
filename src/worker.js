export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (
      url.pathname === "/api" || url.pathname.startsWith("/api/") ||
      url.pathname === "/socket.io" || url.pathname.startsWith("/socket.io/")
    ) {
      const backend = new URL(env.API_ORIGIN);
      const target = new URL(url.pathname + url.search, backend.origin);
      return fetch(new Request(target, request));
    }

    return env.ASSETS.fetch(request);
  },
};