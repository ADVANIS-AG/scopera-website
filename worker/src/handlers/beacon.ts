import { recordPageview } from "../session-store";
import type { BeaconPayload, Env } from "../types";

const MAX_PATH_LENGTH = 512;
const MAX_CLICKS = 20;
const MAX_CLICK_LENGTH = 64;
const MAX_DURATION_MS = 30 * 60 * 1000; // Kappen gegen manipulierte/kaputte Werte
const MAX_HEAT = 30;
const HEAT_SPALTEN = 20;
const HEAT_ZEILEN = 50;
const ERLAUBTE_VIEWPORTS = ["mobil", "tablet", "desktop"];

function isValidPayload(body: unknown): body is BeaconPayload {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.sessionId === "string" &&
    b.sessionId.length > 0 &&
    b.sessionId.length <= 128 &&
    typeof b.path === "string" &&
    b.path.length > 0 &&
    b.path.length <= MAX_PATH_LENGTH &&
    typeof b.durationMs === "number" &&
    b.durationMs >= 0 &&
    // Beides optional: aeltere Seiten im Cache senden sie noch nicht mit.
    (b.scrollDepth === undefined || (typeof b.scrollDepth === "number" && b.scrollDepth >= 0 && b.scrollDepth <= 100)) &&
    (b.clicks === undefined || (Array.isArray(b.clicks) && b.clicks.every((c) => typeof c === "string"))) &&
    (b.viewport === undefined || typeof b.viewport === "string") &&
    (b.heat === undefined || (Array.isArray(b.heat) && b.heat.every((h) => typeof h === "string")))
  );
}

/** Nimmt nur Zellennummern innerhalb des Rasters an.
 *
 *  Die Pruefung ist streng, weil der Wert aus dem Browser kommt und ungeprueft in eine
 *  GROUP-BY-Abfrage wandert: Alles, was nicht genau "zahl:zahl" im erlaubten Bereich ist, wird
 *  verworfen statt zurechtgebogen. Doppelte Zellen bleiben erhalten, sie sind die Intensitaet. */
function bereinigeHeat(heat: string[] | undefined): Array<{ spalte: number; zeile: number }> {
  if (!heat) return [];
  const raus: Array<{ spalte: number; zeile: number }> = [];
  for (const eintrag of heat.slice(0, MAX_HEAT)) {
    const treffer = /^(\d{1,2}):(\d{1,2})$/.exec(eintrag);
    if (!treffer) continue;
    const spalte = Number(treffer[1]);
    const zeile = Number(treffer[2]);
    if (spalte >= HEAT_SPALTEN || zeile >= HEAT_ZEILEN) continue;
    raus.push({ spalte, zeile });
  }
  return raus;
}

/** Unbekannte Fensterklassen werden verworfen, nicht geraten - sonst stehen in der Auswertung
 *  Klassen, die es im Layout nicht gibt. */
function bereinigeViewport(viewport: string | undefined): string {
  return viewport && ERLAUBTE_VIEWPORTS.includes(viewport) ? viewport : "";
}

/** Kappt Anzahl und Laenge, damit ein manipulierter Aufruf die Auswertung nicht flutet. */
function bereinigeKlicks(clicks: string[] | undefined): string[] {
  if (!clicks) return [];
  return clicks
    .map((c) => c.trim().slice(0, MAX_CLICK_LENGTH))
    .filter((c) => c.length > 0)
    .slice(0, MAX_CLICKS);
}

export async function handleBeacon(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  if (!isValidPayload(body)) {
    return new Response("invalid payload", { status: 400 });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const durationMs = Math.min(body.durationMs, MAX_DURATION_MS);

  const scrollDepth = typeof body.scrollDepth === "number" ? Math.round(body.scrollDepth) : undefined;
  await recordPageview(
    env,
    ip,
    body.sessionId,
    { path: body.path, durationMs, scrollDepth },
    bereinigeKlicks(body.clicks),
    bereinigeViewport(body.viewport),
    bereinigeHeat(body.heat),
  );

  return new Response(null, { status: 204 });
}
