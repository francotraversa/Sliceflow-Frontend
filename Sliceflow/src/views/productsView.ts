import { stockService } from '../api/stockServices';
import { renderDashboard } from './dashboardView';
import { renderMovements } from './movementsView';
import type { ProductCreateRequest, Product, ProductUpdateRequest } from '../types/stock';
import { getUserFromToken } from '../api/authServices';
const { role } = getUserFromToken();
const isAdmin = role.toLowerCase() === 'admin';
// -------------------------------
// MODAL: NUEVO PRODUCTO
// -------------------------------
const renderAddProductModal = (app: HTMLDivElement) => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans';

  modal.innerHTML = `
    <div class="bg-white w-full max-w-lg rounded-[32px] p-10 shadow-2xl animate-in zoom-in-95 duration-200 relative text-left">
      <button id="close-add-modal" class="absolute top-6 right-6 text-slate-400 hover:text-red-500 text-2xl font-black transition-colors">×</button>

      <h3 class="text-2xl font-black text-[#0f172a] mb-8 uppercase tracking-tighter">Nuevo Producto</h3>

      <form id="add-product-form" class="space-y-6">
        <div class="space-y-2">
          <label class="text-[11px] font-black uppercase text-slate-400 ml-1">Nombre</label>
          <input type="text" name="name" required class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#4391d4]/10">
        </div>

        <div class="space-y-2">
          <label class="text-[11px] font-black uppercase text-slate-400 ml-1">Descripción</label>
          <input type="text" name="description" required class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#4391d4]/10">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 ml-1">SKU</label>
            <input type="text" name="sku" required class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
          </div>
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 ml-1">Precio</label>
            <input type="number" name="price" step="0.01" required class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 ml-1">Stock Inicial</label>
            <input type="number" name="quantity" required class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
          </div>
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 ml-1">Stock Mínimo</label>
            <input type="number" name="min_qty" required class="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
          </div>
        </div>

        <button id="btn-add-submit" type="submit"
          class="w-full bg-[#0f172a] text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-sm mt-4 active:scale-95 transition-all">
          Guardar Producto
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#close-add-modal')?.addEventListener('click', () => modal.remove());

  const form = modal.querySelector('#add-product-form') as HTMLFormElement;
  const btn = modal.querySelector('#btn-add-submit') as HTMLButtonElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    btn.disabled = true;
    btn.innerText = 'PROCESANDO...';

    try {
      const fd = new FormData(form);

      const productData: ProductCreateRequest = {
        sku: String(fd.get('sku') ?? '').trim(),
        name: String(fd.get('name') ?? '').trim(),
        price: Number(fd.get('price')),
        quantity: Number(fd.get('quantity')),
        min_qty: Number(fd.get('min_qty')),
        description: String(fd.get('description') ?? '').trim(),
      };

      if (!productData.name || !productData.sku) throw new Error('Datos inválidos');

      await stockService.createProduct(productData);

      modal.remove();
      const fresh = await stockService.getProducts();
      renderProducts(fresh, app);
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.innerText = 'Guardar Producto';
      alert('Error al crear producto');
    }
  });
};

// -------------------------------
// MODAL: MOVIMIENTO DE STOCK
// Producto + IN/OUT + Descripción
// -------------------------------
const renderStockMovementModal = (app: HTMLDivElement, products: Product[], preselectedSku?: string) => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans';

  modal.innerHTML = `
    <div class="bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl relative text-left animate-in zoom-in-95 duration-200">
      <button id="close-mov-modal" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-xl font-bold transition-colors">✕</button>

      <h3 class="text-2xl font-black text-[#0f172a] mb-6 uppercase tracking-tighter">
        Movimiento de Stock
      </h3>

      <form id="mov-stock-form" class="space-y-4">
        <div class="relative" id="product-combobox">
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Producto</label>

          <input type="text" 
                 id="product-search" 
                 placeholder="Escribí para buscar..." 
                 class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0f172a]/10 transition-all"
                 value="${preselectedSku ? products.find(p => p.sku === preselectedSku)?.name : ''}"
                 autocomplete="off">

          <input type="hidden" name="sku" id="selected-sku" value="${preselectedSku || ''}" required>

          <div id="product-results" class="hidden absolute left-0 right-0 top-[105%] bg-white border border-slate-200 shadow-2xl rounded-2xl max-h-60 overflow-y-auto z-50 p-2 custom-scrollbar">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Tipo</label>
            <select name="type" required class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
              <option value="IN">↑ Entrada</option>
              <option value="OUT">↓ Salida</option>
              <option value="ADJUSTMENT">↔ Ajuste</option>
              <option value="INTERNAL_USE">🧩 Uso interno</option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Cantidad</label>
            <input type="number" name="quantity" min="1" step="1" required placeholder="1"
              class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none">
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Motivo del Ajuste</label>
          <select name="reason" required class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none cursor-pointer hover:border-blue-300 transition-colors">
            <option value="" disabled selected>Seleccioná un motivo...</option>
            <option value="Venta">Venta</option>
            <option value="Compra">Compra / Reposición</option>
            <option value="Ajuste">Ajuste de Inventario (Manual)</option>
            <option value="Desperdicio">Desperdicio / Error de Impresión</option>
            <option value="Uso Interno">Uso Interno / Pruebas</option>
            <option value="Devolución">Devolución de Cliente</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Descripción</label>
          <textarea name="description" required placeholder="Detalle del movimiento..."
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none min-h-[110px]"></textarea>
        </div>

        <button type="submit" id="btn-submit-mov"
          class="w-full py-5 bg-[#0f172a] text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest mt-2 active:scale-95 transition-all">
          Confirmar
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // --- LÓGICA DE FILTRADO (ESTO ES LO QUE BUSCABAS) ---
  const searchInput = modal.querySelector('#product-search') as HTMLInputElement;
  const resultsDiv = modal.querySelector('#product-results') as HTMLDivElement;
  const hiddenSkuInput = modal.querySelector('#selected-sku') as HTMLInputElement;

  searchInput.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value.toLowerCase();
    
    if (!val) {
      hiddenSkuInput.value = '';
      resultsDiv.classList.add('hidden');
      return;
    }

    // Filtramos productos por nombre o SKU
    const matches = products.filter(p => 
      p.name.toLowerCase().includes(val) || p.sku.toLowerCase().includes(val)
    );

    if (matches.length > 0) {
      resultsDiv.classList.remove('hidden');
      resultsDiv.innerHTML = matches.map(p => `
        <div class="product-option p-4 hover:bg-slate-50 cursor-pointer rounded-xl font-bold text-sm text-slate-700 transition-colors flex justify-between items-center" 
             data-sku="${p.sku}" data-name="${p.name}">
          <span>${p.name}</span>
          <span class="text-[9px] text-slate-400 uppercase font-black px-2 py-1 bg-slate-100 rounded-md">${p.sku}</span>
        </div>
      `).join('');

      // Listener para seleccionar producto
      resultsDiv.querySelectorAll('.product-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLElement;
          searchInput.value = target.dataset.name!;
          hiddenSkuInput.value = target.dataset.sku!;
          resultsDiv.classList.add('hidden');
        });
      });
    } else {
      resultsDiv.innerHTML = '<p class="p-4 text-[10px] font-black text-slate-300 uppercase text-center">Sin resultados</p>';
      resultsDiv.classList.remove('hidden');
    }
  });

  // Cerrar lista al clickear afuera
  modal.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target as Node) && !resultsDiv.contains(e.target as Node)) {
      resultsDiv.classList.add('hidden');
    }
  });

  // --- FIN LÓGICA FILTRADO ---

  modal.querySelector('#close-mov-modal')?.addEventListener('click', () => modal.remove());

  const form = modal.querySelector('#mov-stock-form') as HTMLFormElement;
  const btn = modal.querySelector('#btn-submit-mov') as HTMLButtonElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // ... (El resto de tu lógica de submit se mantiene igual)
    btn.disabled = true;
    btn.innerText = 'PROCESANDO...';

    try {
      const fd = new FormData(form);
      const sku = hiddenSkuInput.value; // Usamos el valor del input oculto
      const type = fd.get('type') as "IN" | "OUT";
      const quantity = Number(fd.get('quantity'));
      const description = String(fd.get('description'));

      if (!sku) throw new Error('Seleccioná un producto de la lista');
      
      await stockService.createMovement({
        sku,
        type,
        quantity,
        reason: String(fd.get('reason')),
        description,
        location_id: 1,
      });

      modal.remove();
      const fresh = await stockService.getProducts();
      renderProducts(fresh, app);
    } catch (err: any) {
      btn.disabled = false;
      btn.innerText = 'CONFIRMAR';
      alert(err?.message || 'Error');
    }
  });
};

