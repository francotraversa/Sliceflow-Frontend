
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

/**
 * Matches backend OrderItem GORM struct.
 * IMPORTANT: Go field `StlName` has json tag "product_name"
 *            so the API returns items as { product_name: "...", ... }
 */
export interface OrderItem {
    id: number;
    order_id?: number;
    product_name: string;  // backend json:"product_name" (Go field: StlName)
    quantity: number;
    done_pieces: number;
    price?: number;        // per-item price
    weight?: number;       // gr/ml consumed
    time?: number;         // print time in minutes for this item
    material_id?: number;
    machine_id?: number;
    material?: { id: number; name: string };
    machine?:  { id: number; name: string };
}

/**
 * Matches backend ProductionOrder GORM struct.
 * No order-level material_id / machine_id — those are per-item only.
 */
export interface ProductionOrder {
    id: number;            // DB auto-increment PK
    id_order?: number;     // Company's manual order number (e.g. 7987)
    id_company?: number;
    created_at: string;
    updated_at: string;
    client_name: string;
    items: OrderItem[];
    priority: string;      // P1, P2, P3
    notes: string;
    total_pieces: number;
    estimated_minutes: number;
    deadline: string;
    finish_time?: string;
    status: string;        // pending, queued, in-progress, ready, completed, cancelled
    done_pieces: number;
    operator_id: number;
    total_price?: number;  // backend: TotalPrice = sum of item prices (decimal)
}

export interface ProductionDashboardResponse {
    active_jobs: number;
    utilization_rate: number;
    revenue_fdm?: number;
    revenue_sls?: number;
    machines: Machine[];
    active_orders: ProductionOrder[];
}

/**
 * Sent to POST /orders.
 * StlName → json:"stl_name" in CreateOrderItemDTO (different from OrderItem!)
 */
export interface CreateOrderItemDTO {
    stl_name: string;      // backend CreateOrderItemDTO json:"stl_name"
    quantity: number;
    done_pieces?: number;
    price: number;
    weight?: number;
    time?: number;
    material_id?: number;
    machine_id?: number;
}

export interface CreateOrderDTO {
    id?: number;
    client_name: string;
    items: CreateOrderItemDTO[];
    priority: string;
    notes: string;
    estimated_hours: number;
    estimated_minutes: number;   // 0–59, backend computes hours*60 + mins
    deadline: string;            // "YYYY-MM-DD"
    operator_id: number;
}

/**
 * Sent to PATCH /orders/:id.
 * Backend UpdateOrderDTO.Items uses *[]CreateOrderItemDTO (same as create),
 * so items field also sends stl_name, not product_name.
 */
export interface UpdateOrderDTO {
    client_name?: string;
    done_pieces?: number;
    priority?: string;
    notes?: string;
    status?: string;
    estimated_minutes?: number;
    deadline?: string;
    items?: CreateOrderItemDTO[];   // same DTO as create per backend Go types
    operator_id?: number;
}