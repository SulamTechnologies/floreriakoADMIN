import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ShoppingBag, Clock, Truck, CheckCircle, XCircle, DollarSign, Package } from "lucide-react";
import { useOrders, useUpdateOrderStatus } from "@/features/orders/api";
import type { AdminOrderDTO } from "@/types/api";
import { formatCurrency } from "@/shared/lib/format";

type Status = AdminOrderDTO["status"];

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:   { label: "Pendiente",   color: "text-amber-700",  bg: "bg-amber-50",  icon: Clock },
  paid:      { label: "Pagado",      color: "text-blue-700",   bg: "bg-blue-50",   icon: DollarSign },
  shipped:   { label: "Enviado",     color: "text-violet-700", bg: "bg-violet-50", icon: Truck },
  delivered: { label: "Entregado",   color: "text-green-700",  bg: "bg-green-50",  icon: CheckCircle },
  cancelled: { label: "Cancelado",   color: "text-red-600",    bg: "bg-red-50",    icon: XCircle },
};

const NEXT_STATUS: Partial<Record<Status, Status>> = {
  pending: "paid",
  paid: "shipped",
  shipped: "delivered",
};

type Tab = "all" | Status;

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function OrderRow({ order }: { order: AdminOrderDTO }) {
  const [expanded, setExpanded] = useState(false);
  const updateStatus = useUpdateOrderStatus();
  const next = NEXT_STATUS[order.status];

  const total = order.items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);

  return (
    <>
      <tr
        className="group hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-4 py-3 text-xs font-mono text-gray-400">
          #{order.id.slice(0, 8)}
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-gray-900">{order.user_email ? order.user_email.split("@")[0] : "—"}</p>
          <p className="text-xs text-gray-400">{order.user_email}</p>
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={order.status} />
        </td>
        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
          {formatCurrency(total / 100)}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {new Date(order.created_at).toLocaleDateString("es-MX", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 justify-end">
            {next && (
              <button
                onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: order.id, status: next }); }}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-60"
              >
                {STATUS_CONFIG[next].label} →
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: order.id, status: "cancelled" }); }}
              disabled={updateStatus.isPending || order.status === "cancelled" || order.status === "delivered"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30"
            >
              Cancelar
            </button>
            <span className="text-gray-300 ml-1">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="px-4 pb-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Artículos</p>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-100 shrink-0">
                      {item.product_snapshot?.image_url ? (
                        <img src={item.product_snapshot.image_url} alt={item.product_snapshot.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-4 h-4" strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product_snapshot?.name ?? "Producto"}</p>
                      <p className="text-xs text-gray-400">{item.quantity} × {formatCurrency(item.unit_price_cents / 100)}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      {formatCurrency((item.unit_price_cents * item.quantity) / 100)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-end">
                <p className="text-sm font-bold text-gray-900">Total: {formatCurrency(total / 100)}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const [tab, setTab] = useState<Tab>("all");

  const stats = useMemo(() => ({
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    revenue: orders.filter((o) => o.status !== "cancelled").reduce(
      (s, o) => s + o.items.reduce((ss, i) => ss + i.unit_price_cents * i.quantity, 0), 0
    ),
  }), [orders]);

  const filtered = useMemo(() =>
    tab === "all" ? orders : orders.filter((o) => o.status === tab),
    [orders, tab]
  );

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "all",       label: "Todos",     count: stats.all },
    { key: "pending",   label: "Pendientes", count: stats.pending },
    { key: "paid",      label: "Pagados",   count: stats.paid },
    { key: "shipped",   label: "Enviados",  count: stats.shipped },
    { key: "delivered", label: "Entregados",count: stats.delivered },
    { key: "cancelled", label: "Cancelados",count: stats.cancelled },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-500 mt-0.5">{stats.all} pedidos en total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: "Ingresos", value: formatCurrency(stats.revenue / 100), color: "text-green-600 bg-green-50" },
          { icon: Clock, label: "Pendientes", value: stats.pending, color: "text-amber-600 bg-amber-50" },
          { icon: Truck, label: "Enviados", value: stats.shipped, color: "text-violet-600 bg-violet-50" },
          { icon: CheckCircle, label: "Entregados", value: stats.delivered, color: "text-blue-600 bg-blue-50" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label} <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-20" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-6 bg-gray-100 rounded-full w-24" />
                <div className="h-3.5 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ShoppingBag className="w-10 h-10 mb-3" strokeWidth={1} />
            <p className="text-sm">No hay pedidos</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Cliente</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Total</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
