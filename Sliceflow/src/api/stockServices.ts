const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import type { ProductCreateRequest, Product, CreateMovementPayload } from '../types/stock';

export const stockService = {
  getDashboard: async () => {
    const token = localStorage.getItem('token'); 
    const res = await fetch(`${API_BASE_URL}/hornero/authed/stock/movement/dashboard?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Error en el servidor');
    return await res.json();
  },

  getProducts: async (): Promise<Product[]> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/hornero/authed/stock/list?t=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  },

  createProduct: async (productData: ProductCreateRequest) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/hornero/authed/stock/addprod`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    },
  );
    if (!res.ok) throw new Error('Error al crear el producto');
    return await res.json();
  },

  deleteProduct: async (sku: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/hornero/authed/stock/delprod/${sku}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('No se pudo eliminar');
    return await res.json();
  },

  updateProduct: async (sku: string, data: Partial<Product>): Promise<void> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/hornero/authed/stock/updprod/${sku}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Error al actualizar el producto');
  }
  },

  createMovement: async (movementData: CreateMovementPayload) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/hornero/authed/stock/movement/addmov`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(movementData),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "Error al registrar el movimiento");
    }
    return await res.json();
  },
  
  getMovements: async (filter?: { sku?: string; start_date?: string; end_date?: string; type?: string }) => {
  const token = localStorage.getItem('token');

  const params = new URLSearchParams();
  if (filter?.sku) params.set('sku', filter.sku);
  if (filter?.start_date) params.set('start_date', filter.start_date);
  if (filter?.end_date) params.set('end_date', filter.end_date);
  if (filter?.type) params.set('type', filter.type);

  params.set('t', Date.now().toString()); // cache-busting

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/hornero/authed/stock/movement/historic?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error('Error al cargar históricos');
  return await res.json();
  },



};