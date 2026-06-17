function PageHeader({
  actions,
  children,
  eyebrow,
  meta,
  subtitle,
  title,
}) {
  return (
    <section className="animate-slide-up overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="grid gap-6 bg-[linear-gradient(135deg,rgba(236,253,245,0.9),rgba(255,255,255,0.95)_52%,rgba(255,251,235,0.9))] px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8 lg:py-7">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {(actions || meta) && (
          <div className="flex min-w-0 flex-col gap-3 lg:min-w-72 lg:items-end lg:justify-end">
            {meta}
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}

export default PageHeader;
