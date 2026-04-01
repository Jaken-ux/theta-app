/**
 * Activity-index history — fetched from PostgreSQL via API routes.
 *
 * Previously stored in localStorage. Now all data lives in a shared
 * database so every visitor sees the same historical trend.
 */

export interface HistoryEntry {
  date: string;
  score: number; // daily average
  sampleCount: number;
}

const DEBOUNCE_KEY = "theta-activity-last-save";

/**
 * Save a score to the database and return the full history.
 * Debounces within 5 seconds to avoid duplicate saves.
 */
export async function saveScore(rawScore: number): Promise<HistoryEntry[]> {
  if (typeof window !== "undefined") {
    const now = Date.now();
    const lastSave = Number(sessionStorage.getItem(DEBOUNCE_KEY) || "0");
    if (now - lastSave < 5000) {
      return getHistory();
    }
    sessionStorage.setItem(DEBOUNCE_KEY, String(now));
  }

  try {
    await fetch("/api/activity-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: rawScore }),
    });
  } catch {
    // Save failed — still return whatever history we can fetch
  }

  return getHistory();
}

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const res = await fetch("/api/activity-history");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getTodaySampleCount(): Promise<number> {
  const history = await getHistory();
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = history.find((e) => e.date === today);
  return todayEntry ? todayEntry.sampleCount : 0;
}

export async function getDaysSinceFirstEntry(): Promise<number> {
  const history = await getHistory();
  if (history.length === 0) return 0;
  const first = new Date(history[0].date);
  const now = new Date();
  return Math.floor((now.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
}
