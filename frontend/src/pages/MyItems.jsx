import { useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { useMyItems } from "../hooks/useMyItems";
import { useRequests } from "../hooks/useRequests";
import {
  deleteItem as deleteItemDocument,
  updateItem,
} from "../services/itemService";
import {
  activeBorrowingStatuses,
  getStatusBadgeClass,
  getStatusBadgeLabel,
} from "../utils/requestStatus";
import {
  getItemCategoryLabel,
  isValidItemCategory,
  itemCategories,
} from "../utils/itemCategories";

const inputClass =
  "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

function MyItems({ activeCommunity, user, userProfile }) {
  const [editingItemId, setEditingItemId] = useState("");
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAvailable, setEditAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const { items, loading } = useMyItems({ activeCommunity, user });
  const { incomingRequests } = useRequests({ activeCommunity, user });

  const activeRequestByItemId = useMemo(() => {
    const map = new Map();

    incomingRequests.forEach((request) => {
      if (
        request.status === "pending" ||
        request.status === "pickup_change_requested" ||
        activeBorrowingStatuses.includes(request.status)
      ) {
        map.set(request.itemId, request);
      }
    });

    return map;
  }, [incomingRequests]);

  const startEditing = (item) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditCategory(item.category || "");
    setEditDescription(item.description || "");
    setEditAvailable(item.available);
  };

  const cancelEditing = () => {
    setEditingItemId("");
    setEditName("");
    setEditCategory("");
    setEditDescription("");
    setEditAvailable(true);
  };

  const saveItem = async (event) => {
    event.preventDefault();

    if (!editName.trim()) {
      alert("Please enter an item name.");
      return;
    }

    if (!isValidItemCategory(editCategory)) {
      alert("Please select a category.");
      return;
    }

    setSaving(true);

    try {
      await updateItem(editingItemId, {
        name: editName.trim(),
        category: editCategory,
        description: editDescription.trim(),
        available: editAvailable,
      });

      cancelEditing();
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (itemId) => {
    const confirmed = window.confirm(
      "Delete this item? Active pending or approved requests will be closed."
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteItemDocument({ activeCommunity, itemId, user });
    } catch (error) {
      alert(error.message);
    }
  };

  const getOwnerLabel = (item) =>
    item.ownerUsername || userProfile?.username || item.ownerEmail || item.ownerId;

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          Profile Tools
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950">
              My Items
            </h1>
            <p className="mt-2 text-slate-600">
              Manage your listings in{" "}
              <span className="font-bold text-emerald-800">
                {activeCommunity}
              </span>
              .
            </p>
          </div>
          <span className="rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-slate-600">
            {items.length} listed
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {loading && (
          <p className="rounded-3xl border border-stone-200 bg-white p-6 text-slate-600 shadow-sm lg:col-span-2">
            Loading your items...
          </p>
        )}

        {!loading && items.length === 0 && (
          <div className="lg:col-span-2">
            <EmptyState>You have no items here yet.</EmptyState>
          </div>
        )}

        {items.map((item) => {
          const activeRequest = activeRequestByItemId.get(item.id);

          return (
            <article
              className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
              key={item.id}
            >
              <div className="h-28 bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100 p-4">
                <div className="flex h-full items-end justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/85 text-xl font-black text-emerald-800 shadow-sm">
                    {(item.name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <Badge
                    className={
                      item.available
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                        : "bg-stone-100 text-slate-600 ring-stone-200"
                    }
                  >
                    {item.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </div>

              <div className="p-5">
                {editingItemId === item.id ? (
                  <form className="grid gap-4" onSubmit={saveItem}>
                    <input
                      className={inputClass}
                      type="text"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                    />

                    <select
                      className={inputClass}
                      required
                      value={editCategory}
                      onChange={(event) => setEditCategory(event.target.value)}
                    >
                      <option value="">Select a category</option>
                      {itemCategories.map((itemCategory) => (
                        <option key={itemCategory} value={itemCategory}>
                          {itemCategory}
                        </option>
                      ))}
                    </select>

                    <textarea
                      className={`${inputClass} min-h-28`}
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)}
                    />

                    <label className="flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-stone-200">
                      <input
                        className="h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
                        type="checkbox"
                        checked={editAvailable}
                        onChange={(event) =>
                          setEditAvailable(event.target.checked)
                        }
                      />
                      Available now
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <button
                        className="rounded-2xl bg-emerald-700 px-4 py-2 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                        type="submit"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="rounded-2xl border border-stone-200 bg-white px-4 py-2 font-bold text-slate-700 transition hover:bg-stone-50"
                        type="button"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid gap-5">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">
                        {item.name}
                      </h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                        {item.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {item.community}
                      </span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-100">
                        {getItemCategoryLabel(item)}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                        {getOwnerLabel(item)}
                      </span>
                      {activeRequest && (
                        <Badge
                          className={`text-xs ${getStatusBadgeClass(
                            activeRequest.status
                          )}`}
                        >
                          {getStatusBadgeLabel(activeRequest.status)}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4">
                      <button
                        className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                        type="button"
                        onClick={() => startEditing(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                        type="button"
                        onClick={() => deleteItem(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default MyItems;
