import GettingStarted from "../../components/GettingStarted";

export default function GetStartedPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Get Started</h1>
        <p className="text-theta-muted">
          Everything you need to know to buy, store, and stake THETA and TFUEL.
        </p>
      </div>

      <GettingStarted />
    </div>
  );
}
