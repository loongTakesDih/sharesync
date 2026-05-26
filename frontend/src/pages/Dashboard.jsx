function Dashboard({ activeCommunity, userProfile }) {
  return (
    <section className="grid gap-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Dashboard
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Welcome, {userProfile?.username}
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Share useful items, manage requests, and keep your community exchanges
          organized in one calm place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Active community
          </p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {activeCommunity}
          </p>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Reputation</p>
          <p className="mt-2 text-xl font-bold text-emerald-800">
            {userProfile?.reputationScore ?? 0}
          </p>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Profile</p>
          <p className="mt-2 text-xl font-bold capitalize text-slate-900">
            {userProfile?.authProvider || "member"}
          </p>
        </article>
      </div>
    </section>
  );
}

export default Dashboard;
