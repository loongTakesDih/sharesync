import { useState } from "react";
import CommunitySelector from "../community/CommunitySelector";
import { updateEditableUserProfile } from "../../services/userService";
import { compressProfileImageToBase64 } from "../../utils/imageUtils";
import {
  getProfileActiveCommunity,
  getProfileCommunities,
} from "../../utils/communityDisplay";
import { inputClass } from "../../utils/styles";
import ProfileAvatar from "./ProfileAvatar";

const textareaClass = `${inputClass} min-h-28 resize-none`;
const sectionClass =
  "grid gap-4 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm ring-1 ring-stone-100";

function EditProfileModal({ onClose, onSaved, user, userProfile }) {
  const joinedCommunities = getProfileCommunities(userProfile);
  const activeCommunity = getProfileActiveCommunity(userProfile);
  const [username, setUsername] = useState(userProfile.username || "");
  const [bio, setBio] = useState(userProfile.bio || "");
  const [gender, setGender] = useState(userProfile.gender || "");
  const [pronouns, setPronouns] = useState(userProfile.pronouns || "");
  const [profileImageBase64, setProfileImageBase64] = useState(
    userProfile.profileImageBase64 || ""
  );
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  const handleImageChange = async (file) => {
    if (!file) {
      return;
    }

    setImageProcessing(true);
    setMessage("");

    try {
      const compressedImage = await compressProfileImageToBase64(file);

      setProfileImageBase64(compressedImage);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setImageProcessing(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!username.trim()) {
      setMessage("Username is required.");
      return;
    }

    if (bio.length > 300) {
      setMessage("Bio must be 300 characters or fewer.");
      return;
    }

    setSaving(true);

    try {
      await updateEditableUserProfile({
        bio,
        gender,
        profileImageBase64,
        pronouns,
        selectedCommunity,
        user,
        userProfile,
        username,
      });
      onSaved?.("Profile updated.");
      onClose();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        className="max-h-[calc(100svh-3rem)] w-full max-w-4xl overflow-auto rounded-3xl border border-white/70 bg-[#f8f6f1] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/70 bg-white/90 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
              {"\u270F\uFE0F"} Edit Profile
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Update your ShareSync identity
            </h2>
          </div>
          <button
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-50"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form className="grid gap-5 p-5 sm:p-6" onSubmit={saveProfile}>
          {message && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              {message}
            </p>
          )}

          <section className={sectionClass}>
            <div>
              <h3 className="text-lg font-black text-slate-950">
                {"\u{1F464}"} Basic Info
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                This is how neighbors recognize you around ShareSync.
              </p>
            </div>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Username
              <input
                className={inputClass}
                maxLength={40}
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
          </section>

          <section className={sectionClass}>
            <div>
              <h3 className="text-lg font-black text-slate-950">
                {"\u{1F5BC}\uFE0F"} Profile Picture
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Stored as a small Base64 image on your profile.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ProfileAvatar
                profile={{ ...userProfile, profileImageBase64 }}
                size="lg"
              />
              <div className="grid flex-1 gap-3">
                <input
                  className={inputClass}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={saving || imageProcessing}
                  onChange={(event) => handleImageChange(event.target.files?.[0])}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-50"
                    type="button"
                    disabled={saving || imageProcessing}
                    onClick={() => setProfileImageBase64("")}
                  >
                    Use default photo
                  </button>
                  {imageProcessing && (
                    <span className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100">
                      Compressing image...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <div>
              <h3 className="text-lg font-black text-slate-950">
                {"\u{1F331}"} About You
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Bio is public. Gender stays on your own Profile page.
              </p>
            </div>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Bio
              <textarea
                className={textareaClass}
                maxLength={300}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
              <span className="text-right text-xs font-bold text-slate-500">
                {bio.length}/300
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Gender
                <input
                  className={inputClass}
                  type="text"
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Pronouns
                <input
                  className={inputClass}
                  type="text"
                  value={pronouns}
                  onChange={(event) => setPronouns(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className={sectionClass}>
            <div>
              <h3 className="text-lg font-black text-slate-950">
                {"\u{1F3D8}\uFE0F"} Community
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Join another community here. Switch your active community from the homepage.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Current community
              </p>
              <p className="mt-1 font-black text-slate-950">{activeCommunity}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {joinedCommunities.map(({ community, label }) => (
                  <span
                    className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-emerald-100"
                    key={community?.communityId || label}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <CommunitySelector
              disabled={saving}
              selectedCommunity={selectedCommunity}
              user={user}
              onChange={setSelectedCommunity}
            />
            <p className="text-xs font-semibold leading-5 text-slate-500">
              Selecting a place adds it to your joined communities. It will not change your current community.
            </p>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-white/70 pt-4 sm:flex-row sm:justify-end">
            <button
              className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-stone-50"
              type="button"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              type="submit"
              disabled={saving || imageProcessing}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
