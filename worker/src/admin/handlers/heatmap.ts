import { VISITOR_EVENTS_DATASET } from "../../analytics";
import { queryAnalyticsEngine } from "../../cf-api-client";
import { jsonResponse } from "../../lib/json";
import type { Env } from "../../types";

/** Muss mit BaseLayout.astro und handlers/beacon.ts uebereinstimmen. */
const SPALTEN = 20;
const ZEILEN = 50;
const ERLAUBTE_VIEWPORTS = ["mobil", "tablet", "desktop"];
const MAX_PATH_LENGTH = 512;

interface ZellenZeile {
  zelle: string;
  anzahl: number;
}

/** Laesst nur Pfade durch, die wie ein Pfad dieser Webseite aussehen.
 *
 *  Der Wert landet in einer SQL-Abfrage. Statt Anfuehrungszeichen zu maskieren wird hier
 *  abgewiesen, was nicht passt: Eine Erlaubnisliste kann man nicht halb richtig hinschreiben,
 *  eine Maskierung schon. Zugelassen sind Buchstaben, Zahlen, Schraegstrich, Bindestrich,
 *  Unterstrich und Punkt - kein Anfuehrungszeichen, kein Semikolon, kein Backslash. */
function istErlaubterPfad(pfad: string): boolean {
  return pfad.length > 0 && pfad.length <= MAX_PATH_LENGTH && /^\/[A-Za-z0-9/_.-]*$/.test(pfad);
}

/** GET /admin/api/heatmap?path=/de/product/&viewport=desktop
 *
 *  Liefert die Klickzahl je Rasterzelle. Die Oberflaeche legt das als Overlay ueber die Seite,
 *  siehe handlers/preview.ts fuer das Seitenabbild. */
export async function handleGetHeatmap(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pfad = url.searchParams.get("path") ?? "";
  const viewport = url.searchParams.get("viewport") ?? "desktop";

  if (!istErlaubterPfad(pfad)) {
    return jsonResponse({ ok: false, error: "invalid-path" }, 400);
  }
  if (!ERLAUBTE_VIEWPORTS.includes(viewport)) {
    return jsonResponse({ ok: false, error: "invalid-viewport" }, 400);
  }

  const sql = `
    SELECT blob4 AS zelle, sum(double1) AS anzahl
    FROM ${VISITOR_EVENTS_DATASET}
    WHERE blob1 = 'heat' AND blob2 = '${pfad}' AND blob3 = '${viewport}'
      AND blob4 != '' AND timestamp > NOW() - INTERVAL '30' DAY
    GROUP BY blob4
    ORDER BY anzahl DESC
    LIMIT ${SPALTEN * ZEILEN}
  `;

  const ergebnis = await queryAnalyticsEngine<ZellenZeile>(env, sql);
  if (!ergebnis.ok) {
    return jsonResponse({ ok: false, error: ergebnis.errors?.join("; ") ?? "query-failed" }, 200);
  }

  // "spalte:zeile" erst hier zerlegen. Kaputte Werte werden uebersprungen, nicht geraten.
  const zellen: Array<{ spalte: number; zeile: number; anzahl: number }> = [];
  let maximum = 0;
  for (const zeile of ergebnis.result ?? []) {
    const treffer = /^(\d{1,2}):(\d{1,2})$/.exec(zeile.zelle);
    if (!treffer) continue;
    const spalte = Number(treffer[1]);
    const r = Number(treffer[2]);
    if (spalte >= SPALTEN || r >= ZEILEN) continue;
    const anzahl = Number(zeile.anzahl) || 0;
    zellen.push({ spalte, zeile: r, anzahl });
    if (anzahl > maximum) maximum = anzahl;
  }

  return jsonResponse({ ok: true, spalten: SPALTEN, zeilen: ZEILEN, maximum, zellen }, 200);
}
