import { useMemo, useState } from "react";
import PublicProfileModal from "../profile/PublicProfileModal";
import ItemCard from "../items/ItemCard";
import ItemDetailModal from "./ItemDetailModal";
import ItemForm from "../items/ItemForm";
import EmptyState from "../ui/EmptyState";
import { usePublicProfileModal } from "../../hooks/usePublicProfileModal";
import { useItems } from "../../hooks/useItems";
import { useRequests } from "../../hooks/useRequests";
import { createItem } from "../../services/itemService";
import { createRequest } from "../../services/requestService";
import { itemCategories, isValidItemCategory } from "../../utils/itemCategories";

function MarketplaceView({
  activeCommunity,
  listIntent = 0,
  onSearchChange,
  searchTerm = "",
  user,
  userProfile,
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [requestingItemId, setRequestingItemId] = useState("");
  const [requestedItemIds, setRequestedItemIds] = useState([]);
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
  const { items, loading } = useItems({ activeCommunity, user });
  const { outgoingRequests } = useRequests({ activeCommunity, user });

  const pendingRequestedItemIds = outgoingRequests
    .filter((request) => request.status === "pending")
    .map((request) => request.itemId);
  const allRequestedItemIds = [
    ...new Set([...pendingRequestedItemIds, ...requestedItemIds]),
  ];

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        [item.name, item.description, item.ownerUsername, item.community]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, items, searchTerm]);

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

    if (!activeCommunity) {
      setMessage("Please select a community first.");
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
        category,
        description,
        name,
        user,
        userProfile,
      });

      setName("");
      setCategory("");
      setDescription("");
      setShowListForm(false);
      setMessage("Your item is listed.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const requestItem = async (item) => {
    if (item.ownerId === user.uid) {
      setMessage("You cannot request your own item.");
      return;
    }

    if (!item.available) {
      setMessage("This item is currently unavailable.");
      return;
    }

    if (!activeCommunity) {
      setMessage("Please select a community first.");
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

  return (
    <section className="grid gap-7">
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="grid gap-6 bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-5 py-6 sm:px-8 lg:grid-cols-[1.35fr_0.65fr] lg:px-10 lg:py-8">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
              Marketplace
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Borrow useful items from neighbors nearby.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Browse available listings in{" "}
              <span className="font-bold text-emerald-800">
                {activeCommunity}
              </span>
              , send requests, and keep handovers organized.
            </p>
          </div>

          <div className="flex flex-col justify-end gap-3 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Ready to share something useful?
            </p>
            <button
              className="rounded-2xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-800"
              type="button"
              onClick={() => setShowListForm(true)}
            >
              List an Item
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-t border-stone-100 px-5 py-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:px-10">
          <label className="relative block">
            <span className="sr-only">Search items</span>
            <input
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-base font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              type="search"
              placeholder="Search tools, books, kitchen items..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:justify-end">
            <button
              className={
                activeCategory === "All"
                  ? "whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                  : "whitespace-nowrap rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50"
              }
              type="button"
              onClick={() => setActiveCategory("All")}
            >
              All
            </button>
            {itemCategories.map((itemCategory) => (
              <button
                className={
                  activeCategory === itemCategory
                    ? "whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                    : "whitespace-nowrap rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50"
                }
                key={itemCategory}
                type="button"
                onClick={() => setActiveCategory(itemCategory)}
              >
                {itemCategory}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900">
          {message}
        </p>
      )}

      {showListForm && (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                New Listing
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                List an item for {activeCommunity}
              </h2>
            </div>
            <button
              className="self-start rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-50"
              type="button"
              onClick={() => setShowListForm(false)}
            >
              Cancel
            </button>
          </div>
          <ItemForm
            category={category}
            description={description}
            name={name}
            onCategoryChange={setCategory}
            onDescriptionChange={setDescription}
            onNameChange={setName}
            onSubmit={addItem}
            saving={saving}
          />
        </div>
      )}

      <div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Community Listings
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}{" "}
              shown
            </p>
          </div>
        </div>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                className="h-72 animate-pulse rounded-3xl border border-stone-200 bg-white shadow-sm"
                key={item}
              />
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <EmptyState>
            No matching items here yet. Try another search or list something
            useful for your community.
          </EmptyState>
        )}

        {!loading && filteredItems.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <ItemCard
                item={item}
                key={item.id}
                onOpenDetail={setSelectedItem}
                onOpenUserProfile={openUserProfile}
                onRequest={requestItem}
                requested={allRequestedItemIds.includes(item.id)}
                requesting={requestingItemId === item.id}
                user={user}
              />
            ))}
          </div>
        )}
      </div>

      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onOpenUserProfile={openUserProfile}
        onRequest={requestItem}
        requested={selectedItemIsRequested}
        requesting={selectedItem?.id === requestingItemId}
        user={user}
      />
      <PublicProfileModal
        loading={profileLoading}
        onClose={closeUserProfile}
        profile={profile}
      />
    </section>
  );
}

export default MarketplaceView;
