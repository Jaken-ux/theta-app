export default function ThetaVsTfuel() {
  return (
    <svg viewBox="0 0 600 280" fill="none" className="w-full max-w-[600px]">
      {/* THETA side */}
      <rect x="20" y="40" width="240" height="200" rx="20" fill="#151D2E" stroke="#2AB8E6" strokeWidth="1.5" />
      <circle cx="140" cy="110" r="36" fill="#2AB8E6" fillOpacity="0.12" stroke="#2AB8E6" strokeWidth="1.5" />
      <text x="140" y="116" textAnchor="middle" fill="#2AB8E6" fontSize="20" fontWeight="600">Θ</text>
      <text x="140" y="170" textAnchor="middle" fill="white" fontSize="16" fontWeight="600">THETA</text>
      <text x="140" y="194" textAnchor="middle" fill="#B0B8C4" fontSize="12">Governance &amp; Security</text>
      <text x="140" y="214" textAnchor="middle" fill="#B0B8C4" fontSize="12">Stake to validate</text>

      {/* Arrow */}
      <line x1="280" y1="140" x2="320" y2="140" stroke="#445064" strokeWidth="1.5" strokeDasharray="4 4" />
      <text x="300" y="128" textAnchor="middle" fill="#7D8694" fontSize="11">powers</text>

      {/* TFUEL side */}
      <rect x="340" y="40" width="240" height="200" rx="20" fill="#151D2E" stroke="#10B981" strokeWidth="1.5" />
      <circle cx="460" cy="110" r="36" fill="#10B981" fillOpacity="0.12" stroke="#10B981" strokeWidth="1.5" />
      <text x="460" y="116" textAnchor="middle" fill="#10B981" fontSize="18" fontWeight="600">⚡</text>
      <text x="460" y="170" textAnchor="middle" fill="white" fontSize="16" fontWeight="600">TFUEL</text>
      <text x="460" y="194" textAnchor="middle" fill="#B0B8C4" fontSize="12">Operations &amp; Rewards</text>
      <text x="460" y="214" textAnchor="middle" fill="#B0B8C4" fontSize="12">Earned by edge nodes</text>
    </svg>
  );
}
