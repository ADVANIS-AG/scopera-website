import type { PageVisit } from "./types";

// Startwerte aus dem Plan (docs/superpowers oder .claude/plans) - nach ein paar Wochen echter
// Traffic-Daten gemeinsam mit ADVANIS nachschaerfen.
const PAGE_SCORES: Record<string, number> = {
  "/pakete": 40,
  "/kontakt": 40,
  "/plattform": 20,
  "/leistungen": 20,
};
const INSIGHTS_SCORE = 10;
const EXTRA_PAGE_SCORE = 5;
const SESSION_DURATION_BONUS = 15;
const SESSION_DURATION_THRESHOLD_MS = 2 * 60 * 1000;
export const REPEAT_VISIT_BONUS = 25;
export const REPEAT_VISIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function normalizePath(path: string): string {
  const trimmed = path.split("?")[0].replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function scoreForPage(path: string): number {
  const normalized = normalizePath(path);
  if (normalized in PAGE_SCORES) return PAGE_SCORES[normalized];
  if (normalized.startsWith("/insights")) return INSIGHTS_SCORE;
  return 0;
}

/** Score einer Session ausschliesslich aus den bisher gesammelten Seitenbesuchen (ohne Repeat-Visit-Bonus). */
export function scorePages(pages: PageVisit[]): number {
  let score = 0;
  const totalDurationMs = pages.reduce((sum, p) => sum + p.durationMs, 0);

  pages.forEach((page, index) => {
    score += scoreForPage(page.path);
    if (index > 0) score += EXTRA_PAGE_SCORE;
  });

  if (totalDurationMs > SESSION_DURATION_THRESHOLD_MS) {
    score += SESSION_DURATION_BONUS;
  }

  return score;
}
