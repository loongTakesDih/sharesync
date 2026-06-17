function EmptyState({ children }) {
  return (
    <div className="animate-fade-in rounded-2xl border border-dashed border-stone-300 bg-white/90 px-5 py-7 text-center shadow-sm">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-2xl ring-1 ring-emerald-100">
        📭
      </span>
      <p className="mt-3 font-medium text-slate-600">{children}</p>
    </div>
  );
}

export default EmptyState;
