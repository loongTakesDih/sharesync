import { useMemo, useState } from "react";
import EmptyState from "../components/ui/EmptyState";
import ItemDetailModal from "../components/marketplace/ItemDetailModal";
import PublicProfileModal from "../components/profile/PublicProfileModal";
import { usePublicProfileModal } from "../hooks/usePublicProfileModal";
import { useItems } from "../hooks/useItems";
import { useMyItems } from "../hooks/useMyItems";
import { useRequests } from "../hooks/useRequests";
import { createRequest } from "../services/requestService";
import { closedRequestStatuses } from "../utils/requestStatus";

function Home({
  activeCommunity,
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
  const { items, loading: itemsLoading } = useItems({ activeCommunity, user });
  const { items: myItems, loading: myItemsLoading } = useMyItems({
    activeCommunity,
    user,
  });
  const {
    incomingRequests,
    outgoingRequests,
    requestsLoading,
  } = useRequests({ activeCommunity, user });
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
  const recentItems = useMemo(() => items.slice(0, 4), [items]);
  const needsActionCount = useMemo(
    () =>
      [
        ...incomingRequests.filter(
          (request) =>
            request.status === "pending" ||
            request.status === "pickup_change_requested" ||
            request.status === "pickup_confirmed" ||
            request.status === "return_pending" ||
            request.status === "return_issue"
        ),
        ...outgoingRequests.filter(
          (request) => request.status === "pickup_scheduled"
        ),
      ].length,
    [incomingRequests, outgoingRequests]
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
      note: `${activeRequestCount} active request${
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
    <section className="grid gap-6">
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="grid gap-6 bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-5 py-6 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
              Home
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Welcome back, {userProfile.username}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Check what needs attention, browse nearby listings, or share an
              item with your active community.
            </p>
          </div>

          <div className="self-end rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Active community
              <select
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                value={activeCommunity}
                onChange={(event) => onCommunityChange(event.target.value)}
              >
                {userProfile.communities.map((community) => (
                  <option key={community} value={community}>
                    {community}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <button
            className="rounded-3xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-md"
            key={action.label}
            type="button"
            onClick={action.onClick}
          >
            <span className="text-lg font-black text-slate-950">
              {action.label}
            </span>
            <span className="mt-2 block text-sm leading-6 text-slate-600">
              {action.description}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
            key={stat.label}
          >
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-4xl font-black text-slate-950">
              {stat.loading ? "..." : stat.value}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {stat.note}
            </p>
          </div>
        ))}
      </div>

      {message && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900">
          {message}
        </p>
      )}

      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
              Recently Added
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Latest in {activeCommunity}
            </h2>
          </div>
          <button
            className="self-start rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
            type="button"
            onClick={() => navigate(pagePaths.browse)}
          >
            Browse All
          </button>
        </div>

        {itemsLoading && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                className="h-52 animate-pulse rounded-3xl border border-stone-200 bg-stone-50"
                key={item}
              />
            ))}
          </div>
        )}

        {!itemsLoading && recentItems.length === 0 && (
          <div className="mt-5">
            <EmptyState>No items have been listed here yet.</EmptyState>
          </div>
        )}

        {!itemsLoading && recentItems.length > 0 && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recentItems.map((item) => (
              <button
                className="overflow-hidden rounded-3xl border border-stone-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100">
                  {item.imageBase64 ? (
                    <img
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-contain"
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
                    {item.category || "Item"} by{" "}
                    {item.ownerUsername || item.ownerEmail || "Neighbor"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
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

export default Home;
