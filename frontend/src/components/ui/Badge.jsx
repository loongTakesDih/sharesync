function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-black ring-1 ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
