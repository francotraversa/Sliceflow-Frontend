import { stockService } from '../api/stockServices';
import { renderProducts } from './productsView';
import { authService, getUserFromToken } from '../api/authServices';
import { renderMovements } from './movementsView';
import { renderProduction } from './productionView';
import { productionService } from '../api/productionServices';
import { renderUsers } from './userView';
const { user, role } = getUserFromToken();

const renderStatCard = (title: string, value: any, subtitle: string, icon: string, color: string) => `
  <div class="bg-white rounded-[28px] p-8 shadow-lg border border-slate-100 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
    <div class="absolute bottom-0 left-0 w-full h-1.5 opacity-40 transition-opacity group-hover:opacity-100" style="background-color: ${color}"></div>
    <div class="flex justify-between items-start mb-6">
      <p class="text-slate-400 text-[11px] uppercase tracking-[0.15em] font-black">${title}</p>
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style="background-color: ${color}15">${icon}</div>
    </div>
    <p class="text-5xl font-black mb-2 tracking-tighter text-nowrap" style="color: ${color}">${value}</p>
    <p class="text-[11px] text-slate-400 font-bold uppercase tracking-tight">${subtitle}</p>
  </div>`;

export const renderDashboard = (data: any, app: HTMLDivElement) => {
  app.innerHTML = `
    <div class="min-h-screen bg-[#f0f4f8] font-sans text-[#1e293b]">
      <header class="bg-white border-b-2 border-[#4391d4]/20 px-8 py-4 flex justify-between items-center shadow-md">
  <div class="flex items-center gap-4">
    <div class="bg-[#4391d4] p-2 rounded-xl shadow-lg shadow-[#4391d4]/30">
      <img src="/logo.png" alt="Logo" class="w-8 h-8 object-contain invert">
    </div>
    <div>
      <h1 class="font-black text-2xl leading-none tracking-tight text-[#0f172a]">Hornero3DX</h1>
      <p class="text-[11px] text-[#4391d4] uppercase tracking-[0.2em] font-black mt-1">Control de Stock</p>
    </div>
  </div>

<div class="flex items-center gap-4">
  <div class="text-right leading-tight">
    <div class="text-[12px] font-black text-[#0f172a]">${user}</div>
    <div class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">${role}</div>
  </div>

  ${role.toLowerCase() === 'admin' ? `
    <button id="btn-open-users" 
      class="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
      Usuarios
    </button>
  ` : ''}

  <button id="btn-i3d"
    class="px-5 py-2 bg-[#4391d4] text-white rounded-xl text-sm font-black hover:bg-[#367eb8] transition-all shadow-lg">
    I3D
  </button>

  <button id="logout-btn"
    class="px-6 py-2 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg">
    Salir
  </button>
</div>
</header>

      <nav class="px-8 mt-8">
        <div class="flex gap-3 bg-white p-2 rounded-2xl w-fit shadow-sm border border-slate-200">
          <button class="px-10 py-2.5 bg-[#4391d4] text-white shadow-md rounded-xl text-sm font-black transition-all">Dashboard</button>
          <button id="nav-products" class="px-10 py-2.5 text-slate-500 hover:text-[#4391d4] text-sm font-bold hover:bg-blue-50 rounded-xl transition-all">Productos</button>
          <button id="nav-movements" class="px-10 py-2.5 text-slate-500 hover:text-[#4391d4] text-sm font-bold hover:bg-blue-50 rounded-xl transition-all">Movimientos</button>
          </div>
      </nav>

      <main class="p-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          ${renderStatCard("Total Productos", data.total_items || 0, "Items activos", "📦", "#4391d4")}
          ${renderStatCard(
              "Valor Total Stock", 
              role.toLowerCase() === 'admin' ? `$ ${data.total_value || 0}` : "••••••", 
              role.toLowerCase() === 'admin' ? "Capital en USD" : "Acceso Restringido", 
              "U$D", 
              "#4391d4"
            )}
          ${renderStatCard("Alertas Críticas", data.low_stock_count || 0, "Requieren atención", "⚠️", "#ef4444")}
          ${renderStatCard("Movimientos Hoy", data.movements_today || 0, "Flujo del día", "📊", "#4391d4")}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div class="bg-white border-t-4 border-[#ef4444] rounded-[32px] p-10 shadow-xl flex flex-col">
            <div class="flex justify-between items-center mb-8">
              <h3 class="text-3xl font-black text-[#0f172a]">Stock Bajo</h3>
              <span class="bg-red-100 text-red-600 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-tighter">${data.low_stock_count || 0} ALERTAS</span>
            </div>
            <div class="flex flex-col gap-4 overflow-y-auto max-h-[400px]">
              ${data.low_stock_items && data.low_stock_items.length > 0 
                ? data.low_stock_items.map((item: any) => `
                    <div class="flex items-center justify-between p-6 bg-red-50/40 rounded-2xl border border-red-100/50 shadow-sm group">
                      <div class="flex items-center gap-5">
                        <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm"><span class="text-xl">⚠️</span></div>
                        <div><p class="text-base font-black text-[#0f172a]">${item.name}</p></div>
                      </div>
                      <div class="flex flex-col items-end"><span class="text-2xl font-black text-red-600">${item.quantity}</span></div>
                    </div>`).join('') 
                : `<div class="py-20 text-center opacity-20"><p class="text-sm font-black uppercase tracking-widest text-slate-400">Sincronización OK</p></div>`}
            </div>
          </div>
          <div class="bg-white border-t-4 border-[#4391d4] rounded-[32px] p-10 shadow-xl flex flex-col justify-between text-center">
            <h3 class="text-3xl font-black text-[#0f172a] mb-12 text-left">Resumen Operativo</h3>
            <div class="grid grid-cols-2 gap-6">
              <div class="bg-blue-50/50 rounded-2xl p-8 border border-blue-100/50 text-center">
                <p class="text-5xl font-black text-[#4391d4] mb-2">${data.total_items || 0}</p>
                <p class="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Productos</p>
              </div>
              <div class="bg-red-50/50 rounded-2xl p-8 border border-red-100/50 text-center">
                <p class="text-5xl font-black text-[#ef4444] mb-2">${data.low_stock_count || 0}</p>
                <p class="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">Alertas</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>`;

  document.getElementById('logout-btn')?.addEventListener('click', () => { authService.logout(); window.location.reload(); });
  document.getElementById('nav-products')?.addEventListener('click', async () => {
    app.innerHTML = `<div class="min-h-screen bg-[#f0f4f8] flex items-center justify-center animate-pulse text-[#4391d4] font-black">CARGANDO PRODUCTOS...</div>`;
    const products = await stockService.getProducts();
    renderProducts(products, app);
  });
  document.getElementById('btn-nav-movements')?.addEventListener('click', async () => {
  const movements = await stockService.getMovements();
  renderMovements(movements, app);
  });
  document.getElementById('btn-i3d')?.addEventListener('click', async () => {
    try {
      const productionData = await productionService.getProductionDashboard();
      renderProduction(app, productionData);
    } catch (error) {
      console.error("Error al cargar el panel de producción:", error);
      alert("No se pudo conectar con el radar de producción.");
    }
  });
  document.getElementById('logout-btn')?.addEventListener('click', () => {
  authService.logout();
  });

  document.getElementById('nav-movements')?.addEventListener('click', async () => {
    app.innerHTML = `<div class="flex h-screen items-center justify-center font-black text-[#4391d4] animate-pulse text-2xl">CARGANDO MOVIMIENTOS...</div>`;
    
    try {
        const movements = await stockService.getMovements();
        renderMovements(movements, app);
    } catch (err) {
        alert("Error al cargar los movimientos. Revisá la consola.");
        console.error(err);
        const products = await stockService.getProducts();
        renderProducts(products, app);
    }
  });
  app.querySelector('#btn-open-users')?.addEventListener('click', async () => {
    try {
      console.log("Navegando a la gestión de usuarios...");
      renderUsers(app); 
    } catch (error) {
      console.error("Error al cargar el módulo de usuarios:", error);
    }
  });
};
