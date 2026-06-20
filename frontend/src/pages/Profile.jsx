import { useState } from "react";
import EditProfileModal from "../components/profile/EditProfileModal";
import ProfileAvatar from "../components/profile/ProfileAvatar";
import ReturnPatternSection from "../components/profile/ReturnPatternSection";
import TrustBadge from "../components/profile/TrustBadge";
import TrustRatingMark from "../components/profile/TrustRatingMark";
import SectionCard from "../components/ui/SectionCard";
import UiStatCard from "../components/ui/StatCard";
import { useProfileSummary } from "../hooks/useProfileSummary";
import {
  getProfileActiveCommunity,
  getProfileCommunities,
} from "../utils/communityDisplay";
import { formatFirestoreDate } from "../utils/formatDate";
import { getTrustRating, getTrustStats } from "../utils/trust";

function Profile({ activeCommunity, user, userProfile }) {
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
            userProfile={userProfile}
          />

          <CommunityInvolvement userProfile={userProfile} />

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

        <ReturnPatternSection trustStats={trustStats} />
      </div>

      {editing && (
        <EditProfileModal
          onClose={() => setEditing(false)}
          onSaved={setMessage}
          user={user}
          userProfile={userProfile}
        />
      )}
    </section>
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

function AboutSection({ userProfile }) {
  const details = [
    ["Pronouns", userProfile.pronouns],
    ["Gender", userProfile.gender],
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

function CommunityInvolvement({ userProfile }) {
  const communities = getProfileCommunities(userProfile);
  const activeCommunity = getProfileActiveCommunity(userProfile);

  return (
    <SectionCard
      subtitle="Items and requests are shown based on the active community."
      title={`${"\u{1F3D8}\uFE0F"} Community Involvement`}
    >
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 p-4 ring-1 ring-emerald-100">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
          Currently active in
        </p>
        <p className="mt-1 text-lg font-black text-slate-950">
          {activeCommunity}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {communities.length} {communities.length === 1 ? "community" : "communities"} joined
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {communities.length > 0 ? (
          communities.map(({ community, label }) => (
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${
                label === activeCommunity
                  ? "bg-emerald-100 text-emerald-900 ring-emerald-200"
                  : "bg-white text-slate-600 ring-stone-200"
              }`}
              key={community?.communityId || label}
            >
              {label}
            </span>
          ))
        ) : (
          <span className="text-sm font-semibold text-slate-500">Community not set</span>
        )}
      </div>
    </SectionCard>
  );
}

export default Profile;
