import type { ProductionDashboardResponse } from '../types/production';
import { openUpdateProductionModal, openNewOrderModal } from './productionModals';
import { productionService } from '../api/productionServices';
import { getUserFromToken } from '../api/authServices';

export const renderProduction = (app: HTMLDivElement, data: ProductionDashboardResponse) => {
  const { role } = getUserFromToken();
  const isAdmin = role.toLowerCase() === 'admin' || role.toLowerCase() === 'owner';

  const totalI3D = data.active_orders.reduce((acc, order) => {
    const itemsSum = order.items?.reduce((s, item) => s + (Number(item.price) || 0), 0) || 0;
    return acc + itemsSum;
  }, 0);

  let totalConsumoFDM = 0;
  let totalConsumoResina = 0;
  let totalTiempoCola = 0; // en minutos

  data.active_orders.forEach(order => {
    order.items?.forEach((item: any) => {
      const qty = item.quantity || 0;
      const done = item.done_pieces || 0;
      const remaining = Math.max(0, qty - done);

      totalTiempoCola += (Number(item.time) || 0) * remaining;

      let isResin = false;
      const machine = data.machines?.find(m => m.id === item.machine_id);
      const mType = (machine?.type || '').toLowerCase();
      if (mType.includes('resina') || mType.includes('sla') || mType.includes('sls')) {
        isResin = true;
      } else if (!machine) {
        const matName = (item.material?.name || '').toLowerCase();
        if (matName.includes('resina') || matName.includes('sla') || matName.includes('sls')) {
          isResin = true;
        }
      }

      if (isResin) {
        totalConsumoResina += (Number(item.weight) || 0) * remaining;
      } else {
        totalConsumoFDM += (Number(item.weight) || 0) * remaining;
      }
    });
  });

  const backlogHours = Math.floor(totalTiempoCola / 60);
  const backlogMins = totalTiempoCola % 60;

  app.innerHTML = `
    <div class="min-h-screen bg-[#f8fafc] font-sans text-slate-900 animate-in fade-in duration-500">
      <header class="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-[#0f172a] uppercase">Control de Producción</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Hornero 3DX • Monitoring System</p>
        </div>
        <div class="flex gap-3">
          <button id="btn-go-stock" class="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
            📦 Stock
          </button>
          <button id="btn-open-history" ${!isAdmin ? 'disabled' : ''} class="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}">
            📋 Historial
          </button>
          <button id="btn-open-config" ${!isAdmin ? 'disabled' : ''} class="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}">
            ⚙️ Configuración
          </button>
          ${isAdmin ? `
          <button id="btn-create-user" class="flex items-center gap-2 px-5 py-2.5 border border-emerald-200 bg-emerald-50 rounded-2xl font-black text-[10px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-100 transition-all">
            👤 Nuevo Usuario
          </button>
          ` : ''}
          <button id="btn-new-order" class="flex items-center gap-2 px-6 py-2.5 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all">
            ➕ Nueva Orden
          </button>
          <button id="btn-logout" class="flex items-center gap-2 px-5 py-2.5 border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-50 transition-all ml-2">
            🚪 Salir
          </button>
        </div>
      </header>

      <main class="p-8 max-w-7xl mx-auto space-y-8">

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div class="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-3">
              <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-tight">Total<br>Generado</span>
              <div class="p-2 bg-blue-50 rounded-lg text-blue-500 text-xs">💰</div>
            </div>
            <h2 class="text-2xl font-black text-[#0f172a]">${isAdmin ? `$${totalI3D.toLocaleString()}` : '••••'}</h2>
          </div>

          <div class="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
            <div class="flex justify-between items-start mb-3">
              <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-tight">Consumo<br>Estimado</span>
              <div class="p-2 bg-emerald-50 rounded-lg text-emerald-500 text-xs">⚖️</div>
            </div>
            <div class="flex flex-col gap-1">
              <p class="text-lg font-black text-[#0f172a] leading-none">${(totalConsumoFDM / 1000).toFixed(2)} <span class="text-[10px] text-slate-400">kg (FDM)</span></p>
              <p class="text-lg font-black text-[#0f172a] leading-none">${(totalConsumoResina / 1000).toFixed(2)} <span class="text-[10px] text-slate-400">L (Resina)</span></p>
            </div>
          </div>

          <div class="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
            <div class="flex justify-between items-start mb-3">
              <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-tight">Tiempo<br>en Cola</span>
              <div class="p-2 bg-indigo-50 rounded-lg text-indigo-500 text-xs">⏱️</div>
            </div>
            <h2 class="text-2xl font-black text-[#0f172a]">${backlogHours}<span class="text-xs text-slate-400 font-bold ml-1">h</span> ${backlogMins}<span class="text-xs text-slate-400 font-bold ml-1">m</span></h2>
            <p class="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Backlog de impresión</p>
          </div>

          <div class="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
            <div class="flex justify-between items-start mb-3">
              <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-tight">Trabajos<br>Activos</span>
              <div class="p-2 bg-amber-50 rounded-lg text-amber-500 text-xs">▶️</div>
            </div>
            <h2 class="text-2xl font-black text-[#0f172a]">${data.active_jobs}</h2>
            <p class="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Impresoras en uso</p>
          </div>

          <div class="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
            <div class="flex justify-between items-start mb-3">
              <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-tight">Capacidad<br>Ociosa</span>
              <div class="p-2 bg-slate-50 rounded-lg text-slate-400 text-xs">📊</div>
            </div>
            <div class="flex items-baseline gap-1">
              <h2 class="text-2xl font-black text-[#0f172a]">${(100 - Number(data.utilization_rate || 0)).toFixed(1)}%</h2>
              <span class="text-[9px] font-bold text-slate-300 uppercase">Libre</span>
            </div>
            <div class="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
              <div class="bg-[#0f172a] h-full transition-all duration-1000" style="width: ${data.utilization_rate}%"></div>
            </div>
          </div>
        </div>

        <!-- Orders -->
        <div class="space-y-8">
          ${data.active_orders.length > 0 ? data.active_orders.map((order, index) => {
            const progress = order.total_pieces > 0 ? Math.round((order.done_pieces / order.total_pieces) * 100) : 0;

            const formatDate = (dateStr: string) => {
              const d = new Date(dateStr);
              return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' +
                d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            };

            const creationDate  = formatDate(order.created_at);
            const deadlineDate  = order.deadline ? formatDate(order.deadline) : 'Sin definir';
            const isOverdue     = order.deadline && new Date(order.deadline) < new Date();
            const isReady       = order.status === 'ready' || order.done_pieces >= order.total_pieces;
            const orderNum      = order.id_order ?? order.id;

            const priorityClass = order.priority === 'P1'
              ? 'bg-red-100 text-red-600'
              : order.priority === 'P2'
              ? 'bg-amber-100 text-amber-600'
              : 'bg-slate-100 text-slate-500';

            const statusClass = order.status === 'completed'
              ? 'bg-emerald-100 text-emerald-600'
              : order.status === 'in-progress' || order.status === 'printing'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-slate-100 text-slate-500';

            return `
              <div class="bg-white rounded-[40px] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-slate-300 transition-all duration-300 overflow-hidden">

                <!-- Card Header -->
                <div class="px-10 pt-10 pb-6 flex justify-between items-start border-b border-slate-50">
                  <div>
                    <div class="flex items-center gap-4 mb-3">
                      <h3 class="text-3xl font-black tracking-tighter text-[#0f172a]">Orden #${orderNum}</h3>
                      <span class="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${priorityClass}">${order.priority}</span>
                      <span class="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusClass}">${order.status}</span>
                    </div>
                    <div class="flex items-center gap-6">
                      <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        📅 Ingreso: <span class="text-slate-600 font-black">${creationDate}</span>
                      </span>
                      <span class="text-[11px] font-black uppercase tracking-wide ${isOverdue ? 'text-red-500' : 'text-orange-500'}">
                        ⏰ Deadline: ${deadlineDate}
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em] mb-1">Cliente</p>
                    <p class="text-2xl font-black text-[#0f172a] tracking-tight">${order.client_name}</p>
                  </div>
                </div>

                <!-- Items Table -->
                <div class="mx-6 my-6 overflow-hidden rounded-3xl border border-slate-100">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-slate-50/80 border-b border-slate-100">
                        <th class="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Pieza / STL</th>
                        <th class="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Material</th>
                        <th class="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Máquina</th>
                        <th class="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Progreso</th>
                        <th class="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Cant.</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                      ${order.items && order.items.length > 0 ? order.items.map(item => {
                        const iMat = (item as any).material?.name
                          || ((item as any).material_id ? `#${(item as any).material_id}` : null);
                        const iMac = (item as any).machine?.name
                          || ((item as any).machine_id
                            ? (data.machines?.find((m: any) => m.id === (item as any).machine_id)?.name || `#${(item as any).machine_id}`)
                            : null);
                        const iPct = item.quantity > 0 ? Math.round((item.done_pieces / item.quantity) * 100) : 0;
                        return `
                        <tr class="hover:bg-slate-50/60 transition-colors">
                          <td class="px-6 py-5 font-black text-slate-800 text-sm">${item.product_name || '—'}</td>
                          <td class="px-6 py-5">
                            ${iMat
                              ? `<span class="bg-blue-50 text-blue-700 text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wide">${iMat}</span>`
                              : `<span class="text-slate-200 font-black text-xs">—</span>`}
                          </td>
                          <td class="px-6 py-5">
                            ${iMac
                              ? `<span class="bg-indigo-50 text-indigo-700 text-[9px] font-black px-3 py-1.5 rounded-xl">${iMac}</span>`
                              : `<span class="text-slate-200 font-black text-xs">—</span>`}
                          </td>
                          <td class="px-6 py-5">
                            <div class="flex items-center justify-center gap-3">
                              <span class="text-xs font-black text-slate-400 min-w-[52px]">${item.done_pieces} / ${item.quantity}</span>
                              <div class="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div class="${iPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'} h-full rounded-full transition-all duration-700" style="width:${iPct}%"></div>
                              </div>
                              <span class="text-[10px] font-black text-slate-400 w-8">${iPct}%</span>
                            </div>
                          </td>
                          <td class="px-6 py-5 text-right font-black text-slate-900 text-sm">${item.quantity}</td>
                        </tr>`;
                      }).join('') : '<tr><td colspan="5" class="px-6 py-10 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">Sin piezas registradas</td></tr>'}
                    </tbody>
                  </table>
                </div>

                <!-- Notes (only if present) -->
                ${order.notes ? `
                <div class="mx-6 mb-6 bg-slate-50/70 px-6 py-4 rounded-2xl border border-slate-100">
                  <p class="text-xs text-slate-500 font-semibold italic leading-relaxed">"${order.notes}"</p>
                </div>` : ''}

                <!-- Footer: Progress + Actions -->
                <div class="px-10 pb-10">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                      <span class="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Progreso Total</span>
                      <span class="text-[10px] font-bold text-slate-400">${order.done_pieces} / ${order.total_pieces} piezas</span>
                    </div>
                    <span class="text-2xl font-black ${progress >= 100 ? 'text-emerald-500' : progress > 50 ? 'text-blue-600' : 'text-[#0f172a]'}">${progress}%</span>
                  </div>
                  <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-8">
                    <div class="h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}" style="width:${progress}%"></div>
                  </div>

                  <div class="flex justify-end gap-3">
                    <button class="btn-cancel-order border border-slate-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-200 hover:text-red-500'}"
                            data-id="${order.id}" data-order-num="${orderNum}" ${!isAdmin ? 'disabled' : ''}>
                      ✕ Cancelar
                    </button>
                    ${isReady ? `
                      <button class="btn-finalize-order bg-emerald-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all animate-pulse"
                              data-id="${order.id}" data-order-num="${orderNum}">
                        ✅ Finalizar Orden
                      </button>
                    ` : `
                      <button class="btn-update-production bg-[#0f172a] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-slate-200 transition-all"
                              data-index="${index}">
                        📝 Actualizar Producción
                      </button>
                    `}
                  </div>
                </div>
              </div>
            `;
          }).join('') : `
            <div class="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-300">
              <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay órdenes de producción activas</p>
            </div>
          `}
        </div>
      </main>
    </div>
  `;

  // ── Listeners ──────────────────────────────────────────────────────────────

  app.querySelector('#btn-new-order')?.addEventListener('click', async () => {
    try { await openNewOrderModal(); }
    catch (error) { console.error('Error al abrir el modal de creación:', error); }
  });

  app.querySelectorAll('.btn-update-production').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const index = Number(target.dataset.index);
      openUpdateProductionModal(data.active_orders[index]);
    });
  });

  app.querySelectorAll('.btn-cancel-order').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const orderId = Number(target.dataset.id);
      if (confirm(`¿Estás seguro de que querés borrar la Orden #${(target as any).dataset.orderNum || orderId}?`)) {
        try {
          target.disabled = true;
          target.innerText = 'Eliminando...';
          await productionService.deleteOrder(orderId);
          const freshData = await productionService.getProductionDashboard();
          renderProduction(app, freshData);
        } catch {
          alert('Error al eliminar la orden');
          target.disabled = false;
          target.innerText = '✕ Cancelar';
        }
      }
    });
  });

  app.querySelectorAll('.btn-finalize-order').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const orderId = Number(target.dataset.id);
      if (confirm(`¿Confirmás que la Orden #${(target as any).dataset.orderNum || orderId} está lista para ser retirada?`)) {
        try {
          target.disabled = true;
          target.innerText = 'Finalizando...';
          await productionService.updateOrder(orderId, { status: 'completed' });
          const freshData = await productionService.getProductionDashboard();
          renderProduction(app, freshData);
        } catch {
          alert('Error al finalizar la orden');
          target.disabled = false;
          target.innerHTML = '✅ Finalizar Orden';
        }
      }
    });
  });

  app.querySelector('#btn-open-config')?.addEventListener('click', async () => {
    try {
      const { renderConfig } = await import('./configView');
      renderConfig(app);
    } catch (error) { console.error('Error al cargar la configuración:', error); }
  });

  if (isAdmin) {
    app.querySelector('#btn-create-user')?.addEventListener('click', async () => {
      try {
        const { openUserModal } = await import('./configModals');
        openUserModal(app);
      } catch (error) { console.error('Error al abrir modal de usuario:', error); }
    });
  }

  app.querySelector('#btn-open-history')?.addEventListener('click', async () => {
    const { renderHistory } = await import('./historyView');
    renderHistory(app);
  });

  app.querySelector('#btn-go-stock')?.addEventListener('click', async () => {
    const { renderDashboard } = await import('./dashboardView');
    const { stockService } = await import('../api/stockServices');
    const stockData = await stockService.getDashboard();
    renderDashboard(stockData, app);
  });

  app.querySelector('#btn-logout')?.addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) {
      localStorage.removeItem('token');
      window.location.reload();
    }
  });
};
