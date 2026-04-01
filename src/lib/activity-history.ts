/**
 * Local activity-index history stored in localStorage.
 *
 * Each day collects multiple samples (one per page visit). The daily score
 * shown in the UI is the average of all samples that day, which smooths out
 * short-term fluctuations.
 *
 * Storage format:
 *   DailyEntry  — one per day, holds all raw samples + computed average
 *   HistoryEntry — simplified (date + average) used by the chart
 */

const STORAGE_KEY = "theta-activity-history-v2";

interface DailyEntry {
  date: string; // YYYY-MM-DD
  samples: number[]; // raw scores from each visit
  average: number; // Math.round(mean of samples)
}

export interface HistoryEntry {
  date: string;
  score: number; // daily average
  sampleCount: number;
}

function loadDaily(): DailyEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDaily(entries: DailyEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable
  }
}

const LAST_SAVE_KEY = "theta-activity-last-save";

/**
 * Record a new sample for today. Returns the full history as HistoryEntry[].
 * Debounces saves within 5 seconds to avoid React StrictMode double-fires.
 */
export function saveScore(rawScore: number): HistoryEntry[] {
  const now = Date.now();
  const lastSave = Number(sessionStorage.getItem(LAST_SAVE_KEY) || "0");
  if (now - lastSave < 5000) {
    // Skip duplicate — return current history
    return getHistory();
  }
  sessionStorage.setItem(LAST_SAVE_KEY, String(now));

  const entries = loadDaily();
  const today = new Date().toISOString().slice(0, 10);

  const idx = entries.findIndex((e) => e.date === today);
  if (idx >= 0) {
    entries[idx].samples.push(rawScore);
    const sum = entries[idx].samples.reduce((a, b) => a + b, 0);
    entries[idx].average = Math.round(sum / entries[idx].samples.length);
  } else {
    entries.push({ date: today, samples: [rawScore], average: rawScore });
  }

  // Keep last 90 days
  const trimmed = entries.slice(-90);
  saveDaily(trimmed);

  return trimmed.map((e) => ({
    date: e.date,
    score: e.average,
    sampleCount: e.samples.length,
  }));
}

export function getHistory(): HistoryEntry[] {
  return loadDaily().map((e) => ({
    date: e.date,
    score: e.average,
    sampleCount: e.samples.length,
  }));
}

export function getTodaySampleCount(): number {
  const entries = loadDaily();
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find((e) => e.date === today);
  return todayEntry ? todayEntry.samples.length : 0;
}

export function getDaysSinceFirstEntry(): number {
  const entries = loadDaily();
  if (entries.length === 0) return 0;
  const first = new Date(entries[0].date);
  const now = new Date();
  return Math.floor((now.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
}
