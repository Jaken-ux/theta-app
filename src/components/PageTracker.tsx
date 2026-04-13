"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getVisitorId(): string {
  const key = "theta-visitor-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;
type UtmKey = (typeof UTM_KEYS)[number];

function readAttribution(): {
  referrer: string | null;
  utm: Partial<Record<UtmKey, string>>;
} {
  const key = "theta-attribution";
  const stored = sessionStorage.getItem(key);
  if (stored) return JSON.parse(stored);

  const url = new URL(window.location.href);
  const utm: Partial<Record<UtmKey, string>> = {};
  for (const k of UTM_KEYS) {
    const v = url.searchParams.get(k);
    if (v) utm[k] = v.slice(0, 100);
  }
  let referrer: string | null = null;
  if (document.referrer) {
    try {
      const host = new URL(document.referrer).hostname;
      if (host && host !== window.location.hostname) referrer = host;
    } catch {
      // malformed referrer — ignore
    }
  }
  const data = { referrer, utm };
  sessionStorage.setItem(key, JSON.stringify(data));
  return data;
}

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hostname === "localhost") return;
    try {
      const visitorId = getVisitorId();
      const { referrer, utm } = readAttribution();
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, page: pathname, referrer, utm }),
      }).catch(() => {});
    } catch {
      // localStorage/sessionStorage unavailable
    }
  }, [pathname]);

  return null;
}
