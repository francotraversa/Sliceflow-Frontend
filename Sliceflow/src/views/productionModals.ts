import { productionService } from '../api/productionServices';
import type { CreateOrderDTO, CreateOrderItemDTO, ProductionOrder, UpdateOrderDTO, MetricsResponse } from '../types/production';

import { renderProduction } from './productionView';
import { getUserFromToken } from '../api/authServices';



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
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Orden #${order.id_order ?? order.id} • ${order.client_name}</p>
      </div>

      <div class="p-8 space-y-6">

        <div class="relative">
          <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3 ml-1">Progreso y Configuración de Items</label>
          <div class="max-h-[340px] overflow-y-auto space-y-3 pr-1 custom-scrollbar text-left">
            ${order.items.map(item => `
              <div class="item-update-row rounded-[20px] border border-slate-100 bg-slate-50/40 p-4 space-y-3 group hover:border-blue-100 transition-colors">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-black text-slate-800 text-sm">${item.product_name}</p>

                    <p class="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Meta: ${item.quantity} un.</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-[9px] font-black text-slate-300 uppercase">Hechas</span>
                    <input type="number"
                           class="item-progress-input w-18 bg-white border border-slate-200 rounded-xl px-3 py-2 text-center font-black text-blue-600 focus:ring-2 focus:ring-blue-400 outline-none w-[72px]"
                           data-item-id="${item.id}"
                           data-stl-name="${item.product_name}"
                           data-old-weight="${item.weight ?? 0}"
                           data-old-time="${item.time ?? 0}"
                           data-total-qty="${item.quantity}"
                           value="${item.done_pieces}"
                           min="0" max="${item.quantity}">
                  </div>
                </div>
                <div class="grid grid-cols-6 gap-2">
                  <div>
                    <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Precio ($)</label>
                    <div class="relative">
                      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">$</span>
                      <input type="number" step="0.01" min="0"
                             class="item-price-input w-full bg-white border border-slate-100 rounded-xl pl-5 pr-2 py-1.5 text-[11px] font-black text-slate-700 outline-none focus:border-blue-300"
                             value="${item.price ?? 0}">
                    </div>
                  </div>
                  <div>
                    <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Peso</label>
                    <input type="number" step="0.1" min="0" placeholder="0"
                           class="item-weight-input w-full bg-white border border-slate-100 rounded-xl px-2 py-1.5 text-[11px] font-black text-slate-700 outline-none focus:border-blue-300"
                           value="${item.weight ?? ''}">
                  </div>
                  <div>
                    <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Horas</label>
                    <input type="number" min="0" placeholder="0"
                           class="item-hours-input w-full bg-white border border-slate-100 rounded-xl px-2 py-1.5 text-[11px] font-black text-slate-700 outline-none focus:border-blue-300"
                           value="${item.time ? Math.floor(item.time / 60) : ''}">
                  </div>
                  <div>
                    <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Min.</label>
                    <input type="number" min="0" max="59" placeholder="0"
                           class="item-mins-input w-full bg-white border border-slate-100 rounded-xl px-2 py-1.5 text-[11px] font-black text-slate-700 outline-none focus:border-blue-300"
                           value="${item.time ? item.time % 60 : ''}">
                  </div>
                  <div>
                    <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Material</label>
                    <select class="item-update-material w-full bg-white border border-slate-100 rounded-xl px-2 py-1.5 text-[10px] font-bold outline-none cursor-pointer text-slate-600">
                      <option value="">Sin cambio</option>
                      ${finalMaterials.map((m: any) => `<option value="${m.id}" ${m.id === item.material_id ? 'selected' : ''}>${m.name}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Máquina</label>
                    <select class="item-update-machine w-full bg-white border border-slate-100 rounded-xl px-2 py-1.5 text-[10px] font-bold outline-none cursor-pointer text-slate-600">
                      <option value="0">Sin asignar</option>
                      ${finalMachines.map((m: any) => `<option value="${m.id}" ${m.id === item.machine_id ? 'selected' : ''}>${m.name}</option>`).join('')}
                    </select>
                  </div>
                </div>
              </div>
            `).join('')}
            <div class="space-y-3 pt-4 border-t border-slate-100">
          <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Bitácora / Seguimiento del Cliente</label>
          
          <div class="bg-slate-50 rounded-2xl p-4 max-h-[100px] overflow-y-auto border border-slate-100 mb-2">
            <p class="text-[11px] font-bold text-slate-500 whitespace-pre-wrap leading-relaxed">
              ${order.notes || 'Sin registros previos.'}
            </p>
          </div>

          <textarea id="update-new-note" 
                    placeholder="Escribí aquí lo que solicita el cliente o el avance..." 
                    class="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[60px] resize-none"
          ></textarea>
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

    // 1. CAPTURAR NOTAS (Bitácora acumulativa)
    const newNoteInput = modal.querySelector('#update-new-note') as HTMLTextAreaElement;
    const newNoteText = newNoteInput.value.trim();
    let finalNotes = order.notes || ''; // Tomamos lo que ya existe en la BD

    if (newNoteText !== "") {
      const now = new Date();
      // Agregamos la fecha y hora
      const timestamp = `${now.getDate()}/${now.getMonth() + 1} ${now.getHours()}:${now.getMinutes()}`;
      const entry = `[${timestamp}]: ${newNoteText}`;

      // El \n es vital para que Go lo guarde como multilínea
      finalNotes = finalNotes ? `${finalNotes}\n${entry}` : entry;
    }



    saveBtn.disabled = true;
    saveBtn.innerText = 'GUARDANDO...';

    // 3. CAPTURAR ITEMS — cada row tiene: done_pieces, price, material_id, machine_id
    const itemRows = Array.from(modal.querySelectorAll('.item-progress-input'));
    const updatedItems: CreateOrderItemDTO[] = itemRows.map((input: any) => {
      const row = input.closest('.item-update-row') as HTMLElement;

      // Capturamos los inputs
      const weightInput = row?.querySelector('.item-weight-input') as HTMLInputElement | null;
      const hoursInput = row?.querySelector('.item-hours-input') as HTMLInputElement | null;
      const minsInput = row?.querySelector('.item-mins-input') as HTMLInputElement | null;

      // REGLA DE RECUPERACIÓN: 
      // 1. Si el input tiene un valor escrito por el usuario, usamos ese.
      // 2. Si el input está vacío, intentamos usar lo que venía de la DB (guardado en dataset).
      // 3. Si no hay nada, mandamos 0.
      const finalWeight = weightInput?.value !== ""
        ? Number(weightInput?.value)
        : Number(input.dataset.oldWeight || 0);

      const computedTime = (hoursInput?.value && hoursInput.value !== "" || minsInput?.value && minsInput.value !== "")
        ? (Number(hoursInput?.value || 0) * 60) + Number(minsInput?.value || 0)
        : null;

      const finalTime = computedTime !== null 
        ? computedTime 
        : Number(input.dataset.oldTime || 0);

      return {
        stl_name: input.dataset.stlName || '',
        quantity: Number(input.dataset.totalQty),
        done_pieces: Number(input.value),
        price: Number((row?.querySelector('.item-price-input') as HTMLInputElement)?.value || 0),
        machine_id: Number((row?.querySelector('.item-update-machine') as HTMLSelectElement)?.value) || undefined,
        material_id: Number((row?.querySelector('.item-update-material') as HTMLSelectElement)?.value) || undefined,

        // Aquí usamos los valores recuperados
        weight: finalWeight,
        time: finalTime,
      };
    });

    const totalDone = updatedItems.reduce((acc, item) => acc + (item.done_pieces ?? 0), 0);


    // 4. ARMAR PAYLOAD FINAL — price is now per-item, backend sums into TotalPrice
    const updateData: UpdateOrderDTO = {
      items: updatedItems,
      done_pieces: totalDone,
      notes: finalNotes,
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
  let allOrders: any[] = [];
  try {
    const [resMat, resMac, resHis] = await Promise.all([
      productionService.getMaterials(),
      productionService.getMachines(),
      productionService.getHistoricalOrders()
    ]);
    materials = Array.isArray(resMat) ? resMat : [];
    machines = Array.isArray(resMac) ? resMac : [];
    allOrders = Array.isArray(resHis) ? resHis : [];
  } catch (err) {
    console.error("Error cargando dependencias:", err);
  }

  const uniqueClients = [...new Set(allOrders.map((o: any) => o.client_name))].sort();

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
            <input type="text" name="client_name" id="client_name_input" list="clients-list" required class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none" placeholder="Nombre o buscar...">
          </div>
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Deadline</label>
            <input type="date" name="deadline" required class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none">
          </div>
        </div>

        <div>
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Prioridad</label>
            <select name="priority" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none cursor-pointer">
              <option value="P3">P3 - Normal</option>
              <option value="P2">P2 - Alta</option>
              <option value="P1">P1 - Crítica 🔥</option>
            </select>
          </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Horas Est.</label>
            <input type="number" id="global-hours-input" name="estimated_hours" value="0" min="0" readonly class="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none cursor-not-allowed">
          </div>
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Mins Est.</label>
            <input type="number" id="global-mins-input" name="estimated_minutes_form" value="0" min="0" max="59" readonly class="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none cursor-not-allowed">
          </div>
        </div>

        <div class="bg-slate-50/60 rounded-[20px] border border-slate-100 p-4">
          <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">⚙️ Material y Máquina por defecto <span class="font-normal normal-case text-slate-300">(se aplica a todas las piezas sin asignación propia)</span></p>
          <div class="grid grid-cols-2 gap-3">
            <div class="relative">
              <label class="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Material por defecto</label>
              <input type="text" id="mat-search" placeholder="Buscar material..." class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none">
              <input type="hidden" name="material_id" id="mat-id-hidden">
              <div id="mat-results" class="hidden absolute left-0 right-0 top-full mt-1 bg-white border border-slate-100 shadow-xl rounded-xl max-h-36 overflow-y-auto z-50 p-1.5 custom-scrollbar"></div>
            </div>
            <div>
              <label class="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Máquina por defecto</label>
              <select id="default-machine-id" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none cursor-pointer">
                <option value="">Sin asignar</option>
                ${machines.map((m: any) => `<option value="${m.id}">${m.name} (${m.type})</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="space-y-3 pt-2">
          <div class="flex justify-between items-center pb-2">
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">🖨️ Piezas / STLs</label>
            <button type="button" id="add-item-row" class="text-[9px] font-black bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full uppercase hover:bg-blue-100 transition-colors">+ Añadir Pieza</button>
          </div>
          <div id="items-container" class="space-y-3">
            <div class="item-row bg-slate-50 border border-slate-100 rounded-[20px] p-4 space-y-3">
              <div class="flex gap-3 items-center">
                <input type="text" placeholder="Nombre STL / Pieza" class="item-name flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-300" required>
                <input type="number" placeholder="Cant." class="item-qty w-20 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none text-center focus:border-blue-300" required min="1">
              </div>
              <div class="grid grid-cols-6 gap-2">
                <div>
                  <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Precio ($)</label>
                  <div class="relative">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">$</span>
                    <input type="number" step="0.01" min="0" value="0" class="item-price w-full bg-white border border-slate-100 rounded-xl pl-5 pr-2 py-2 text-[11px] font-black text-slate-700 outline-none focus:border-blue-300">
                  </div>
                </div>
                <div>
                  <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Peso gr/ml</label>
                  <input type="number" step="0.1" min="0" placeholder="0" class="item-weight w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-black text-slate-700 outline-none focus:border-blue-300">
                </div>
                <div>
                  <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Horas</label>
                  <input type="number" min="0" placeholder="0" class="item-time-hours w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-black text-slate-700 outline-none focus:border-blue-300">
                </div>
                <div>
                  <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Minutos</label>
                  <input type="number" min="0" max="59" placeholder="0" class="item-time-mins w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-black text-slate-700 outline-none focus:border-blue-300">
                </div>
                <div>
                  <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Material específico</label>
                  <select class="item-material-id w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-bold outline-none cursor-pointer text-slate-600">
                    <option value="">↑ Por defecto</option>
                    ${materials.map((m: any) => `<option value="${m.id}">${m.name} (${m.type})</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Máquina específica</label>
                  <select class="item-machine-id w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-bold outline-none cursor-pointer text-slate-600">
                    <option value="">↑ Por defecto</option>
                    ${machines.map((m: any) => `<option value="${m.id}">${m.name} (${m.status})</option>`).join('')}
                  </select>
                </div>
              </div>
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

        <datalist id="clients-list">
          ${uniqueClients.map((client: string) => `<option value="${client}">`).join('')}
        </datalist>

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

  const buildItemRowHTML = (mats: any[], macs: any[]) => {
    const matOptions = mats.map((m: any) => `<option value="${m.id}">${m.name} (${m.type})</option>`).join('');
    const macOptions = macs.map((m: any) => `<option value="${m.id}">${m.name} (${m.status})</option>`).join('');
    return `
            <div class="flex gap-3 items-center">
                <input type="text" placeholder="Nombre STL / Pieza" class="item-name flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-300" required>
                <input type="number" placeholder="Cant." class="item-qty w-20 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none text-center focus:border-blue-300" required min="1">
                <button type="button" class="remove-row text-slate-300 hover:text-red-500 font-black text-lg leading-none px-1 flex-shrink-0">✕</button>
            </div>
            <div class="grid grid-cols-6 gap-2">
                <div>
                    <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Precio ($)</label>
                    <div class="relative">
                        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">$</span>
                        <input type="number" step="0.01" min="0" value="0" class="item-price w-full bg-white border border-slate-100 rounded-xl pl-5 pr-2 py-2 text-[11px] font-black text-slate-700 outline-none focus:border-blue-300">
                    </div>
                </div>
                <div>
                    <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Peso gr/ml</label>
                    <input type="number" step="0.1" min="0" placeholder="0" class="item-weight w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-black text-slate-700 outline-none focus:border-blue-300">
                </div>
                <div>
                    <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Horas</label>
                    <input type="number" min="0" placeholder="0" class="item-time-hours w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-black text-slate-700 outline-none focus:border-blue-300">
                </div>
                <div>
                    <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Minutos</label>
                    <input type="number" min="0" max="59" placeholder="0" class="item-time-mins w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-black text-slate-700 outline-none focus:border-blue-300">
                </div>
                <div>
                    <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Material específico</label>
                    <select class="item-material-id w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-bold outline-none cursor-pointer text-slate-600">
                        <option value="">↑ Por defecto</option>
                        ${matOptions}
                    </select>
                </div>
                <div>
                    <label class="text-[8px] font-black uppercase text-slate-300 tracking-widest block mb-1">Máquina específica</label>
                    <select class="item-machine-id w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-[11px] font-bold outline-none cursor-pointer text-slate-600">
                        <option value="">↑ Por defecto</option>
                        ${macOptions}
                    </select>
                </div>
            </div>
        `;
  };

  // Filas Dinámicas
  const container = modal.querySelector('#items-container')!;
  
  // Función para actualizar los totales de tiempo
  const updateGlobalTime = () => {
    let totalMinutes = 0;
    container.querySelectorAll('.item-row').forEach(row => {
      const qty = Number((row.querySelector('.item-qty') as HTMLInputElement).value || 0);
      const hours = Number((row.querySelector('.item-time-hours') as HTMLInputElement).value || 0);
      const mins = Number((row.querySelector('.item-time-mins') as HTMLInputElement).value || 0);
      const time = (hours * 60) + mins;
      totalMinutes += (qty * time);
    });

    const hInput = modal.querySelector('#global-hours-input') as HTMLInputElement;
    const mInput = modal.querySelector('#global-mins-input') as HTMLInputElement;
    
    if (hInput && mInput) {
      hInput.value = Math.floor(totalMinutes / 60).toString();
      mInput.value = (totalMinutes % 60).toString();
    }
  };

  container.addEventListener('input', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('item-time-hours') || target.classList.contains('item-time-mins') || target.classList.contains('item-qty')) {
      updateGlobalTime();
    }
  });

  modal.querySelector('#add-item-row')?.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'item-row bg-slate-50 border border-slate-100 rounded-[20px] p-4 space-y-3 animate-in slide-in-from-bottom-2 duration-200';
    row.innerHTML = buildItemRowHTML(materials, machines);
    row.querySelector('.remove-row')?.addEventListener('click', () => {
      row.remove();
      updateGlobalTime();
    });
    container.appendChild(row);
  });

  const form = modal.querySelector('#form-new-order') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = modal.querySelector('#btn-submit-new') as HTMLButtonElement;

    // material_id is optional when every item has its own
    const allItemsHaveMaterial = Array.from(modal.querySelectorAll('.item-material-id')).every((s: any) => s.value !== '');
    if (!matHidden.value && !allItemsHaveMaterial) {
      alert("Seleccioná un material por defecto, o asignale uno a cada pieza.");
      return;
    }

    btn.disabled = true; btn.innerText = 'PROCESANDO...';

    const fd = new FormData(form);
    const defaultMaterialId = matHidden.value ? Number(matHidden.value) : undefined;
    const defaultMachineId = (modal.querySelector('#default-machine-id') as HTMLSelectElement).value;
    const defaultMacNum = defaultMachineId ? Number(defaultMachineId) : undefined;

    const items: CreateOrderItemDTO[] = Array.from(modal.querySelectorAll('.item-row')).map((row: any) => {
      const itemMatVal = (row.querySelector('.item-material-id') as HTMLSelectElement)?.value;
      const itemMacVal = (row.querySelector('.item-machine-id') as HTMLSelectElement)?.value;
      const itemPrice = (row.querySelector('.item-price') as HTMLInputElement)?.value ?? '0';
      const itemWeight = (row.querySelector('.item-weight') as HTMLInputElement)?.value;
      
      const itemHours = (row.querySelector('.item-time-hours') as HTMLInputElement)?.value;
      const itemMins = (row.querySelector('.item-time-mins') as HTMLInputElement)?.value;
      let itemTime: number | undefined = undefined;
      
      if ((itemHours && itemHours !== "") || (itemMins && itemMins !== "")) {
        itemTime = (Number(itemHours || 0) * 60) + Number(itemMins || 0);
      }

      return {
        stl_name: row.querySelector('.item-name').value,
        quantity: Number(row.querySelector('.item-qty').value),
        done_pieces: 0,
        price: Number(itemPrice),
        weight: itemWeight ? Number(itemWeight) : undefined,
        time: itemTime,
        // fall back to order-level default if no item-specific value
        material_id: itemMatVal ? Number(itemMatVal) : defaultMaterialId,
        machine_id: itemMacVal ? Number(itemMacVal) : defaultMacNum,
      };
    });

    const { user_id } = getUserFromToken();

    const payload: CreateOrderDTO = {
      id: Number(fd.get('id')),
      client_name: String(fd.get('client_name')),
      items: items,
      priority: String(fd.get('priority')),
      notes: String(fd.get('notes') || ''),
      estimated_hours: Number(fd.get('estimated_hours') || 0),
      estimated_minutes: Number(fd.get('estimated_minutes_form') || 0), // 0-59, backend does the math
      deadline: String(fd.get('deadline')),
      operator_id: user_id || 1,
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
                    <h2 class="text-3xl font-black text-[#0f172a] tracking-tighter">ORDEN #${order.id_order ?? order.id}</h2>
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
                    <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Recursos por Pieza</label>
                    <div class="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-2 max-h-[200px] overflow-y-auto">
                        ${order.items.map(item => {
    const iMat = (item as any).material?.name
      || (item.material_id ? (materials.find((m) => m.id === item.material_id)?.name || '#' + item.material_id) : null);
    const iMac = (item as any).machine?.name
      || (item.machine_id ? (machines.find((m) => m.id === item.machine_id)?.name || '#' + item.machine_id) : null);
    const iName = item.product_name || '—';

    return `
                          <div class="bg-white rounded-2xl px-3 py-2.5 border border-slate-100">
                            <p class="text-xs font-black text-slate-700 mb-1">${iName}</p>
                            <div class="flex gap-2 flex-wrap">
                              ${iMat ? '<span class="bg-blue-50 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">' + iMat + '</span>' : ''}
                              ${iMac ? '<span class="bg-indigo-50 text-indigo-600 text-[8px] font-black px-2 py-0.5 rounded-full">' + iMac + '</span>' : ''}
                              ${!iMat && !iMac ? '<span class="text-slate-300 text-[8px] font-black">Sin recursos asignados</span>' : ''}
                            </div>
                          </div>`;
  }).join('')}
                        <p class="text-xs font-medium text-slate-400 mt-2">Operador ID: #${order.operator_id}</p>
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
                                    <p class="text-sm font-black text-slate-700">${item.product_name || '—'}</p>

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
                $${((order as any).total_price ?? (order as any).price ?? 0).toLocaleString()}
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

  modal.querySelector('#btn-print-ticket')?.addEventListener('click', () => {
    const orderNum = order.id_order ?? order.id;
    const totalPrice = ((order as any).total_price ?? (order as any).price ?? 0).toLocaleString();
    const createdAt = new Date(order.created_at).toLocaleDateString();
    const deadline = order.deadline ? new Date(order.deadline).toLocaleDateString() : '___________';

    // Build one table row per item
    const itemRows = (order.items ?? []).map(item => {
      const iMat = (item as any).material?.name
        || (item.material_id ? materials.find((m: any) => m.id === item.material_id)?.name || '' : '');
      const iMac = (item as any).machine?.name
        || (item.machine_id ? machines.find((m: any) => m.id === item.machine_id)?.name || '' : '');
      const name = item.product_name || '';

      return `
        <tr>
          <td>${iMac}</td>
          <td>${name}</td>
          <td>${item.time || ''}</td>
          <td>${iMat}</td>
          <td>${item.weight || ''}</td>
          <td>${item.quantity}</td>
          <td>${item.done_pieces}</td>
        </tr>`;
    });

    // Add extra blank rows (minimum 8 rows visible)
    const extraRows = Math.max(0, 8 - itemRows.length);
    for (let i = 0; i < extraRows; i++) {
      itemRows.push('<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>');
    }

    const win = window.open('', '_blank', 'width=680,height=960');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket Orden #${orderNum} — Hornero 3DX</title>
  <style>
    * { 
      box-sizing: border-box; margin: 0; padding: 0; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #000;
      background: #fff;
      padding: 12mm;
    }
    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand-name { font-size: 13px; font-weight: 900; line-height: 1.1; }
    .brand-sub  { font-size: 9px; color: #555; }
    .title      { font-size: 18px; font-weight: 700; text-align: center; flex: 1; }
    .id-block   { font-size: 11px; white-space: nowrap; }
    .id-block span { border-bottom: 1px solid #000; display: inline-block; width: 80px; }

    /* ── Section headers ── */
    .section-header {
      background-color: #333 !important;
      color: #fff !important;
      text-align: center;
      font-weight: 700;
      font-size: 10px;
      padding: 4px 0;
      margin-top: 6px;
      border-radius: 3px 3px 0 0;
    }
    .section-body {
      border: 1px solid #555;
      border-top: none;
      padding: 6px 8px;
      border-radius: 0 0 3px 3px;
    }

    /* ── Fields ── */
    .row-fields {
      display: flex;
      gap: 16px;
      margin-bottom: 5px;
    }
    .field {
      display: flex;
      align-items: baseline;
      gap: 4px;
      flex: 1;
    }
    .field label { font-weight: 700; white-space: nowrap; }
    .field .line {
      flex: 1;
      border-bottom: 1px solid #000;
      min-width: 60px;
      height: 14px;
    }
    .field .value {
      font-size: 10px;
      flex: 1;
      border-bottom: 1px solid #000;
      min-width: 60px;
      height: 14px;
      display: flex;
      align-items: flex-end;
      padding-bottom: 1px;
    }

    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0;
    }
    th, td {
      border: 1px solid #999;
      padding: 3px 4px;
      text-align: center;
      font-size: 9px;
    }
    th {
      background: #eee;
      font-weight: 700;
      font-size: 8.5px;
    }
    td:nth-child(2) { text-align: left; } /* Gcode */

    /* ── Footer sections ── */
    .footer-grid {
      display: flex;
      gap: 8px;
      margin-top: 2px;
    }
    .footer-grid .field { flex: 1; }

    /* ── Total ── */
    .total-line {
      margin-top: 8px;
      text-align: right;
      font-weight: 700;
      font-size: 12px;
    }

    @media print {
      body { padding: 8mm; }
      @page { margin: 5mm; size: A5; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div>
        <div class="brand-name">HORNERO<br>3DX</div>
      </div>
    </div>
    <div class="title">Servicio de impresión 3D</div>
    <div class="id-block">ID: <span>#${orderNum}</span></div>
  </div>

  <!-- Información del cliente -->
  <div class="section-header">Información del cliente</div>
  <div class="section-body">
    <div class="row-fields">
      <div class="field"><label>Nombre:</label><input type="text" id="inp-nombre" placeholder="Escribir nombre..." style="flex:1;border:none;border-bottom:1px solid #000;font-size:10px;font-family:Arial;outline:none;padding:1px 3px;"></div>
      <div class="field"><label>Empresa:</label><div class="value">${order.client_name}</div></div>
    </div>
    <div class="row-fields">
      <div class="field"><label>Fecha de inicio:</label><div class="value">${createdAt}</div></div>
      <div class="field"><label>Fecha de entrega acordada:</label><div class="value">${deadline}</div></div>
    </div>
  </div>

  <!-- Impresión 3D -->
  <div class="section-header">Impresión 3D</div>
  <table>
    <thead>
      <tr>
        <th>Impresora</th>
        <th>Gcode</th>
        <th>Tiempo</th>
        <th>Material/Color</th>
        <th>gr/ml</th>
        <th>Cant.</th>
        <th>Realizadas</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows.join('')}
    </tbody>
  </table>

  <!-- Para postprocesar -->
  <div class="section-header">Para postprocesar</div>
  <div class="section-body">
    <div class="row-fields">
      <div class="field" style="max-width:160px"><label>Piezas en caja PP:</label><div class="line"></div></div>
      <div class="field"><label>Info adicional:</label><div class="line"></div></div>
    </div>
  </div>

  <!-- Control de calidad -->
  <div class="section-header">Control de calidad y para embalar</div>
  <div class="section-body">
    <div class="row-fields">
      <div class="field" style="max-width:160px"><label>Piezas en caja CC:</label><div class="line"></div></div>
      <div class="field" style="max-width:160px"><label>Aprobado por:</label><div class="line"></div></div>
      <div class="field"><label>Firma:</label><div class="line"></div></div>
    </div>
  </div>

  <div class="total-line">Total: $${totalPrice}</div>

  <div style="margin-top:10px;text-align:right">
    <button onclick="window.print()" style="background:#0f172a;color:#fff;border:none;padding:8px 22px;border-radius:8px;font-size:11px;font-weight:900;cursor:pointer;letter-spacing:0.05em;">🖨️ Imprimir</button>
  </div>
  <style>@media print { button { display:none !important; } }</style>
</body>
</html>`);
    win.document.close();
  });
};

