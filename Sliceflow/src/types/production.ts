
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

export interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    done_pieces: number;
}

export interface ProductionOrder {
    id: number;        // DB auto-increment primary key
    id_order?: number; // Company's manual order number (e.g. 24)
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
    status: string; // pending, in-progress, ready, completed, cancelled
    done_pieces: number;
    operator_id: number;
    price?: number;
}

export interface ProductionDashboardResponse {
    active_jobs: number;
    utilization_rate: number;
    revenue_fdm?: number;
    revenue_sls?: number;
    machines: Machine[];
    active_orders: ProductionOrder[];
}

export interface CreateOrderItemDTO {
    product_name: string;
    quantity: number;
    done_pieces?: number;
    material_id?: number; // overrides order-level default
    machine_id?: number;  // overrides order-level default
}

export interface CreateOrderDTO {
    id?: number;           // Manual ID (e.g. 2026)
    client_name: string;
    items: CreateOrderItemDTO[];
    material_id: number;
    machine_id?: number;
    priority: string;      // P1, P2, P3
    notes: string;
    estimated_minutes: number; // total minutes (hours * 60 + mins)
    deadline: string;          // "YYYY-MM-DD"
    operator_id: number;
    price?: number;
}

export interface UpdateOrderDTO {
    client_name?: string;
    total_pieces?: number;
    done_pieces?: number;
    priority?: string;
    notes?: string;
    status?: string;
    price?: number;
    estimated_minutes?: number;
    deadline?: string;
    items?: UpdateOrderItemDTO[];
    operator_id?: number;
    material_id?: number | null;
    machine_id?: number | null;
}

export interface UpdateOrderItemDTO {
    id: number;
    product_name: string;
    quantity: number;
    done_pieces: number;
}