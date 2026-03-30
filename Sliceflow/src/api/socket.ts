const WS_URL = import.meta.env.VITE_API_BASE_URL.replace('http', 'ws');

export const connectSocket = (onMessage: () => void) => {
  const socket = new WebSocket(`${WS_URL}/hornero/ws/dashboard`);

  socket.onopen = () => console.log("✅ Conectado al radar de Hornero3DX");

  socket.onmessage = () => {
    console.log("🔄 Cambio detectado en el stock...");
    onMessage();
  };

  socket.onclose = () => {
    console.log("❌ Conexión cerrada. Reintentando en 5s...");
    setTimeout(() => connectSocket(onMessage), 5000);
  };
};