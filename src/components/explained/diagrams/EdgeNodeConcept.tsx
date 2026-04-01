export default function EdgeNodeConcept() {
  return (
    <svg viewBox="0 0 400 300" fill="none" className="w-full max-w-[400px]">
      {/* Computer */}
      <rect x="130" y="40" width="140" height="100" rx="12" fill="#111827" stroke="#2AB8E6" strokeWidth="1.5" />
      <rect x="150" y="56" width="100" height="60" rx="4" fill="#0A0F1C" />
      <text x="200" y="92" textAnchor="middle" fill="#2AB8E6" fontSize="12" fontWeight="500">Your PC</text>
      {/* Base */}
      <rect x="170" y="144" width="60" height="6" rx="3" fill="#374151" />

      {/* Arrows out */}
      {[
        { x: 60, y: 220, label: "Bandwidth" },
        { x: 200, y: 240, label: "Storage" },
        { x: 340, y: 220, label: "Compute" },
      ].map((item, i) => (
        <g key={i}>
          <line x1="200" y1="150" x2={item.x} y2={item.y - 20} stroke="#2AB8E6" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={item.x} cy={item.y} r="24" fill="#111827" stroke="#2AB8E6" strokeWidth="1" />
          <text x={item.x} y={item.y + 4} textAnchor="middle" fill="#2AB8E6" fontSize="9">{item.label}</text>
        </g>
      ))}

      {/* Reward */}
      <text x="200" y="290" textAnchor="middle" fill="#10B981" fontSize="12" fontWeight="500">
        → Earn TFUEL for sharing resources
      </text>
    </svg>
  );
}
