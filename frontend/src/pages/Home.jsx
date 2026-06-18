import { useMemo } from "react";
import MarketplaceView from "../components/marketplace/MarketplaceView";
import PageHeader from "../components/ui/PageHeader";
import SectionCard from "../components/ui/SectionCard";
import { useItems } from "../hooks/useItems";
import { useMyItems } from "../hooks/useMyItems";
import { useRequests } from "../hooks/useRequests";
import {
  closedRequestStatuses,
  getStatusBadgeLabel,
  ownerNeedsActionStatuses,
} from "../utils/requestStatus";

function Home({
  activeCommunity,
  activeCommunityId,
  activeCommunityObject,
  listIntent,
  navigate,
  onCommunityChange,
  onListItem,
  onSearchChange,
  pagePaths,
  searchTerm,
  user,
  userProfile,
}) {
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
  const { incomingRequests, outgoingRequests, requestsLoading } = useRequests({
    activeCommunity,
    activeCommunityId,
    user,
  });

  const availableItems = useMemo(
    () => items.filter((item) => item.available),
    [items]
  );
  const activeRequests = useMemo(
    () =>
      [...incomingRequests, ...outgoingRequests].filter(
        (request) => !closedRequestStatuses.includes(request.status)
      ),
    [incomingRequests, outgoingRequests]
  );
  const actionableRequests = useMemo(
    () =>
      incomingRequests
        .filter((request) => ownerNeedsActionStatuses.includes(request.status))
        .slice(0, 3),
    [incomingRequests]
  );
  const hasStructuredCommunities = userProfile.communities.some(
    (community) => community.communityId
  );

  const quickActions = [
    {
      label: "My Items",
      helper: "Edit listings and availability.",
      mark: "📦",
      tone: "bg-emerald-50 text-emerald-800 ring-emerald-100",
      onClick: () => navigate(pagePaths.myItems),
    },
    {
      label: "Requests",
      helper: "Review borrowing activity.",
      mark: "🤝",
      tone: "bg-amber-50 text-amber-800 ring-amber-100",
      onClick: () => navigate(pagePaths.requests),
    },
    {
      label: "History",
      helper: "See completed records.",
      mark: "🕘",
      tone: "bg-sky-50 text-sky-800 ring-sky-100",
      onClick: () => navigate(pagePaths.history),
    },
    {
      label: "Profile",
      helper: "Manage trust and account details.",
      mark: "⭐",
      tone: "bg-violet-50 text-violet-800 ring-violet-100",
      onClick: () => navigate(pagePaths.profile),
    },
  ];

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
                disabled={!hasStructuredCommunities}
              >
                {userProfile.communities.map((community) => (
                  <option
                    key={community.communityId || community.name}
                    value={community.communityId}
                  >
                    {community.name}
                  </option>
                ))}
                {!hasStructuredCommunities && (
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
              List Item
            </button>
          </div>
        }
        eyebrow="Home"
        subtitle={`Borrow useful things from ${activeCommunity}, or list something your neighbors can use.`}
        title={`Find something nearby, ${userProfile.username}.`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <MarketplaceView
            activeCommunity={activeCommunity}
            activeCommunityId={activeCommunityId}
            activeCommunityObject={activeCommunityObject}
            availableOnly
            embedded
            key={listIntent}
            listIntent={listIntent}
            onSearchChange={onSearchChange}
            searchTerm={searchTerm}
            user={user}
            userProfile={userProfile}
          />
        </div>

        <aside className="grid content-start gap-5">
          <SectionCard
            actions={
              <button
                className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
                type="button"
                onClick={() => navigate(pagePaths.requests)}
              >
                Open
              </button>
            }
            subtitle="Owner-side requests that may need a reply or handover step."
            title="Needs Action"
          >
            {requestsLoading && (
              <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-stone-200">
                Checking requests...
              </p>
            )}

            {!requestsLoading && actionableRequests.length === 0 && (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-100">
                No urgent actions right now.
              </p>
            )}

            {!requestsLoading && actionableRequests.length > 0 && (
              <div className="grid gap-3">
                {actionableRequests.map((request) => (
                  <button
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm"
                    key={request.id}
                    type="button"
                    onClick={() => navigate(pagePaths.requests)}
                  >
                    <span className="line-clamp-1 text-sm font-black text-slate-950">
                      {request.itemName || "Borrow request"}
                    </span>
                    <span className="mt-1 block line-clamp-1 text-xs font-semibold text-slate-500">
                      {request.borrowerUsername || "A neighbor"} -{" "}
                      {getStatusBadgeLabel(request.status)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Quick Actions">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {quickActions.map((action) => (
                <button
                  className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md active:scale-[0.98]"
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg font-black ring-1 ${action.tone}`}
                  >
                    {action.mark}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-950">
                      {action.label}
                    </span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                      {action.helper}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Community Summary">
            <div className="grid gap-3">
              <SummaryRow label="Active community" value={activeCommunity} />
              <SummaryRow
                label="Available to borrow"
                loading={itemsLoading}
                value={`${availableItems.length} item${
                  availableItems.length === 1 ? "" : "s"
                }`}
              />
              <SummaryRow
                label="Your listings"
                loading={myItemsLoading}
                value={`${myItems.length} item${myItems.length === 1 ? "" : "s"}`}
              />
              <SummaryRow
                label="Open requests"
                loading={requestsLoading}
                value={`${activeRequests.length} request${
                  activeRequests.length === 1 ? "" : "s"
                }`}
              />
              {activeCommunityObject?.type && (
                <SummaryRow label="Community type" value={activeCommunityObject.type} />
              )}
            </div>
          </SectionCard>
        </aside>
      </div>
    </section>
  );
}

function SummaryRow({ label, loading = false, value }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="text-right text-sm font-black text-slate-900">
        {loading ? "..." : value}
      </span>
    </div>
  );
}

export default Home;
