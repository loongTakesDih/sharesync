function EmptyState({ children }) {
  return (
    <div className="sharesync-card-glow animate-fade-in rounded-2xl border border-dashed border-emerald-200 bg-white/90 px-5 py-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 text-2xl ring-1 ring-emerald-100">
        {"\u{1F4ED}"}
      </span>
      <p className="mx-auto mt-3 max-w-md font-semibold leading-7 text-slate-600">
        {children}
      </p>
    </div>
  );
}

export default EmptyState;
