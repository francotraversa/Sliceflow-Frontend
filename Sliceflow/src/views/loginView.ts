import { authService } from '../api/authServices';
import { type UserLoginCreds } from '../types/auth';

export const renderLogin = (error: string | null = null, app: HTMLDivElement) => {
  app.innerHTML = `
    <div class="flex min-h-screen bg-[#f0f4f8] font-sans">
      <div class="hidden lg:flex flex-col justify-between w-[45%] bg-[#0f172a] p-16 text-white relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-20">
            <span class="text-xl font-bold tracking-tight">Hornero3DX</span>
          </div>
          <h1 class="text-6xl font-extrabold leading-tight mb-8">Control de Stock y Produccion<br>para tu Laboratorio</h1>
          <p class="text-slate-400 text-lg max-w-md">Gestiona tus insumos y tu produccion en tiempo real.</p>
        </div>
        <div class="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-[#4391d4]/10 rounded-full blur-3xl"></div>
      </div>

      <div class="flex-1 flex items-center justify-center p-8 lg:p-24">
        <div class="w-full max-w-md text-center lg:text-left">
          <div class="mb-12">
            <h2 class="text-4xl font-black text-[#0f172a] mb-3 uppercase tracking-tighter">Iniciar Sesión</h2>
            <p class="text-slate-500 font-medium">Ingresá tus credenciales de Sliceflow</p>
          </div>
          
          <form id="login-form" class="space-y-6">
            ${error ? `<div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold animate-pulse text-left">⚠️ ${error}</div>` : ''}
            
            <div class="space-y-2 text-left">
              <label class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Usuario</label>
              <input type="text" id="username" placeholder="hornero3dx" required 
                class="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#4391d4]/10 focus:border-[#4391d4] outline-none transition-all">
            </div>

            <div class="space-y-2 text-left">
              <label class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Contraseña</label>
              <input type="password" id="password" placeholder="••••••••" required 
                class="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#4391d4]/10 focus:border-[#4391d4] outline-none transition-all">
            </div>

            <button type="submit" id="submit-btn" 
              class="w-full bg-[#4391d4] text-white font-black py-5 rounded-2xl shadow-xl shadow-[#4391d4]/20 uppercase tracking-widest text-sm transition-all hover:-translate-y-1 active:scale-95">
              Ingresar al Sistema
            </button>
          </form>
        </div>
      </div>
    </div>`;

  const form = document.getElementById('login-form') as HTMLFormElement;
  const btn = document.getElementById('submit-btn') as HTMLButtonElement;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Feedback visual de carga
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block mr-2">↻</span> Autenticando...`;

    const credentials: UserLoginCreds = {
      username: (document.getElementById('username') as HTMLInputElement).value,
      password: (document.getElementById('password') as HTMLInputElement).value
    };

    try {
      await authService.login(credentials);
      window.location.reload(); 
    } catch (err) {
      console.error("Error de login:", err);
      renderLogin("Usuario o contraseña incorrectos", app);
    }
  });
};