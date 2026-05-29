function AuthShell({ children, subtitle, title }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-50 via-white to-emerald-50 px-4 py-10 text-slate-800">
      <div className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white/95 p-8 shadow-xl shadow-stone-200/60 sm:p-10">
        <div className="mb-8 space-y-3">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            ShareSync Marketplace
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="text-base leading-7 text-slate-600">{subtitle}</p>
        </div>
        <div className="grid gap-5">{children}</div>
      </div>
    </div>
  );
}

export default AuthShell;
