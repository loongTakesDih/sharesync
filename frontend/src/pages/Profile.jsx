import TrustRatingMark from "../components/profile/TrustRatingMark";
import SectionCard from "../components/ui/SectionCard";
import UiStatCard from "../components/ui/StatCard";
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

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="grid gap-6 xl:col-span-4">
          <SectionCard title="Trust Overview">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <UiStatCard
                label="Completed Borrows"
                tone="success"
                value={trustStats.completedBorrows}
              />
              <UiStatCard
                label="Total Return Issues"
                tone="warning"
                value={trustStats.returnIssues}
              />
            </div>
          </SectionCard>

          <SectionCard title="Lending Activity">
            <div className="grid gap-3 sm:grid-cols-2">
              <UiStatCard label="Listed Items" value={lendingStats.listedItems} />
              <UiStatCard
                label="Currently Available"
                value={lendingStats.availableItems}
              />
              <UiStatCard
                label="Currently Lent Out"
                value={lendingStats.currentlyLentOut}
              />
              <UiStatCard
                label="Completed Lends"
                value={lendingStats.completedLends}
              />
            </div>
          </SectionCard>
        </div>

        <SectionCard
          className="xl:col-span-8"
          subtitle="Total return issues is a summary. These cards show the condition categories behind it."
          title="Return Condition Breakdown"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <UiStatCard
              label="Excellent Condition Returns"
              value={trustStats.excellentReturns}
            />
            <UiStatCard
              label="Good Condition Returns"
              value={trustStats.goodReturns}
            />
            <UiStatCard
              label="Minor Wear Returns"
              value={trustStats.minorWearReturns}
            />
            <UiStatCard
              label="Damaged Returns"
              value={trustStats.damagedReturns}
            />
            <UiStatCard
              label="Missing Part Returns"
              value={trustStats.missingPartReturns}
            />
            <UiStatCard
              label="Not Returned Properly"
              value={trustStats.notReturnedIssues}
            />
            <UiStatCard label="Other Issues" value={trustStats.otherIssues} />
          </div>
        </SectionCard>
      </div>
    </section>
  );
}

function ProfileHeader({ activeCommunity, trustRating, userProfile }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-6 py-8 sm:px-8">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          Profile
        </p>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {userProfile.photoURL ? (
              <img
                alt=""
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white"
                src={userProfile.photoURL}
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-700 text-3xl font-black text-white ring-4 ring-white">
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
          <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Trust Rating</p>
            <TrustRatingMark className="mt-1" rating={trustRating} size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
