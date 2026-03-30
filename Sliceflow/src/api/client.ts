const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** Call this when any request returns 401 — clears session and shows login */
export const handleUnauthorized = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('expires');
  window.location.reload(); // re-render will show login since token is gone
};

export const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error en la petición: ${response.status}`);
  }

  return response.json();
};