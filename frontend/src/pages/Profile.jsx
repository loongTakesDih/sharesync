import { useState } from "react";
import EditProfileModal from "../components/profile/EditProfileModal";
import ProfileAvatar from "../components/profile/ProfileAvatar";
import TrustBadge from "../components/profile/TrustBadge";
import TrustRatingMark from "../components/profile/TrustRatingMark";
import SectionCard from "../components/ui/SectionCard";
import UiStatCard from "../components/ui/StatCard";
import { useProfileSummary } from "../hooks/useProfileSummary";
import { formatFirestoreDate } from "../utils/formatDate";
import { getTrustRating, getTrustStats } from "../utils/trust";

function Profile({ activeCommunity, activeCommunityId, user, userProfile }) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
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
        onEdit={() => {
          setMessage("");
          setEditing(true);
        }}
        trustRating={trustRating}
        userProfile={userProfile}
      />

      {message && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {error}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="grid gap-6 xl:col-span-4">
          <AboutSection
            activeCommunity={activeCommunity}
            userProfile={userProfile}
          />

          <SectionCard title={`${"\u2B50"} Trust Overview`}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <UiStatCard
                icon={`${"\u2705"}`}
                label="Completed Borrows"
                tone="success"
                value={trustStats.completedBorrows}
              />
              <UiStatCard
                icon={`${"\u26A0\uFE0F"}`}
                label="Total Return Issues"
                tone="warning"
                value={trustStats.returnIssues}
              />
            </div>
          </SectionCard>

          <SectionCard title={`${"\u{1F331}"} Lending Activity`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <UiStatCard
                icon={`${"\u{1F4E6}"}`}
                label="Listed Items"
                value={lendingStats.listedItems}
              />
              <UiStatCard
                icon={`${"\u2705"}`}
                label="Currently Available"
                value={lendingStats.availableItems}
              />
              <UiStatCard
                icon={`${"\u{1F91D}"}`}
                label="Currently Lent Out"
                value={lendingStats.currentlyLentOut}
              />
              <UiStatCard
                icon={`${"\u{1F389}"}`}
                label="Completed Lends"
                value={lendingStats.completedLends}
              />
            </div>
          </SectionCard>
        </div>

        <SectionCard
          className="xl:col-span-8"
          subtitle="Total return issues is a summary. These cards show the condition categories behind it."
          title={`${"\u2728"} Return Condition Breakdown`}
        >
          <ReturnConditionBreakdown trustStats={trustStats} />
        </SectionCard>
      </div>

      {editing && (
        <EditProfileModal
          activeCommunityId={activeCommunityId}
          onClose={() => setEditing(false)}
          onSaved={setMessage}
          user={user}
          userProfile={userProfile}
        />
      )}
    </section>
  );
}

