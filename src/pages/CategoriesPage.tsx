import { useState, type FormEvent } from "react";
import { Plus, Tag, Pencil, Trash2, Check, X } from "lucide-react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/features/categories/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { CategoryDTO } from "@/types/api";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function CategoryRow({
  cat,
  onEdit,
  onDelete,
}: {
  cat: CategoryDTO;
  onEdit: (cat: CategoryDTO) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="group hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4 text-brand-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">{cat.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-gray-400">{cat.slug}</span>
      </td>
      <td className="px-2 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          <button
            onClick={() => onEdit(cat)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(cat.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function InlineForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: CategoryDTO;
  onSave: (data: { name: string; slug: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [autoSlug, setAutoSlug] = useState(!initial);

  function handleName(v: string) {
    setName(v);
    if (autoSlug) setSlug(slugify(v));
  }

  function handleSlug(v: string) {
    setAutoSlug(false);
    setSlug(v);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({ name: name.trim(), slug: slug.trim() });
  }

  return (
    <tr className="bg-brand-50/40">
      <td className="px-4 py-2" colSpan={2}>
        <form id="cat-form" onSubmit={handleSubmit} className="flex gap-2">
          <input
            autoFocus
            required
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => handleName(e.target.value)}
            className="flex-1 border border-brand-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
          <input
            required
            type="text"
            placeholder="slug"
            value={slug}
            onChange={(e) => handleSlug(e.target.value)}
            pattern="^[a-z0-9-]+$"
            title="Solo letras minúsculas, números y guiones"
            className="w-36 border border-brand-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </form>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1 justify-end">
          <button
            type="submit"
            form="cat-form"
            disabled={isPending}
            className="p-1.5 rounded-lg text-white bg-brand-600 hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(data: { name: string; slug: string }) {
    await createCategory.mutateAsync(data);
    setCreating(false);
  }

  async function handleUpdate(data: { name: string; slug: string }) {
    if (!editingId) return;
    await updateCategory.mutateAsync({ id: editingId, ...data });
    setEditingId(null);
  }

  async function handleDelete() {
    if (!deletingId) return;
    await deleteCategory.mutateAsync(deletingId);
    setDeletingId(null);
  }

  const editingCat = categories.find((c) => c.id === editingId);

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} categorías</p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditingId(null); }}
          disabled={creating}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
                <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/5 ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">Slug</th>
                <th className="px-2 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {creating && (
                <InlineForm
                  onSave={handleCreate}
                  onCancel={() => setCreating(false)}
                  isPending={createCategory.isPending}
                />
              )}
              {categories.length === 0 && !creating ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-400 text-sm">
                    <Tag className="w-8 h-8 mx-auto mb-2" strokeWidth={1} />
                    No hay categorías. Crea la primera.
                  </td>
                </tr>
              ) : (
                categories.map((cat) =>
                  editingId === cat.id ? (
                    <InlineForm
                      key={cat.id}
                      initial={editingCat}
                      onSave={handleUpdate}
                      onCancel={() => setEditingId(null)}
                      isPending={updateCategory.isPending}
                    />
                  ) : (
                    <CategoryRow
                      key={cat.id}
                      cat={cat}
                      onEdit={(c) => { setEditingId(c.id); setCreating(false); }}
                      onDelete={(id) => setDeletingId(id)}
                    />
                  )
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!deletingId}
        title="Eliminar categoría"
        description="Los productos que usen esta categoría perderán la asociación. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
