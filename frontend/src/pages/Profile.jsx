import TrustRatingMark from "../components/profile/TrustRatingMark";
import { useProfileSummary } from "../hooks/useProfileSummary";
import { formatFirestoreDate } from "../utils/formatDate";
import { getTrustRating, getTrustStats } from "../utils/trust";

function Profile({ activeCommunity, user, userProfile }) {
  const trustRating = getTrustRating(userProfile);
  const trustStats = getTrustStats(userProfile);
  const { error, lendingStats } = useProfileSummary(user.uid, {
    includeBorrowerRequests: false,
    includeOwnerRequests: true,
  });

  return (
    <section className="grid gap-6">
      <ProfileHeader
        activeCommunity={activeCommunity}
        trustRating={trustRating}
        userProfile={userProfile}
      />

      {error && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {error}
        </p>
      )}

      <Section title="Trust Overview">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Completed Borrows"
            value={trustStats.completedBorrows}
          />
          <StatCard
            label="Total Return Issues"
            tone="warning"
            value={trustStats.returnIssues}
          />
        </div>
      </Section>

      <Section
        title="Return Condition Breakdown"
        subtitle="Total return issues is a summary. These cards show the condition categories behind it."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Excellent Condition Returns"
            value={trustStats.excellentReturns}
          />
          <StatCard
            label="Good Condition Returns"
            value={trustStats.goodReturns}
          />
          <StatCard
            label="Minor Wear Returns"
            value={trustStats.minorWearReturns}
          />
          <StatCard label="Damaged Returns" value={trustStats.damagedReturns} />
          <StatCard
            label="Missing Part Returns"
            value={trustStats.missingPartReturns}
          />
          <StatCard
            label="Not Returned Properly"
            value={trustStats.notReturnedIssues}
          />
          <StatCard label="Other Issues" value={trustStats.otherIssues} />
        </div>
      </Section>

      <Section title="Lending Activity">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Listed Items" value={lendingStats.listedItems} />
          <StatCard
            label="Currently Available"
            value={lendingStats.availableItems}
          />
          <StatCard
            label="Currently Lent Out"
            value={lendingStats.currentlyLentOut}
          />
          <StatCard label="Completed Lends" value={lendingStats.completedLends} />
        </div>
      </Section>
    </section>
  );
}

function ProfileHeader({ activeCommunity, trustRating, userProfile }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-6 py-8 sm:px-8">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          Profile
        </p>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {userProfile.photoURL ? (
              <img
                alt=""
                className="h-20 w-20 rounded-3xl object-cover ring-4 ring-white"
                src={userProfile.photoURL}
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-700 text-3xl font-black text-white ring-4 ring-white">
                {(userProfile.username || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950">
                {userProfile.username}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {activeCommunity}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Joined {formatFirestoreDate(userProfile.createdAt, "recently")}
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-white bg-white/80 p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Trust Rating</p>
            <TrustRatingMark className="mt-1" rating={trustRating} size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ children, subtitle, title }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, tone = "neutral", value }) {
  return (
    <article
      className={
        tone === "warning"
          ? "rounded-2xl border border-amber-200 bg-amber-50 p-4"
          : "rounded-2xl border border-stone-200 bg-stone-50 p-4"
      }
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </article>
  );
}

export default Profile;
