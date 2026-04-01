import Card from "../../components/Card";
import CalculatorCard from "../../components/CalculatorCard";
import DreamCalculator from "../../components/DreamCalculator";
import { fetchNetworkStats } from "../../lib/theta-api";

export const revalidate = 60;

const ways = [
  {
    title: "Run an Edge Node",
    description:
      "Stake TFUEL (min 10,000) and share compute resources. Earn TFUEL rewards from block production and EdgeCloud jobs.",
    difficulty: "Easy",
  },
  {
    title: "Stake TFUEL",
    description:
      "Lock TFUEL in an Elite Edge Node to earn staking rewards. Higher stakes and longer lock periods increase returns.",
    difficulty: "Easy",
  },
  {
    title: "Run a Guardian Node",
    description:
      "Stake THETA (min 1,000) to validate blocks and earn TFUEL rewards. Higher security role in the network.",
    difficulty: "Advanced",
  },
];

export default async function EarnPage() {
  const stats = await fetchNetworkStats();

  const stakingData = {
    thetaStaked: stats.thetaStake.totalAmount,
    tfuelStaked: stats.tfuelStake.totalAmount,
    tfuelPrice: stats.tfuelPrice.price,
    thetaPrice: stats.thetaPrice.price,
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Earn with Theta</h1>
        <p className="text-theta-muted">
          Calculate your staking rewards based on live network data.
        </p>
      </div>

      {/* Calculator */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Reward Calculator
        </h2>
        <CalculatorCard stakingData={stakingData} />
      </section>

      {/* What if calculator */}
      <section>
        <DreamCalculator stakingData={stakingData} />
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