export const openMetricsModal = (metrics: MetricsResponse) => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm flex justify-center items-center z-[200] p-4 font-sans animate-in zoom-in-95';

  modal.innerHTML = `
    <div class="bg-white w-full max-w-4xl rounded-[40px] p-10 shadow-2xl relative text-left flex flex-col max-h-[90vh]">
      <button id="close-metrics-btn" class="absolute top-8 right-8 text-slate-400 hover:text-slate-600 text-2xl font-black transition-all hover:rotate-90">✕</button>

      <div class="mb-10">
        <h2 class="text-3xl font-black text-[#0f172a] uppercase tracking-tighter">Métricas de Producción</h2>
        <p class="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-1">Análisis de saturación y backlog</p>
      </div>

      <div class="flex-1 overflow-y-auto pr-4 space-y-10">
        <!-- Tiempo por Máquina -->
        <section>
          <h3 class="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#0f172a] mb-5">
            <span class="p-2 bg-indigo-50 text-indigo-500 rounded-xl leading-none">⏱️</span>
            Workload por Máquina (Horas)
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${metrics.machines.length > 0 ? metrics.machines.map(m => `
              <div class="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex justify-between items-center hover:scale-[1.02] transition-all">
                <div class="flex flex-col">
                  <span class="text-xs font-black text-slate-400 uppercase tracking-widest">ID #${m.machine_id}</span>
                  <span class="text-sm font-black text-[#0f172a] max-w-[120px] truncate">${m.machine_name}</span>
                </div>
                <div class="flex items-end gap-1">
                  <span class="text-2xl font-black text-indigo-600">${m.queued_hours.toFixed(1)}</span><span class="text-xs text-indigo-400 font-bold mb-1">h</span>
                </div>
              </div>
            `).join('') : '<p class="text-slate-400 text-xs font-bold w-full col-span-full">No hay máquinas asignadas a la cola.</p>'}
          </div>
        </section>

        <!-- Consumo por Material -->
        <section>
          <h3 class="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#0f172a] mb-5">
            <span class="p-2 bg-emerald-50 text-emerald-500 rounded-xl leading-none">⚖️</span>
            Consumo Estimado (Kg / L)
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${metrics.materials.length > 0 ? metrics.materials.map(mat => {
              const isResin = mat.material_name.toLowerCase().includes('resina') || mat.material_type.toLowerCase().includes('sla');
              const unit = isResin ? 'L' : 'kg';
              const color = isResin ? 'text-teal-600' : 'text-emerald-600';
              const bgBadge = isResin ? 'bg-teal-100 text-teal-700' : 'bg-emerald-100 text-emerald-700';

              return `
              <div class="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex justify-between items-center hover:scale-[1.02] transition-all">
                <div class="flex flex-col gap-1 items-start">
                  <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${bgBadge}">${mat.material_type}</span>
                  <span class="text-sm font-black text-[#0f172a]">${mat.material_name}</span>
                </div>
                <div class="flex items-end gap-1">
                  <span class="text-2xl font-black ${color}">${mat.queued_kilos.toFixed(2)}</span><span class="text-xs ${color} opacity-60 font-bold mb-1">${unit}</span>
                </div>
              </div>`
            }).join('') : '<p class="text-slate-400 text-xs font-bold w-full col-span-full">No hay materiales requeridos en la cola actual.</p>'}
          </div>
        </section>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#close-metrics-btn')?.addEventListener('click', () => {
    modal.remove();
  });
};