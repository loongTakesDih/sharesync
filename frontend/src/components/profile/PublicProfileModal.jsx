import { formatFirestoreDate } from "../../utils/formatDate";
import {
  getTrustBadgeClass,
  getTrustLabel,
  getTrustScore,
  getTrustStats,
} from "../../utils/trust";
import Badge from "../ui/Badge";

function PublicProfileModal({ loading, onClose, profile }) {
  if (!profile) {
    return null;
  }

  const score = getTrustScore(profile);
  const trustLabel = getTrustLabel(score);
  const stats = getTrustStats(profile);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8"
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
                {score} / 100 · {trustLabel}
              </Badge>
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

        {loading && (
          <p className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-medium text-slate-600">
            Loading profile...
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Completed" value={stats.completedBorrows} />
          <Stat label="Good Returns" value={stats.goodReturns} />
          <Stat label="Issues" value={stats.returnIssues} />
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-bold text-slate-500">Joined</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {formatFirestoreDate(profile.createdAt, "Not available")}
          </p>
        </div>
      </div>
    </div>
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

export default PublicProfileModal;
