export interface Product {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  min_qty: number;
  category?: string;
  description?: string;
  status: 'active' | 'inactive';
}

export type MovementType = "IN" | "OUT" | "ADJUSTMENT" | "INTERNAL_USE";


export type CreateMovementPayload = {
  sku: string;
  quantity: number;
  type: MovementType;
  reason: string;
  description?: string;
  location_id: number;
};


export interface DashboardResponse {
  total_items: number;
  total_value: number;
  low_stock_count: number;
  movements_today: number;
  active_users: number;
  low_stock_items: Product[];
  top_selling_items: {
    sku: string;
    name: string;
    total_sold: number;
  }[];
}


export interface ProductCreateRequest {
    sku: string;         // json:"sku"
    name: string;        // json:"name"
    description: string; // json:"description"
    quantity: number;    // json:"quantity"
    price: number;       // json:"price"
    min_qty: number;     // json:"min_qty"
}

export interface ProductUpdateRequest {
    sku: string;         // json:"sku"
    name: string;        // json:"name"
    description: string; // json:"description"
    price: number;       // json:"price"
    min_qty: number;     // json:"min_qty"
}

export type StockMovement = {
  id: number;
  stock_sku: string;
  type: string;
  qty_delta: number;
  qty_before: number;
  qty_after: number;
  reason: string;
  created_by: number;
  location_id: number;
  created_at: string;
  description?: string;
};