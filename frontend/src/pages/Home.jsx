import { useMemo } from "react";
import MarketplaceView from "../components/marketplace/MarketplaceView";
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
  const communityLabel = activeCommunity || "your community";

  const quickActions = [
    {
      helper: "Edit listings and availability.",
      label: "My Items",
      mark: "\u{1F4E6}",
      onClick: () => navigate(pagePaths.myItems),
      tone: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    },
    {
      helper: "Review borrowing activity.",
      label: "Requests",
      mark: "\u{1F91D}",
      onClick: () => navigate(pagePaths.requests),
      tone: "bg-amber-50 text-amber-800 ring-amber-100",
    },
    {
      helper: "See completed records.",
      label: "History",
      mark: "\u{1F552}",
      onClick: () => navigate(pagePaths.history),
      tone: "bg-sky-50 text-sky-800 ring-sky-100",
    },
    {
      helper: "Manage trust and account details.",
      label: "Profile",
      mark: "\u{2B50}",
      onClick: () => navigate(pagePaths.profile),
      tone: "bg-violet-50 text-violet-800 ring-violet-100",
    },
  ];

  return (
    <section className="grid gap-6">
      <section className="sharesync-card-glow sharesync-hero-texture animate-slide-up relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-5 backdrop-blur sm:p-7 lg:p-8">
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <div className="min-w-0">
            <p className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-800 shadow-sm ring-1 ring-emerald-100">
              Friendly Community Marketplace
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Borrow what you need, share what you don't. {"\u{1F331}"}
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
              Find practical things from {communityLabel}, keep useful items
              moving, and make everyday borrowing feel more neighborly.
            </p>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-xl shadow-slate-950/5 backdrop-blur lg:mt-2">
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Active community
              <select
                className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition hover:border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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

            <div className="mt-4 grid grid-cols-3 gap-2">
              <HeroMiniStat
                label="Available"
                loading={itemsLoading}
                value={availableItems.length}
              />
              <HeroMiniStat
                label="Yours"
                loading={myItemsLoading}
                value={myItems.length}
              />
              <HeroMiniStat
                label="Open"
                loading={requestsLoading}
                value={activeRequests.length}
              />
            </div>
          </div>
        </div>
      </section>

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
                className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-800 active:scale-[0.98]"
                type="button"
                onClick={() => navigate(pagePaths.requests)}
              >
                Open
              </button>
            }
            subtitle="Owner-side requests that may need a reply or handover step."
            title={`${"\u{1F4AC}"} Needs Action`}
          >
            {requestsLoading && (
              <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-stone-200">
                Checking requests...
              </p>
            )}

            {!requestsLoading && actionableRequests.length === 0 && (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-100">
                No urgent actions right now {"\u{1F389}"}
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

          <SectionCard title={`${"\u{2728}"} Quick Actions`}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {quickActions.map((action) => (
                <button
                  className="group flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md active:scale-[0.98]"
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg font-black ring-1 transition-transform duration-200 group-hover:scale-105 ${action.tone}`}
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

          <SectionCard title={`${"\u{1F3E0}"} Community Summary`}>
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
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-stone-50 to-white px-4 py-3 ring-1 ring-stone-200/70">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="text-right text-sm font-black text-slate-900">
        {loading ? "..." : value}
      </span>
    </div>
  );
}

function HeroMiniStat({ label, loading = false, value }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 px-3 py-3 text-center ring-1 ring-white/80">
      <p className="text-xl font-black text-slate-950">
        {loading ? "..." : value}
      </p>
      <p className="mt-1 text-[0.68rem] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}

export default Home;
