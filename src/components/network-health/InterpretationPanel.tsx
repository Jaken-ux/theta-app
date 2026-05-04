export default function InterpretationPanel() {
  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8">
      <h3 className="text-base font-semibold text-white mb-4">
        How to interpret this
      </h3>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-sm font-medium text-[#10B981]">
              If utilization trends upward
            </span>
          </div>
          <ul className="space-y-1.5 text-sm text-[#B0B8C4] leading-relaxed">
            <li>More activity may be happening on the network</li>
            <li>Infrastructure usage may be increasing</li>
            <li>Network effects may be strengthening</li>
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#7D8694]" />
            <span className="text-sm font-medium text-[#7D8694]">
              If utilization is flat
            </span>
          </div>
          <ul className="space-y-1.5 text-sm text-[#B0B8C4] leading-relaxed">
            <li>Adoption may not yet be accelerating</li>
            <li>The network may be in a stable phase</li>
            <li>External factors may be limiting growth</li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-[#5C6675] mt-6">
        This is an informational overview, not investment advice. Network
        activity does not guarantee future growth or token value.
      </p>
    </div>
  );
}
