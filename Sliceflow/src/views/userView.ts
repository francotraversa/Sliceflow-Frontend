import { userService } from "../api/userService";
import { stockService } from "../api/stockServices";
import { renderDashboard } from "./dashboardView";
import { getUserFromToken } from "../api/authServices";
import type { UserRole, UserUpdateCreds, UserCreateCreds } from "../types/user";

// --- HELPERS PARA BADGES ---
const roleBadge = (role: string) => 
  role.toLowerCase() === "admin" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700";

const statusBadge = (s: string) => 
  s.toLowerCase() === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700";

// --- MODAL: AGREGAR USUARIO ---
const renderCreateUserModal = (onDone: () => Promise<void>) => {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 font-sans";

  modal.innerHTML = `
    <div class="bg-white w-full max-w-lg rounded-[32px] p-10 shadow-2xl relative text-left animate-in zoom-in-95">
      <button id="close-user-modal" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
      <h3 class="text-2xl font-black text-[#0f172a] mb-2 uppercase tracking-tighter">Nuevo Operario</h3>
      <p class="text-slate-500 text-sm mb-6">Se creará una nueva cuenta en Sliceflow.</p>

      <form id="create-user-form" class="space-y-4">
        <div>
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Username</label>
          <input name="username" required class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
        </div>
        <div>
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Password</label>
          <input name="password" type="password" required class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
          <p class="text-[9px] font-bold text-slate-400 mt-1 ml-1">* Mínimo 6 caracteres.</p>
        </div>
        <div>
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Rol</label>
          <select name="role" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
            <option value="user" selected>User (Operario)</option>
            <option value="admin">Admin (Administrador)</option>
          </select>
        </div>
        <button id="btn-submit-user" type="submit" class="w-full py-5 bg-[#0f172a] text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest mt-4">Lanzar Alta</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector("#close-user-modal")?.addEventListener("click", () => modal.remove());

  const form = modal.querySelector("#create-user-form") as HTMLFormElement;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = modal.querySelector("#btn-submit-user") as HTMLButtonElement;
    btn.disabled = true; btn.innerText = "PROCESANDO...";

    try {
      const fd = new FormData(form);
      const payload: UserCreateCreds = {
        username: String(fd.get("username")).trim().toLowerCase(),
        password: String(fd.get("password")).trim(),
        role: fd.get("role") as UserRole
      };
      await userService.create(payload);
      modal.remove();
      await onDone();
    } catch (err: any) {
      alert(err.message || "Error al crear usuario");
      btn.disabled = false; btn.innerText = "Lanzar Alta";
    }
  });
};

// --- MODAL: EDITAR USUARIO ---
const renderEditUserModal = (u: any, onDone: () => Promise<void>) => {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 font-sans";

  modal.innerHTML = `
    <div class="bg-white w-full max-w-lg rounded-[32px] p-10 shadow-2xl relative text-left">
      <h3 class="text-2xl font-black text-[#0f172a] mb-6 uppercase tracking-tighter">Editar Usuario #${u.ID}</h3>
      <form id="edit-user-form" class="space-y-4">
        <div>
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Username</label>
          <input name="username" value="${u.Username}" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
        </div>
        <div>
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Nuevo Password</label>
          <input name="password" type="password" placeholder="Dejar vacío para no cambiar" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
        </div>
        <div>
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Rol</label>
          <select name="role" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
            <option value="user" ${u.Role.toLowerCase() === "user" ? "selected" : ""}>User</option>
            <option value="admin" ${u.Role.toLowerCase() === "admin" ? "selected" : ""}>Admin</option>
          </select>
        </div>
        <div class="flex gap-2 pt-4">
          <button type="button" id="close-edit" class="flex-1 py-4 font-black uppercase text-slate-400 text-[10px]">Cancelar</button>
          <button type="submit" id="btn-save-edit" class="flex-[2] py-4 bg-[#0f172a] text-white font-black rounded-2xl uppercase text-[10px] tracking-widest">Guardar Cambios</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector("#close-edit")?.addEventListener("click", () => modal.remove());

  const form = modal.querySelector("#edit-user-form") as HTMLFormElement;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = modal.querySelector("#btn-save-edit") as HTMLButtonElement;
    btn.disabled = true; btn.innerText = "GUARDANDO...";

    try {
      const fd = new FormData(form);
      const payload: UserUpdateCreds = {
        username: String(fd.get("username")),
        password: String(fd.get("password")),
        role: fd.get("role") as UserRole
      };
      await userService.update(u.ID, payload);
      modal.remove();
      await onDone();
    } catch (err: any) {
      alert(err.message || "Error al actualizar");
      btn.disabled = false; btn.innerText = "Guardar Cambios";
    }
  });
};