// -------------------------------
// MODAL: EDITAR PRODUCTO
// nombre + precio + stock mínimo
// -------------------------------
const renderEditProductModal = (app: HTMLDivElement, product: Product) => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans';

  modal.innerHTML = `
    <div class="bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl relative text-left">
      <button id="close-edit-modal" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>

      <h3 class="text-2xl font-black text-[#0f172a] mb-6 uppercase tracking-tighter">
        Editar Producto
      </h3>

      <form id="edit-product-form" class="space-y-4">
        <div>
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Nombre</label>
          <input type="text" name="name" required value="${product.name}"
            class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Precio</label>
            <input type="number" step="0.01" name="price" required value="${product.price}"
              class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none">
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Stock Mínimo</label>
            <input type="number" name="min_qty" required value="${product.min_qty}"
              class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none">
          </div>
        </div>

        <button type="submit" id="btn-submit-edit"
          class="w-full py-5 bg-[#0f172a] text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest mt-4">
          Guardar Cambios
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector('#close-edit-modal')?.addEventListener('click', () => modal.remove());

  const form = modal.querySelector('#edit-product-form') as HTMLFormElement;
  const btn = modal.querySelector('#btn-submit-edit') as HTMLButtonElement;

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  btn.disabled = true;
  btn.innerText = 'PROCESANDO...';

  try {
    const fd = new FormData(form);

    const rawName = fd.get('name');
    const name = String(rawName ?? '').trim() || product.name;

    const rawPrice = fd.get('price');
    const price = rawPrice === null || rawPrice === '' ? product.price : Number(rawPrice);

    const rawMin = fd.get('min_qty');
    const min_qty = rawMin === null || rawMin === '' ? product.min_qty : Number(rawMin);

    if (!name) throw new Error('Nombre obligatorio');
    if (!Number.isFinite(price) || price < 0) throw new Error('Precio inválido');
    if (!Number.isFinite(min_qty) || min_qty < 0) throw new Error('Min qty inválido');

    const productData: ProductUpdateRequest = {
      sku: product.sku,
      name,
      price,
      min_qty: min_qty,                            
      description: product.description || '',
    };

    await stockService.updateProduct(productData.sku, productData);

    modal.remove();
    const fresh = await stockService.getProducts();
    renderProducts(fresh, app);
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.innerText = 'GUARDAR CAMBIOS';
    alert('Error al actualizar el producto.');
  }
});

};

// -------------------------------
// VISTA PRINCIPAL
// -------------------------------
export const renderProducts = (products: Product[], app: HTMLDivElement) => {
  app.innerHTML = `
    <div class="min-h-screen bg-[#f0f4f8] font-sans text-[#1e293b]">
      <header class="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div class="flex items-center gap-3">
          <div class="bg-[#4391d4] p-2 rounded-lg shadow-md">
            <img src="/logo.png" alt="Logo" class="w-6 h-6 object-contain invert">
          </div>
          <h1 class="font-black text-xl text-[#0f172a]">Hornero3DX</h1>
        </div>
        <button id="logout-btn" class="px-6 py-2 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg">Salir</button>
      </header>

      <nav class="px-8 mt-8 text-left">
        <div class="flex gap-3 bg-white p-2 rounded-2xl w-fit shadow-sm border border-slate-200">
          <button id="nav-dashboard" class="px-10 py-2.5 text-slate-500 hover:text-[#4391d4] text-sm font-bold hover:bg-blue-50 rounded-xl transition-all">Dashboard</button>
          <button class="px-10 py-2.5 bg-[#4391d4] text-white shadow-md rounded-xl text-sm font-black transition-all">Productos</button>
          <button id="nav-movements" class="px-10 py-2.5 text-slate-500 hover:text-[#4391d4] text-sm font-bold hover:bg-blue-50 rounded-xl transition-all">Movimientos</button>
        </div>
      </nav>

      <main class="p-8 max-w-7xl mx-auto">
        <div class="bg-white rounded-[24px] shadow-sm border border-slate-200 p-8">
          <div class="flex flex-wrap gap-4 mb-8">
            <div class="flex-1 min-w-[300px] relative text-left">
              <span class="absolute left-4 top-3.5 text-slate-400">🔍</span>
              <input type="text" id="search-products" placeholder="Filtrar productos..."
                class="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-[#4391d4]/10 transition-all">
            </div>

            <div class="flex gap-2">
              <button id="btn-stock-movement"
                class="bg-[#4391d4] text-white px-6 py-3 rounded-xl font-black shadow-lg hover:bg-[#367eb8] transition-all uppercase text-[10px] tracking-widest">
                🔁 Movimiento de stock
              </button>

              <button id="btn-open-add-modal"
                class="bg-[#0f172a] text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95 text-[10px] tracking-widest uppercase">
                + Nuevo Producto
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[12px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                  <th class="px-6 py-4">SKU</th>
                  <th class="px-6 py-4">Producto</th>
                  <th class="px-6 py-4 text-center">Stock Actual</th>
                  <th class="px-6 py-4 text-center">Precio</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody id="products-table-body" class="divide-y divide-slate-50">
                ${products.map((p: Product) => `
                  <tr class="hover:bg-slate-50 transition-colors group">
                    <td class="px-6 py-5 font-black text-[#0f172a]">${p.name}</td>
                    <td class="px-6 py-5 font-bold text-slate-500">
                      <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black">${p.sku} </span>
                    </td>
                    <td class="px-6 py-5 text-center font-black ${p.quantity <= p.min_qty ? 'text-red-500' : 'text-slate-700'}">${p.quantity}</td>
                    <td class="px-6 py-5 text-center font-black text-slate-700">$${p.price}</td>

                    <td class="px-6 py-5 text-right flex justify-end gap-2">
                      <button
                        class="btn-edit-product bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold text-[10px] uppercase hover:bg-slate-200 transition-all"
                        data-sku="${p.sku}">
                        Editar
                      </button>

                      <button
                        class="btn-delete-product p-2 border border-slate-100 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                        data-sku="${p.sku}"
                        data-name="${p.name}">
                        🗑️
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;

  // NAV
  document.getElementById('nav-dashboard')?.addEventListener('click', async () => {
    const data = await stockService.getDashboard();
    renderDashboard(data, app);
  });

  document.getElementById('nav-movements')?.addEventListener('click', async () => {
    const movements = await stockService.getMovements();
    renderMovements(movements, app);
  });

  document.getElementById('btn-stock-movement')?.addEventListener('click', () => {
  renderStockMovementModal(app, products);
    });



  document.getElementById('btn-open-add-modal')?.addEventListener('click', () => {
    renderAddProductModal(app);
  });

  // EDIT
  document.querySelectorAll('.btn-edit-product').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sku = (btn as HTMLElement).getAttribute('data-sku')!;
      const product = products.find(p => p.sku === sku);
      if (!product) return;
      renderEditProductModal(app, product);
    });
  });

  // DELETE
  document.querySelectorAll('.btn-delete-product').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sku = (btn as HTMLElement).getAttribute('data-sku');
      const name = (btn as HTMLElement).getAttribute('data-name');
      if (!sku) return;

      if (confirm(`¿Eliminar ${name}?`)) {
        try {
          await stockService.deleteProduct(sku);
          const fresh = await stockService.getProducts();
          renderProducts(fresh, app);
        } catch (err) {
          console.error(err);
          alert('Error al eliminar');
        }
      }
    });
  });

  // SEARCH
  const searchInput = document.getElementById('search-products') as HTMLInputElement;
  searchInput?.addEventListener('input', (e) => {
    const term = (e.target as HTMLInputElement).value.toLowerCase();
    document.querySelectorAll('#products-table-body tr').forEach((row) => {
      const text = (row as HTMLElement).textContent?.toLowerCase() || '';
      (row as HTMLElement).style.display = text.includes(term) ? '' : 'none';
    });
  });
  
};
