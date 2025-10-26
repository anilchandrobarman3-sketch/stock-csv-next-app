export function Badge({ children, variant="default", className="" }) {
  const variants = {
    default: "bg-slate-900 text-white",
    secondary: "bg-slate-100",
    outline: "border border-slate-300",
    destructive: "bg-rose-600 text-white"
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${variants[variant]} ${className}`}>{children}</span>;
}
