/**
 * trend: number | null
 *   positive = up, negative = down, 0 = flat, null = no data yet
 */
function TrendIndicator({ trend }: { trend: number | null }) {
  if (trend === null) {
    return (
      <p className="text-[11px] text-[#B0B8C4] mt-2 italic">
        Trend data available after 14 days of tracking
      </p>
    );
  }

  const abs = Math.abs(trend);
  let symbol: string;
  let color: string;
  let label: string;

  if (abs < 0.5) {
    symbol = "≈";
    color = "#7D8694";
    label = `${abs.toFixed(1)}% flat`;
  } else if (trend > 0) {
    symbol = "▲";
    color = "#10B981";
    label = `+${abs.toFixed(1)}% last 30d`;
  } else {
    symbol = "▼";
    color = "#EF4444";
    label = `-${abs.toFixed(1)}% last 30d`;
  }

  return (
    <p className="text-[11px] mt-2 font-medium" style={{ color }}>
      {symbol} {label}
    </p>
  );
}

export default function ActivityMetric({
  title,
  value,
  subValue,
  secondaryValue,
  secondaryNote,
  description,
  weight,
  tooltip,
  trend = null,
}: {
  title: string;
  value: string;
  subValue?: string;
  secondaryValue?: string;
  secondaryNote?: string;
  description: string;
  weight: string;
  tooltip?: string;
  trend?: number | null;
}) {
  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6">
      <div className="flex items-baseline justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-white">{title}</h3>
          {tooltip && (
            <span
              title={tooltip}
              className="w-4 h-4 rounded-full border border-[#7D8694] text-[#B0B8C4] hover:text-white hover:border-[#B0B8C4] transition-colors flex items-center justify-center text-[10px] font-medium leading-none cursor-help shrink-0"
            >
              ?
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#B0B8C4] font-mono">{weight}</span>
      </div>

      <p className="text-2xl font-semibold text-white tabular-nums mt-3">
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-[#B0B8C4] mt-0.5">{subValue}</p>
      )}

      <TrendIndicator trend={trend} />

      {secondaryValue && (
        <div className="mt-3 p-2.5 bg-[#0A0F1C] rounded-lg">
          <p className="text-sm font-medium text-[#B0B8C4]">{secondaryValue}</p>
          {secondaryNote && (
            <p className="text-[10px] text-[#B0B8C4] mt-0.5">{secondaryNote}</p>
          )}
        </div>
      )}

      <p className="text-xs text-[#D1D5DB] leading-relaxed mt-4 border-t border-[#2A3548] pt-3">
        {description}
      </p>
    </div>
  );
}
