export default function CentralizedVsDecentralized() {
  return (
    <svg viewBox="0 0 640 300" fill="none" className="w-full max-w-[640px]">
      {/* Centralized */}
      <text x="150" y="28" textAnchor="middle" fill="#9CA3AF" fontSize="13" fontWeight="500">Traditional Cloud</text>
      <rect x="110" y="80" width="80" height="50" rx="10" fill="#111827" stroke="#EF4444" strokeWidth="1.5" />
      <text x="150" y="110" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="500">Server</text>
      {/* Lines from center server to users */}
      {[60, 120, 180, 240].map((x, i) => (
        <g key={i}>
          <line x1="150" y1="130" x2={x} y2="210" stroke="#374151" strokeWidth="1" />
          <circle cx={x} cy="220" r="14" fill="#111827" stroke="#6B7280" strokeWidth="1" />
          <text x={x} y="225" textAnchor="middle" fill="#6B7280" fontSize="9">user</text>
        </g>
      ))}
      <text x="150" y="268" textAnchor="middle" fill="#EF4444" fillOpacity="0.7" fontSize="11">Single point of failure</text>

      {/* Divider */}
      <line x1="320" y1="20" x2="320" y2="280" stroke="#1F2937" strokeWidth="1" strokeDasharray="4 4" />

      {/* Decentralized */}
      <text x="490" y="28" textAnchor="middle" fill="#9CA3AF" fontSize="13" fontWeight="500">Theta Network</text>
      {/* Nodes in a mesh */}
      {[
        { x: 420, y: 100 }, { x: 560, y: 100 },
        { x: 490, y: 80 },
        { x: 440, y: 180 }, { x: 540, y: 180 },
        { x: 490, y: 210 },
      ].map((node, i) => (
        <g key={i}>
          <circle cx={node.x} cy={node.y} r="18" fill="#111827" stroke="#2AB8E6" strokeWidth="1.5" />
          <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#2AB8E6" fontSize="9" fontWeight="500">node</text>
        </g>
      ))}
      {/* Mesh lines */}
      {[
        [490, 80, 420, 100], [490, 80, 560, 100],
        [420, 100, 440, 180], [560, 100, 540, 180],
        [440, 180, 490, 210], [540, 180, 490, 210],
        [420, 100, 540, 180], [560, 100, 440, 180],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2AB8E6" strokeOpacity="0.2" strokeWidth="1" />
      ))}
      <text x="490" y="268" textAnchor="middle" fill="#2AB8E6" fillOpacity="0.7" fontSize="11">Distributed &amp; resilient</text>
    </svg>
  );
}
