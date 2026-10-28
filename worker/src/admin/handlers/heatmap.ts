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

interface VerlaufRoh {
  zeit: string;
  art: string;
  pfad: string;
  b3: string;
  b4: string;
  b5: string;
  anzahl: number;
}

export interface VerlaufEintrag {
  zeit: string;
  pfad: string;
  viewport: string;
  ziele: string[];
  zellen: Array<{ spalte: number; zeile: number; anzahl: number }>;
}

const VERLAUF_MAX_AUFRUFE = 100;

/** GET /admin/api/heatmap/verlauf?path=/de/product/   (path optional)
 *
 *  Die letzten Seitenaufrufe mit Klicks, neueste zuerst: welche Seite, welches Geraet, welche Ziele
 *  angeklickt und an welchen Stellen. Der Browser schickt Klicks gesammelt beim Verlassen der Seite,
 *  der Zeitpunkt ist darum der eines Aufrufs, nicht der eines einzelnen Klicks.
 *
 *  Zusammengehalten wird ein Aufruf ueber die zufaellige Aufruf-Kennung (blob4 bei Klicks, blob5 bei
 *  Klickorten). Aeltere Daten ohne Kennung werden ueber Seite und Sekunde zusammengefasst. */
export async function handleGetHeatVerlauf(request: Request, env: Env): Promise<Response> {
  const pfad = new URL(request.url).searchParams.get("path") ?? "";
  if (pfad && !istErlaubterPfad(pfad)) {
    return jsonResponse({ ok: false, error: "invalid-path" }, 400);
  }

  const sql = `
    SELECT timestamp AS zeit, blob1 AS art, blob2 AS pfad, blob3 AS b3, blob4 AS b4, blob5 AS b5,
           double1 AS anzahl
    FROM ${VISITOR_EVENTS_DATASET}
    WHERE blob1 IN ('heat', 'click') ${pfad ? `AND blob2 = '${pfad}'` : ""}
      AND timestamp > NOW() - INTERVAL '30' DAY
    ORDER BY timestamp DESC
    LIMIT 2000
  `;
  const ergebnis = await queryAnalyticsEngine<VerlaufRoh>(env, sql);
  if (!ergebnis.ok) {
    return jsonResponse({ ok: false, error: ergebnis.errors?.join("; ") ?? "query-failed" }, 200);
  }

  const aufrufe = new Map<string, VerlaufEintrag>();
  for (const z of ergebnis.result ?? []) {
    const kennung = z.art === "click" ? z.b4 : z.b5;
    const schluessel = kennung || `${z.pfad}|${String(z.zeit).slice(0, 19)}`;
    let eintrag = aufrufe.get(schluessel);
    if (!eintrag) {
      if (aufrufe.size >= VERLAUF_MAX_AUFRUFE) continue;
      eintrag = { zeit: z.zeit, pfad: z.pfad, viewport: "", ziele: [], zellen: [] };
      aufrufe.set(schluessel, eintrag);
    }
    if (z.art === "click") {
      if (z.b3 && !eintrag.ziele.includes(z.b3)) eintrag.ziele.push(z.b3);
    } else {
      if (ERLAUBTE_VIEWPORTS.includes(z.b3)) eintrag.viewport = z.b3;
      const treffer = /^(\d{1,2}):(\d{1,2})$/.exec(z.b4);
      if (!treffer) continue;
      const spalte = Number(treffer[1]);
      const zeile = Number(treffer[2]);
      if (spalte >= SPALTEN || zeile >= ZEILEN) continue;
      eintrag.zellen.push({ spalte, zeile, anzahl: Number(z.anzahl) || 1 });
    }
  }

  return jsonResponse({ ok: true, spalten: SPALTEN, zeilen: ZEILEN, aufrufe: [...aufrufe.values()] }, 200);
}
