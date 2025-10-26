export function Select({ value, onValueChange, children }) {
  return (
    <select
      value={value}
      onChange={(e)=> onValueChange && onValueChange(e.target.value)}
      className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
    >{children}</select>
  );
}
export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
export function SelectTrigger({ children }) { return children; }
export function SelectValue() { return null; }
export function SelectContent({ children }) { return children; }
export function SelectGroup({ children }) { return children; }
export function SelectLabel({ children }) { return <optgroup label={children} />; }
