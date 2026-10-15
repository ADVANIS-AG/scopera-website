import { kuerzeIp } from "./lib/ip";
import type { CrmLeadPayload, Env, SessionState } from "./types";

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
export function recordVisitorEvent(env: Env, session: SessionState): void {
  if (!isConfigured(env)) return;
  try {
    env.VISITOR_EVENTS.writeDataPoint({
      blobs: ["visitor", session.sessionId, session.company?.name ?? "", session.company?.source ?? ""],
      doubles: [session.score, session.pages.length],
      // Gekuerzt, weil Analytics Engine keine Aufbewahrungsfrist kennt und der Index
      // abfragbar bleibt. Die volle IP steht nur in KV und laeuft dort nach 30 Minuten ab.
      indexes: [session.company?.name ?? kuerzeIp(session.ip)],
    });
  } catch (err) {
    console.warn("recordVisitorEvent fehlgeschlagen:", err instanceof Error ? err.message : err);
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
