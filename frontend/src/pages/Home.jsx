import { useMemo } from "react";
import MarketplaceView from "../components/marketplace/MarketplaceView";
import PublicProfileModal from "../components/profile/PublicProfileModal";
import ProfileAvatar from "../components/profile/ProfileAvatar";
import TrustRatingMark from "../components/profile/TrustRatingMark";
import SectionCard from "../components/ui/SectionCard";
import { useCommunityNeighbors } from "../hooks/useCommunityNeighbors";
import { usePublicProfileModal } from "../hooks/usePublicProfileModal";
import { useRequests } from "../hooks/useRequests";
import { getProfileActiveCommunity } from "../utils/communityDisplay";
import { formatFirestoreDate } from "../utils/formatDate";
import {
  activeBorrowingStatuses,
  ownerNeedsActionStatuses,
  pendingBorrowerRequestStatuses,
} from "../utils/requestStatus";
import { getTrustRating } from "../utils/trust";

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
  const { incomingRequests, outgoingRequests, requestsLoading } = useRequests({
    activeCommunity,
    activeCommunityId,
    user,
  });
  const { loading: neighborsLoading, neighbors } = useCommunityNeighbors({
    activeCommunity,
    activeCommunityId,
    user,
  });
  const {
    closeUserProfile,
    openUserProfile,
    profile: selectedNeighbor,
    profileLoading,
  } = usePublicProfileModal();
  const communities = userProfile?.communities || [];
  const switchableCommunities = communities.filter(
    (community) => community.communityId
  );
  const hasMultipleCommunities = switchableCommunities.length > 1;
  const communityLabel = activeCommunity || "your community";
  const actionCounts = useMemo(
    () => [
      {
        label: "Incoming",
        value: incomingRequests.filter(
          (request) =>
            request.ownerId === user.uid &&
            ownerNeedsActionStatuses.includes(request.status)
        ).length,
      },
      {
        label: "Pending",
        value: outgoingRequests.filter(
          (request) =>
            request.borrowerId === user.uid &&
            pendingBorrowerRequestStatuses.includes(request.status)
        ).length,
      },
      {
        label: "Active Lending",
        value: incomingRequests.filter(
          (request) =>
            request.ownerId === user.uid &&
            activeBorrowingStatuses.includes(request.status)
        ).length,
      },
      {
        label: "Active Borrowing",
        value: outgoingRequests.filter(
          (request) =>
            request.borrowerId === user.uid &&
            activeBorrowingStatuses.includes(request.status)
        ).length,
      },
    ],
    [incomingRequests, outgoingRequests, user.uid]
  );

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
              Active community
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Sharing in {communityLabel}
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
              Borrow, lend, and connect with neighbors in your selected community.
            </p>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-xl shadow-slate-950/5 backdrop-blur lg:mt-2">
            <label className="grid gap-2 text-sm font-black text-slate-700">
              {hasMultipleCommunities ? "Switch community" : "Current community"}
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2"
                >
                  {"\u{1F3D8}\uFE0F"}
                </span>
                <select
                  className="w-full appearance-none rounded-2xl border border-emerald-100 bg-emerald-50 py-3 pl-11 pr-10 text-sm font-black text-emerald-950 shadow-sm outline-none transition enabled:cursor-pointer enabled:hover:border-emerald-300 enabled:hover:bg-emerald-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-default disabled:opacity-100"
                  value={activeCommunityId || ""}
                  onChange={(event) => onCommunityChange(event.target.value)}
                  disabled={!hasMultipleCommunities}
                >
                  {switchableCommunities.length > 0 ? (
                    switchableCommunities.map((community) => (
                      <option key={community.communityId} value={community.communityId}>
                        {community.communityId === activeCommunityId ? "Current - " : ""}
                        {community.name || community.displayName || community.area}
                      </option>
                    ))
                  ) : (
                    <option value="">{communityLabel}</option>
                  )}
                </select>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-black text-emerald-700"
                >
                  {hasMultipleCommunities ? "\u2304" : "\u2713"}
                </span>
              </div>
              <span className="text-xs font-semibold leading-5 text-slate-500">
                {hasMultipleCommunities
                  ? "Choose where you want to browse, borrow, and lend."
                  : "Items and requests are filtered to this community."}
              </span>
            </label>
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
            subtitle="A quick view of borrowing activity. Open Requests for details."
            title={`${"\u{1F4AC}"} Needs Action`}
          >
            <div className="grid grid-cols-2 gap-3">
              {actionCounts.map((count) => (
                <button
                  className="rounded-2xl bg-gradient-to-br from-stone-50 to-white px-3 py-4 text-center ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:ring-emerald-300"
                  key={count.label}
                  type="button"
                  onClick={() => navigate(pagePaths.requests)}
                >
                  <span className="block text-2xl font-black text-slate-950">
                    {requestsLoading ? "..." : count.value}
                  </span>
                  <span className="mt-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                    {count.label}
                  </span>
                </button>
              ))}
            </div>
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

          <SectionCard
            subtitle={`People currently sharing in ${communityLabel}.`}
            title={`${"\u{1F44B}"} Recently Joined Neighbors`}
          >
            {neighborsLoading && (
              <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-stone-200">
                Finding neighbors...
              </p>
            )}
            {!neighborsLoading && neighbors.length === 0 && (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-100">
                No neighbors found yet.
              </p>
            )}
            {!neighborsLoading && neighbors.length > 0 && (
              <div className="grid max-h-[320px] gap-3 overflow-y-auto p-1 pr-2">
                {neighbors.map((neighbor) => (
                  <button
                    className="group flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-stone-50 to-white px-3 py-3 text-left ring-1 ring-stone-200/70 transition hover:-translate-y-0.5 hover:from-emerald-50 hover:ring-emerald-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    key={neighbor.uid}
                    type="button"
                    onClick={() => openUserProfile(neighbor.uid, neighbor)}
                  >
                    <ProfileAvatar profile={neighbor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950">
                        {neighbor.username || "ShareSync neighbor"}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {getProfileActiveCommunity(neighbor)}
                      </p>
                      {neighbor.createdAt && (
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                          Joined {formatFirestoreDate(neighbor.createdAt)}
                        </p>
                      )}
                    </div>
                    <TrustRatingMark rating={getTrustRating(neighbor)} size="sm" />
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </aside>
      </div>
      <PublicProfileModal
        loading={profileLoading}
        onClose={closeUserProfile}
        profile={selectedNeighbor}
      />
    </section>
  );
}

export default Home;
