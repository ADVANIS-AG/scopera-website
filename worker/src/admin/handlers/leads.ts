import { VISITOR_EVENTS_DATASET } from "../../analytics";
import { queryAnalyticsEngine } from "../../cf-api-client";
import { createLead, failedLeadKey } from "../../crm-client";
import { jsonResponse } from "../../lib/json";
import type { Env, FailedLeadRecord } from "../../types";

interface LeadEventRow {
  subject: string;
  source: string;
  company: string;
  outcome: string;
  score: number;
  timestamp: string;
}

/** GET /admin/api/leads - Log aller Lead-Uebertragungsversuche (erfolgreich/fehlgeschlagen/bereits
 *  bekannt), aus Workers Analytics Engine. */
export async function handleGetLeads(env: Env): Promise<Response> {
  const sql = `
    SELECT index1 AS subject, blob2 AS source, blob3 AS company, blob4 AS outcome, double1 AS score, timestamp
    FROM ${VISITOR_EVENTS_DATASET}
    WHERE blob1 = 'lead'
    ORDER BY timestamp DESC
    LIMIT 100
  `;
  const result = await queryAnalyticsEngine<LeadEventRow>(env, sql);
  if (!result.ok) {
    return jsonResponse({ ok: false, error: result.errors?.join("; ") ?? "query-failed" }, 502);
  }
  return jsonResponse({ ok: true, leads: result.result ?? [] }, 200);
}

/** GET /admin/api/leads/failed - aktuell zum Retry anstehende, fehlgeschlagene Lead-Uebertragungen. */
export async function handleGetFailedLeads(env: Env): Promise<Response> {
  const list = await env.ADMIN_STORE.list({ prefix: "failed-lead:" });
  const records = await Promise.all(
    list.keys.map((k) => env.ADMIN_STORE.get<FailedLeadRecord>(k.name, "json")),
  );
  return jsonResponse({ ok: true, failed: records.filter((r): r is FailedLeadRecord => r !== null) }, 200);
}

/** POST /admin/api/leads/failed/:id/retry */
export async function handleRetryFailedLead(env: Env, id: string): Promise<Response> {
  const record = await env.ADMIN_STORE.get<FailedLeadRecord>(failedLeadKey(id), "json");
  if (!record) {
    return jsonResponse({ ok: false, error: "not-found" }, 404);
  }

  // Alten Eintrag zuerst entfernen: createLead() legt bei erneutem Fehlschlag ohnehin einen neuen
  // failed-lead-Datensatz an - ohne das Loeschen hier wuerden sich bei wiederholten Fehlversuchen
  // Karteileichen des urspruenglichen Eintrags ansammeln.
  await env.ADMIN_STORE.delete(failedLeadKey(id));
  const result = await createLead(env, record.payload);
  return jsonResponse({ ok: result.ok, error: result.error }, result.ok ? 200 : 502);
}
