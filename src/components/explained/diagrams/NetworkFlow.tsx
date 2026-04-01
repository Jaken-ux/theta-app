export default function NetworkFlow() {
  return (
    <svg viewBox="0 0 700 160" fill="none" className="w-full max-w-[700px]">
      {/* Step boxes */}
      {[
        { x: 0, label: "Content\nCreator", icon: "🎬", color: "#A78BFA" },
        { x: 175, label: "Theta\nNetwork", icon: "Θ", color: "#2AB8E6" },
        { x: 350, label: "Edge\nNodes", icon: "🖥", color: "#10B981" },
        { x: 525, label: "Viewer", icon: "👁", color: "#F59E0B" },
      ].map((step, i) => (
        <g key={i}>
          <rect x={step.x + 10} y="20" width="140" height="100" rx="16" fill="#111827" stroke={step.color} strokeWidth="1.5" />
          <text x={step.x + 80} y="60" textAnchor="middle" fontSize="22">{step.icon}</text>
          {step.label.split("\n").map((line, li) => (
            <text key={li} x={step.x + 80} y={88 + li * 16} textAnchor="middle" fill="white" fontSize="12" fontWeight="500">
              {line}
            </text>
          ))}
          {/* Arrow */}
          {i < 3 && (
            <>
              <line x1={step.x + 155} y1="70" x2={step.x + 180} y2="70" stroke="#374151" strokeWidth="1.5" />
              <polygon points={`${step.x + 180},65 ${step.x + 188},70 ${step.x + 180},75`} fill="#374151" />
            </>
          )}
        </g>
      ))}
      {/* TFUEL reward arrow */}
      <line x1="540" y1="130" x2="260" y2="130" stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" />
      <text x="400" y="152" textAnchor="middle" fill="#10B981" fontSize="11">TFUEL rewards flow back</text>
    </svg>
  );
}
