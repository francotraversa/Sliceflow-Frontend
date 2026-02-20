// src/api/productionServices.ts
import type { CreateOrderDTO, ProductionDashboardResponse, ProductionOrder } from '../types/production';
import type { UpdateOrderDTO } from '../types/production';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const productionService = {

  getProductionDashboard: async (): Promise<ProductionDashboardResponse> => {
    const token = localStorage.getItem('token');
    
    const res = await fetch(`${API_BASE_URL}/hornero/authed/orders/dashboard`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      }
    });

    if (!res.ok) {
      throw new Error('Error al conectar con el servidor de producción');
    }

    return await res.json();
  },
  getHistoricalOrders: async (filters?: { status?: string, from_date?: string, to_date?: string, id?: string }) => {
    const token = localStorage.getItem('token');
    
    // Construimos los parámetros de búsqueda dinámicamente
    const params = new URLSearchParams();
    if (filters) {
        if (filters.status) params.append('status', filters.status);
        if (filters.from_date) params.append('from_date', filters.from_date);
        if (filters.to_date) params.append('to_date', filters.to_date);
        if (filters.id) params.append('id', filters.id);
    }

    const url = `${API_BASE_URL}/hornero/authed/orders/list?${params.toString()}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error('Error al obtener el historial de órdenes');
    }
    return await res.json();
},
  updateOrder: async (orderId: number, updateData: UpdateOrderDTO) => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const res = await fetch(`${API_BASE_URL}/hornero/authed/orders/updord/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!res.ok) throw new Error('Error al actualizar la orden');
    return await res.json();
  },
  deleteOrder: async (orderId: number) => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const res = await fetch(`${API_BASE_URL}/hornero/authed/orders/delord/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error('No se pudo eliminar la orden');
    return true;
  },
  createOrder: async (orderData: CreateOrderDTO) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/hornero/authed/orders/order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error('Error al crear la orden');
    return await res.json();
},
  getMaterials: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/hornero/authed/materials/list`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  },

  getMachines: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/hornero/authed/machine/list`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  },
  createMaterial: async (data: any) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/hornero/authed/materials/addmat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
},
updateMaterial: async (id: number, data: any) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/hornero/loged/materials/updmat/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
},
deleteMaterial: async (id: number) => {
  const token = localStorage.getItem('token');
  await fetch(`${API_BASE_URL}/hornero/loged/materials/delmat/${id}`, { 
    method: 'DELETE', 
    headers: { 'Authorization': `Bearer ${token}` } 
  });
},
createMachine: async (data: any) => {
    const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE_URL}/hornero/authed/machine/addmac`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
},
updateMachine: async (id: number, data: any) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/hornero/authed/machine/updmac/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
},
deleteMachine: async (id: number) => {
    const token = localStorage.getItem('token');
  await fetch(`${API_BASE_URL}/hornero/authed/machine/delmac/${id}`, { 
    method: 'DELETE', 
    headers: { 'Authorization': `Bearer ${token}` } 
  });
},
getOrderById: async (id: string | number): Promise<ProductionOrder> => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/hornero/authed/orders/list?id=${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error("Error fetching order");
        const data = await response.json();
        return Array.isArray(data) ? data[0] : data;
    }
};