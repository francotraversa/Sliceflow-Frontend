
export interface Material {
    id: number;
    name: string;
    type: string;
    brand?: string;
}

export interface Machine {
    id: number;
    name: string;
    type: string;
    status: string;
}

export interface ProductionOrder {
    id: number;
    created_at: string;
    updated_at: string;
    client_name: string;
    items: OrderItem[];
    material_id: number;
    material?: Material; 
    machine_id?: number;
    machine?: Machine;
    priority: string; // P1, P2, P3
    notes: string;
    total_pieces: number;
    estimated_minutes: number;
    deadline: string;
    finish_time?: string;
    status: string; // pending, in-progress, completed
    done_pieces: number;
    operator_id: number;
    price?: number;
}

export interface ProductionDashboardResponse {
    active_jobs: number;      // json:"active_jobs"
    utilization_rate: number; // json:"utilization_rate"
    revenue_fdm?: number;     // json:"revenue_fdm,omitempty"
    revenue_sls?: number;     // json:"revenue_sls,omitempty"
    machines: Machine[];      // json:"machines"
    active_orders: ProductionOrder[]; // json:"active_orders"
}

export interface UpdateOrderDTO {
    client_name?: string;
    product_details?: string;
    total_pieces?: number;
    done_pieces?: number;
    priority?: string;
    notes?: string;
    status?: string;
    price?: number;
    estimated_hours?: number;
    estimated_minutes?: number;
    deadline?: string;
    items?: CreateOrderItemDTO[];
    operator_id?: number;
    material_id?: number | null;
    machine_id?: number | null;
}




// types/production.ts

export interface CreateOrderItemDTO {
    product_name: string;
    quantity: number;
}

export interface CreateOrderDTO {
    id?: number; // Para el ID manual (ej: 2026)
    client_name: string;
    items: CreateOrderItemDTO[]; 
    material_id: number;
    machine_id?: number;
    priority: string;
    notes: string;
    estimated_hours: number;
    estimated_minutes: number;
    deadline: string; // "YYYY-MM-DD"
    operator_id: number;
    price?: number;
}

export interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    done_pieces: number;
}

export interface CreateOrderItemDTO {
    product_name: string;
    quantity: number;
}

export interface CreateOrderDTO {
    id?: number; // Para el ID manual solicitado
    client_name: string;
    items: CreateOrderItemDTO[]; 
    material_id: number;
    machine_id?: number;
    priority: string;
    notes: string;
    estimated_hours: number;
    estimated_minutes: number;
    deadline: string; // Formato "YYYY-MM-DD"
    operator_id: number;
    price?: number;
}