function PageShell({ children, eyebrow, subtitle, title }) {
  return (
    <section className="grid gap-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export default PageShell;
