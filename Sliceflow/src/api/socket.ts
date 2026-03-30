const WS_URL = import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws');

export const connectSocket = (onMessage: () => void) => {
  const token = localStorage.getItem('token');
  const PROTECTED = `${WS_URL}/hornero/authed/ws/dashboard${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  const LEGACY    = `${WS_URL}/hornero/ws/dashboard`;

  let attempts = 0;
  const MAX_ATTEMPTS = 2; // try each route cycle at most 2 times before giving up
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  };

  const tryConnect = (url: string, isFallback = false) => {
    console.log(`🔌 WS → ${isFallback ? '[legacy]' : '[authed]'}`);
    const socket = new WebSocket(url);

    socket.onopen = () =>
      console.log(`✅ WS abierto ${isFallback ? '(legacy)' : '(authed)'}`);

    socket.onmessage = () => {
      attempts = 0; // reset on real activity
      onMessage();
    };

    socket.onclose = (e) => {
      // Protected rejected → try legacy once
      if (!isFallback && e.code !== 1000) {
        console.warn(`⚠️ Authed rechazado (${e.code}) → legacy...`);
        tryConnect(LEGACY, true);
        return;
      }

      // Both failed or legacy also dropped
      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        cleanup();
        console.warn('🔕 WebSocket no disponible (ambas rutas fallaron). Live-updates off.');
        return;
      }

      const delay = attempts * 8000; // 8s, 16s
      console.log(`❌ WS cerrado (${e.code}). Reintento ${attempts}/${MAX_ATTEMPTS} en ${delay / 1000}s...`);
      retryTimer = setTimeout(() => tryConnect(PROTECTED), delay);
    };

    socket.onerror = () => { /* onclose handles it */ };
  };

  tryConnect(PROTECTED);
};