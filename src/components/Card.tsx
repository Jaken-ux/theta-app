export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-theta-card border border-theta-border rounded-xl p-6 ${className}`}
    >
      {children}
    </div>
  );
}
