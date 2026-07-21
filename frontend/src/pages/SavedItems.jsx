import { useMemo, useState } from "react";
import EmptyState from "../components/ui/EmptyState";
import ItemCard from "../components/items/ItemCard";
import ItemDetailModal from "../components/marketplace/ItemDetailModal";
import PageHeader from "../components/ui/PageHeader";
import PublicProfileModal from "../components/profile/PublicProfileModal";
import { useItems } from "../hooks/useItems";
import { usePublicProfileModal } from "../hooks/usePublicProfileModal";
import { useRequests } from "../hooks/useRequests";
import { useSavedItems } from "../hooks/useSavedItems";
import { useUserProfiles } from "../hooks/useUserProfiles";
import { createRequest } from "../services/requestService";
import {
  removeSavedItem,
  toggleSavedItem,
} from "../services/savedItemService";
import { closedRequestStatuses } from "../utils/requestStatus";

function SavedItems({
  activeCommunity,
  activeCommunityId,
  activeCommunityObject,
  user,
  userProfile,
}) {
  const [message, setMessage] = useState("");
  const [requestingItemId, setRequestingItemId] = useState("");
  const [requestedItemIds, setRequestedItemIds] = useState([]);
  const [savingSavedItemId, setSavingSavedItemId] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const { closeUserProfile, openUserProfile, profile, profileLoading } =
    usePublicProfileModal();
  const { items, loading: itemsLoading } = useItems({
    activeCommunity,
    activeCommunityId,
    user,
  });
  const { outgoingRequests } = useRequests({
    activeCommunity,
    activeCommunityId,
    user,
  });
  const { loading: savedLoading, savedItemIds, savedItems } = useSavedItems({
    activeCommunity,
    activeCommunityId,
    user,
  });
  const ownerIds = useMemo(() => items.map((item) => item.ownerId), [items]);
  const ownerProfiles = useUserProfiles(ownerIds);

  const savedLiveItems = useMemo(
    () => items.filter((item) => savedItemIds.has(item.id)),
    [items, savedItemIds]
  );
  const liveSavedItemIds = useMemo(
    () => new Set(savedLiveItems.map((item) => item.id)),
    [savedLiveItems]
  );
  const missingSavedItems = useMemo(
    () => savedItems.filter((savedItem) => !liveSavedItemIds.has(savedItem.itemId)),
    [liveSavedItemIds, savedItems]
  );
  const trackedRequestedItemIds = outgoingRequests
    .filter((request) => !closedRequestStatuses.includes(request.status))
    .map((request) => request.itemId);
  const allRequestedItemIds = [
    ...new Set([...trackedRequestedItemIds, ...requestedItemIds]),
  ];
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

  const removeMissingSavedItem = async (savedItem) => {
    setSavingSavedItemId(savedItem.itemId);
    setMessage("");

    try {
      await removeSavedItem({ itemId: savedItem.itemId, user });
      setMessage("Saved item removed.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingSavedItemId("");
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
      setMessage(error.message);
    } finally {
      setRequestingItemId("");
    }
  };

  return (
    <section className="grid gap-6">
      <PageHeader
        eyebrow="Saved Items"
        subtitle={`Keep an eye on items you may want to borrow later in ${activeCommunity}.`}
        title="Your Wishlist"
      />

      {message && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900">
          {message}
        </p>
      )}

      {missingSavedItems.length > 0 && (
        <div className="grid gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-950">
            Some saved items no longer appear in this community.
          </p>
          <div className="grid gap-2">
            {missingSavedItems.map((savedItem) => (
              <div
                className="flex flex-col gap-3 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-amber-100 sm:flex-row sm:items-center sm:justify-between"
                key={savedItem.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {savedItem.itemName || "Saved item"}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    It may have been deleted or moved out of this community.
                  </p>
                </div>
                <button
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={savingSavedItemId === savedItem.itemId}
                  type="button"
                  onClick={() => removeMissingSavedItem(savedItem)}
                >
                  {savingSavedItemId === savedItem.itemId
                    ? "Removing..."
                    : "Remove"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {(itemsLoading || savedLoading) && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              className="h-80 animate-pulse rounded-2xl border border-stone-200 bg-white shadow-sm"
              key={item}
            />
          ))}
        </div>
      )}

      {!itemsLoading && !savedLoading && savedLiveItems.length === 0 && (
        <EmptyState>
          No saved items yet. Tap the heart on an item card to save it here.
        </EmptyState>
      )}

      {!itemsLoading && !savedLoading && savedLiveItems.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {savedLiveItems.map((item) => (
            <ItemCard
              item={item}
              key={item.id}
              onOpenDetail={setSelectedItem}
              onOpenUserProfile={openUserProfile}
              onToggleSaved={handleToggleSaved}
              ownerProfile={ownerProfiles[item.ownerId]}
              saved={savedItemIds.has(item.id)}
              savingSaved={savingSavedItemId === item.id}
              user={user}
            />
          ))}
        </div>
      )}

      <ItemDetailModal
        item={selectedItem}
        items={items}
        onClose={() => setSelectedItem(null)}
        onOpenDetail={setSelectedItem}
        onOpenUserProfile={openUserProfile}
        onRequest={requestItem}
        ownerProfile={ownerProfiles[selectedItem?.ownerId]}
        requested={selectedItemIsRequested}
        requesting={selectedItem?.id === requestingItemId}
        user={user}
      />
      <PublicProfileModal
        activeCommunity={activeCommunity}
        activeCommunityId={activeCommunityId}
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

export default SavedItems;
