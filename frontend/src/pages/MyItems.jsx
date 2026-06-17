import { useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ItemCard from "../components/items/ItemCard";
import ImageCropModal from "../components/items/ImageCropModal";
import ItemDetailModal from "../components/marketplace/ItemDetailModal";
import PageHeader from "../components/ui/PageHeader";
import PublicProfileModal from "../components/profile/PublicProfileModal";
import { useMyItems } from "../hooks/useMyItems";
import { usePublicProfileModal } from "../hooks/usePublicProfileModal";
import { useRequests } from "../hooks/useRequests";
import {
  deleteItem as deleteItemDocument,
  toggleItemAvailability,
  updateItem,
} from "../services/itemService";
import {
  activeBorrowingStatuses,
  getStatusBadgeClass,
  getStatusBadgeLabel,
  preHandoverStatuses,
} from "../utils/requestStatus";
import { isValidItemCategory, itemCategories } from "../utils/itemCategories";
import { itemConditions } from "../utils/itemCondition";
import { cropImageToBase64, readImageFileForCrop } from "../utils/imageUtils";

const inputClass =
  "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

function MyItems({ activeCommunity, activeCommunityId, onListItem, user }) {
  const [editingItemId, setEditingItemId] = useState("");
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCondition, setEditCondition] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPreferredPickupLocation, setEditPreferredPickupLocation] =
    useState("");
  const [editImageBase64, setEditImageBase64] = useState("");
  const [editAvailable, setEditAvailable] = useState(true);
  const [availabilityId, setAvailabilityId] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropFocalX, setCropFocalX] = useState(50);
  const [cropFocalY, setCropFocalY] = useState(50);
  const [cropZoom, setCropZoom] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const {
    closeUserProfile,
    openUserProfile,
    profile,
    profileLoading,
  } = usePublicProfileModal();
  const { items, loading } = useMyItems({
    activeCommunity,
    activeCommunityId,
    user,
  });
  const { incomingRequests } = useRequests({
    activeCommunity,
    activeCommunityId,
    user,
  });

  const activeRequestByItemId = useMemo(() => {
    const map = new Map();

    incomingRequests.forEach((request) => {
      if (
        request.status === "pending" ||
        preHandoverStatuses.includes(request.status) ||
        activeBorrowingStatuses.includes(request.status)
      ) {
        map.set(request.itemId, request);
      }
    });

    return map;
  }, [incomingRequests]);

  const selectedActiveRequest = selectedItem
    ? activeRequestByItemId.get(selectedItem.id)
    : null;

  const startEditing = (item) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditCategory(item.category || "");
    setEditCondition(item.condition || "");
    setEditDescription(item.description || "");
    setEditPreferredPickupLocation(item.preferredPickupLocation || "");
    setEditImageBase64(item.imageBase64 || "");
    setEditAvailable(item.available);
  };

  const cancelEditing = () => {
    setEditingItemId("");
    setEditName("");
    setEditCategory("");
    setEditCondition("");
    setEditDescription("");
    setEditPreferredPickupLocation("");
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
        condition: editCondition.trim(),
        description: editDescription.trim(),
        preferredPickupLocation: editPreferredPickupLocation.trim(),
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
      "Delete this item? Open requests and borrowing records will be closed."
    );

    if (!confirmed) {
      return false;
    }

    try {
      await deleteItemDocument({
        activeCommunity,
        activeCommunityId,
        itemId,
        user,
      });
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  const toggleAvailability = async (item) => {
    setAvailabilityId(item.id);

    try {
      await toggleItemAvailability(item.id, !item.available);
      setSelectedItem((currentItem) =>
        currentItem?.id === item.id
          ? { ...currentItem, available: !item.available }
          : currentItem
      );
    } catch (error) {
      alert(error.message);
    } finally {
      setAvailabilityId("");
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

  return (
    <section className="grid gap-6">
      <PageHeader
        actions={
          <div className="grid w-full gap-3">
            <span className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
              {items.length} listed
            </span>
            <button
              className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
              type="button"
              onClick={onListItem}
            >
              List Item
            </button>
          </div>
        }
        eyebrow="Owner tools"
        subtitle={`Manage your listings, availability, and active request status in ${activeCommunity}.`}
        title="My Items"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {loading && (
          <p className="rounded-2xl border border-stone-200 bg-white p-6 text-slate-600 shadow-sm sm:col-span-2 xl:col-span-3 2xl:col-span-4">
            Loading your items...
          </p>
        )}

        {!loading && items.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3 2xl:col-span-4">
            <EmptyState>You have no items here yet.</EmptyState>
          </div>
        )}

        {items.map((item) => (
          <ItemCard
            item={item}
            key={item.id}
            onOpenDetail={setSelectedItem}
            onOpenUserProfile={openUserProfile}
            showAvailability={false}
            user={user}
          />
        ))}
      </div>
      <EditItemModal
        available={editAvailable}
        category={editCategory}
        condition={editCondition}
        description={editDescription}
        imageBase64={editImageBase64}
        imageProcessing={imageProcessing}
        itemId={editingItemId}
        name={editName}
        onAvailableChange={setEditAvailable}
        onCancel={cancelEditing}
        onCategoryChange={setEditCategory}
        onConditionChange={setEditCondition}
        onDescriptionChange={setEditDescription}
        onImageChange={handleEditImageChange}
        onImageRemove={() => setEditImageBase64("")}
        onNameChange={setEditName}
        onPreferredPickupLocationChange={setEditPreferredPickupLocation}
        onSubmit={saveItem}
        preferredPickupLocation={editPreferredPickupLocation}
        saving={saving}
      />
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
      <ItemDetailModal
        item={selectedItem}
        items={items}
        onClose={() => setSelectedItem(null)}
        onOpenDetail={setSelectedItem}
        onOpenUserProfile={openUserProfile}
        ownerActions={
          selectedItem && (
            <OwnerManagementActions
              availabilityId={availabilityId}
              item={selectedItem}
              onDelete={async (itemId) => {
                const deleted = await deleteItem(itemId);

                if (deleted) {
                  setSelectedItem(null);
                }
              }}
              onEdit={(item) => {
                startEditing(item);
                setSelectedItem(null);
              }}
              onToggleAvailability={toggleAvailability}
            />
          )
        }
        ownerStatus={
          selectedActiveRequest ? (
            <Badge
              className={`text-xs ${getStatusBadgeClass(
                selectedActiveRequest.status
              )}`}
            >
              {getStatusBadgeLabel(selectedActiveRequest.status)}
            </Badge>
          ) : undefined
        }
        user={user}
      />
      <PublicProfileModal
        loading={profileLoading}
        onClose={closeUserProfile}
        onOpenItemDetail={(item) => {
          closeUserProfile();
          setSelectedItem(item);
        }}
        profile={profile}
      />
    </section>
  );
}

function EditItemModal({
  available,
  category,
  condition,
  description,
  imageBase64,
  imageProcessing,
  itemId,
  name,
  onAvailableChange,
  onCancel,
  onCategoryChange,
  onConditionChange,
  onDescriptionChange,
  onImageChange,
  onImageRemove,
  onNameChange,
  onPreferredPickupLocationChange,
  onSubmit,
  preferredPickupLocation,
  saving,
}) {
  if (!itemId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        className="max-h-[calc(100svh-3rem)] w-full max-w-2xl overflow-auto rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
              Edit Listing
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Update item details
            </h2>
          </div>
          <button
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-50"
            type="button"
            onClick={onCancel}
          >
            Close
          </button>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Item name
            <input
              className={inputClass}
              type="text"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Category
            <select
              className={inputClass}
              required
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              <option value="">Select a category</option>
              {itemCategories.map((itemCategory) => (
                <option key={itemCategory} value={itemCategory}>
                  {itemCategory}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Condition
            <select
              className={inputClass}
              value={condition}
              onChange={(event) => onConditionChange(event.target.value)}
            >
              <option value="">Not specified</option>
              {itemConditions.map((itemCondition) => (
                <option key={itemCondition} value={itemCondition}>
                  {itemCondition}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Item image
            <input
              className={inputClass}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => onImageChange(event.target.files?.[0])}
            />
            <span className="text-xs font-semibold text-slate-500">
              Optional. Uploaded images are cropped to the shared 4:3 listing
              size.
            </span>
          </label>

          {imageProcessing && (
            <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-stone-200">
              Preparing image...
            </p>
          )}

          {imageBase64 && (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
              <img
                alt="Item preview"
                className="h-40 w-full rounded-xl object-cover"
                src={imageBase64}
              />
              <button
                className="mt-3 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-50"
                type="button"
                onClick={onImageRemove}
              >
                Remove image
              </button>
            </div>
          )}

          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Description
            <textarea
              className={`${inputClass} min-h-32`}
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Preferred pickup location
            <input
              className={inputClass}
              type="text"
              placeholder="Lobby, Block A or Guardhouse"
              value={preferredPickupLocation}
              onChange={(event) =>
                onPreferredPickupLocationChange(event.target.value)
              }
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-stone-200">
            <input
              className="h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
              type="checkbox"
              checked={available}
              onChange={(event) => onAvailableChange(event.target.checked)}
            />
            Available now
          </label>

          <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 pt-4">
            <button
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 font-bold text-slate-700 transition hover:bg-stone-50"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="rounded-2xl bg-emerald-700 px-4 py-2 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={saving || imageProcessing}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OwnerManagementActions({
  availabilityId,
  item,
  onDelete,
  onEdit,
  onToggleAvailability,
}) {
  return (
    <>
      <button
        className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
        type="button"
        onClick={() => onEdit(item)}
      >
        Edit listing
      </button>
      <button
        className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        disabled={availabilityId === item.id}
        onClick={() => onToggleAvailability(item)}
      >
        {availabilityId === item.id
          ? "Updating..."
          : item.available
            ? "Mark unavailable"
            : "Mark available"}
      </button>
      <button
        className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
        type="button"
        onClick={() => onDelete(item.id)}
      >
        Delete listing
      </button>
    </>
  );
}

export default MyItems;
