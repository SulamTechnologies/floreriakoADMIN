import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import type { AdminOrderDTO } from "@/types/api";

export const ORDERS_KEY = ["admin", "orders"] as const;

export function useOrders() {
  return useQuery<AdminOrderDTO[]>({
    queryKey: ORDERS_KEY,
    queryFn: () => api.get<AdminOrderDTO[]>("/api/admin/orders"),
    refetchInterval: 1000 * 60,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminOrderDTO["status"] }) =>
      api.patch<AdminOrderDTO>(`/api/admin/orders/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}
