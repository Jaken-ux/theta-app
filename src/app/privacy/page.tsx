import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Theta Simplified handles your data — what is collected, why, how long it is kept, and your rights.",
  alternates: { canonical: "https://thetasimplified.com/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <article className="max-w-2xl mx-auto space-y-8 text-theta-muted leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Privacy Policy
        </h1>
        <p className="text-sm text-theta-muted/80">Last updated: May 5, 2026</p>
      </header>

      <p>
        Theta Simplified (the &ldquo;site&rdquo;) is an independent project run
        by Jacob Jansson. This page describes what data the site collects, why
        it is collected, how long it is kept, and what you can do about it.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          What we collect
        </h2>

        <p>
          <strong className="text-white">Aggregated analytics (Vercel Analytics).</strong>{" "}
          The site uses Vercel Analytics to count page views and identify
          general traffic patterns. Vercel Analytics does not use cookies, does
          not store persistent identifiers on your device, and does not collect
          information that could identify you personally. See{" "}
          <a
            href="https://vercel.com/docs/analytics/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-theta-teal underline decoration-theta-teal/40 underline-offset-2 hover:decoration-theta-teal"
          >
            Vercel&rsquo;s analytics privacy notice
          </a>{" "}
          for details.
        </p>

        <p>
          <strong className="text-white">EdgeCloud chat.</strong> When you use
          the floating &ldquo;Ask Theta AI&rdquo; chat (or the chat on{" "}
          <Link href="/use-edgecloud" className="text-theta-teal underline decoration-theta-teal/40 underline-offset-2 hover:decoration-theta-teal">
            /use-edgecloud
          </Link>
          ), the site processes your IP address as a one-way SHA-256 hash for
          rate limiting (10 requests per hour) and to track aggregate usage by
          model and topic. Your prompts and the model&rsquo;s replies are sent
          to{" "}
          <a
            href="https://www.thetaedgecloud.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-theta-teal underline decoration-theta-teal/40 underline-offset-2 hover:decoration-theta-teal"
          >
            Theta EdgeCloud
          </a>
          ; chat content itself is not stored on this site. We do store the
          model used, the outcome (success / timeout / error), and a coarse
          topic classification of the question.
        </p>

        <p>
          <strong className="text-white">Contact form.</strong> Messages
          submitted on{" "}
          <Link href="/contact" className="text-theta-teal underline decoration-theta-teal/40 underline-offset-2 hover:decoration-theta-teal">
            /contact
          </Link>{" "}
          are delivered via{" "}
          <a
            href="https://formspree.io/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-theta-teal underline decoration-theta-teal/40 underline-offset-2 hover:decoration-theta-teal"
          >
            Formspree
          </a>
          , a third-party form processor. Whatever you put in the form (name,
          email, message) is sent to Formspree and forwarded to the site
          owner&rsquo;s email.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          What we do not collect
        </h2>
        <ul className="list-disc pl-6 space-y-2 marker:text-theta-teal/60">
          <li>
            We do not run Google Analytics, Meta Pixel, advertising trackers, or
            any cross-site tracking technology.
          </li>
          <li>
            We do not store cookies for analytics, advertising, or
            personalization. The only client-side storage used is for an admin
            login key on{" "}
            <code className="px-1 py-0.5 rounded bg-theta-card border border-theta-border text-[0.92em] text-theta-teal font-mono">
              /admin
            </code>{" "}
            (relevant only to the site owner) and a temporary session indicator
            that the chat panel is open.
          </li>
          <li>
            We do not sell or share data with third parties for marketing
            purposes.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          How long we keep data
        </h2>
        <p>
          Aggregated EdgeCloud usage counters (per IP hash, per model, per
          topic) are retained indefinitely for capacity planning. Hashed IPs
          cannot be reversed back into a real IP address. Vercel Analytics
          retention follows{" "}
          <a
            href="https://vercel.com/docs/analytics/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-theta-teal underline decoration-theta-teal/40 underline-offset-2 hover:decoration-theta-teal"
          >
            Vercel&rsquo;s policy
          </a>
          . Contact-form messages are retained until the site owner deletes them
          from their email.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          Your rights
        </h2>
        <p>
          Under the EU GDPR and similar laws, you may request access to, or
          deletion of, any personal data we hold about you. Because this site
          stores almost nothing tied to individual users (only a hashed IP for
          chat rate limiting, which is not reversible), most requests will
          confirm there is nothing identifiable to delete. To make a request,
          use the{" "}
          <Link href="/contact" className="text-theta-teal underline decoration-theta-teal/40 underline-offset-2 hover:decoration-theta-teal">
            contact form
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">
          Changes to this policy
        </h2>
        <p>
          If we change how the site handles data, this page will be updated and
          the &ldquo;Last updated&rdquo; date at the top will change. Material
          changes will be flagged on the homepage for at least 30 days.
        </p>
      </section>
    </article>
  );
}
