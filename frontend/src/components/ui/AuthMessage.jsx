function AuthMessage({ children }) {
  return (
    <p className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm font-semibold leading-6 text-amber-900 shadow-sm">
      {children}
    </p>
  );
}

export default AuthMessage;
