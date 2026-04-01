export default function DemandGrowth() {
  // Simple area-like path
  const points = [
    [0, 180], [60, 170], [120, 155], [180, 148],
    [240, 130], [300, 105], [360, 80], [420, 48], [480, 20],
  ];
  const pathD =
    "M" +
    points.map(([x, y]) => `${x + 40},${y}`).join(" L") +
    ` L520,200 L40,200 Z`;
  const lineD =
    "M" + points.map(([x, y]) => `${x + 40},${y}`).join(" L");

  return (
    <svg viewBox="0 0 560 240" fill="none" className="w-full max-w-[560px]">
      {/* Grid lines */}
      {[60, 100, 140, 180].map((y) => (
        <line key={y} x1="40" y1={y} x2="520" y2={y} stroke="#1F2937" strokeWidth="1" />
      ))}

      {/* Area */}
      <defs>
        <linearGradient id="demand-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2AB8E6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2AB8E6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={pathD} fill="url(#demand-grad)" />
      <path d={lineD} stroke="#2AB8E6" strokeWidth="2" fill="none" />

      {/* Labels */}
      <text x="40" y="220" fill="#6B7280" fontSize="11">2020</text>
      <text x="500" y="220" fill="#6B7280" fontSize="11">2030</text>
      <text x="280" y="220" textAnchor="middle" fill="#9CA3AF" fontSize="11">Projected global compute demand</text>

      {/* Y axis label */}
      <text x="20" y="18" fill="#6B7280" fontSize="10">Demand</text>
    </svg>
  );
}
