import { useState, useMemo } from "react";
import { Plus, Search, Package, TrendingUp, AlertTriangle, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/features/products/api";
import type { CreateProductPayload } from "@/features/products/api";
import type { AdminProductDTO } from "@/types/api";
import { ProductDrawer } from "@/components/ProductDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatCurrency } from "@/shared/lib/format";

type Tab = "all" | "active" | "inactive" | "nostock";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">Sin stock</span>;
  if (stock <= 5) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">{stock} uds.</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">{stock} uds.</span>;
}

export default function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProductDTO | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.active).length,
    nostock: products.filter((p) => p.stock === 0).length,
    revenue: products.reduce((s, p) => s + p.price_cents, 0),
  }), [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (tab === "active") list = list.filter((p) => p.active);
    if (tab === "inactive") list = list.filter((p) => !p.active);
    if (tab === "nostock") list = list.filter((p) => p.stock === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.slug.includes(q));
    }
    return list;
  }, [products, tab, search]);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(p: AdminProductDTO) {
    setEditing(p);
    setDrawerOpen(true);
  }

  async function handleSubmit(payload: CreateProductPayload & { id?: string }) {
    if (payload.id) {
      const { id, ...data } = payload;
      await updateProduct.mutateAsync({ id, ...data });
    } else {
      await createProduct.mutateAsync(payload);
    }
    setDrawerOpen(false);
  }

  async function handleDelete() {
    if (!deletingId) return;
    await deleteProduct.mutateAsync(deletingId);
    setDeletingId(null);
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: "Todos", count: stats.total },
    { key: "active", label: "Activos", count: stats.active },
    { key: "inactive", label: "Inactivos", count: stats.total - stats.active },
    { key: "nostock", label: "Sin stock", count: stats.nostock },
  ];

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{stats.total} productos en el catálogo</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Total", value: stats.total, color: "text-blue-600 bg-blue-50" },
          { icon: TrendingUp, label: "Activos", value: stats.active, color: "text-green-600 bg-green-50" },
          { icon: AlertTriangle, label: "Sin stock", value: stats.nostock, color: "text-red-600 bg-red-50" },
          { icon: EyeOff, label: "Inactivos", value: stats.total - stats.active, color: "text-gray-500 bg-gray-100" },
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label} {count !== undefined && <span className="ml-1 opacity-60">{count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-3.5 bg-gray-100 rounded w-16" />
                <div className="h-6 bg-gray-100 rounded-full w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="w-10 h-10 mb-3" strokeWidth={1} />
            <p className="text-sm">No hay productos</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 w-12" />
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Producto</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Precio</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Stock</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Categorías</th>
                <th className="px-2 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr key={p.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-5 h-5" strokeWidth={1} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {formatCurrency(p.price_cents / 100)}
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge stock={p.stock} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.categories.slice(0, 2).map((c) => (
                        <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-700 font-medium">
                          {c.name}
                        </span>
                      ))}
                      {p.categories.length > 2 && (
                        <span className="text-xs text-gray-400">+{p.categories.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(p.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProductDrawer
        open={drawerOpen}
        product={editing}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
        isPending={isPending}
      />

      <ConfirmDialog
        open={!!deletingId}
        title="Eliminar producto"
        description="Esta acción no se puede deshacer. El producto será eliminado permanentemente."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
