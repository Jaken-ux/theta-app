export default function Paragraph({
  children,
  className = "",
  muted = true,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <p
      className={`text-[18px] leading-[1.6] ${
        muted ? "text-[#B0B8C4]" : "text-white"
      } ${className}`}
    >
      {children}
    </p>
  );
}
