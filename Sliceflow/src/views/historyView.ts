import { productionService } from '../api/productionServices';

export const renderHistory = async (app: HTMLDivElement) => {
  // Traemos todas las órdenes (asegurá que tu endpoint en Go soporte 'all' o similar)
  let allOrders = await productionService.getHistoricalOrders();

  app.innerHTML = `
    <div class="min-h-screen bg-[#f8fafc] p-8 animate-in fade-in duration-500">
      <header class="max-w-7xl mx-auto mb-10 flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-black text-[#0f172a] uppercase tracking-tighter">Historial de Órdenes</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Reportes y Auditoría • Hornero 3DX</p>
        </div>
        <button id="btn-back-home" class="px-6 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-all">← Volver</button>
      </header>

      <nav class="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
        <div>
          <label class="text-[9px] font-black uppercase text-slate-400 ml-2 mb-2 block">Número de Orden</label>
          <input type="number" id="filter-id" placeholder="Ej: 2024" class="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20">
        </div>
        <div>
          <label class="text-[9px] font-black uppercase text-slate-400 ml-2 mb-2 block">Empresa / Cliente</label>
          <input type="text" id="filter-client" placeholder="Buscar cliente..." class="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20">
        </div>
        <div>
          <label class="text-[9px] font-black uppercase text-slate-400 ml-2 mb-2 block">Desde</label>
          <input type="date" id="filter-date-from" class="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold outline-none">
        </div>
        <div>
          <label class="text-[9px] font-black uppercase text-slate-400 ml-2 mb-2 block">Hasta</label>
          <input type="date" id="filter-date-to" class="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold outline-none">
        </div>
      </nav>

      <div class="max-w-7xl mx-auto bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">ID</th>
              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Cliente</th>
              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Fecha</th>
              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Estado</th>
              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-right">Precio</th>
            </tr>
          </thead>
          <tbody id="history-table-body" class="divide-y divide-slate-50">
            </tbody>
        </table>
      </div>
    </div>
  `;

  const tableBody = app.querySelector('#history-table-body')!;
  
  const updateTable = () => {
    const filterId = (app.querySelector('#filter-id') as HTMLInputElement).value;
    const filterClient = (app.querySelector('#filter-client') as HTMLInputElement).value.toLowerCase();
    const filterFrom = (app.querySelector('#filter-date-from') as HTMLInputElement).value;
    const filterTo = (app.querySelector('#filter-date-to') as HTMLInputElement).value;

    const filtered = allOrders.filter((o: any) => {
      const matchId = filterId ? o.id.toString().includes(filterId) : true;
      const matchClient = filterClient ? o.client_name.toLowerCase().includes(filterClient) : true;
      
      // Lógica de fechas
      const orderDate = o.created_at.split('T')[0]; // YYYY-MM-DD
      const matchFrom = filterFrom ? orderDate >= filterFrom : true;
      const matchTo = filterTo ? orderDate <= filterTo : true;

      return matchId && matchClient && matchFrom && matchTo;
    });

    tableBody.innerHTML = filtered.map((o: any) => `
      <tr class="hover:bg-slate-50/50 transition-colors">
        <td class="px-8 py-4 font-black text-slate-700">#${o.id}</td>
        <td class="px-8 py-4 font-bold text-slate-600">${o.client_name}</td>
        <td class="px-8 py-4 text-xs font-bold text-slate-400">${new Date(o.created_at).toLocaleDateString()}</td>
        <td class="px-8 py-4">
          <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}">
            ${o.status}
          </span>
        </td>
        <td class="px-8 py-4 text-right font-black text-slate-900">$${(o.price || 0).toLocaleString()}</td>
      </tr>
    `).join('');
  };

  // Listeners de filtros
  ['filter-id', 'filter-client', 'filter-date-from', 'filter-date-to'].forEach(id => {
    app.querySelector(`#${id}`)?.addEventListener('input', updateTable);
  });

  // Botón Volver
  app.querySelector('#btn-back-home')?.addEventListener('click', async () => {
    const { renderProduction } = await import('./productionView');
    const data = await productionService.getProductionDashboard();
    renderProduction(app, data);
  });

  updateTable(); // Carga inicial
};