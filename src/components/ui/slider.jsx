export function Slider({ value=[50], min=0, max=100, step=1, onValueChange }) {
  const v = value[0];
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={v}
      onChange={(e) => onValueChange && onValueChange([Number(e.target.value)])}
      className="w-full accent-slate-900"
    />
  );
}
