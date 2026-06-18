import { useState } from "react";
import AuthMessage from "../components/ui/AuthMessage";
import AuthShell from "../components/ui/AuthShell";
import { loginWithEmail, loginWithGooglePopup } from "../services/authService";
import { fetchUserProfile } from "../services/userService";
import { inputClass, linkButtonClass, primaryButtonClass } from "../utils/styles";

const secondaryButtonClass =
  "w-full rounded-2xl border border-white/70 bg-white/90 px-4 py-3 font-black text-slate-700 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100";

function Login({ navigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const login = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await loginWithEmail(email, password);
      navigate("/home");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const googleLogin = async () => {
    setSaving(true);
    setMessage("");

    try {
      const userCredential = await loginWithGooglePopup();
      const profile = await fetchUserProfile(userCredential.user.uid);

      navigate(profile ? "/home" : "/complete-profile");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell title="Login" subtitle="Welcome back to ShareSync.">
      {message && <AuthMessage>{message}</AuthMessage>}
      <form className="grid gap-4" onSubmit={login}>
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
        <button className={primaryButtonClass} type="submit" disabled={saving}>
          {saving ? "Logging in..." : "Login"}
        </button>
      </form>

      <button
        className={secondaryButtonClass}
        type="button"
        onClick={googleLogin}
        disabled={saving}
      >
        Continue with Google
      </button>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
        <button
          className={linkButtonClass}
          type="button"
          onClick={() => navigate("/forgot-password")}
        >
          Forgot password?
        </button>
        <button
          className={linkButtonClass}
          type="button"
          onClick={() => navigate("/register")}
        >
          Register
        </button>
      </div>
    </AuthShell>
  );
}

export default Login;
