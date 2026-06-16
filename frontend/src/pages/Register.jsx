import { useState } from "react";
import CommunitySelector from "../components/community/CommunitySelector";
import AuthMessage from "../components/ui/AuthMessage";
import AuthShell from "../components/ui/AuthShell";
import { registerWithEmail } from "../services/authService";
import {
  createUserProfile,
  isUsernameTaken,
} from "../services/userService";
import { inputClass, linkButtonClass, primaryButtonClass } from "../utils/styles";
import { getUsernameLower } from "../utils/validators";

function Register({ navigate, onProfileCreated }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [community, setCommunity] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const register = async (event) => {
    event.preventDefault();
    setMessage("");

    if (
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword ||
      !community?.name
    ) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const usernameTaken = await isUsernameTaken(getUsernameLower(username));

      if (usernameTaken) {
        throw new Error("That username is already taken.");
      }

      const userCredential = await registerWithEmail({
        email,
        password,
        username,
      });
      const profile = await createUserProfile({
        authProvider: "password",
        community,
        firebaseUser: userCredential.user,
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

  return (
    <AuthShell title="Register" subtitle="Create your ShareSync identity.">
      {message && <AuthMessage>{message}</AuthMessage>}
      <form className="grid gap-4" onSubmit={register}>
        <input
          className={inputClass}
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <input
          className={inputClass}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className={inputClass}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <input
          className={inputClass}
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <CommunitySelector
          disabled={saving}
          selectedCommunity={community}
          onChange={setCommunity}
        />
        <button className={primaryButtonClass} type="submit" disabled={saving}>
          {saving ? "Creating account..." : "Register"}
        </button>
      </form>
      <div className="pt-2">
        <button
          className={linkButtonClass}
          type="button"
          onClick={() => navigate("/login")}
        >
          Back to login
        </button>
      </div>
    </AuthShell>
  );
}

export default Register;
