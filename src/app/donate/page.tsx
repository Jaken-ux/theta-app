import type { Metadata } from "next";
import DonationAddresses from "@/components/DonationAddresses";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "If Theta Simplified has helped you understand the network better, you can support the work with a small donation. The site stays free either way.",
  alternates: { canonical: "https://thetasimplified.com/donate" },
};

export default function SupportPage() {
  return (
    <article className="max-w-2xl mx-auto space-y-10 text-theta-muted leading-relaxed">
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          Support Theta Simplified
        </h1>
      </header>

      <p className="text-[17px] leading-[1.7]">
        I run this site on my own time. The data, the writing, the videos,
        the methodology — all of it.
      </p>

      <p className="text-[17px] leading-[1.7]">
        If something here has helped you understand Theta better, and
        you&rsquo;d like to support the work, donations are appreciated.
        They&rsquo;re not necessary. The site stays free either way.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          What it covers
        </h2>
        <p className="text-[17px] leading-[1.7]">
          Hosting, data sources, time. Mostly time.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          How to donate
        </h2>
        <DonationAddresses />
      </section>

      <p className="text-[17px] leading-[1.7]">
        No subscriptions, no paywalls, no obligation. If you&rsquo;d rather
        just read and share, that&rsquo;s also support.
      </p>

      <p className="text-[17px] leading-[1.7] text-theta-muted">— Jacob</p>
    </article>
  );
}
