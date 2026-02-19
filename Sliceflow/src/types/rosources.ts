export interface Material {
  id: number;
  name: string;
  type: string;
  description: string;
  brand: string;
  created_at: string;
}

export interface Machine {
  id: number;
  name: string;
  type: 'FDM' | 'SLS';
  status: 'idle' | 'printing' | 'maintenance';
}