
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

// Matches the backend OrderItem GORM model (stl_name JSON tag)
export interface OrderItem {
    id: number;
    stl_name: string;      // backend: StlName json:"stl_name"
    quantity: number;
    done_pieces: number;
    price?: number;        // per-item price
    material_id?: number;
    machine_id?: number;
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
    price?: number;       // order-level price (read-only view, computed by backend)
    total_price?: number; // backend: TotalPrice = sum of item prices
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
    stl_name: string;      // backend: StlName
    quantity: number;
    done_pieces?: number;
    material_id?: number;  // overrides order-level default
    machine_id?: number;   // overrides order-level default
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
    estimated_minutes?: number;
    deadline?: string;
    items?: UpdateOrderItemDTO[];
    operator_id?: number;
    material_id?: number | null;  // order-level default (if backend uses it)
    machine_id?: number | null;   // order-level default (if backend uses it)
}

// Matches backend UpdateOrderItemDTO exactly
export interface UpdateOrderItemDTO {
    id: number;
    stl_name: string;      // was product_name — backend uses StlName
    quantity: number;
    done_pieces: number;
    price: number;         // backend computes TotalPrice = sum of item prices
    material_id?: number;  // triggers machine status update on backend
    machine_id?: number;   // triggers machine release/assign on backend
}