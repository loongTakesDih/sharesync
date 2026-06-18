import { useMemo, useState } from "react";
import PublicProfileModal from "../profile/PublicProfileModal";
import ItemCard from "../items/ItemCard";
import ItemDetailModal from "./ItemDetailModal";
import ItemForm from "../items/ItemForm";
import ImageCropModal from "../items/ImageCropModal";
import EmptyState from "../ui/EmptyState";
import PageHeader from "../ui/PageHeader";
import SectionCard from "../ui/SectionCard";
import { usePublicProfileModal } from "../../hooks/usePublicProfileModal";
import { useItems } from "../../hooks/useItems";
import { useRequests } from "../../hooks/useRequests";
import { useSavedItems } from "../../hooks/useSavedItems";
import { createItem } from "../../services/itemService";
import { createRequest } from "../../services/requestService";
import { toggleSavedItem } from "../../services/savedItemService";
import { cropImageToBase64, readImageFileForCrop } from "../../utils/imageUtils";
import {
  getItemCategoryLabel,
  itemCategories,
  isValidItemCategory,
} from "../../utils/itemCategories";
import { closedRequestStatuses } from "../../utils/requestStatus";

function MarketplaceView({
  activeCommunity,
  activeCommunityId,
  activeCommunityObject,
  availableOnly = false,
  borrowableOnly = false,
  embedded = false,
  listIntent = 0,
  onSearchChange,
  searchTerm = "",
  user,
  userProfile,
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [preferredPickupLocation, setPreferredPickupLocation] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imageProcessing, setImageProcessing] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropFocalX, setCropFocalX] = useState(50);
  const [cropFocalY, setCropFocalY] = useState(50);
  const [cropZoom, setCropZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [requestingItemId, setRequestingItemId] = useState("");
  const [requestedItemIds, setRequestedItemIds] = useState([]);
  const [savingSavedItemId, setSavingSavedItemId] = useState("");
  const [message, setMessage] = useState("");
  const [showListForm, setShowListForm] = useState(listIntent > 0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const {
    closeUserProfile,
    openUserProfile,
    profile,
    profileLoading,
  } = usePublicProfileModal();
  const { items, loading } = useItems({
    activeCommunity,
    activeCommunityId,
    user,
  });
  const { outgoingRequests } = useRequests({
    activeCommunity,
    activeCommunityId,
    user,
  });
  const { savedItemIds } = useSavedItems({
    activeCommunity,
    activeCommunityId,
    user,
  });

  const pendingRequestedItemIds = outgoingRequests
    .filter((request) => !closedRequestStatuses.includes(request.status))
    .map((request) => request.itemId);
  const allRequestedItemIds = [
    ...new Set([...pendingRequestedItemIds, ...requestedItemIds]),
  ];

  const marketplaceItems = useMemo(
    () =>
      items.filter((item) => {
        if (availableOnly && !item.available) {
          return false;
        }

        if (borrowableOnly && item.ownerId === user?.uid) {
          return false;
        }

        return true;
      }),
    [availableOnly, borrowableOnly, items, user?.uid]
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return marketplaceItems.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        [item.name, item.description, item.ownerUsername, item.community]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, marketplaceItems, searchTerm]);

  const addItem = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setMessage("Please enter an item name.");
      return;
    }

    if (!isValidItemCategory(category)) {
      setMessage("Please select a category.");
      return;
    }

    if (!activeCommunityObject?.communityId) {
      setMessage("Please select or create your community first.");
      return;
    }

    if (!userProfile?.username) {
      setMessage("Please complete your profile before adding items.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await createItem({
        activeCommunity,
        activeCommunityObject,
        category,
        condition,
        description,
        imageBase64,
        name,
        preferredPickupLocation,
        user,
        userProfile,
      });

      setName("");
      setCategory("");
      setCondition("");
      setDescription("");
      setPreferredPickupLocation("");
      setImageBase64("");
      setShowListForm(false);
      setMessage("Your item is listed.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (file) => {
    if (!file) {
      return;
    }

    setImageProcessing(true);
    setMessage("");

    try {
      const imageForCrop = await readImageFileForCrop(file);
      setCropImage(imageForCrop);
      setCropFocalX(50);
      setCropFocalY(50);
      setCropZoom(1);
    } catch (error) {
      setImageBase64("");
      setMessage(error.message);
    } finally {
      setImageProcessing(false);
    }
  };

  const applyImageCrop = async () => {
    if (!cropImage) {
      return;
    }

    setImageProcessing(true);
    setMessage("");

    try {
      const croppedImage = await cropImageToBase64({
        focalX: cropFocalX,
        focalY: cropFocalY,
        source: cropImage.source,
        zoom: cropZoom,
      });
      setImageBase64(croppedImage);
      setCropImage(null);
    } catch (error) {
      setImageBase64("");
      setMessage(error.message);
    } finally {
      setImageProcessing(false);
    }
  };

  const requestItem = async (item) => {
    if (!user) {
      setMessage("Please log in to request items.");
      return;
    }

    if (item.ownerId === user.uid) {
      setMessage("You cannot request your own item.");
      return;
    }

    if (!item.available) {
      setMessage("This item is currently unavailable.");
      return;
    }

    if (!(activeCommunityId || activeCommunity)) {
      setMessage("Please select or create your community first.");
      return;
    }

    if (!userProfile?.username) {
      setMessage("Please complete your profile before requesting items.");
      return;
    }

    if (allRequestedItemIds.includes(item.id)) {
      setMessage("You have already requested this item.");
      return;
    }

    setRequestingItemId(item.id);
    setMessage("");

    try {
      const requestedItemId = await createRequest({
        activeCommunity,
        activeCommunityId,
        activeCommunityObject,
        item,
        user,
        userProfile,
      });

      setRequestedItemIds((currentIds) =>
        currentIds.includes(requestedItemId)
          ? currentIds
          : [...currentIds, requestedItemId]
      );
      setMessage("Request sent.");
    } catch (error) {
      if (error.message === "You have already requested this item.") {
        setRequestedItemIds((currentIds) =>
          currentIds.includes(item.id) ? currentIds : [...currentIds, item.id]
        );
      }

      setMessage(error.message);
    } finally {
      setRequestingItemId("");
    }
  };

  const selectedItemIsRequested = selectedItem
    ? allRequestedItemIds.includes(selectedItem.id)
    : false;

  const handleToggleSaved = async (item) => {
    setSavingSavedItemId(item.id);
    setMessage("");

    try {
      await toggleSavedItem({
        activeCommunity,
        activeCommunityId,
        item,
        saved: savedItemIds.has(item.id),
        user,
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingSavedItemId("");
    }
  };

  if (embedded) {
    return (
      <section className="grid gap-5">
        {message && (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900">
            {message}
          </p>
        )}

        <SectionCard
          className="overflow-hidden"
          subtitle={`${filteredItems.length} of ${marketplaceItems.length} available listings shown in ${activeCommunity}. Use the top search bar to narrow results.`}
          title="Available to Borrow"
        >
          <div className="grid gap-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Showing now
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-950">
                  {filteredItems.length}
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-800">
                  {activeCategory === "All"
                    ? "All categories"
                    : `${activeCategory} listings`}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Browse by category
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <CategoryButton
                    active={activeCategory === "All"}
                    label="All"
                    onClick={() => setActiveCategory("All")}
                  />
                  {itemCategories.map((itemCategory) => (
                    <CategoryButton
                      active={activeCategory === itemCategory}
                      key={itemCategory}
                      label={getItemCategoryLabel({ category: itemCategory })}
                      onClick={() => setActiveCategory(itemCategory)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {showListForm && (
          <SectionCard
            actions={
              <button
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-50"
                type="button"
                onClick={() => setShowListForm(false)}
              >
                Cancel
              </button>
            }
            subtitle={`Create a listing for ${activeCommunity}.`}
            title="New Listing"
          >
            <ItemForm
              category={category}
              condition={condition}
              description={description}
              imageBase64={imageBase64}
              imageProcessing={imageProcessing}
              name={name}
              onCategoryChange={setCategory}
              onConditionChange={setCondition}
              onDescriptionChange={setDescription}
              onImageChange={handleImageChange}
              onImageRemove={() => setImageBase64("")}
              onNameChange={setName}
              onPreferredPickupLocationChange={setPreferredPickupLocation}
              onSubmit={addItem}
              preferredPickupLocation={preferredPickupLocation}
              saving={saving}
            />
          </SectionCard>
        )}

        <section className="min-w-0">
          {loading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  className="h-80 animate-pulse rounded-2xl border border-stone-200 bg-white shadow-sm"
                  key={item}
                />
              ))}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <EmptyState>
              No matching available items found. Try another category or search
              term.
            </EmptyState>
          )}

          {!loading && filteredItems.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredItems.map((item) => (
                <ItemCard
                  item={item}
                  key={item.id}
                  onOpenDetail={setSelectedItem}
                  onOpenUserProfile={openUserProfile}
                  onToggleSaved={handleToggleSaved}
                  saved={savedItemIds.has(item.id)}
                  savingSaved={savingSavedItemId === item.id}
                  showAvailability={false}
                  user={user}
                />
              ))}
            </div>
          )}
        </section>

        <ItemDetailModal
          item={selectedItem}
          items={items}
          onClose={() => setSelectedItem(null)}
          onOpenDetail={setSelectedItem}
          onOpenUserProfile={openUserProfile}
          onRequest={requestItem}
          requested={selectedItemIsRequested}
          requesting={selectedItem?.id === requestingItemId}
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
        <ImageCropModal
          crop={cropImage}
          focalX={cropFocalX}
          focalY={cropFocalY}
          onApply={applyImageCrop}
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

  return (
    <section className="grid gap-6">
      <PageHeader
        actions={
          <div className="grid w-full gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Active community
              </p>
              <p className="mt-1 truncate text-sm font-black text-slate-900">
                {activeCommunity}
              </p>
            </div>
            <button
              className="rounded-2xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-800 active:scale-[0.98]"
              type="button"
              onClick={() => setShowListForm(true)}
            >
              📦 List an Item
            </button>
          </div>
        }
        eyebrow="🔍 Marketplace"
        subtitle="Search, filter, and request useful items shared by neighbors nearby."
        title="Browse Items 🔍"
      >
        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="block">
            <span className="sr-only">Search items</span>
            <input
              className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-base font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              type="search"
              placeholder="Search tools, books, kitchen items..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:max-w-xl">
            <CategoryButton
              active={activeCategory === "All"}
              label="All"
              onClick={() => setActiveCategory("All")}
            />
            {itemCategories.map((itemCategory) => (
              <CategoryButton
                active={activeCategory === itemCategory}
                key={itemCategory}
                label={getItemCategoryLabel({ category: itemCategory })}
                onClick={() => setActiveCategory(itemCategory)}
              />
            ))}
          </div>
        </div>
      </PageHeader>

      {message && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900">
          {message}
        </p>
      )}

      {showListForm && (
        <SectionCard
          actions={
            <button
              className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-50"
              type="button"
              onClick={() => setShowListForm(false)}
            >
              Cancel
            </button>
          }
          subtitle={`Create a listing for ${activeCommunity}.`}
          title="📦 New Listing"
        >
          <ItemForm
            category={category}
            condition={condition}
            description={description}
            imageBase64={imageBase64}
            imageProcessing={imageProcessing}
            name={name}
            onCategoryChange={setCategory}
            onConditionChange={setCondition}
            onDescriptionChange={setDescription}
            onImageChange={handleImageChange}
            onImageRemove={() => setImageBase64("")}
            onNameChange={setName}
            onPreferredPickupLocationChange={setPreferredPickupLocation}
            onSubmit={addItem}
            preferredPickupLocation={preferredPickupLocation}
            saving={saving}
          />
        </SectionCard>
      )}

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <SectionCard
            subtitle={`${filteredItems.length} of ${marketplaceItems.length} listings shown.`}
            title="🔍 Filters"
          >
            <div className="grid gap-5">
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Search
                <input
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  type="search"
                  placeholder="Search listings"
                  value={searchTerm}
                  onChange={(event) => onSearchChange(event.target.value)}
                />
              </label>
              <div>
                <p className="text-sm font-bold text-slate-700">Category</p>
                <div className="mt-3 flex flex-wrap gap-2 lg:grid">
                  <CategoryButton
                    active={activeCategory === "All"}
                    label="All"
                    onClick={() => setActiveCategory("All")}
                  />
                  {itemCategories.map((itemCategory) => (
                    <CategoryButton
                      active={activeCategory === itemCategory}
                      key={itemCategory}
                      label={getItemCategoryLabel({ category: itemCategory })}
                      onClick={() => setActiveCategory(itemCategory)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                ✅ Available Listings
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}{" "}
                shown
              </p>
            </div>
          </div>

          {loading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  className="h-80 animate-pulse rounded-2xl border border-stone-200 bg-white shadow-sm"
                  key={item}
                />
              ))}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <EmptyState>
              No matching items found. Try another category or search term.
            </EmptyState>
          )}

          {!loading && filteredItems.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredItems.map((item) => (
                <ItemCard
                  item={item}
                  key={item.id}
                  onOpenDetail={setSelectedItem}
                  onOpenUserProfile={openUserProfile}
                  onToggleSaved={handleToggleSaved}
                  saved={savedItemIds.has(item.id)}
                  savingSaved={savingSavedItemId === item.id}
                  user={user}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <ItemDetailModal
        item={selectedItem}
        items={items}
        onClose={() => setSelectedItem(null)}
        onOpenDetail={setSelectedItem}
        onOpenUserProfile={openUserProfile}
        onRequest={requestItem}
        requested={selectedItemIsRequested}
        requesting={selectedItem?.id === requestingItemId}
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
      <ImageCropModal
        crop={cropImage}
        focalX={cropFocalX}
        focalY={cropFocalY}
        onApply={applyImageCrop}
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

function CategoryButton({ active, label, onClick }) {
  return (
    <button
      className={
        active
          ? "whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          : "whitespace-nowrap rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-all duration-200 hover:scale-[1.02] hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.98]"
      }
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default MarketplaceView;
