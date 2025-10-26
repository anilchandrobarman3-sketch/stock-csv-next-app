export function Switch({ checked=false, onCheckedChange }) {
  return (
    <button
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={`w-11 h-6 rounded-full transition relative ${checked ? 'bg-slate-900' : 'bg-slate-300'}`}
      aria-pressed={checked}
      type="button"
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? 'translate-x-5' : ''}`}/>
    </button>
  );
}