function ReturnConditionBreakdown({ trustStats }) {
  const rows = [
    {
      description:
        "This user consistently returns items in excellent shape. Keep up the outstanding care.",
      label: "Excellent Condition",
      tone: "from-emerald-500 to-teal-500",
      value: trustStats.excellentReturns,
    },
    {
      description:
        "This user usually returns items well and respectfully. A little extra care keeps trust strong.",
      label: "Good Condition",
      tone: "from-lime-500 to-emerald-500",
      value: trustStats.goodReturns,
    },
    {
      description:
        "Normal wear can happen, but try to return items with as little wear as possible.",
      label: "Minor Wear",
      tone: "from-amber-400 to-orange-400",
      value: trustStats.minorWearReturns,
    },
    {
      description:
        "This outcome signals item damage. Please handle borrowed items carefully and responsibly.",
      label: "Damaged",
      tone: "from-rose-400 to-red-500",
      value: trustStats.damagedReturns,
    },
    {
      description:
        "This item was often returned with something missing. Double-check all parts before returning.",
      label: "Missing Part",
      tone: "from-purple-400 to-violet-500",
      value: trustStats.missingPartReturns,
    },
    {
      description:
        "This outcome suggests incomplete or improper returns. Make sure borrowed items are returned correctly and on time.",
      label: "Not Returned Properly",
      tone: "from-slate-500 to-slate-700",
      value: trustStats.notReturnedIssues,
    },
    {
      description:
        "This outcome reflects recurring return concerns. Pay extra attention to return expectations and item care.",
      label: "Other Issues",
      tone: "from-sky-400 to-cyan-500",
      value: trustStats.otherIssues,
    },
  ];
  const totalReturns =
    trustStats.excellentReturns +
    trustStats.goodReturns +
    trustStats.minorWearReturns;
  const totalIssues =
    trustStats.damagedReturns +
    trustStats.missingPartReturns +
    trustStats.notReturnedIssues +
    trustStats.otherIssues;
  const maxValue = Math.max(...rows.map((row) => row.value), 1);
  const strongestRow = rows.reduce(
    (strongest, row) => (row.value > strongest.value ? row : strongest),
    rows[0]
  );
  const totalTracked = totalReturns + totalIssues;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <BreakdownSummary
          label="Positive Returns"
          tone="bg-emerald-50 text-emerald-900 ring-emerald-100"
          value={totalReturns}
        />
        <BreakdownSummary
          label="Return Issues"
          tone="bg-amber-50 text-amber-900 ring-amber-100"
          value={totalIssues}
        />
        <BreakdownSummary
          label="Tracked Categories"
          tone="bg-sky-50 text-sky-900 ring-sky-100"
          value={rows.length}
        />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)]">
        <div className="animate-slide-up flex min-h-72 flex-col justify-between rounded-3xl border border-white/70 bg-gradient-to-br from-white via-emerald-50/70 to-amber-50/70 p-6 shadow-sm ring-1 ring-stone-100">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
              Most common outcome
            </p>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {strongestRow.label}
            </h3>
            <p className="mt-3 max-w-sm text-sm font-semibold leading-6 text-slate-600">
              {totalTracked === 0
                ? "Return history will appear here as lending records grow."
                : strongestRow.description}
            </p>
          </div>
          <div className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <span className="text-6xl font-black text-slate-950">
                {strongestRow.value}
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-white">
                {totalTracked} total tracked
              </span>
            </div>
            <div className="mt-5 h-4 overflow-hidden rounded-full bg-white/80 ring-1 ring-white">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${strongestRow.tone} transition-all duration-700`}
                style={{
                  width: `${Math.max((strongestRow.value / maxValue) * 100, 8)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {rows.map((row, index) => (
            <div
              className="animate-slide-up rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm ring-1 ring-stone-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              key={row.label}
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-black text-slate-950">
                    {row.label}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {row.value === 0
                      ? "No records yet"
                      : `${row.value} record${row.value === 1 ? "" : "s"}`}
                  </p>
                </div>
                <span className="rounded-2xl bg-stone-50 px-4 py-2 text-xl font-black text-slate-950 ring-1 ring-stone-200">
                  {row.value}
                </span>
              </div>
              <div className="mt-5 h-3.5 overflow-hidden rounded-full bg-stone-100 ring-1 ring-stone-200">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${row.tone} transition-all duration-700`}
                  style={{ width: `${Math.max((row.value / maxValue) * 100, 8)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BreakdownSummary({ label, tone, value }) {
  return (
    <div className={`rounded-3xl px-5 py-5 shadow-sm ring-1 ${tone}`}>
      <p className="text-4xl font-black">{value}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-wide">{label}</p>
    </div>
  );
}

function ProfileHeader({ activeCommunity, onEdit, trustRating, userProfile }) {
  return (
    <div className="sharesync-card-glow overflow-hidden rounded-2xl border border-white/70 bg-white/90 backdrop-blur">
      <div className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-6 py-9 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase leading-none tracking-wide text-emerald-700">
              {"\u{1F464}"} Profile
            </p>
            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
              <ProfileAvatar profile={userProfile} size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-black tracking-tight text-slate-950">
                    {userProfile.username}
                  </h1>
                  {userProfile.pronouns && (
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-100">
                      {userProfile.pronouns}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {activeCommunity}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Joined {formatFirestoreDate(userProfile.createdAt, "recently")}
                </p>
              </div>
              <TrustBadge
                className="w-full sm:w-44"
                rating={trustRating}
                size="lg"
              />
            </div>
          </div>
          <div className="grid w-full gap-4 sm:w-56">
            <button
              className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-800 active:scale-[0.98]"
              type="button"
              onClick={onEdit}
            >
              Edit Profile {"\u270F\uFE0F"}
            </button>
            <div className="w-full rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">
                {"\u2B50"} Trust Rating
              </p>
              <TrustRatingMark className="mt-1" rating={trustRating} size="lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutSection({ activeCommunity, userProfile }) {
  const details = [
    ["Pronouns", userProfile.pronouns],
    ["Gender", userProfile.gender],
    ["Active community", activeCommunity],
  ];

  return (
    <SectionCard title={`${"\u{1F331}"} About`}>
      <div className="grid gap-4">
        <p className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold leading-7 text-slate-600 ring-1 ring-stone-100">
          {userProfile.bio || "No bio added yet."}
        </p>
        <div className="grid gap-3">
          {details.map(([label, value]) => (
            <div
              className="flex items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-stone-50 to-white px-4 py-3 ring-1 ring-stone-200/70"
              key={label}
            >
              <span className="text-sm font-bold text-slate-500">{label}</span>
              <span className="text-right text-sm font-black text-slate-900">
                {value || "Not set"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export default Profile;
