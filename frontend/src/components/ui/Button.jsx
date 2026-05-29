const variants = {
  primary:
    "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800",
  secondary:
    "border-stone-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50",
  danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  link: "border-transparent bg-transparent text-emerald-800 hover:bg-emerald-50",
};

function Button({
  children,
  className = "",
  fullWidth = false,
  variant = "secondary",
  ...props
}) {
  return (
    <button
      className={`rounded-xl border px-4 py-2 font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
        fullWidth ? "w-full py-3" : ""
      } ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
