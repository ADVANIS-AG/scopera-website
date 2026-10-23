import { kuerzeIp } from "./lib/ip";
import type { CrmLeadPayload, Env, PageVisit, SessionState } from "./types";

// Muss mit wrangler.toml [[analytics_engine_datasets]] dataset = "..." uebereinstimmen.
export const VISITOR_EVENTS_DATASET = "scopera_visitor_events";

// Zentrale Stelle fuer alles, was in Workers Analytics Engine landet - siehe Plan
// ".claude/plans/zum-thema-webseitenbesucher-untersuche-dreamy-key.md". Zwei "Datasets" ueber
// Indexe unterschieden (index0 = "visitor" | "lead"), da ein Analytics-Engine-Binding pro Dataset
// gedacht ist und wir mit einem Binding auskommen wollen.

function isConfigured(env: Env): boolean {
  return typeof env.VISITOR_EVENTS?.writeDataPoint === "function";
}

/** Wird bei jedem Pageview/Firmen-Match aufgerufen (siehe session-store.ts). Nicht awaiten noetig -
 *  writeDataPoint() kehrt sofort zurueck, Cloudflare schreibt im Hintergrund. Lokal per `wrangler
 *  dev` ist das Binding nicht immer verfuegbar - siehe worker/README.md "Bekannte Einschraenkungen". */
export function recordVisitorEvent(env: Env, session: SessionState, seite?: PageVisit): void {
  if (!isConfigured(env)) return;
  try {
    env.VISITOR_EVENTS.writeDataPoint({
      // blob5 und double3 sind der aufgerufene Pfad und seine Verweildauer. Ohne sie war keine
      // Seitenauswertung moeglich: Die Pfade erreichten zwar den Worker, lebten aber nur 30
      // Minuten in KV und wurden nie dauerhaft geschrieben. Leer, wenn das Ereignis nicht von
      // einem Seitenaufruf stammt, etwa bei einer Firmenerkennung.
      blobs: [
        "visitor",
        session.sessionId,
        session.company?.name ?? "",
        session.company?.source ?? "",
        seite?.path ?? "",
      ],
      doubles: [session.score, session.pages.length, seite?.durationMs ?? 0, seite?.scrollDepth ?? -1],
      // Gekuerzt, weil Analytics Engine keine Aufbewahrungsfrist kennt und der Index
      // abfragbar bleibt. Die volle IP steht nur in KV und laeuft dort nach 30 Minuten ab.
      indexes: [session.company?.name ?? kuerzeIp(session.ip)],
    });
  } catch (err) {
    console.warn("recordVisitorEvent fehlgeschlagen:", err instanceof Error ? err.message : err);
  }
}

/** Ein Ereignis je angeklicktem Ziel. Bewusst getrennt vom Besucher-Ereignis: Pro Seitenaufruf
 *  gibt es genau ein Besucher-Ereignis, aber beliebig viele Klicks. Ohne Sitzungs-ID, damit sich
 *  daraus kein Bewegungsprofil einer Person zusammensetzen laesst. */
export function recordClickEvents(env: Env, path: string, ziele: string[]): void {
  if (!isConfigured(env) || ziele.length === 0) return;
  try {
    for (const ziel of ziele) {
      env.VISITOR_EVENTS.writeDataPoint({
        blobs: ["click", path, ziel],
        doubles: [1],
        indexes: [path],
      });
    }
  } catch (err) {
    console.warn("recordClickEvents fehlgeschlagen:", err instanceof Error ? err.message : err);
  }
}

/** Wird bei jedem Lead-Uebertragungsversuch aufgerufen (siehe crm-client.ts). */
export function recordLeadEvent(env: Env, payload: CrmLeadPayload, outcome: "ok" | "failed" | "existing"): void {
  if (!isConfigured(env)) return;
  try {
    env.VISITOR_EVENTS.writeDataPoint({
      blobs: ["lead", payload.source, payload.company ?? "", outcome],
      doubles: [payload.score ?? 0],
      // Bewusst nicht die E-Mail-Adresse: sie waere damit dauerhaft im Index abfragbar.
      indexes: [payload.company ?? payload.source ?? "unknown"],
    });
  } catch (err) {
    console.warn("recordLeadEvent fehlgeschlagen:", err instanceof Error ? err.message : err);
  }
}
