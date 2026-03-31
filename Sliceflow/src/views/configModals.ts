import { productionService } from '../api/productionServices';

export const openMachineModal = (app: HTMLDivElement, machine?: any) => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in zoom-in-95';

  modal.innerHTML = `
    <div class="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative text-left">
      <h2 class="text-xl font-black text-[#0f172a] uppercase mb-8 tracking-tighter">
        ${machine ? 'Editar Máquina' : 'Nueva Máquina'}
      </h2>
      
      <form id="machine-form" class="space-y-4">
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 block">Nombre del Modelo</label>
          <input type="text" name="name" placeholder="Ej: Ender 3 V2" value="${machine?.name || ''}" required 
                 class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20">
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 block">Tipo</label>
            <select name="type" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
              <option value="FDM" ${machine?.type === 'FDM' ? 'selected' : ''}>FDM</option>
              <option value="SLS" ${machine?.type === 'SLS' ? 'selected' : ''}>SLS</option>
            </select>
          </div>

          ${machine ? `
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 block">Estado</label>
            <select name="status" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
              <option value="idle" ${machine.status === 'idle' ? 'selected' : ''}>Libre</option>
              <option value="printing" ${machine.status === 'printing' ? 'selected' : ''}>Imprimiendo</option>
              <option value="maintenance" ${machine.status === 'maintenance' ? 'selected' : ''}>Mantenimiento</option>
            </select>
          </div>
          ` : ''}
        </div>

        <div class="flex gap-3 pt-6">
          <button type="button" id="close-modal" class="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
          <button type="submit" class="flex-[2] bg-[#0f172a] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-black transition-all">
            ${machine ? 'Actualizar' : 'Crear Máquina'}
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector('#machine-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      if (machine) {
        await productionService.updateMachine(machine.id, payload);
      } else {
        await productionService.createMachine(payload);
      }
      modal.remove();
      const { renderConfig } = await import('./configView');
      renderConfig(app); 
    } catch (err) {
      alert("Error al gestionar la máquina");
    }
  });

  modal.querySelector('#close-modal')?.addEventListener('click', () => modal.remove());
};
export const openMaterialModal = (app: HTMLDivElement, material?: any) => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in zoom-in-95';

  modal.innerHTML = `
    <div class="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative text-left">
      <h2 class="text-xl font-black text-[#0f172a] uppercase mb-8 tracking-tighter">
        ${material ? 'Editar Material' : 'Nuevo Material'}
      </h2>

      <form id="material-form" class="space-y-4">
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 block">Nombre</label>
          <input type="text" name="name" placeholder="Ej: PLA" value="${material?.name || ''}" required
                 class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 block">Marca</label>
          <input type="text" name="brand" placeholder="Ej: Hatchbox" value="${material?.brand || ''}"
                 class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
        </div>

        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 block">Tipo</label>
          <input type="text" name="type" placeholder="Ej: FDM" value="${material?.type || ''}"
                 class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
        </div>

        <div class="flex gap-3 pt-6">
          <button type="button" id="close-modal" class="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
          <button type="submit" class="flex-[2] bg-[#0f172a] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all">
            ${material ? 'Actualizar' : 'Crear Material'}
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector('#material-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      if (material && material.id) {
        await productionService.updateMaterial(material.id, payload);
      } else {
        await productionService.createMaterial(payload);
      }
      modal.remove();
      const { renderConfig } = await import('./configView');
      renderConfig(app);
    } catch (err) {
      alert("Error al gestionar el material");
    }
  });

  modal.querySelector('#close-modal')?.addEventListener('click', () => modal.remove());
};