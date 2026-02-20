import type { ProductionDashboardResponse } from '../types/production';
import { openUpdateProductionModal, openNewOrderModal } from './productionModals';
import { productionService } from '../api/productionServices';
import { getUserFromToken } from '../api/authServices';

export const renderProduction = (app: HTMLDivElement, data: ProductionDashboardResponse) => {
  const { role } = getUserFromToken();
  const isAdmin = role.toLowerCase() === 'admin';
  app.innerHTML = `
      </header>
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

          <button id="btn-open-history" class="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
            📋 Historial
          </button>

          <button id="btn-open-config" class="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
            ⚙️ Configuración
          </button>

          <button id="btn-new-order" class="flex items-center gap-2 px-6 py-2.5 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all">
            ➕ Nueva Orden
          </button>

          <button id="btn-logout" class="flex items-center gap-2 px-5 py-2.5 border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-50 transition-all ml-2">
            🚪 Salir
          </button>
        </div>
      </header>

      <main class="p-8 max-w-7xl mx-auto space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-4">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Generado por I3D</span>
              <div class="p-2 bg-blue-50 rounded-lg text-blue-500 text-xs">🖨️</div>
            </div>
            <h2 class="text-3xl font-black text-[#0f172a]">${isAdmin ? `$${(data.revenue_fdm || 0).toLocaleString()}` : "••••••"}</h2>
          </div>

          <div class="bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm">
            <div class="flex justify-between items-start mb-4">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest">SLS - Total Generado</span>
              <div class="p-2 bg-purple-50 rounded-lg text-purple-500 text-xs">🖨️</div>
            </div>
            <h2 class="text-3xl font-black text-[#0f172a]">${isAdmin ? `$${(data.revenue_sls || 0).toLocaleString()}` : "••••••"}</h2>
          </div>

          <div class="bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm">
            <div class="flex justify-between items-start mb-4">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Trabajos Activos</span>
              <div class="p-2 bg-amber-50 rounded-lg text-amber-500 text-xs">▶️</div>
            </div>
            <h2 class="text-3xl font-black text-[#0f172a]">${data.active_jobs}</h2>
            <p class="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Impresoras en uso</p>
          </div>

          <div class="bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm">
            <div class="flex justify-between items-start mb-4">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Capacidad Ociosa</span>
              <div class="p-2 bg-slate-50 rounded-lg text-slate-400 text-xs">📊</div>
            </div>
            <h2 class="text-3xl font-black text-[#0f172a]">${data.utilization_rate}%</h2>
            <div class="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div class="bg-[#0f172a] h-full transition-all duration-1000" style="width: ${data.utilization_rate}%"></div>
            </div>
          </div>
        </div>

        <div class="space-y-12">
          ${data.active_orders.length > 0 ? data.active_orders.map((order, index) => {
            const progress = order.total_pieces > 0 ? Math.round((order.done_pieces / order.total_pieces) * 100) : 0;
            
            const formatDate = (dateStr: string) => {
                const date = new Date(dateStr);
                return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + 
                       date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            };

            const creationDate = formatDate(order.created_at);
            const deadlineDate = order.deadline ? formatDate(order.deadline) : 'Sin definir';

            const materialName = (order.material && typeof order.material === 'object') 
              ? (order.material as any).name 
              : 'S/M';
            const isReady = order.status === 'ready' || order.done_pieces >= order.total_pieces;

            return `
              <div class="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300">
                <div class="flex justify-between items-start mb-6">
                  <div class="flex items-center gap-5">
                    <h3 class="text-2xl font-black tracking-tighter text-[#0f172a]">Orden #${order.id}</h3>
                    <div class="flex gap-2">
                      <span class="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">${order.priority}</span>
                      <span class="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">${order.status}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Cliente</p>
                    <p class="text-lg font-black text-slate-700">${order.client_name}</p>
                  </div>
                </div>

                <div class="mb-8 overflow-hidden rounded-3xl border border-slate-100">
                  <table class="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr class="bg-slate-50 border-b border-slate-100">
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pieza / STL</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Progreso</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                      ${order.items && order.items.length > 0 ? order.items.map(item => `
                        <tr>
                          <td class="px-6 py-4 font-bold text-slate-700">${item.product_name}</td>
                          <td class="px-6 py-4">
                            <div class="flex items-center justify-center gap-3">
                               <span class="text-[11px] font-black text-slate-400 min-w-[45px]">${item.done_pieces} / ${item.quantity}</span>
                               <div class="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div class="bg-blue-500 h-full" style="width: ${(item.done_pieces / item.quantity) * 100}%"></div>
                               </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 text-right font-black text-slate-900">${item.quantity} pcs</td>
                        </tr>
                      `).join('') : '<tr><td colspan="3" class="px-6 py-4 text-center text-slate-400">Sin items registrados</td></tr>'}
                    </tbody>
                  </table>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-10 mb-8 px-2">
                  <div>
                    <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Material</p>
                    <p class="text-lg font-black text-[#0f172a] uppercase">${materialName}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Máquina</p>
                    <p class="text-lg font-black text-[#0f172a]">${order.machine_id || 'S/A'}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Ingreso</p>
                    <p class="text-lg font-black text-slate-500">${creationDate}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-2">Deadline</p>
                    <p class="text-lg font-black text-orange-600">${deadlineDate}</p>
                  </div>
                </div>

                <div class="bg-slate-50 p-5 rounded-3xl mb-8 border border-slate-100">
                   <p class="text-xs text-slate-500 font-bold italic">"${order.notes || 'Sin descripción adicional.'}"</p>
                </div>

                <div class="space-y-4">
                  <div class="flex justify-between items-end">
                    <span class="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Carga Total de Orden</span>
                    <span class="text-lg font-black text-[#0f172a]">${progress}%</span>
                  </div>
                  <div class="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-1">
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-1000 shadow-sm" style="width: ${progress}%"></div>
                  </div>
                </div>
                
                <div class="mt-8 flex justify-end gap-3">
                    <button class="btn-cancel-order flex items-center gap-2 border-2 border-slate-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-red-200 hover:text-red-500 transition-all"
                            data-id="${order.id}">
                        <span>❌</span> Cancelar
                    </button>
                                      
                    ${isReady ? `
                        <button class="btn-finalize-order flex items-center gap-2 bg-emerald-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all animate-pulse"
                                data-id="${order.id}">
                            <span>✅</span> Finalizar Orden
                        </button>
                    ` : `
                        <button class="btn-update-production flex items-center gap-2 bg-[#0f172a] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-slate-200 transition-all"
                                data-index="${index}">
                            <span>📝</span> Actualizar Producción
                        </button>
                    `}
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

  // 2. ACTIVACIÓN DE LISTENERS (SOLO UNA VEZ AL FINAL)

  // Botón Nueva Orden (Header)
  const newOrderBtn = app.querySelector('#btn-new-order');
  if (newOrderBtn) {
    newOrderBtn.addEventListener('click', async () => {
      try {
        console.log("Abriendo modal de nueva orden...");
        await openNewOrderModal(); 
      } catch (error) {
        console.error("Error al abrir el modal de creación:", error);
      }
    });
  }

  // Botones de Actualización (Cards)
  app.querySelectorAll('.btn-update-production').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const index = Number(target.dataset.index);
        openUpdateProductionModal(data.active_orders[index]);
    });
  });

  // Botones de Cancelación (Cards)
  app.querySelectorAll('.btn-cancel-order').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const orderId = Number(target.dataset.id);

      if (confirm(`¿Estás seguro de que querés borrar la Orden #${orderId}?`)) {
        try {
          target.disabled = true;
          target.innerText = 'Eliminando...';
          await productionService.deleteOrder(orderId);
        } catch (error) {
          alert("Error al eliminar la orden");
          target.disabled = false;
          target.innerHTML = '<span>❌</span> Cancelar';
        }
      }
    });
  });
  app.querySelector('#btn-open-config')?.addEventListener('click', async () => {
  try {
    console.log("Cambiando a vista de Configuración...");
    const { renderConfig } = await import('./configView');
    renderConfig(app);
  } catch (error) {
    console.error("Error al cargar la configuración:", error);
  }
});
app.querySelector('#btn-open-history')?.addEventListener('click', async () => {
  const { renderHistory } = await import('./historyView');
  renderHistory(app);
});
app.querySelector('#btn-go-stock')?.addEventListener('click', async () => {
    const { renderDashboard } = await import('./dashboardView');
    const { stockService } = await import('../api/stockServices');
    const data = await stockService.getDashboard(); 
    renderDashboard(data, app);
});

app.querySelector('#btn-logout')?.addEventListener('click', () => {
    if (confirm("¿Cerrar sesión?")) {
        localStorage.removeItem('token'); 
        window.location.reload(); 
    }
});
app.querySelectorAll('.btn-finalize-order').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const orderId = Number(target.dataset.id);

        if (confirm(`¿Confirmás que la Orden #${orderId} está lista para ser retirada?`)) {
            try {
                target.disabled = true;
                target.innerText = 'Finalizando...';
                
                // Envía el estado de cierre al backend
                await productionService.updateOrder(orderId, { status: 'completed' });
                
                // Refresco total para limpiar la vista de activos
                const freshData = await productionService.getProductionDashboard();
                renderProduction(app, freshData);
            } catch (error) {
                alert("Error al finalizar la orden");
                target.disabled = false;
                target.innerHTML = '<span>✅</span> Finalizar Orden';
            }
        }
    });
});
};
