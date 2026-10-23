import { VISITOR_EVENTS_DATASET } from "../../analytics";
import { queryAnalyticsEngine } from "../../cf-api-client";
import { jsonResponse } from "../../lib/json";
import type { Env } from "../../types";

interface ScrollRow {
  path: string;
  avgScroll: number;
  gemessen: number;
}

interface ClickRow {
  path: string;
  target: string;
  clicks: number;
}

/** GET /admin/api/engagement
 *
 *  Bewusst getrennt von /pages: Jene Abfrage ist verifiziert und soll nicht mitfallen, wenn hier
 *  etwas schiefgeht. Scheitert eine der beiden Abfragen, kommt der andere Teil trotzdem durch.
 *
 *  double4 ist -1, wenn die Seite die Scrolltiefe nicht mitgeschickt hat (aeltere Fassung im
 *  Browser-Cache). Solche Zeilen zaehlen nicht in den Durchschnitt, darum sumIf/countIf statt
 *  avg, mit greatest(...) gegen eine Division durch null. */
export async function handleGetEngagement(env: Env): Promise<Response> {
  const scrollSql = `
    SELECT blob5 AS path,
           sumIf(double4, double4 >= 0) / greatest(countIf(double4 >= 0), 1) AS avgScroll,
           countIf(double4 >= 0) AS gemessen
    FROM ${VISITOR_EVENTS_DATASET}
    WHERE blob1 = 'visitor' AND blob5 != '' AND timestamp > NOW() - INTERVAL '30' DAY
    GROUP BY blob5
    ORDER BY gemessen DESC
    LIMIT 50
  `;

  const clickSql = `
    SELECT blob2 AS path, blob3 AS target, count() AS clicks
    FROM ${VISITOR_EVENTS_DATASET}
    WHERE blob1 = 'click' AND timestamp > NOW() - INTERVAL '30' DAY
    GROUP BY blob2, blob3
    ORDER BY clicks DESC
    LIMIT 50
  `;

  const [scroll, klicks] = await Promise.all([
    queryAnalyticsEngine<ScrollRow>(env, scrollSql),
    queryAnalyticsEngine<ClickRow>(env, clickSql),
  ]);

  return jsonResponse(
    {
      ok: true,
      scroll: scroll.ok ? (scroll.result ?? []) : [],
      scrollError: scroll.ok ? undefined : (scroll.errors?.join("; ") ?? "query-failed"),
      clicks: klicks.ok ? (klicks.result ?? []) : [],
      clicksError: klicks.ok ? undefined : (klicks.errors?.join("; ") ?? "query-failed"),
    },
    200,
  );
}
