"use client";

import { useState, FormEvent } from "react";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      await fetch("https://formspree.io/f/xreoyyyg", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      setSubmitted(true);
    } catch {
      // Silently fail — the message may still go through
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8 text-center">
        <p className="text-lg font-semibold text-white mb-2">Message sent.</p>
        <p className="text-sm text-[#B0B8C4]">
          Thanks for helping improve Theta Simplified.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#151D2E] border border-[#2A3548] rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold text-white mb-1">
        Questions, feedback or ideas?
      </h3>
      <p className="text-sm text-[#B0B8C4] mb-6">
        If you have thoughts about Theta, the data, or potential collaboration,
        I&apos;d love to hear from you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot */}
        <input
          type="text"
          name="_gotcha"
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
        />

        <div>
          <label htmlFor="message" className="block text-sm text-[#B0B8C4] mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className="w-full bg-[#0D1117] border border-[#2A3548] rounded-lg px-4 py-3 text-white text-sm placeholder:text-[#5C6675] focus:outline-none focus:ring-2 focus:ring-[#2AB8E6]/40 resize-y"
            placeholder="What's on your mind?"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm text-[#B0B8C4] mb-1">
            Your email <span className="text-[#7D8694]">(optional)</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            className="w-full bg-[#0D1117] border border-[#2A3548] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#5C6675] focus:outline-none focus:ring-2 focus:ring-[#2AB8E6]/40"
            placeholder="Only if you want a reply"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="px-6 py-3 bg-[#2AB8E6] text-white font-medium rounded-lg hover:bg-[#2AB8E6]/90 transition-colors text-sm disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send message"}
        </button>
      </form>
    </div>
  );
}
