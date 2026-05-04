import type { Metadata } from "next";
import ContactSection from "../../components/ContactSection";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send feedback, ideas, or collaboration proposals to Theta Simplified.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Contact</h1>
        <p className="text-theta-muted">
          Reach out — I read every message.
        </p>
      </div>

      <ContactSection />
    </div>
  );
}
