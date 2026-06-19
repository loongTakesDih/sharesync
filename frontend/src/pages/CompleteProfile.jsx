import { useState } from "react";
import CommunitySelector from "../components/community/CommunitySelector";
import AuthMessage from "../components/ui/AuthMessage";
import AuthShell from "../components/ui/AuthShell";
import { logoutUser } from "../services/authService";
import { toCommunitySummary } from "../services/communityService";
import {
  createUserProfile,
  isUsernameTaken,
} from "../services/userService";
import { inputClass, linkButtonClass, primaryButtonClass } from "../utils/styles";
import { getUsernameLower } from "../utils/validators";

function CompleteProfile({ navigate, onProfileCreated, user }) {
  const [username, setUsername] = useState("");
  const [community, setCommunity] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const completeProfile = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!username.trim()) {
      setMessage("Please enter a username.");
      return;
    }

    if (!community) {
      setMessage("Please select a community before continuing.");
      return;
    }

    if (!toCommunitySummary(community)?.name) {
      setMessage(
        "This place could not be prepared as a community. Please choose another result."
      );
      return;
    }

    setSaving(true);

    try {
      const usernameTaken = await isUsernameTaken(getUsernameLower(username));

      if (usernameTaken) {
        throw new Error("That username is already taken.");
      }

      const providerIds = user.providerData.map((provider) => provider.providerId);
      const authProvider = providerIds.includes("google.com")
        ? "google"
        : "password";
      const profile = await createUserProfile({
        authProvider,
        community,
        firebaseUser: user,
        username,
      });

      onProfileCreated(profile);
      navigate("/home");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const useAnotherAccount = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <AuthShell
      title="Complete Profile"
      subtitle="Choose how neighbors will recognize you."
    >
      {message && <AuthMessage>{message}</AuthMessage>}
      <form className="grid gap-4" onSubmit={completeProfile}>
        <input
          className={inputClass}
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <CommunitySelector
          disabled={saving}
          selectedCommunity={community}
          onChange={setCommunity}
          user={user}
        />
        <button className={primaryButtonClass} type="submit" disabled={saving}>
          {saving ? "Saving..." : "Complete profile"}
        </button>
      </form>
      <div className="pt-2">
        <button
          className={linkButtonClass}
          type="button"
          onClick={useAnotherAccount}
        >
          Use another account
        </button>
      </div>
    </AuthShell>
  );
}

export default CompleteProfile;
