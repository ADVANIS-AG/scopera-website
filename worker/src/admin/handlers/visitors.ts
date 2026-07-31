import { VISITOR_EVENTS_DATASET } from "../../analytics";
import { queryAnalyticsEngine } from "../../cf-api-client";
import { jsonResponse } from "../../lib/json";
import type { Env } from "../../types";

interface VisitorRow {
  subject: string;
  company: string;
  source: string;
  score: number;
  pages: number;
  timestamp: string;
}

/** GET /admin/api/visitors - letzte Firmenbesuche aus Workers Analytics Engine (siehe analytics.ts). */
export async function handleGetVisitors(env: Env): Promise<Response> {
  const sql = `
    SELECT index1 AS subject, blob3 AS company, blob4 AS source, double1 AS score, double2 AS pages, timestamp
    FROM ${VISITOR_EVENTS_DATASET}
    WHERE blob1 = 'visitor'
    ORDER BY timestamp DESC
    LIMIT 100
  `;
  const result = await queryAnalyticsEngine<VisitorRow>(env, sql);
  if (!result.ok) {
    return jsonResponse({ ok: false, error: result.errors?.join("; ") ?? "query-failed" }, 502);
  }
  return jsonResponse({ ok: true, visitors: result.result ?? [] }, 200);
}
