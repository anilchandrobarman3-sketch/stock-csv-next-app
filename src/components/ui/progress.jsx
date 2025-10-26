export function Progress({ value=0 }) {
  return (
    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
      <div style={{width: `${Math.max(0, Math.min(100, value))}%`}} className="h-full bg-slate-900" />
    </div>
  );
}
