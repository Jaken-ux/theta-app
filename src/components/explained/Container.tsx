export default function Container({
  children,
  className = "",
  narrow = false,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div
      className={`mx-auto px-6 ${narrow ? "max-w-[900px]" : "max-w-6xl"} ${className}`}
    >
      {children}
    </div>
  );
}
