import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import type { AdminProductDTO } from "@/types/api";

export const PRODUCTS_KEY = ["admin", "products"] as const;

export interface CreateProductPayload {
  name: string;
  slug: string;
  description?: string;
  price_cents: number;
  stock: number;
  image_url?: string;
  active?: boolean;
  category_ids?: string[];
}

export function useProducts() {
  return useQuery<AdminProductDTO[]>({
    queryKey: PRODUCTS_KEY,
    queryFn: () => api.get<AdminProductDTO[]>("/api/admin/products"),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductPayload) =>
      api.post<AdminProductDTO>("/api/admin/products", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CreateProductPayload> & { id: string }) =>
      api.patch<AdminProductDTO>(`/api/admin/products/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/api/admin/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}