// --- VISTA PRINCIPAL ---
export const renderUsers = async (app: HTMLDivElement) => {
  const me = getUserFromToken(); 
  const isAdmin = me.role === "admin";
  let users: any[] = [];
  
  const load = async () => {
    try { users = await userService.list(); }
    catch (e) { console.error("Error cargando usuarios:", e); }
  };

  await load();

  app.innerHTML = `
    <div class="min-h-screen bg-[#f0f4f8] font-sans text-[#1e293b]">
      <header class="bg-white border-b-2 border-[#4391d4]/20 px-8 py-4 flex justify-between items-center shadow-md">
        <div class="flex items-center gap-4 text-left">
          <div class="bg-[#4391d4] p-2 rounded-xl shadow-lg shadow-[#4391d4]/30">
            <img src="/logo.png" alt="Logo" class="w-8 h-8 object-contain invert">
          </div>
          <div>
            <h1 class="font-black text-2xl leading-none tracking-tight text-[#0f172a]">Hornero3DX</h1>
            <p class="text-[11px] text-[#4391d4] uppercase tracking-[0.2em] font-black mt-1">Usuarios</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-right leading-tight">
            <div class="text-[12px] font-black text-[#0f172a]">${me.user}</div>
            <div class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">${me.role}</div>
          </div>
          <button id="btn-i3d" class="px-4 py-2 rounded-xl border border-slate-200 font-black text-[11px] hover:bg-slate-50 transition-all">I3D</button>
          <button id="btn-dashboard" class="px-4 py-2 rounded-xl border border-slate-200 font-black text-[11px] hover:bg-slate-50 transition-all">Dashboard</button>
        </div>
      </header>

      <main class="p-8 max-w-7xl mx-auto">
        <div class="bg-white rounded-[24px] shadow-sm border border-slate-200 p-8">
          <div class="flex flex-wrap gap-4 items-center justify-between mb-6">
            <div class="text-left">
              <h2 class="text-2xl font-black text-[#0f172a]">Gestión de usuarios</h2>
              <p class="text-slate-500 text-sm italic">Admin gestiona todo. Operarios solo su cuenta.</p>
            </div>
            <div class="flex gap-2 items-center">
              <input id="user-search" placeholder="Buscar por username..." class="pl-4 pr-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold">
              ${isAdmin ? `<button id="btn-add-user" class="bg-[#0f172a] text-white px-6 py-3 rounded-xl font-black shadow-lg hover:bg-black uppercase text-[11px] tracking-widest transition-all">＋ Agregar Usuario</button>` : ''}
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[12px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                  <th class="px-6 py-4">Usuario</th>
                  <th class="px-6 py-4">Rol</th>
                  <th class="px-6 py-4">Estado</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody id="users-body" class="divide-y divide-slate-50"></tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;

  const usersBody = app.querySelector("#users-body") as HTMLTableSectionElement;
  const searchInput = app.querySelector("#user-search") as HTMLInputElement;

  const draw = (list: any[]) => {
    const term = (searchInput?.value || "").toLowerCase().trim();
    const filtered = list.filter(u => u.Username && u.Username.toLowerCase().includes(term));

    usersBody.innerHTML = filtered.map((u) => {
      const role = (u.Role || "user").toLowerCase();
      const status = (u.Status || "active").toLowerCase();
      const isOwner = me.user_id === u.ID;
      const meTag = isOwner ? `<span class="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-[#4391d4] text-[10px] font-black uppercase tracking-tighter">Vos</span>` : "";

      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-6 py-4 text-left">
            <div class="font-black text-[#0f172a]">${u.Username}${meTag}</div>
            <div class="text-slate-400 text-xs">ID #${u.ID}</div>
          </td>
          <td class="px-6 py-4">
            <span class="px-3 py-1 rounded-full text-[11px] font-black ${roleBadge(role)}">${role}</span>
          </td>
          <td class="px-6 py-4">
            <span class="px-3 py-1 rounded-full text-[11px] font-black ${statusBadge(status)}">${status}</span>
          </td>
          <td class="px-6 py-4 text-right">
            <div class="flex justify-end gap-2">
              <button class="btn-edit-user p-2 border border-slate-200 rounded-lg hover:bg-slate-100" data-id="${u.ID}">✏️</button>
              ${status === "active" 
                ? `<button class="btn-disable-user p-2 border border-slate-200 rounded-lg hover:bg-red-50" data-id="${u.ID}">🗑️</button>`
                : `<button class="btn-enable-user px-3 py-2 border border-slate-200 rounded-lg hover:bg-emerald-50 text-[10px] font-black uppercase" data-id="${u.ID}">Enable</button>`
              }
            </div>
          </td>
        </tr>`;
    }).join("");
    bindRowListeners();
  };

  const reload = async () => { await load(); draw(users); };

  const bindRowListeners = () => {
    app.querySelectorAll(".btn-edit-user").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number((btn as HTMLElement).dataset.id);
        const u = users.find(x => x.ID === id);
        if (u) renderEditUserModal(u, reload);
      });
    });

    app.querySelectorAll(".btn-disable-user").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = Number((btn as HTMLElement).dataset.id);
        if (confirm(`¿Deshabilitar al usuario #${id}?`)) {
          try {
            await userService.disable(id);
            await reload();
          } catch (e) { alert(e); }
        }
      });
    });

    app.querySelectorAll(".btn-enable-user").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = Number((btn as HTMLElement).dataset.id);
        try {
          await userService.enable(id);
          await reload(); 
        } catch (e) {
          alert("Error al habilitar el usuario");
        }
      });
    });
  };

  // --- LISTENERS GENERALES ---
  searchInput?.addEventListener("input", () => draw(users));
  app.querySelector("#btn-add-user")?.addEventListener("click", () => renderCreateUserModal(reload));
  
  app.querySelector("#btn-dashboard")?.addEventListener("click", async () => {
  try {
      const data = await stockService.getDashboard();
      renderDashboard(data, app); 
    } catch (error) {
      console.error("Error al volver al dashboard:", error);
    }
  });
  
  app.querySelector("#btn-i3d")?.addEventListener("click", async () => {
      const { renderProduction } = await import('./productionView');
      const data = await (await import('../api/productionServices')).productionService.getProductionDashboard();
      renderProduction(app, data);
  });

  draw(users);
};