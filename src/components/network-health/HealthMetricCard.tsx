export default function HealthMetricCard({
  title,
  description,
  metrics,
  explanation,
}: {
  title: string;
  description: string;
  metrics: { label: string; value: string }[];
  explanation: string;
}) {
  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8 flex flex-col">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-[#7D8694] mt-1 mb-5">{description}</p>

      <div className="space-y-3 mb-5 flex-1">
        {metrics.map((m) => (
          <div key={m.label} className="flex justify-between items-baseline">
            <span className="text-sm text-[#B0B8C4]">{m.label}</span>
            <span className="text-lg font-semibold text-white tabular-nums">
              {m.value}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#7D8694] leading-relaxed border-t border-[#2A3548] pt-4">
        {explanation}
      </p>
    </div>
  );
}
