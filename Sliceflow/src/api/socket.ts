const WS_URL = import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws');

export const connectSocket = (onMessage: () => void) => {
  // WebSocket is now on a protected route — pass JWT as query param
  // (browsers don't support custom headers on WebSocket upgrades)
  const token = localStorage.getItem('token');
  const url = `${WS_URL}/hornero/authed/ws/dashboard${token ? `?token=${token}` : ''}`;

  const socket = new WebSocket(url);

  socket.onopen = () => console.log('✅ Conectado al radar de Hornero3DX');

  socket.onmessage = () => {
    console.log('🔄 Cambio detectado...');
    onMessage();
  };

  socket.onclose = (e) => {
    // 1008 = policy violation (auth failed) — don't retry endlessly
    if (e.code === 1008) {
      console.warn('❌ WebSocket rechazado: token inválido o ausente.');
      return;
    }
    console.log('❌ Conexión cerrada. Reintentando en 5s...');
    setTimeout(() => connectSocket(onMessage), 5000);
  };

  socket.onerror = (err) => console.error('WebSocket error:', err);
};