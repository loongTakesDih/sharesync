const normalizeUsernameHistory = ({
  currentUsername = "",
  previousUsername = "",
  previousUsernames = [],
}) => {
  const currentKey = currentUsername.trim().toLowerCase();
  const seen = new Set();

  return [
    ...(Array.isArray(previousUsernames) ? previousUsernames : []),
    previousUsername,
  ]
    .filter((name) => typeof name === "string" && name.trim())
    .map((name) => name.trim())
    .filter((name) => {
      const key = name.toLowerCase();

      if (key === currentKey || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

function PreviousUsernamesDropdown({
  compact = false,
  currentUsername,
  previousUsername,
  previousUsernames,
}) {
  const names = normalizeUsernameHistory({
    currentUsername,
    previousUsername,
    previousUsernames,
  });

  if (names.length === 0) {
    return null;
  }

  if (names.length === 1) {
    return (
      <div
        className={`rounded-2xl bg-gradient-to-r from-stone-50 to-white ring-1 ring-stone-200/70 ${
          compact ? "px-3 py-2.5" : "px-4 py-3"
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Previously known as
        </p>
        <p className="mt-1 truncate text-sm font-black text-slate-800">
          {names[0]}
        </p>
      </div>
    );
  }

  return (
    <details className="group rounded-2xl bg-gradient-to-r from-stone-50 to-white ring-1 ring-stone-200/70">
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl ${
          compact ? "px-3 py-2.5" : "px-4 py-3"
        }`}
      >
        <span className="min-w-0">
          <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
            Previously known as
          </span>
          <span className="mt-1 block truncate text-sm font-black text-slate-800">
            {names[0]} +{names.length - 1} more
          </span>
        </span>
        <span
          aria-hidden="true"
          className="text-sm font-black text-emerald-700 transition group-open:rotate-180"
        >
          &#8964;
        </span>
      </summary>
      <ul
        className={`grid gap-1 border-t border-stone-200 ${compact ? "p-2" : "p-3"}`}
      >
        {names.map((name) => (
          <li
            className="rounded-xl bg-white/80 px-3 py-2 text-sm font-bold text-slate-700"
            key={name.toLowerCase()}
          >
            {name}
          </li>
        ))}
      </ul>
    </details>
  );
}

export default PreviousUsernamesDropdown;
