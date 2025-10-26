export function Input({ className="", ...props }) {
  return <input className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring ${className}`} {...props} />;
}
