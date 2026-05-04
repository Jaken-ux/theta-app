export default function Heading({
  children,
  as: Tag = "h2",
  size = "section",
  className = "",
}: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  size?: "hero" | "section" | "sub";
  className?: string;
}) {
  const sizes = {
    hero: "text-[40px] sm:text-[56px] leading-[1.08] tracking-tight",
    section: "text-[28px] sm:text-[32px] leading-[1.2] tracking-tight",
    sub: "text-[22px] sm:text-[24px] leading-[1.3]",
  };

  return (
    <Tag className={`font-semibold text-white ${sizes[size]} ${className}`}>
      {children}
    </Tag>
  );
}
