import { useId } from 'react';
export function Tabs({ value, onValueChange, children, className="" }) {
  return <div className={className}>{children({ value, onValueChange })}</div>;
}
export function TabsList({ children, className="" }) {
  return <div className={`rounded-xl bg-slate-100 p-1 grid gap-1 ${className}`}>{children}</div>;
}
export function TabsTrigger({ value, current, onClick, children }) {
  const active = current === value;
  return (
    <button
      className={`text-xs rounded-lg px-3 py-2 ${active ? 'bg-white shadow font-semibold' : 'opacity-70 hover:opacity-100'}`}
      onClick={onClick}
      type="button"
    >{children}</button>
  );
}
export function TabsContent({ children }) { return <div>{children}</div>; }
