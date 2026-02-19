import type { User, UserCreateCreds, UserUpdateCreds } from "../types/user";

const API_BASE = import.meta.env.VITE_API_BASE_URL; // Ej: http://localhost:8080/hornero/authed

const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const userService = {
  // Llama a GetAllUserUserUseCase
  list: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/hornero/authed/admin/alluser`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Acceso denegado");
    return await res.json();
  },

  disable: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/hornero/authed/admin/deleteuser/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Error al deshabilitar");
  },

  enable: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/hornero/authed/admin/enableuser`, {
      method: 'PATCH', // Coincide con tu lógica de actualización parcial
      headers: getHeaders(),
      body: JSON.stringify({ id }) // Go bindea el body types.UserIDActivate
    });
    if (!res.ok) throw new Error("No se pudo habilitar");
  },

  // Llama a CreateUserUseCase
  create: async (payload: UserCreateCreds): Promise<void> => {
    const res = await fetch(`${API_BASE}/hornero/authed/admin/newuser`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al crear el usuario");
    }
  },

  // Llama a UpdateUserUseCase
  update: async (id: number, payload: UserUpdateCreds): Promise<void> => {
    const res = await fetch(`${API_BASE}/hornero/authed/edituser/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al actualizar");
    }
  },
};