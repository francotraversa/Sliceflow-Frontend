import { productionService } from '../api/productionServices';
import type { CreateOrderDTO, CreateOrderItemDTO, ProductionOrder, UpdateOrderDTO } from '../types/production';
import { renderProduction } from './productionView';

// --- UTILIDAD: BUSCAR NOMBRES ---
const getMaterialName = (id: number, materials: any[]) => {
  const m = materials.find(mat => mat.id === id);
  return m ? m.name : `Material #${id}`;
};

const getMachineName = (id: number, machines: any[]) => {
  if (!id) return 'No asignada';
  const mac = machines.find(m => m.id === id);
  return mac ? mac.name : `Máquina #${id}`;
};

// --- MODAL 1: ACTUALIZAR PROGRESO DE PRODUCCIÓN ---
export const openUpdateProductionModal = async (
  order: ProductionOrder, 
  materials: any[] = [], 
  machines: any[] = []
) => {
  // --- REFUERZO: Si las listas vienen vacías, las buscamos del servidor ---
  let finalMaterials = materials;
  let finalMachines = machines;

  if (finalMaterials.length === 0 || finalMachines.length === 0) {
    try {
      const [resMat, resMac] = await Promise.all([
        productionService.getMaterials(),
        productionService.getMachines()
      ]);
      finalMaterials = Array.isArray(resMat) ? resMat : [];
      finalMachines = Array.isArray(resMac) ? resMac : [];
    } catch (err) {
      console.error("Error cargando dependencias para actualización:", err);
    }
  }

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300';
  
  modal.innerHTML = `
    <div class="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
      <div class="p-8 border-b border-slate-100 bg-slate-50/50">
        <h2 class="text-xl font-black text-[#0f172a] uppercase tracking-tighter">Actualizar Producción</h2>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Orden #${order.id} • ${order.client_name}</p>
      </div>

      <div class="p-8 space-y-6">
        <div class="grid grid-cols-2 gap-4 p-2">
            <div>
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Material</label>
                <select id="update-material-id" class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    ${finalMaterials.map(m => `
                        <option value="${m.id}" ${m.id === order.material_id ? 'selected' : ''}>${m.name}</option>
                    `).join('')}
                </select>
            </div>
            <div>
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Máquina Asignada</label>
                <select id="update-machine-id" class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option value="0">Sin asignar / Libre</option>
                    ${finalMachines.map(m => `
                        <option value="${m.id}" ${m.id === order.machine_id ? 'selected' : ''}>${m.name} (${m.status})</option>
                    `).join('')}
                </select>
            </div>
        </div>

        <div class="relative">
          <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4 ml-3">Progreso de Items</label>
          <div class="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar text-left">
            ${order.items.map(item => `
              <div class="p-4 rounded-3xl border border-slate-100 flex items-center justify-between bg-slate-50/30 group hover:border-blue-200 transition-colors">
                <div class="flex-1">
                  <p class="font-black text-slate-700 text-sm">${item.product_name}</p>
                  <p class="text-[10px] font-bold text-slate-400 uppercase">Meta: ${item.quantity} un.</p>
                </div>
                <div class="flex items-center gap-4">
                  <input type="number" 
                         data-item-id="${item.id}"
                         data-product-name="${item.product_name}"
                         data-total-qty="${item.quantity}"
                         value="${item.done_pieces}" 
                         min="0" 
                         max="${item.quantity}"
                         class="item-progress-input w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-center font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
        <button id="close-modal-update" class="px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-200 transition-all">Cancelar</button>
        <button id="save-production" class="bg-[#0f172a] text-white px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-slate-200 transition-all active:scale-95">Guardar Cambios</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  // Eventos de botones
  modal.querySelector('#close-modal-update')?.addEventListener('click', () => modal.remove());

  modal.querySelector('#save-production')?.addEventListener('click', async () => {
    const saveBtn = modal.querySelector('#save-production') as HTMLButtonElement;
    
    const materialId = Number((modal.querySelector('#update-material-id') as HTMLSelectElement).value);
    const machineIdRaw = (modal.querySelector('#update-machine-id') as HTMLSelectElement).value;
    const machineId = machineIdRaw === "0" ? null : Number(machineIdRaw);

    saveBtn.disabled = true;
    saveBtn.innerText = 'GUARDANDO...';

    const updatedItems = Array.from(modal.querySelectorAll('.item-progress-input')).map((input: any) => ({
      id: Number(input.dataset.itemId),
      product_name: input.dataset.productName,
      quantity: Number(input.dataset.totalQty),
      done_pieces: Number(input.value)
    }));

    const totalDone = updatedItems.reduce((acc, item) => acc + item.done_pieces, 0);

    const updateData: UpdateOrderDTO = {
      items: updatedItems,
      done_pieces: totalDone,
      material_id: materialId,
      machine_id: machineId
    };

    try {
      await productionService.updateOrder(Number(order.id), updateData);
      modal.remove();
      const freshData = await productionService.getProductionDashboard();
      renderProduction(document.getElementById('app') as HTMLDivElement, freshData);
    } catch (error) {
      alert("Error al actualizar la producción");
      saveBtn.disabled = false;
      saveBtn.innerText = 'Guardar Cambios';
    }
  });
};

