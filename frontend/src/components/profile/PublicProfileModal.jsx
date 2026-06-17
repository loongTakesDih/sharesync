import { useProfileSummary } from "../../hooks/useProfileSummary";
import { formatFirestoreDate } from "../../utils/formatDate";
import { getItemCategoryLabel } from "../../utils/itemCategories";
import { getTrustRating, getTrustStats } from "../../utils/trust";
import TrustRatingMark from "./TrustRatingMark";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";

function PublicProfileModal({ loading, onClose, onOpenItemDetail, profile }) {
  const {
    error,
    loading: summaryLoading,
    ownedItems,
  } = useProfileSummary(profile?.uid, {
    includeBorrowerRequests: false,
    includeOwnerRequests: false,
  });

  if (!profile) {
    return null;
  }

  const trustRating = getTrustRating(profile);
  const stats = getTrustStats(profile);
  const availableItems = ownedItems.filter((item) => item.available === true);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        className="max-h-[calc(100svh-3rem)] w-full max-w-6xl overflow-auto rounded-2xl border border-stone-200 bg-[#f8f6f1] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 bg-white px-5 py-5 sm:px-6">
          <div className="flex items-center gap-4">
            {profile.photoURL ? (
              <img
                alt=""
                className="h-16 w-16 rounded-2xl object-cover"
                src={profile.photoURL}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-2xl font-black text-white">
                {(profile.username || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                {profile.username || "ShareSync user"}
              </h2>
              <TrustRatingMark className="mt-1" rating={trustRating} />
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Joined {formatFirestoreDate(profile.createdAt, "recently")}
              </p>
            </div>
          </div>
          <button
            className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-50"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="grid gap-5 lg:self-start">
            {(loading || summaryLoading) && (
              <p className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-600 ring-1 ring-stone-200">
                Loading profile...
              </p>
            )}

            {error && (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {error}
              </p>
            )}

            <Section title="⭐ Trust Overview">
              <div className="grid gap-3">
                <Stat label="Completed Borrows" value={stats.completedBorrows} />
                <Stat label="Total Return Issues" value={stats.returnIssues} />
              </div>
            </Section>
          </aside>

          <main className="grid gap-5">
            <Section title="✨ Return Condition Breakdown">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Stat label="Excellent Condition" value={stats.excellentReturns} />
                <Stat label="Good Condition" value={stats.goodReturns} />
                <Stat label="Minor Wear" value={stats.minorWearReturns} />
                <Stat label="Damaged" value={stats.damagedReturns} />
                <Stat label="Missing Part" value={stats.missingPartReturns} />
                <Stat
                  label="Not Returned Properly"
                  value={stats.notReturnedIssues}
                />
                <Stat label="Other Issues" value={stats.otherIssues} />
              </div>
            </Section>

            <Section title="📦 Available Items from this User">
              {availableItems.length === 0 && (
                <EmptyState>No available listings found.</EmptyState>
              )}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {availableItems.slice(0, 6).map((item) => (
                  <button
                    className="overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md disabled:hover:translate-y-0 disabled:hover:border-stone-200 disabled:hover:shadow-sm"
                    disabled={!onOpenItemDetail}
                    key={item.id}
                    type="button"
                    onClick={() => onOpenItemDetail?.(item)}
                  >
                    {item.imageBase64 ? (
                      <div className="relative aspect-[4/3] bg-white">
                        <img
                          alt={item.name}
                          className="absolute inset-0 h-full w-full object-contain"
                          src={item.imageBase64}
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/85 text-xl font-black text-emerald-800 shadow-sm">
                          {(item.name || "?").slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 font-black text-slate-950">
                          {item.name}
                        </h3>
                        <Badge
                          className={
                            item.available
                              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                              : "bg-stone-100 text-slate-600 ring-stone-200"
                          }
                        >
                          {item.available ? "✅ Available" : "⚠️ Unavailable"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Chip>{getItemCategoryLabel(item)}</Chip>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Section>
          </main>
        </div>
      </div>
    </div>
  );
}

function Section({ children, title }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-stone-200">
      {children}
    </span>
  );
}

export default PublicProfileModal;
