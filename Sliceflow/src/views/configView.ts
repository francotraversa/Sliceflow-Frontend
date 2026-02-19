import { productionService } from '../api/productionServices';
import { openMachineModal, openMaterialModal } from './configModals';

export const renderConfig = async (app: HTMLDivElement) => {
  // Cargamos la data inicial
  const [materials, machines] = await Promise.all([
    productionService.getMaterials(),
    productionService.getMachines()
  ]);

  app.innerHTML = `
    <div class="min-h-screen bg-[#f8fafc] p-8 animate-in fade-in duration-500">
      <header class="max-w-7xl mx-auto mb-10 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-black text-[#0f172a] uppercase tracking-tighter">Configuración</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Gestión de Recursos • Hornero 3DX</p>
        </div>
        <button id="btn-back-prod" class="px-6 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-all">← Volver</button>
      </header>

      <main class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        <section class="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-black text-[#0f172a] uppercase text-sm tracking-widest">Materiales</h3>
            <button id="add-material" class="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-100">+ Nuevo</button>
          </div>
          <div class="space-y-3">
            ${materials.map((m: any) => `
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <div>
                  <p class="font-black text-slate-700 text-sm">${m.name}</p>
                  <p class="text-[9px] font-bold text-slate-400 uppercase">${m.brand} • ${m.type}</p>
                </div>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="edit-mat text-blue-500 text-xs font-bold" data-id="${m.id}">Editar</button>
                  <button class="delete-mat text-red-400 text-xs font-bold" data-id="${m.id}">Eliminar</button>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <section class="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-black text-[#0f172a] uppercase text-sm tracking-widest">Máquinas</h3>
            <button id="add-machine" class="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100">+ Nueva</button>
          </div>
          <div class="space-y-3">
            ${machines.map((mac: any) => `
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <div>
                  <p class="font-black text-slate-700 text-sm">${mac.name}</p>
                  <p class="text-[9px] font-bold text-slate-400 uppercase">${mac.type} • ID: ${mac.id}</p>
                </div>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="edit-mac text-blue-500 text-xs font-bold" data-id="${mac.id}">Editar</button>
                  <button class="delete-mac text-red-400 text-xs font-bold" data-id="${mac.id}">Eliminar</button>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

      </main>
    </div>
  `;

  // Listeners
  document.getElementById('add-material')?.addEventListener('click', () => openMaterialModal(app));
  document.getElementById('add-machine')?.addEventListener('click', () => openMachineModal(app));
  
  // Botón Volver
  document.getElementById('btn-back-prod')?.addEventListener('click', async () => {
    const { renderProduction } = await import('./productionView');
    const data = await productionService.getProductionDashboard();
    renderProduction(app, data);
  });
  app.querySelectorAll('.delete-mat').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const id = Number((e.target as HTMLElement).dataset.id);
    if (confirm("¿Seguro que querés borrar este material? Se perderá el stock asociado.")) {
      await productionService.deleteMaterial(id);
      renderConfig(app);
    }
  });
});

// Eliminar Máquina
app.querySelectorAll('.delete-mac').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const id = Number((e.target as HTMLElement).dataset.id);
    if (confirm("¿Borrar máquina? Se desvinculará de las órdenes actuales.")) {
      await productionService.deleteMachine(id);
      renderConfig(app);
    }
  });
});

// Editar Material (abre el modal con data)
app.querySelectorAll('.edit-mat').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const id = Number((e.target as HTMLElement).dataset.id);
    const mat = materials.find((m: any) => m.id === id);
    openMaterialModal(app, mat);
  });
});
};