// --- MODAL 2: NUEVA ORDEN ---
export const openNewOrderModal = async () => {
    let materials: any[] = [];
    let machines: any[] = [];

    try {
        const [resMat, resMac] = await Promise.all([
            productionService.getMaterials(),
            productionService.getMachines()
        ]);
        materials = Array.isArray(resMat) ? resMat : [];
        machines = Array.isArray(resMac) ? resMac : [];
    } catch (err) {
        console.error("Error cargando dependencias:", err);
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300';

    modal.innerHTML = `
    <div class="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
      <div class="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-black text-[#0f172a] uppercase tracking-tighter">Nueva Orden de Producción</h2>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hornero 3DX • Monitoring System</p>
        </div>
        <button id="close-modal-new" class="text-slate-400 hover:text-red-500 transition-colors text-2xl font-black">✕</button>
      </div>

      <form id="form-new-order" class="p-8 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar text-left">
        <div class="bg-blue-50/30 p-5 rounded-[28px] border border-blue-100/50 mb-2">
          <label class="text-[10px] font-black uppercase text-blue-500 tracking-widest block mb-2 ml-1">ID de Orden (Manual)</label>
          <input type="number" name="id" placeholder="Ej: 2024" required class="w-full bg-white border border-blue-200 rounded-2xl px-5 py-3 text-sm font-black text-blue-900 outline-none">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Cliente</label>
            <input type="text" name="client_name" required class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none">
          </div>
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Deadline</label>
            <input type="date" name="deadline" required class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="relative">
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Material</label>
            <input type="text" id="mat-search" placeholder="Escribí para buscar..." class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none">
            <input type="hidden" name="material_id" id="mat-id-hidden" required>
            <div id="mat-results" class="hidden absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 shadow-xl rounded-2xl max-h-40 overflow-y-auto z-50 p-2 custom-scrollbar"></div>
          </div>
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Prioridad</label>
            <select name="priority" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none cursor-pointer">
              <option value="P3">P3 - Normal</option>
              <option value="P2">P2 - Alta</option>
              <option value="P1">P1 - Crítica 🔥</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Horas Est.</label>
            <input type="number" name="estimated_hours" value="0" min="0" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none">
          </div>
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Mins Est.</label>
            <input type="number" name="estimated_minutes_form" value="0" min="0" max="59" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none">
          </div>
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Precio ($)</label>
            <input type="number" name="price" step="0.01" value="0" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none">
          </div>
        </div>

        <div>
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Asignar Máquina</label>
            <select name="machine_id" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none cursor-pointer">
                <option value="">Pendiente de asignación</option>
                ${machines.map((m: any) => `<option value="${m.id}">${m.name} (${m.type})</option>`).join('')}
            </select>
        </div>

        <div class="space-y-4 pt-2">
          <div class="flex justify-between items-center border-b border-slate-100 pb-2">
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Piezas / STLs</label>
            <button type="button" id="add-item-row" class="text-[9px] font-black bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full uppercase hover:bg-blue-100 transition-colors">+ Añadir Fila</button>
          </div>
          <div id="items-container" class="space-y-3">
            <div class="item-row flex gap-3">
              <input type="text" placeholder="Nombre STL / Pieza" class="item-name flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none" required>
              <input type="number" placeholder="Cant." class="item-qty w-24 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none" required min="1">
            </div>
          </div>
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Notas</label>
          <textarea name="notes" placeholder="Instrucciones especiales..." class="w-full bg-slate-50 border border-slate-200 rounded-[24px] px-5 py-4 text-xs font-bold outline-none h-24 resize-none"></textarea>
        </div>

        <div class="flex gap-3 pt-4 border-t border-slate-50">
          <button type="button" id="btn-cancel-new" class="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
          <button type="submit" id="btn-submit-new" class="flex-[2] bg-[#0f172a] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-black transition-all">Lanzar Orden</button>
        </div>
      </form>
    </div>`;

    document.body.appendChild(modal);

    // Búsqueda de Materiales
    const matInput = modal.querySelector('#mat-search') as HTMLInputElement;
    const matResults = modal.querySelector('#mat-results') as HTMLDivElement;
    const matHidden = modal.querySelector('#mat-id-hidden') as HTMLInputElement;

    matInput.addEventListener('input', (e) => {
        const val = (e.target as HTMLInputElement).value.toLowerCase();
        if (!val) { matResults.classList.add('hidden'); return; }
        const matches = materials.filter((m: any) => m.name.toLowerCase().includes(val));
        if (matches.length > 0) {
            matResults.classList.remove('hidden');
            matResults.innerHTML = matches.map((m: any) => `
                <div class="mat-opt p-3 hover:bg-blue-50 cursor-pointer rounded-xl font-bold text-xs text-[#0f172a] flex justify-between" data-id="${m.id}" data-name="${m.name}">
                    <span>${m.name}</span>
                    <span class="text-[9px] text-blue-300 font-black">ID: ${m.id}</span>
                </div>
            `).join('');

            matResults.querySelectorAll('.mat-opt').forEach(opt => {
                opt.addEventListener('click', (e) => {
                    const t = e.currentTarget as HTMLElement;
                    matInput.value = t.dataset.name!;
                    matHidden.value = t.dataset.id!;
                    matResults.classList.add('hidden');
                });
            });
        }
    });

    // Filas Dinámicas
    const container = modal.querySelector('#items-container')!;
    modal.querySelector('#add-item-row')?.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'item-row flex gap-3 animate-in slide-in-from-right-2';
        row.innerHTML = `
            <input type="text" placeholder="Nombre STL" class="item-name flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none" required>
            <input type="number" placeholder="Cant." class="item-qty w-24 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none" required min="1">
            <button type="button" class="remove-row text-slate-300 hover:text-red-500 font-bold px-2">✕</button>
        `;
        row.querySelector('.remove-row')?.addEventListener('click', () => row.remove());
        container.appendChild(row);
    });

    const form = modal.querySelector('#form-new-order') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = modal.querySelector('#btn-submit-new') as HTMLButtonElement;
        
        if(!matHidden.value) { alert("Por favor seleccioná un material de la lista"); return; }

        btn.disabled = true; btn.innerText = 'PROCESANDO...';

        const fd = new FormData(form);
        const mId = fd.get('machine_id');

        const items: CreateOrderItemDTO[] = Array.from(modal.querySelectorAll('.item-row')).map((row: any) => ({
            product_name: row.querySelector('.item-name').value,
            quantity: Number(row.querySelector('.item-qty').value),
            done_pieces: 0
        }));

        const payload: CreateOrderDTO = {
            id: Number(fd.get('id')),
            client_name: String(fd.get('client_name')),
            items: items, 
            material_id: Number(fd.get('material_id')),
            priority: String(fd.get('priority')),
            notes: String(fd.get('notes') || ""),
            estimated_hours: Number(fd.get('estimated_hours')),
            estimated_minutes: Number(fd.get('estimated_minutes_form')),
            deadline: String(fd.get('deadline')),
            operator_id: 1, 
            machine_id: mId ? Number(mId) : undefined,
            price: Number(fd.get('price') || 0)
        };

        try {
            await productionService.createOrder(payload);
            modal.remove();
            const freshData = await productionService.getProductionDashboard();
            const { renderProduction } = await import('./productionView');
            renderProduction(document.getElementById('app') as HTMLDivElement, freshData);
        } catch (err) {
            alert("Error al crear la orden: Revisá que el ID no esté duplicado.");
            btn.disabled = false; btn.innerText = 'Lanzar Orden';
        }
    });

    modal.querySelector('#close-modal-new')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#btn-cancel-new')?.addEventListener('click', () => modal.remove());
};

