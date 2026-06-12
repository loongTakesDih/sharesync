import { useState } from "react";

function AppHeader({
  activeCommunity,
  activePage,
  navigate,
  onCommunityChange,
  onListItem,
  onLogout,
  onSearchChange,
  pagePaths,
  searchTerm,
  userProfile,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const avatarLabel = (userProfile.username || "U").slice(0, 1).toUpperCase();

  const goTo = (path) => {
    setProfileOpen(false);
    navigate(path);
  };

  const profileLinks = [
    ["myItems", "My Items"],
    ["requests", "Requests"],
    ["history", "History"],
    ["profile", "Profile"],
  ];

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center justify-between gap-3">
          <button
            className="flex items-center gap-3 rounded-2xl px-1 py-1 text-left"
            type="button"
            onClick={() => goTo(pagePaths.home)}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-lg font-black text-white shadow-sm">
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

          <button
            className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 lg:hidden"
            type="button"
            onClick={onListItem}
          >
            List
          </button>
        </div>

        <nav className="flex gap-2 overflow-x-auto lg:ml-4 lg:shrink-0">
          {[
            ["home", "Home"],
            ["browse", "Browse"],
          ].map(([pageKey, label]) => (
            <button
              className={
                activePage === pageKey
                  ? "whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                  : "whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-emerald-800"
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
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              type="search"
              placeholder="Search ShareSync"
              value={searchTerm}
              onChange={(event) => {
                onSearchChange(event.target.value);
                if (activePage !== "browse") {
                  navigate(pagePaths.browse);
                }
              }}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <select
            className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:flex-none"
            value={activeCommunity}
            onChange={(event) => onCommunityChange(event.target.value)}
            aria-label="Active community"
          >
            {userProfile.communities.map((community) => (
              <option key={community} value={community}>
                {community}
              </option>
            ))}
          </select>

          <button
            className="hidden rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 lg:inline-flex"
            type="button"
            onClick={onListItem}
          >
            List Item
          </button>

          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-2 py-2 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
            >
              {userProfile.photoURL ? (
                <img
                  alt=""
                  className="h-9 w-9 rounded-xl object-cover"
                  src={userProfile.photoURL}
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 font-black text-emerald-800">
                  {avatarLabel}
                </span>
              )}
              <span className="hidden max-w-28 truncate text-sm font-bold text-slate-700 sm:block">
                {userProfile.username}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl">
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
