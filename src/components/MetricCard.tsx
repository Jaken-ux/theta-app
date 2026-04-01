import Card from "./Card";

export default function MetricCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change?: string;
}) {
  return (
    <Card>
      <p className="text-sm text-theta-muted mb-1">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {change && (
        <p className="text-xs text-emerald-400 mt-1">{change}</p>
      )}
    </Card>
  );
}