export const openOrderDetailModal = (
  order: ProductionOrder, 
  materials: any[] = [], 
  machines: any[] = []
) => {
    const materialName = getMaterialName(order.material_id, materials);
    const machineName = getMachineName(order.machine_id, machines);

    // Lógica para el sello de finalización
    let finishBadge = '';
    if (order.finish_time) {
        const finishDate = new Date(order.finish_time);
        const deadlineDate = new Date(order.deadline);
        const isLate = finishDate > deadlineDate;

        finishBadge = `
            <div class="mt-4 p-4 ${isLate ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'} border rounded-2xl">
                <p class="text-[9px] font-black uppercase ${isLate ? 'text-amber-600' : 'text-emerald-600'} tracking-widest mb-1">
                    ${isLate ? '⚠️ Finalizada con retraso' : '✅ Finalizada a tiempo'}
                </p>
                <p class="text-xs font-black text-slate-700">
                    ${finishDate.toLocaleString()}
                </p>
            </div>
        `;
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-[#0f172a]/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300';
    
    const priorityColor = order.priority === 'P1' ? 'text-red-500 bg-red-50' : 'text-blue-500 bg-blue-50';

    modal.innerHTML = `
    <div class="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
        <div class="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
            <div>
                <div class="flex items-center gap-3">
                    <h2 class="text-3xl font-black text-[#0f172a] tracking-tighter">ORDEN #${order.id}</h2>
                    <span class="px-3 py-1 rounded-lg text-[10px] font-black ${priorityColor}">${order.priority}</span>
                </div>
                <p class="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">${order.client_name}</p>
            </div>
            <button id="close-detail" class="text-slate-300 hover:text-red-500 transition-colors text-2xl font-black">✕</button>
        </div>

        <div class="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="space-y-6">
                <div>
                    <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Estado y Cronología</label>
                    <div class="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3">
                        <p class="text-xs"><b>Estado actual:</b> <span class="capitalize text-blue-600 font-bold">${order.status}</span></p>
                        <p class="text-xs text-slate-500"><b>Límite (Deadline):</b> ${new Date(order.deadline).toLocaleDateString()}</p>
                        <p class="text-xs text-slate-500"><b>Estimado:</b> ${order.estimated_minutes} min</p>
                        ${finishBadge}
                    </div>
                </div>
                <div>
                    <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Recursos Asignados</label>
                    <div class="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3">
                        <p class="text-xs"><b>Material:</b> <span class="text-slate-900 font-bold">${materialName}</span></p>
                        <p class="text-xs"><b>Máquina:</b> <span class="text-slate-900 font-bold">${machineName}</span></p>
                        <p class="text-xs font-medium text-slate-400">Operador ID: #${order.operator_id}</p>
                    </div>
                </div>
            </div>

            <div class="md:col-span-2 space-y-6">
                <div>
                    <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Desglose de Producción (${order.done_pieces} / ${order.total_pieces} piezas)</label>
                    <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        ${order.items.map(item => `
                            <div class="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div>
                                    <p class="text-sm font-black text-slate-700">${item.product_name}</p>
                                    <p class="text-[10px] text-slate-400 font-bold uppercase">Meta: ${item.quantity} unidades</p>
                                </div>
                                <div class="text-right">
                                    <span class="text-lg font-black text-blue-600">${item.done_pieces}</span>
                                    <span class="text-xs font-bold text-slate-300">/ ${item.quantity}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100">
                    <label class="text-[10px] font-black uppercase text-blue-400 tracking-widest block mb-2">Notas de Auditoría</label>
                    <p class="text-sm text-slate-600 italic">"${order.notes || 'Sin observaciones registradas'}"</p>
                </div>
            </div>
        </div>
        
        <div class="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <div class="text-2xl font-black text-slate-900">
                <span class="text-[10px] text-slate-400 uppercase block leading-none">Presupuesto Final</span>
                $${(order.price || 0).toLocaleString()}
            </div>
            <div class="flex gap-3">
                <button id="btn-print-ticket" class="bg-[#0f172a] text-white px-8 py-4 rounded-2xl text-xs font-black uppercase hover:bg-black transition-all shadow-lg active:scale-95">
                    🖨️ Imprimir Ticket
                </button>
            </div>
        </div>
    </div>`;

    document.body.appendChild(modal);
    modal.querySelector('#close-detail')?.addEventListener('click', () => modal.remove());
};