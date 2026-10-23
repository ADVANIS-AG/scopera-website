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
 *  Browser-Cache). Solche Zeilen gehoeren nicht in den Durchschnitt und werden im WHERE
 *  aussortiert, nicht in der Aggregation.
 *
 *  Warum im WHERE: Der erste Versuch rechnete sumIf/countIf mit greatest(...) gegen eine
 *  Division durch null. Analytics Engine kennt greatest nicht und antwortet mit
 *  "unknown function call: GREATEST" (HTTP 422). Der Filter im WHERE braucht ueberhaupt keine
 *  Bedingungsfunktion, und damit kommen hier nur noch Funktionen vor, die sich im bereits
 *  laufenden /pages-Endpunkt bewiesen haben: count(), avg(), GROUP BY, ORDER BY, LIMIT.
 *  Seiten ohne eine einzige Messung fallen dadurch aus der Liste, was fuer eine Ansicht
 *  "wie weit wird gelesen" richtig ist. */
export async function handleGetEngagement(env: Env): Promise<Response> {
  const scrollSql = `
    SELECT blob5 AS path,
           avg(double4) AS avgScroll,
           count() AS gemessen
    FROM ${VISITOR_EVENTS_DATASET}
    WHERE blob1 = 'visitor' AND blob5 != '' AND double4 >= 0
      AND timestamp > NOW() - INTERVAL '30' DAY
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
