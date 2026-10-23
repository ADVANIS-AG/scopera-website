import { queryAnalyticsEngine } from "../../cf-api-client";
import { VISITOR_EVENTS_DATASET } from "../../analytics";
import { jsonResponse } from "../../lib/json";
import type { Env } from "../../types";

interface PageRow {
  path: string;
  views: number;
  avgDurationMs: number;
}

/** GET /admin/api/pages
 *
 *  Seitenauswertung aus den Besucher-Ereignissen. Moeglich erst, seit blob5 (Pfad) und double3
 *  (Verweildauer) geschrieben werden - rueckwirkend gibt es diese Daten nicht.
 *  Das Zeitfenster haelt die Auswertung aussagekraeftig; Analytics Engine haelt ohnehin nur
 *  begrenzt vor. */
export async function handleGetPages(env: Env): Promise<Response> {
  const sql = `
    SELECT blob5 AS path, count() AS views, avg(double3) AS avgDurationMs
    FROM ${VISITOR_EVENTS_DATASET}
    WHERE blob1 = 'visitor' AND blob5 != '' AND timestamp > NOW() - INTERVAL '30' DAY
    GROUP BY blob5
    ORDER BY views DESC
    LIMIT 100
  `;

  const result = await queryAnalyticsEngine<PageRow>(env, sql);
  if (!result.ok) {
    return jsonResponse({ ok: false, error: result.errors?.join("; ") ?? "query-failed" }, 502);
  }
  return jsonResponse({ ok: true, pages: result.result ?? [] }, 200);
}
