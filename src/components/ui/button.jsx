export function Button({ children, className = "", variant="default", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring";
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-slate-200 hover:bg-slate-300",
    outline: "border border-slate-300 hover:bg-slate-50",
    destructive: "bg-rose-600 text-white hover:bg-rose-700"
  };
  return (
    <button className={`${base} ${variants[variant]||variants.default} ${className}`} {...props}>
      {children}
    </button>
  );
}
