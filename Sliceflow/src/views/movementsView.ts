import { stockService } from '../api/stockServices';
import { renderDashboard } from './dashboardView';
import { renderProducts } from './productsView';
import type { Product, StockMovement } from '../types/stock';

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};

const labelTipo = (t: string) => {
  if (['IN', 'RETURN'].includes(t)) return 'Ingreso';
  if (['OUT', 'LOSS', 'SCRAP'].includes(t)) return 'Egreso';
  if (t === 'ADJUST') return 'Ajuste';
  return t;
};

const pillTipo = (t: string) => {
  if (['IN', 'RETURN'].includes(t)) return 'bg-green-100 text-green-700';
  if (['OUT', 'LOSS', 'SCRAP'].includes(t)) return 'bg-red-100 text-red-700';
  if (t === 'ADJUST') return 'bg-yellow-100 text-yellow-700';
  return 'bg-slate-100 text-slate-700';
};

const deltaClass = (d: number) => (d >= 0 ? 'text-green-600' : 'text-red-600');
const deltaText = (d: number) => (d >= 0 ? `+${d}` : `${d}`);

// -------------------------------
// VISTA: HISTÓRICOS
// -------------------------------
export const renderMovements = async (movements: StockMovement[], app: HTMLDivElement) => {
  let products: Product[] = [];
  try {
    products = await stockService.getProducts();
  } catch {}

  const productMap = new Map(products.map(p => [p.sku, p]));

  app.innerHTML = `
    <div class="min-h-screen bg-[#f0f4f8] font-sans text-[#1e293b]">
      <header class="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div class="flex items-center gap-3">
          <div class="bg-[#4391d4] p-2 rounded-lg shadow-md">
            <img src="/logo.png" alt="Logo" class="w-6 h-6 object-contain invert">
          </div>
          <h1 class="font-black text-xl text-[#0f172a]">Hornero3DX</h1>
        </div>
        <button id="logout-btn" class="px-6 py-2 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg">Salir</button>
      </header>

      <nav class="px-8 mt-8 text-left">
  <div class="flex gap-3 bg-white p-2 rounded-2xl w-fit shadow-sm border border-slate-200">
    <button id="nav-dashboard"
      class="px-10 py-2.5 text-slate-500 hover:text-[#4391d4] text-sm font-bold hover:bg-blue-50 rounded-xl transition-all">
      Dashboard
    </button>

    <button id="nav-products"
      class="px-10 py-2.5 text-slate-500 hover:text-[#4391d4] text-sm font-bold hover:bg-blue-50 rounded-xl transition-all">
      Productos
    </button>

    <button
      class="px-10 py-2.5 bg-[#4391d4] text-white shadow-md rounded-xl text-sm font-black transition-all">
      Movimientos
    </button>
  </div>
</nav>

      <main class="p-8 max-w-7xl mx-auto">
        <div class="bg-white rounded-[24px] shadow-sm border border-slate-200 p-8">
          <div class="mb-6">
            <h2 class="text-2xl font-black text-[#0f172a]">Movimientos de Stock</h2>
            <p class="text-slate-500 text-sm">Histórico de cambios de stock (se generan al mover stock).</p>
          </div>

          <div class="flex flex-wrap gap-3 items-center mb-6">
            <div class="flex-1 min-w-[320px] relative">
              <span class="absolute left-4 top-3.5 text-slate-400">🔎</span>
              <input id="mov-search" type="text" placeholder="Buscar por producto o motivo..."
                class="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-[#4391d4]/10 transition-all">
            </div>

            <select id="mov-type"
              class="min-w-[180px] px-4 py-3 border border-slate-200 rounded-xl bg-white font-bold text-slate-700 outline-none">
              <option value="">Todos los tipos</option>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
              <option value="ADJUST">ADJUST</option>
              <option value="RETURN">RETURN</option>
              <option value="LOSS">LOSS</option>
              <option value="SCRAP">SCRAP</option>
            </select>

            <input id="start-date" type="date"
              class="px-4 py-3 border border-slate-200 rounded-xl bg-white font-bold text-slate-700 outline-none">
            <input id="end-date" type="date"
              class="px-4 py-3 border border-slate-200 rounded-xl bg-white font-bold text-slate-700 outline-none">

            <button id="btn-apply" type="button"
              class="bg-white border border-slate-200 px-6 py-3 rounded-xl font-black hover:bg-slate-50 uppercase text-[11px] tracking-widest">
              Aplicar
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[12px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                  <th class="px-6 py-4">Fecha/Hora</th>
                  <th class="px-6 py-4">Producto</th>
                  <th class="px-6 py-4">Tipo</th>

                  <th class="px-6 py-4 text-center">Antes</th>
                  <th class="px-6 py-4 text-center">Cambio</th>
                  <th class="px-6 py-4 text-center">Después</th>

                  <th class="px-6 py-4">Motivo</th>
                  <th class="px-6 py-4">Usuario</th>
                  <th class="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody id="mov-body" class="divide-y divide-slate-50"></tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;

  const body = document.getElementById('mov-body') as HTMLTableSectionElement;
  const searchInput = document.getElementById('mov-search') as HTMLInputElement;
  const typeSelect = document.getElementById('mov-type') as HTMLSelectElement;
  const startDate = document.getElementById('start-date') as HTMLInputElement;
  const endDate = document.getElementById('end-date') as HTMLInputElement;

  let state = movements || [];

  const draw = () => {
    const term = (searchInput.value || '').toLowerCase().trim();

    const filtered = state.filter(m => {
      const p = productMap.get(m.stock_sku);
      const productName = (p?.name || m.stock_sku).toLowerCase();
      const reason = (m.reason || '').toLowerCase();
      return !term || productName.includes(term) || reason.includes(term) || m.stock_sku.toLowerCase().includes(term);
    });

    body.innerHTML = filtered.map(m => {
      const p = productMap.get(m.stock_sku);
      const productName = p?.name || m.stock_sku;

      const estado = (p && m.qty_after <= (p.min_qty ?? 0)) ? 'Crítico' : 'Normal';
      const estadoClass = estado === 'Crítico'
        ? 'bg-red-100 text-red-700'
        : 'bg-slate-900 text-white';

      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-6 py-4 font-bold text-slate-700">${formatDateTime(m.created_at)}</td>
          <td class="px-6 py-4 font-black text-[#0f172a]">${productName}</td>

          <td class="px-6 py-4">
            <span class="inline-flex items-center gap-2">
              <span class="text-lg">${['IN','RETURN'].includes(m.type) ? '↑' : ['OUT','LOSS','SCRAP'].includes(m.type) ? '↓' : '↔'}</span>
              <span class="px-3 py-1 rounded-full text-[11px] font-black ${pillTipo(m.type)}">
                ${labelTipo(m.type)}
              </span>
            </span>
          </td>

          <td class="px-6 py-4 text-center font-black text-slate-700">${m.qty_before}</td>
          <td class="px-6 py-4 text-center font-black ${deltaClass(m.qty_delta)}">${deltaText(m.qty_delta)}</td>
          <td class="px-6 py-4 text-center font-black text-slate-700">${m.qty_after}</td>

          <td class="px-6 py-4 font-bold text-slate-700">${m.reason || '-'}</td>
          <td class="px-6 py-4 font-bold text-slate-700">User #${m.created_by}</td>

          <td class="px-6 py-4 text-center">
            <span class="px-3 py-1 rounded-full text-[11px] font-black ${estadoClass}">
              ${estado}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  };

  const reload = async () => {
    const filter = {
      type: typeSelect.value || undefined,
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined,
    };

    state = await stockService.getMovements(filter);
    draw();
  };

  draw();

  searchInput.addEventListener('input', draw);
  document.getElementById('btn-apply')?.addEventListener('click', reload);

  document.getElementById('nav-dashboard')?.addEventListener('click', async () => {
    const data = await stockService.getDashboard();
    renderDashboard(data, app);
  });

  document.getElementById('nav-products')?.addEventListener('click', async () => {
    const prods = await stockService.getProducts();
    renderProducts(prods, app);
  });
};
