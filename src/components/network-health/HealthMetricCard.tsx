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
    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 sm:p-8 flex flex-col">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-[#6B7280] mt-1 mb-5">{description}</p>

      <div className="space-y-3 mb-5 flex-1">
        {metrics.map((m) => (
          <div key={m.label} className="flex justify-between items-baseline">
            <span className="text-sm text-[#9CA3AF]">{m.label}</span>
            <span className="text-lg font-semibold text-white tabular-nums">
              {m.value}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#6B7280] leading-relaxed border-t border-[#1F2937] pt-4">
        {explanation}
      </p>
    </div>
  );
}
