import { useMemo, useState } from "react";
import EmptyState from "../components/ui/EmptyState";
import ItemDetailModal from "../components/marketplace/ItemDetailModal";
import PageHeader from "../components/ui/PageHeader";
import PublicProfileModal from "../components/profile/PublicProfileModal";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import { usePublicProfileModal } from "../hooks/usePublicProfileModal";
import { useItems } from "../hooks/useItems";
import { useMyItems } from "../hooks/useMyItems";
import { useRequests } from "../hooks/useRequests";
import { createRequest } from "../services/requestService";
import { getItemCategoryLabel } from "../utils/itemCategories";
import {
  closedRequestStatuses,
  ownerNeedsActionStatuses,
} from "../utils/requestStatus";

function Home({
  activeCommunity,
  activeCommunityId,
  activeCommunityObject,
  navigate,
  onCommunityChange,
  onListItem,
  pagePaths,
  user,
  userProfile,
}) {
  const [message, setMessage] = useState("");
  const [requestingItemId, setRequestingItemId] = useState("");
  const [requestedItemIds, setRequestedItemIds] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const {
    closeUserProfile,
    openUserProfile,
    profile,
    profileLoading,
  } = usePublicProfileModal();
  const { items, loading: itemsLoading } = useItems({
    activeCommunity,
    activeCommunityId,
    user,
  });
  const { items: myItems, loading: myItemsLoading } = useMyItems({
    activeCommunity,
    activeCommunityId,
    user,
  });
  const {
    incomingRequests,
    outgoingRequests,
    requestsLoading,
  } = useRequests({ activeCommunity, activeCommunityId, user });
  const trackedRequestedItemIds = outgoingRequests
    .filter((request) => !closedRequestStatuses.includes(request.status))
    .map((request) => request.itemId);
  const allRequestedItemIds = [
    ...new Set([...trackedRequestedItemIds, ...requestedItemIds]),
  ];

  const availableItems = useMemo(
    () => items.filter((item) => item.available),
    [items]
  );
  const recentAvailableItems = useMemo(
    () => availableItems.slice(0, 4),
    [availableItems]
  );
  const needsActionCount = useMemo(
    () =>
      incomingRequests.filter((request) =>
        ownerNeedsActionStatuses.includes(request.status)
      ).length,
    [incomingRequests]
  );
  const activeRequestCount = useMemo(
    () =>
      [...incomingRequests, ...outgoingRequests].filter(
        (request) => !closedRequestStatuses.includes(request.status)
      ).length,
    [incomingRequests, outgoingRequests]
  );

  const stats = [
    {
      label: "Available Items",
      loading: itemsLoading,
      value: availableItems.length,
      note: `in ${activeCommunity}`,
    },
    {
      label: "My Listed Items",
      loading: myItemsLoading,
      value: myItems.length,
      note: "currently in this community",
    },
    {
      label: "Needs Action",
      loading: requestsLoading,
      value: needsActionCount,
      note: `${activeRequestCount} open request${
        activeRequestCount === 1 ? "" : "s"
      } total`,
    },
  ];

  const actions = [
    {
      label: "Browse Items",
      description: "Find available items in your community.",
      onClick: () => navigate(pagePaths.browse),
    },
    {
      label: "List an Item",
      description: "Share something useful with neighbors.",
      onClick: onListItem,
    },
    {
      label: "View Requests",
      description: "Respond to requests and track borrowing.",
      onClick: () => navigate(pagePaths.requests),
    },
    {
      label: "View History",
      description: "Review completed and closed activity.",
      onClick: () => navigate(pagePaths.history),
    },
  ];

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

  return (
    <section className="grid gap-6">
      <PageHeader
        actions={
          <div className="grid w-full gap-3">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Active community
              <select
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                value={activeCommunityId}
                onChange={(event) => onCommunityChange(event.target.value)}
                disabled={
                  !userProfile.communities.some(
                    (community) => community.communityId
                  )
                }
              >
                {userProfile.communities.map((community) => (
                  <option
                    key={community.communityId || community.name}
                    value={community.communityId}
                  >
                    {community.name}
                  </option>
                ))}
                {!userProfile.communities.some(
                  (community) => community.communityId
                ) && (
                  <option value="">
                    {activeCommunity || "Select or create your community"}
                  </option>
                )}
              </select>
            </label>
            <button
              className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-800 active:scale-[0.98]"
              type="button"
              onClick={onListItem}
            >
              📦 List an Item
            </button>
          </div>
        }
        eyebrow="🏠 Home"
        subtitle="A focused dashboard for the next thing to check, borrow, or share in your community."
        title={`Welcome back, ${userProfile.username}.`}
      />

      {message && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900">
          {message}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="grid gap-4 xl:col-span-8">
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                loading={stat.loading}
                note={stat.note}
                icon={
                  {
                    "Available Items": "📦",
                    "My Listed Items": "🏘️",
                    "Needs Action": "🤝",
                  }[stat.label]
                }
                tone={stat.label === "Needs Action" ? "success" : "neutral"}
                value={stat.value}
              />
            ))}
          </div>

          <SectionCard
            actions={
              <button
                className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                type="button"
                onClick={() => navigate(pagePaths.browse)}
              >
                Browse All
              </button>
            }
            subtitle="A small, current slice of what is available now."
            title={`📦 Recent Available Items in ${activeCommunity}`}
          >
            {itemsLoading && (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    className="h-72 animate-pulse rounded-2xl border border-stone-200 bg-stone-50"
                    key={item}
                  />
                ))}
              </div>
            )}

            {!itemsLoading && recentAvailableItems.length === 0 && (
              <EmptyState>No available items have been listed here yet.</EmptyState>
            )}

            {!itemsLoading && recentAvailableItems.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                {recentAvailableItems.map((item) => (
                  <button
                    className="group overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100">
                      {item.imageBase64 ? (
                        <img
                          alt={item.name}
                          className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                          src={item.imageBase64}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/85 text-2xl font-black text-emerald-800 shadow-sm">
                            {(item.name || "?").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2 p-4">
                      <h3 className="line-clamp-1 font-black text-slate-950">
                        {item.name}
                      </h3>
                      <p className="line-clamp-1 text-sm font-semibold text-slate-500">
                        {getItemCategoryLabel(item)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </section>

        <aside className="grid gap-6 xl:col-span-4">
          <SectionCard
            actions={
              <button
                className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
                type="button"
                onClick={() => navigate(pagePaths.requests)}
              >
                Open Requests
              </button>
            }
            subtitle="Requests that need your decision before handover."
            title="⚡ Needs Action"
          >
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-5xl font-black text-emerald-900">
                {requestsLoading ? "..." : needsActionCount}
              </p>
              <p className="mt-2 text-sm font-semibold text-emerald-900">
                {needsActionCount === 1
                  ? "request needs attention"
                  : "requests need attention"}
              </p>
            </div>
          </SectionCard>

          <SectionCard title="✨ Quick Actions">
            <div className="grid gap-3">
              {actions.map((action) => (
                <button
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md active:scale-[0.98]"
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                >
                  <span className="text-base font-black text-slate-950">
                    {action.label}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    {action.description}
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="🏘️ Community Summary">
            <div className="grid gap-3">
              <SummaryRow label="Active community" value={activeCommunity} />
              <SummaryRow
                label="Available to borrow"
                value={`${availableItems.length} item${
                  availableItems.length === 1 ? "" : "s"
                }`}
              />
              <SummaryRow
                label="Your listings"
                value={`${myItems.length} item${myItems.length === 1 ? "" : "s"}`}
              />
              <SummaryRow
                label="Open records"
                value={`${activeRequestCount} request${
                  activeRequestCount === 1 ? "" : "s"
                }`}
              />
            </div>
          </SectionCard>
        </aside>
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
    </section>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="text-right text-sm font-black text-slate-900">
        {value}
      </span>
    </div>
  );
}

export default Home;
