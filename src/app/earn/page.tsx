import Card from "../../components/Card";
import CalculatorCard from "../../components/CalculatorCard";

const ways = [
  {
    title: "Run an Edge Node",
    description:
      "Share your computer's spare bandwidth and storage. You'll earn TFUEL for every video chunk you help deliver.",
    difficulty: "Easy",
  },
  {
    title: "Stake TFUEL",
    description:
      "Lock up TFUEL to help secure the network. You earn staking rewards — similar to earning interest.",
    difficulty: "Easy",
  },
  {
    title: "Run a Guardian Node",
    description:
      "Stake THETA tokens to validate transactions. Requires 1,000 THETA minimum.",
    difficulty: "Advanced",
  },
];

export default function EarnPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Earn with Theta</h1>
        <p className="text-theta-muted">
          Estimate your rewards and learn how to participate in the network.
        </p>
      </div>

      {/* Calculator */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Reward Calculator
        </h2>
        <CalculatorCard />
      </section>

      {/* Ways to earn */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Ways to Earn
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {ways.map((way) => (
            <Card key={way.title}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">
                  {way.title}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    way.difficulty === "Easy"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-amber-400/10 text-amber-400"
                  }`}
                >
                  {way.difficulty}
                </span>
              </div>
              <p className="text-sm text-theta-muted">{way.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
