function EmptyState({ children }) {
  return (
    <p className="rounded-3xl border border-dashed border-stone-300 bg-white px-5 py-6 text-center font-medium text-slate-600">
      {children}
    </p>
  );
}

export default EmptyState;
