export function Card({ children, className="" }) {
  return <div className={`rounded-2xl border bg-white ${className}`}>{children}</div>;
}
export function CardHeader({ children, className="" }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
export function CardTitle({ children, className="" }) {
  return <div className={`text-lg font-semibold ${className}`}>{children}</div>;
}
export function CardContent({ children, className="" }) {
  return <div className={`p-4 pt-0 ${className}`}>{children}</div>;
}
