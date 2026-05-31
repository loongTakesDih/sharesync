import { useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ImageCropModal from "../components/items/ImageCropModal";
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
import { cropImageToBase64, readImageFileForCrop } from "../utils/imageUtils";

const inputClass =
  "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

function MyItems({ activeCommunity, user, userProfile }) {
  const [editingItemId, setEditingItemId] = useState("");
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageBase64, setEditImageBase64] = useState("");
  const [editAvailable, setEditAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropFocalX, setCropFocalX] = useState(50);
  const [cropFocalY, setCropFocalY] = useState(50);
  const [cropZoom, setCropZoom] = useState(1);
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
    setEditImageBase64(item.imageBase64 || "");
    setEditAvailable(item.available);
  };

  const cancelEditing = () => {
    setEditingItemId("");
    setEditName("");
    setEditCategory("");
    setEditDescription("");
    setEditImageBase64("");
    setEditAvailable(true);
    setCropImage(null);
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
        imageBase64: editImageBase64,
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

  const handleEditImageChange = async (file) => {
    if (!file) {
      return;
    }

    setImageProcessing(true);

    try {
      const imageForCrop = await readImageFileForCrop(file);
      setCropImage(imageForCrop);
      setCropFocalX(50);
      setCropFocalY(50);
      setCropZoom(1);
    } catch (error) {
      alert(error.message);
    } finally {
      setImageProcessing(false);
    }
  };

  const applyEditImageCrop = async () => {
    if (!cropImage) {
      return;
    }

    setImageProcessing(true);

    try {
      const croppedImage = await cropImageToBase64({
        focalX: cropFocalX,
        focalY: cropFocalY,
        source: cropImage.source,
        zoom: cropZoom,
      });
      setEditImageBase64(croppedImage);
      setCropImage(null);
    } catch (error) {
      setEditImageBase64("");
      alert(error.message);
    } finally {
      setImageProcessing(false);
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
              <div className="relative h-32 bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100">
                {item.imageBase64 && (
                  <img
                    alt={item.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    src={item.imageBase64}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />
                <div className="relative z-10 flex h-full items-end justify-between p-4">
                  {!item.imageBase64 && (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/85 text-xl font-black text-emerald-800 shadow-sm">
                      {(item.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div />
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

                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Item image
                      <input
                        className={inputClass}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) =>
                          handleEditImageChange(event.target.files?.[0])
                        }
                      />
                      <span className="text-xs font-semibold text-slate-500">
                        Optional. Uploaded images are cropped to the shared 4:3
                        listing size.
                      </span>
                    </label>

                    {imageProcessing && (
                      <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-stone-200">
                        Preparing image...
                      </p>
                    )}

                    {editImageBase64 && (
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                        <img
                          alt="Item preview"
                          className="h-40 w-full rounded-xl object-cover"
                          src={editImageBase64}
                        />
                        <button
                          className="mt-3 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-50"
                          type="button"
                          onClick={() => setEditImageBase64("")}
                        >
                          Remove image
                        </button>
                      </div>
                    )}

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
                        disabled={saving || imageProcessing}
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
      <ImageCropModal
        crop={cropImage}
        focalX={cropFocalX}
        focalY={cropFocalY}
        onApply={applyEditImageCrop}
        onCancel={() => setCropImage(null)}
        onFocalXChange={setCropFocalX}
        onFocalYChange={setCropFocalY}
        onZoomChange={setCropZoom}
        processing={imageProcessing}
        zoom={cropZoom}
      />
    </section>
  );
}

export default MyItems;
