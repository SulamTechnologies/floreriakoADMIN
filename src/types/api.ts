export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
}

export interface AdminProductDTO {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  stock: number;
  image_url: string | null;
  active: boolean;
  categories: CategoryDTO[];
}

export interface ProductSnapshot {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
}

export interface OrderItemDTO {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  product_snapshot: ProductSnapshot;
}

export interface AdminOrderDTO {
  id: string;
  user_id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  total_cents: number;
  currency: string;
  items: OrderItemDTO[];
  created_at: string;
  user_email?: string;
}

export interface ProfileDTO {
  id: string;
  full_name: string | null;
  role: "customer" | "admin" | "sudo";
  email: string;
}
