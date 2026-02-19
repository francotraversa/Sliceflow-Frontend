import { productionService } from '../api/productionServices';
import type { CreateOrderDTO, CreateOrderItemDTO, ProductionOrder, UpdateOrderDTO } from '../types/production';

// --- MODAL: ACTUALIZAR PRODUCCIÓN ---
export const openUpdateProductionModal = (order: ProductionOrder) => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300';
  
  modal.innerHTML = `
    <div class="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden">
      <div class="p-8 border-b border-slate-100 bg-slate-50/50">
        <h2 class="text-xl font-black text-[#0f172a] uppercase tracking-tighter">Actualizar Producción</h2>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Orden #${order.id} • ${order.client_name}</p>
      </div>

      <div class="p-8 space-y-6">
        <div class="max-h-[350px] overflow-y-auto space-y-4 pr-2 custom-scrollbar text-left">
          ${order.items.map(item => `
            <div class="p-5 rounded-3xl border border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div class="flex-1">
                <p class="font-black text-slate-700 text-sm">${item.product_name}</p>
                <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">Total: ${item.quantity} piezas</p>
              </div>
              <div class="flex items-center gap-4">
                <input type="number" 
                       data-item-id="${item.id}"
                       data-product-name="${item.product_name}"
                       data-total-qty="${item.quantity}"
                       value="${item.done_pieces}" 
                       min="0" 
                       max="${item.quantity}"
                       class="item-progress-input w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-center font-black text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                >
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
        <button id="close-modal-update" class="px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-200 transition-all">Cancelar</button>
        <button id="save-production" class="bg-[#0f172a] text-white px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-slate-200 transition-all">Guardar Cambios</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#close-modal-update')?.addEventListener('click', () => modal.remove());

modal.querySelector('#save-production')?.addEventListener('click', async () => {
    const saveBtn = modal.querySelector('#save-production') as HTMLButtonElement;
    saveBtn.disabled = true;
    saveBtn.innerText = 'Guardando...';

    const updatedItems = Array.from(modal.querySelectorAll('.item-progress-input')).map((input: any) => ({
      id: Number(input.dataset.itemId),
      product_name: input.dataset.productName,
      quantity: Number(input.dataset.totalQty),
      done_pieces: Number(input.value)
    }));

    const totalDone = updatedItems.reduce((acc, item) => acc + item.done_pieces, 0);

    // REPARACIÓN: Eliminamos el campo 'status' para que no pise la lógica del Backend
    const updateData: UpdateOrderDTO = {
      items: updatedItems,
      done_pieces: totalDone
    };

    try {
      await productionService.updateOrder(Number(order.id), updateData);
      modal.remove();
      // Refrescamos la vista para ver el botón de "Finalizar" si corresponde
      window.location.reload(); 
    } catch (error) {
      alert("Error al actualizar la producción");
      saveBtn.disabled = false;
      saveBtn.innerText = 'Guardar Cambios';
    }
});
};

// --- MODAL: NUEVA ORDEN ---
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
            <select name="priority" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none">
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
            <select name="machine_id" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none">
                <option value="">Pendiente de asignación</option>
                ${machines.map((m: any) => `<option value="${m.id}">${m.name} (${m.type})</option>`).join('')}
            </select>
        </div>

        <div class="space-y-4 pt-2">
          <div class="flex justify-between items-center border-b border-slate-100 pb-2">
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Piezas / STLs</label>
            <button type="button" id="add-item-row" class="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase hover:bg-blue-100 transition-colors">+ Añadir</button>
          </div>
          <div id="items-container" class="space-y-3 pr-2">
            <div class="item-row flex gap-3">
              <input type="text" placeholder="Nombre STL" class="item-name flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none" required>
              <input type="number" placeholder="Cant." class="item-qty w-24 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none" required min="1">
            </div>
          </div>
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 ml-1">Notas</label>
          <textarea name="notes" placeholder="Ej: Terminación superficial lisa..." class="w-full bg-slate-50 border border-slate-200 rounded-[24px] px-5 py-4 text-xs font-bold outline-none h-24 resize-none"></textarea>
        </div>

        <div class="flex gap-3 pt-4 border-t border-slate-50">
          <button type="button" id="btn-cancel-new" class="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
          <button type="submit" id="btn-submit-new" class="flex-[2] bg-[#0f172a] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-black active:scale-95 transition-all">Lanzar Orden</button>
        </div>
      </form>
    </div>`;

    document.body.appendChild(modal);

    // Lógica Buscador Material
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

    // Lógica Filas Dinámicas
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
            deadline: String(fd.get('deadline')), // Formato YYYY-MM-DD
            operator_id: 1, 
            machine_id: mId ? Number(mId) : undefined,
            price: Number(fd.get('price') || 0)
        };

        try {
            await productionService.createOrder(payload);
            modal.remove();
            
            // Refresco manual forzado
            const freshData = await productionService.getProductionDashboard();
            const { renderProduction } = await import('./productionView');
            renderProduction(document.getElementById('app') as HTMLDivElement, freshData);
        } catch (err) {
            console.error(err);
            alert("Error al crear la orden: Revisá que el ID no esté duplicado.");
            btn.disabled = false; btn.innerText = 'Lanzar Orden';
        }
    });

    modal.querySelector('#close-modal-new')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#btn-cancel-new')?.addEventListener('click', () => modal.remove());
};