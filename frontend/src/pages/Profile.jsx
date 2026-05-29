import Badge from "../components/ui/Badge";
import {
  getTrustBadgeClass,
  getTrustLabel,
  getTrustScore,
  getTrustStats,
} from "../utils/trust";

function Profile({ activeCommunity, user, userProfile }) {
  const trustScore = getTrustScore(userProfile);
  const trustLabel = getTrustLabel(trustScore);
  const trustStats = getTrustStats(userProfile);

  return (
    <section className="grid gap-6">
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
                  {userProfile.email}
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-white bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Trust Score</p>
              <p className="mt-1 text-3xl font-black text-slate-950">
                {trustScore} / 100
              </p>
              <Badge className={`mt-2 ${getTrustBadgeClass(trustScore)}`}>
                {trustLabel}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
          <ProfileStat label="Active community" value={activeCommunity} />
          <ProfileStat
            label="Completed Borrows"
            value={trustStats.completedBorrows}
          />
          <ProfileStat label="Login type" value={userProfile.authProvider || "member"} />
        </div>

        <div className="border-t border-stone-100 p-6 sm:p-8">
          <h2 className="text-xl font-black text-slate-950">Trust stats</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TrustStat label="Good Returns" value={trustStats.goodReturns} />
            <TrustStat
              label="Minor Wear Returns"
              value={trustStats.minorWearReturns}
            />
            <TrustStat label="Return Issues" value={trustStats.returnIssues} />
            <TrustStat
              label="Damaged Returns"
              value={trustStats.damagedReturns}
            />
            <TrustStat
              label="Missing Part Returns"
              value={trustStats.missingPartReturns}
            />
            <TrustStat
              label="Not Returned Issues"
              value={trustStats.notReturnedIssues}
            />
            <TrustStat label="Other Issues" value={trustStats.otherIssues} />
          </div>
        </div>

        <div className="border-t border-stone-100 p-6 sm:p-8">
          <h2 className="text-xl font-black text-slate-950">Account details</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
              <dt className="font-bold text-slate-500">Username</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {userProfile.username}
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
              <dt className="font-bold text-slate-500">Communities</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {(userProfile.communities || []).join(", ")}
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:col-span-2">
              <dt className="font-bold text-slate-500">Firebase account</dt>
              <dd className="mt-1 break-all font-semibold text-slate-900">
                {user.email}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function ProfileStat({ label, value }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black capitalize text-slate-950">
        {value}
      </p>
    </article>
  );
}

function TrustStat({ label, value }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </article>
  );
}

export default Profile;
