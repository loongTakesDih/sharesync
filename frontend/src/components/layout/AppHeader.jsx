import { useState } from "react";

function AppHeader({
  activePage,
  navigate,
  onOpenUnreadChats,
  onLogout,
  onSearchChange,
  pagePaths,
  searchTerm,
  unreadChatCount = 0,
  userProfile,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const avatarLabel = (userProfile.username || "U").slice(0, 1).toUpperCase();
  const avatarSrc = userProfile.profileImageBase64 || userProfile.photoURL || "";

  const goTo = (path) => {
    setProfileOpen(false);
    navigate(path);
  };

  const profileLinks = [
    ["myItems", "My Items"],
    ["requests", "Requests"],
    ["savedItems", "Saved Items"],
    ["history", "History"],
    ["profile", "Profile"],
  ];

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-white/60 bg-white/80 px-4 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center justify-between gap-3">
          <button
            className="flex items-center gap-3 rounded-2xl px-1 py-1 text-left transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
            type="button"
            onClick={() => goTo(pagePaths.home)}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-lg font-black text-white shadow-lg shadow-emerald-900/15 ring-1 ring-white/50">
              S
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight text-slate-950">
                ShareSync
              </span>
              <span className="block text-xs font-bold uppercase tracking-wide text-emerald-700">
                Community Marketplace
              </span>
            </span>
          </button>
        </div>

        <nav className="flex gap-2 overflow-x-auto lg:ml-4 lg:shrink-0">
          {[
            ["home", "Home"],
          ].map(([pageKey, label]) => (
            <button
              className={
                activePage === pageKey
                  ? "whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  : "whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition-all duration-200 hover:scale-[1.02] hover:bg-white/80 hover:text-emerald-800 hover:shadow-sm active:scale-[0.98]"
              }
              key={pageKey}
              onClick={() => goTo(pagePaths[pageKey])}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 lg:mx-3">
          <label className="block">
            <span className="sr-only">Search marketplace</span>
            <input
              className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              type="search"
              placeholder="Search ShareSync"
              value={searchTerm}
              onChange={(event) => {
                onSearchChange(event.target.value);
                if (activePage !== "home") {
                  navigate(pagePaths.home);
                }
              }}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <button
            className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/70 bg-white/85 text-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md active:scale-[0.98]"
            type="button"
            aria-label={
              unreadChatCount > 0
                ? `${unreadChatCount} unread request chat${
                    unreadChatCount === 1 ? "" : "s"
                  }`
                : "Open request chats"
            }
            onClick={onOpenUnreadChats}
          >
            <span aria-hidden="true">{"\u{1F4AC}"}</span>
            {unreadChatCount > 0 && (
              <span className="animate-soft-pulse absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1.5 text-xs font-black text-white ring-2 ring-white">
                {unreadChatCount > 9 ? "9+" : unreadChatCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/85 px-2 py-2 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md"
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
            >
              {avatarSrc ? (
                <img
                  alt=""
                  className="h-9 w-9 rounded-xl object-cover"
                  src={avatarSrc}
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-amber-100 font-black text-emerald-800">
                  {avatarLabel}
                </span>
              )}
              <span className="hidden max-w-28 truncate text-sm font-bold text-slate-700 sm:block">
                {userProfile.username}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
                <div className="border-b border-stone-100 p-4">
                  <p className="text-sm font-black text-slate-950">
                    {userProfile.username}
                  </p>
                  <p className="mt-1 truncate text-xs font-medium text-slate-500">
                    {userProfile.email}
                  </p>
                </div>
                <div className="grid p-2">
                  {profileLinks.map(([pageKey, label]) => (
                    <button
                      className={
                        activePage === pageKey
                          ? "rounded-2xl bg-emerald-50 px-4 py-3 text-left text-sm font-bold text-emerald-800"
                          : "rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-600 transition hover:bg-stone-50"
                      }
                      key={pageKey}
                      type="button"
                      onClick={() => goTo(pagePaths[pageKey])}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-700 transition hover:bg-red-50"
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
