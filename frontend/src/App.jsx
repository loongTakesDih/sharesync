import { useCallback, useEffect, useState } from "react";
import AppHeader from "./components/layout/AppHeader";
import { useAuthProfile } from "./hooks/useAuthProfile";
import { logoutUser } from "./services/authService";
import "./App.css";
import Browse from "./pages/Browse";
import CompleteProfile from "./pages/CompleteProfile";
import ForgotPassword from "./pages/ForgotPassword";
import History from "./pages/History";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MyItems from "./pages/MyItems";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Requests from "./pages/Requests";

const pagePaths = {
  home: "/home",
  browse: "/browse",
  myItems: "/my-items",
  requests: "/requests",
  history: "/history",
  profile: "/profile",
};

const publicRoutes = ["/login", "/register", "/forgot-password"];
const legacyPrivateRoutes = {
  "/dashboard": pagePaths.home,
  "/items": pagePaths.browse,
};
const privateRoutes = Object.values(pagePaths);

const getPageFromPath = (pathname) => {
  const canonicalPath = legacyPrivateRoutes[pathname] || pathname;
  const pageEntry = Object.entries(pagePaths).find(([, path]) => path === pathname);

  if (pageEntry) {
    return pageEntry[0];
  }

  const legacyPageEntry = Object.entries(pagePaths).find(
    ([, path]) => path === canonicalPath
  );

  return legacyPageEntry ? legacyPageEntry[0] : "home";
};

function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [marketplaceSearch, setMarketplaceSearch] = useState("");
  const [listIntent, setListIntent] = useState(0);

  const navigate = useCallback((nextPath) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    setPathname(nextPath);
  }, []);

  const {
    activeCommunity,
    activeCommunityId,
    activeCommunityObject,
    applyUserProfile,
    authReady,
    changeActiveCommunity,
    profileLoading,
    user,
    userProfile,
  } = useAuthProfile(navigate);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
      redirectTo(pagePaths.home);
      return;
    }

    if (user && userProfile && legacyPrivateRoutes[pathname]) {
      redirectTo(legacyPrivateRoutes[pathname]);
      return;
    }

    if (
      user &&
      userProfile &&
      !privateRoutes.includes(pathname) &&
      pathname !== "/complete-profile"
    ) {
      redirectTo(pagePaths.home);
    }
  }, [authReady, navigate, pathname, profileLoading, user, userProfile]);

  const logout = async () => {
    await logoutUser();
    navigate("/login");
  };

  const activePage = getPageFromPath(pathname);

  const renderPage = () => {
    if (activePage === "browse") {
      return (
        <Browse
          activeCommunity={activeCommunity}
          activeCommunityId={activeCommunityId}
          activeCommunityObject={activeCommunityObject}
          listIntent={listIntent}
          onSearchChange={setMarketplaceSearch}
          searchTerm={marketplaceSearch}
          user={user}
          userProfile={userProfile}
        />
      );
    }

    if (activePage === "home") {
      return (
        <Home
          activeCommunity={activeCommunity}
          activeCommunityId={activeCommunityId}
          activeCommunityObject={activeCommunityObject}
          navigate={navigate}
          onCommunityChange={changeActiveCommunity}
          onListItem={() => {
            navigate(pagePaths.browse);
            setListIntent((current) => current + 1);
          }}
          pagePaths={pagePaths}
          user={user}
          userProfile={userProfile}
        />
      );
    }

    if (activePage === "myItems") {
      return (
        <MyItems
          activeCommunity={activeCommunity}
          activeCommunityId={activeCommunityId}
          activeCommunityObject={activeCommunityObject}
          onListItem={() => {
            navigate(pagePaths.browse);
            setListIntent((current) => current + 1);
          }}
          user={user}
          userProfile={userProfile}
        />
      );
    }

    if (activePage === "requests") {
      return (
        <Requests
          activeCommunity={activeCommunity}
          activeCommunityId={activeCommunityId}
          activeCommunityObject={activeCommunityObject}
          user={user}
          userProfile={userProfile}
        />
      );
    }

    if (activePage === "history") {
      return (
        <History
          activeCommunity={activeCommunity}
          activeCommunityId={activeCommunityId}
          user={user}
        />
      );
    }

    if (activePage === "profile") {
      return (
        <Profile
          activeCommunity={activeCommunity}
          activeCommunityId={activeCommunityId}
          activeCommunityObject={activeCommunityObject}
          user={user}
          userProfile={userProfile}
        />
      );
    }

    return null;
  };

  if (!authReady || profileLoading) {
    return (
      <div className="min-h-screen bg-[#f8f6f1] px-4 py-8 text-slate-800">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading ShareSync...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (pathname === "/register") {
      return (
        <Register
          navigate={navigate}
          onProfileCreated={applyUserProfile}
        />
      );
    }

    if (pathname === "/forgot-password") {
      return <ForgotPassword navigate={navigate} />;
    }

    return <Login navigate={navigate} />;
  }

  if (!userProfile) {
    return (
      <CompleteProfile
        navigate={navigate}
        onProfileCreated={applyUserProfile}
        user={user}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1] text-slate-800">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-[linear-gradient(135deg,rgba(209,250,229,0.55),rgba(255,255,255,0)_58%)]" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-72 bg-[linear-gradient(315deg,rgba(254,243,199,0.45),rgba(255,255,255,0)_62%)]" />
      <div className="relative mx-auto w-full max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-8">
        <AppHeader
          activeCommunity={activeCommunity}
          activeCommunityId={activeCommunityId}
          activePage={activePage}
          navigate={navigate}
          onCommunityChange={changeActiveCommunity}
          onListItem={() => {
            navigate(pagePaths.browse);
            setListIntent((current) => current + 1);
          }}
          onLogout={logout}
          onSearchChange={setMarketplaceSearch}
          pagePaths={pagePaths}
          searchTerm={marketplaceSearch}
          userProfile={userProfile}
        />

        <main className="mt-6">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
