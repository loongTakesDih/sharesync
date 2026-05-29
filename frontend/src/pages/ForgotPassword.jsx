import { useState } from "react";
import AuthMessage from "../components/ui/AuthMessage";
import AuthShell from "../components/ui/AuthShell";
import { sendResetEmail } from "../services/authService";
import { inputClass, linkButtonClass, primaryButtonClass } from "../utils/styles";

function ForgotPassword({ navigate }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const resetPassword = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter your email.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await sendResetEmail(email);
      setMessage(
        "If this email uses password login, a reset email has been sent. If you use Google login, reset your password through Google."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Recover password-based ShareSync access."
    >
      {message && <AuthMessage>{message}</AuthMessage>}
      <form className="grid gap-4" onSubmit={resetPassword}>
        <input
          className={inputClass}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button className={primaryButtonClass} type="submit" disabled={saving}>
          {saving ? "Sending..." : "Send reset email"}
        </button>
      </form>
      <p className="rounded-xl bg-stone-50 px-4 py-3 text-sm leading-6 text-slate-600">
        Google accounts use Google password recovery, not ShareSync password
        reset.
      </p>
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

export default ForgotPassword;
