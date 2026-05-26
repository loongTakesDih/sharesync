import { useCallback, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Items from "./pages/Items";
import MyItems from "./pages/MyItems";
import Requests from "./pages/Requests";

const pages = {
  dashboard: "Dashboard",
  items: "Items",
  myItems: "My Items",
  requests: "Requests",
  history: "History",
};

const pagePaths = {
  dashboard: "/dashboard",
  items: "/items",
  myItems: "/my-items",
  requests: "/requests",
  history: "/history",
};

const publicRoutes = ["/login", "/register", "/forgot-password"];

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const primaryButtonClass =
  "w-full rounded-xl border border-emerald-700 bg-emerald-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60";
const linkButtonClass =
  "rounded-xl px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50";

const getPageFromPath = (pathname) => {
  const pageEntry = Object.entries(pagePaths).find(([, path]) => path === pathname);
  return pageEntry ? pageEntry[0] : "dashboard";
};

const getUsernameLower = (username) => username.trim().toLowerCase();

function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeCommunity, setActiveCommunity] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const navigate = useCallback((nextPath) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    setPathname(nextPath);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);

      if (!currentUser) {
        setUserProfile(null);
        setActiveCommunity("");
        setProfileLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        return;
      }

      setProfileLoading(true);

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
          setUserProfile(null);
          setActiveCommunity("");
          navigate("/complete-profile");
          return;
        }

        const profile = userDoc.data();
        const communities = Array.isArray(profile.communities)
          ? profile.communities
          : [];

        setUserProfile({
          ...profile,
          communities,
        });
        setActiveCommunity(communities[0] || "");
      } catch (error) {
        alert(error.message);
        setUserProfile(null);
        setActiveCommunity("");
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate, user]);

  useEffect(() => {
    if (!authReady || profileLoading) {
      return;
    }

    const redirectTo = (nextPath) => {
      window.setTimeout(() => navigate(nextPath), 0);
    };

    if (!user && !publicRoutes.includes(pathname)) {
      redirectTo("/login");
      return;
    }

    if (user && !userProfile && pathname !== "/complete-profile") {
      redirectTo("/complete-profile");
      return;
    }

    if (
      user &&
      userProfile &&
      (publicRoutes.includes(pathname) ||
        pathname === "/complete-profile" ||
        pathname === "/")
    ) {
      redirectTo("/dashboard");
    }
  }, [authReady, navigate, pathname, profileLoading, user, userProfile]);

  const isUsernameTaken = async (usernameLower) => {
    const usernameQuery = query(
      collection(db, "users"),
      where("usernameLower", "==", usernameLower),
      limit(1)
    );
    const usernameSnapshot = await getDocs(usernameQuery);

    return !usernameSnapshot.empty;
  };

  const createUserProfile = async ({
    authProvider,
    community,
    firebaseUser,
    username,
  }) => {
    const profile = {
      username: username.trim(),
      usernameLower: getUsernameLower(username),
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName || "",
      photoURL: firebaseUser.photoURL || "",
      communities: [community.trim()],
      createdAt: serverTimestamp(),
      reputationScore: 0,
      authProvider,
    };

    await setDoc(doc(db, "users", firebaseUser.uid), profile);
    setUserProfile({
      ...profile,
      createdAt: null,
    });
    setActiveCommunity(profile.communities[0]);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

    if (userDoc.exists()) {
      navigate("/dashboard");
      return;
    }

    navigate("/complete-profile");
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const activePage = getPageFromPath(pathname);

  const renderPage = () => {
    if (activePage === "items") {
      return (
        <Items
          activeCommunity={activeCommunity}
          user={user}
          userProfile={userProfile}
        />
      );
    }

    if (activePage === "myItems") {
      return (
        <MyItems
          activeCommunity={activeCommunity}
          user={user}
          userProfile={userProfile}
        />
      );
    }

    if (activePage === "requests") {
      return (
        <Requests
          activeCommunity={activeCommunity}
          user={user}
          userProfile={userProfile}
        />
      );
    }

    if (activePage === "history") {
      return <History activeCommunity={activeCommunity} user={user} />;
    }

    return (
      <Dashboard
        activeCommunity={activeCommunity}
        user={user}
        userProfile={userProfile}
      />
    );
  };

  if (!authReady || profileLoading) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-8 text-slate-800">
        <div className="mx-auto max-w-6xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading ShareSync...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (pathname === "/register") {
      return (
        <RegisterPage
          createUserProfile={createUserProfile}
          isUsernameTaken={isUsernameTaken}
          navigate={navigate}
        />
      );
    }

    if (pathname === "/forgot-password") {
      return <ForgotPasswordPage navigate={navigate} />;
    }

    return <LoginPage loginWithGoogle={loginWithGoogle} navigate={navigate} />;
  }

  if (!userProfile) {
    return (
      <CompleteProfilePage
        createUserProfile={createUserProfile}
        isUsernameTaken={isUsernameTaken}
        navigate={navigate}
        user={user}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {userProfile.photoURL && (
                <img
                  alt=""
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-100"
                  src={userProfile.photoURL}
                />
              )}
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  ShareSync
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  {userProfile.username}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                Active community
                <select
                  className="min-w-52 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  value={activeCommunity}
                  onChange={(event) => setActiveCommunity(event.target.value)}
                >
                  {userProfile.communities.map((community) => (
                    <option key={community} value={community}>
                      {community}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>

          <nav className="mt-5 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
            {Object.entries(pages).map(([pageKey, label]) => (
              <button
                className={
                  activePage === pageKey
                    ? "rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white shadow-sm"
                    : "rounded-xl px-4 py-2 font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
                }
                key={pageKey}
                onClick={() => navigate(pagePaths[pageKey])}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mt-6">{renderPage()}</main>
      </div>
    </div>
  );
}

function AuthShell({ children, subtitle, title }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10 text-slate-800">
      <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-8 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            ShareSync
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-base leading-7 text-slate-600">{subtitle}</p>
        </div>
        <div className="grid gap-5">{children}</div>
      </div>
    </div>
  );
}

function LoginPage({ loginWithGoogle, navigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const login = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/dashboard");
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
      await loginWithGoogle();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell title="Login" subtitle="Welcome back to ShareSync.">
      {message && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message}
        </p>
      )}
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

function RegisterPage({ createUserProfile, isUsernameTaken, navigate }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [community, setCommunity] = useState("");
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
      !community.trim()
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
      const usernameLower = getUsernameLower(username);
      const usernameTaken = await isUsernameTaken(usernameLower);

      if (usernameTaken) {
        throw new Error("That username is already taken.");
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(userCredential.user, {
        displayName: username.trim(),
      });

      await createUserProfile({
        authProvider: "password",
        community,
        firebaseUser: userCredential.user,
        username,
      });

      navigate("/dashboard");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell title="Register" subtitle="Create your ShareSync identity.">
      {message && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message}
        </p>
      )}
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
        <input
          className={inputClass}
          type="text"
          placeholder="Community"
          value={community}
          onChange={(event) => setCommunity(event.target.value)}
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

function ForgotPasswordPage({ navigate }) {
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
      await sendPasswordResetEmail(auth, email.trim());
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
      {message && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message}
        </p>
      )}
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

function CompleteProfilePage({
  createUserProfile,
  isUsernameTaken,
  navigate,
  user,
}) {
  const [username, setUsername] = useState("");
  const [community, setCommunity] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const completeProfile = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!username.trim() || !community.trim()) {
      setMessage("Please enter a username and community.");
      return;
    }

    setSaving(true);

    try {
      const usernameLower = getUsernameLower(username);
      const usernameTaken = await isUsernameTaken(usernameLower);

      if (usernameTaken) {
        throw new Error("That username is already taken.");
      }

      const providerIds = user.providerData.map((provider) => provider.providerId);
      const authProvider = providerIds.includes("google.com")
        ? "google"
        : "password";

      await createUserProfile({
        authProvider,
        community,
        firebaseUser: user,
        username,
      });

      navigate("/dashboard");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell
      title="Complete Profile"
      subtitle="Choose how neighbors will recognize you."
    >
      {message && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message}
        </p>
      )}
      <form className="grid gap-4" onSubmit={completeProfile}>
        <input
          className={inputClass}
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <input
          className={inputClass}
          type="text"
          placeholder="Community"
          value={community}
          onChange={(event) => setCommunity(event.target.value)}
        />
        <button className={primaryButtonClass} type="submit" disabled={saving}>
          {saving ? "Saving..." : "Complete profile"}
        </button>
      </form>
      <div className="pt-2">
        <button
          className={linkButtonClass}
          type="button"
          onClick={() => signOut(auth)}
        >
          Use another account
        </button>
      </div>
    </AuthShell>
  );
}

export default App;
