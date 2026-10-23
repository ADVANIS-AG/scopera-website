import type { PageVisit } from "./types";

// Die Pfade hier standen urspruenglich auf alten, deutschen Slugs (/pakete, /kontakt,
// /plattform, /leistungen). Die Seite liefert aber sprachpraefixierte englische Routen
// (/de/editions, /en/contact ...), weshalb jahrelang KEIN Pfad traf und jede Seite 0 Punkte
// ergab. Darum wird unten das Sprachpraefix abgeschnitten, bevor verglichen wird - so bricht
// eine kuenftige Umbenennung nicht erneut still, sondern nur dieser eine Eintrag.
const PAGE_SCORES: Record<string, number> = {
  "/contact": 40,
  "/editions": 40,
  "/packages": 40, // alte Adresse, leitet auf /editions um
  "/playground": 30,
  "/product": 20,
  "/services": 20,
};
const INSIGHTS_SCORE = 10;
const EXTRA_PAGE_SCORE = 5;
const SESSION_DURATION_BONUS = 15;
const SESSION_DURATION_THRESHOLD_MS = 2 * 60 * 1000;
export const REPEAT_VISIT_BONUS = 25;
export const REPEAT_VISIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Schneidet Query und Sprachpraefix ab, damit /de/contact und /en/contact gleich zaehlen. */
export function normalizePath(path: string): string {
  const ohneQuery = path.split("?")[0];
  const ohneSprache = ohneQuery.replace(/^\/(de|en)(?=\/|$)/, "");
  const trimmed = ohneSprache.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function scoreForPage(normalizedPath: string): number {
  if (normalizedPath in PAGE_SCORES) return PAGE_SCORES[normalizedPath];
  if (normalizedPath === "/insights" || normalizedPath.startsWith("/insights/")) return INSIGHTS_SCORE;
  return 0;
}

/** Score aus den Seitenbesuchen, ohne Wiederbesuch-Bonus (siehe scoreSession).
 *  Zaehlt eindeutige Seiten: Fuenfmal dieselbe Seite neu laden war vorher fuenfmal Punkte. */
export function scorePages(pages: PageVisit[]): number {
  const gesehen = new Set<string>();
  let score = 0;

  for (const page of pages) {
    const pfad = normalizePath(page.path);
    if (gesehen.has(pfad)) continue;
    gesehen.add(pfad);
    score += scoreForPage(pfad);
    if (gesehen.size > 1) score += EXTRA_PAGE_SCORE;
  }

  const totalDurationMs = pages.reduce((sum, p) => sum + p.durationMs, 0);
  if (totalDurationMs > SESSION_DURATION_THRESHOLD_MS) {
    score += SESSION_DURATION_BONUS;
  }

  return score;
}

/** Vollstaendiger Score einer Session. Zuvor rechnete recordPageview nur scorePages und loeschte
 *  damit den Wiederbesuch-Bonus wieder weg, den tagCompanyForIp gerade gesetzt hatte. */
export function scoreSession(pages: PageVisit[], repeatVisit: boolean): number {
  return scorePages(pages) + (repeatVisit ? REPEAT_VISIT_BONUS : 0);
}
