import { useProfileSummary } from "../../hooks/useProfileSummary";
import { formatFirestoreDate } from "../../utils/formatDate";
import { getItemCategoryLabel } from "../../utils/itemCategories";
import {
  getTrustBadgeClass,
  getTrustLabel,
  getTrustScore,
  getTrustStats,
} from "../../utils/trust";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";

function PublicProfileModal({ loading, onClose, profile }) {
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

  const score = getTrustScore(profile);
  const trustLabel = getTrustLabel(score);
  const stats = getTrustStats(profile);
  const availableItems = ownedItems.filter((item) => item.available === true);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        className="max-h-[calc(100svh-3rem)] w-full max-w-3xl overflow-auto rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
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
              <Badge className={`mt-2 ${getTrustBadgeClass(score)}`}>
                {score} / 100 - {trustLabel}
              </Badge>
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

        {(loading || summaryLoading) && (
          <p className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-medium text-slate-600">
            Loading profile...
          </p>
        )}

        {error && (
          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {error}
          </p>
        )}

        <Section title="Trust Overview">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Trust Score" value={`${score} / 100`} />
            <Stat label="Trust Label" value={trustLabel} />
            <Stat label="Completed Borrows" value={stats.completedBorrows} />
            <Stat label="Total Return Issues" value={stats.returnIssues} />
          </div>
        </Section>

        <Section title="Return Condition Breakdown">
          <div className="grid gap-3 sm:grid-cols-3">
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

        <Section title="Available Items from this User">
          {availableItems.length === 0 && (
            <EmptyState>No available listings found.</EmptyState>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {availableItems.slice(0, 6).map((item) => (
              <article
                className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50"
                key={item.id}
              >
                <div className="relative h-28 bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100">
                  {item.imageBase64 ? (
                    <img
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      src={item.imageBase64}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/85 text-xl font-black text-emerald-800 shadow-sm">
                        {(item.name || "?").slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-950">{item.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {item.description || "No description provided."}
                      </p>
                    </div>
                    <Badge
                      className={
                        item.available
                          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                          : "bg-stone-100 text-slate-600 ring-stone-200"
                      }
                    >
                      {item.available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Chip>{getItemCategoryLabel(item)}</Chip>
                    <Chip>{item.community}</Chip>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ children, title }) {
  return (
    <section className="mt-6">
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
