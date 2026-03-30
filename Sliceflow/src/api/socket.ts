const WS_URL = import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws');

let retryTimer: ReturnType<typeof setTimeout> | null = null;

export const connectSocket = (onMessage: () => void) => {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  const token = localStorage.getItem('token');

  // Try the protected route first; the token is sent as a query param.
  // Fiber's JWT middleware must be configured with TokenLookup: "query:token"
  // If that isn't the case on the backend, the connection will be rejected
  // and we fall back to the legacy public route.
  const PROTECTED = `${WS_URL}/hornero/authed/ws/dashboard${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  const LEGACY = `${WS_URL}/hornero/ws/dashboard`;

  const tryConnect = (url: string, isFallback = false) => {
    console.log(`🔌 WS conectando → ${isFallback ? '[fallback]' : '[authed]'}`);
    const socket = new WebSocket(url);

    socket.onopen = () =>
      console.log(`✅ WS conectado ${isFallback ? '(ruta legacy)' : '(ruta protegida)'}`);

    socket.onmessage = () => {
      console.log('🔄 Cambio detectado en Hornero3DX');
      onMessage();
    };

    socket.onclose = (e) => {
      // 1008 = Policy Violation (bad token on protected route) → try legacy
      // 1006 = Abnormal closure (route doesn't exist)
      if (!isFallback && (e.code === 1008 || e.code === 1006 || e.code === 1003)) {
        console.warn(`⚠️ Ruta protegida rechazada (code ${e.code}), intentando ruta legacy...`);
        tryConnect(LEGACY, true);
        return;
      }

      console.log(`❌ WS cerrado (code ${e.code}). Reintentando en 8s...`);
      retryTimer = setTimeout(() => connectSocket(onMessage), 8000);
    };

    socket.onerror = () => {
      // onerror fires before onclose; just let onclose handle the retry
    };
  };

  tryConnect(PROTECTED);
};