import { jsonResponse } from "../lib/json";
import { zuVieleAnfragen } from "../lib/ratelimit";
import { verifyTurnstile } from "../lib/turnstile";
import type { Env, WunschRecord } from "../types";

/** Weihnachtsaktion «Wünsch dir was. Für 2027.» (Seiten /de/wunsch/ und /en/wunsch/).
 *
 *  Die Wunschzettel landen in ADMIN_STORE und erscheinen in der Admin-Konsole im Reiter
 *  «Wünsche». Bewusst nicht ueber createLead: Der Zettel ist mehr als eine Kontaktanfrage, und
 *  die Frist steht in den Teilnahmebedingungen (Loeschung spaetestens Ende 2027). */

export const WUNSCH_PREFIX = "wunsch:";

/** Teilnahmeschluss laut Teilnahmebedingungen: 31.01.2027, 23:59 Uhr Schweizer Zeit. */
const TEILNAHMESCHLUSS_MS = Date.UTC(2027, 0, 15, 22, 59, 59);
/** KV loescht die Eintraege von selbst am 01.01.2028, 00:00 UTC. */
const LOESCHUNG_SEKUNDEN = Date.UTC(2028, 0, 1) / 1000;
/** Etwas grosszuegiger als beim Kontaktformular: Wer einen zweiten Wunsch aufschreibt, soll nicht
 *  gleich an die Drossel stossen. Grundschutz bleibt trotzdem. */
const MAX_PRO_STUNDE = 8;

const HAEUFIGKEIT = ["taeglich", "woechentlich", "monatlich", "seltener"] as const;
const DAUER = ["minuten", "halbestunde", "stunde", "stunden"] as const;

const MAX = {
  name: 120,
  firma: 160,
  email: 200,
  wunsch: 600,
  titel: 140,
  heute: 800,
  morgen: 600,
  zeitgewinn: 120,
  bemerkung: 600,
} as const;

function text(wert: unknown, max: number): string | null {
  if (wert === undefined || wert === null) return "";
  if (typeof wert !== "string") return null;
  const t = wert.trim();
  return t.length > max ? null : t;
}

function auswahl<T extends readonly string[]>(wert: unknown, erlaubt: T): T[number] | "" | null {
  if (wert === undefined || wert === null || wert === "") return "";
  return typeof wert === "string" && (erlaubt as readonly string[]).includes(wert) ? (wert as T[number]) : null;
}

export async function handleWunsch(request: Request, env: Env): Promise<Response> {
  if (Date.now() > TEILNAHMESCHLUSS_MS) {
    return jsonResponse({ ok: false, error: "closed" }, 410);
  }

  let body: Record<string, unknown>;
  try {
    const roh = await request.json();
    if (typeof roh !== "object" || roh === null) throw new Error("kein Objekt");
    body = roh as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: "invalid-json" }, 400);
  }

  // Honigtopf: ein fuer Menschen unsichtbares Feld. Ist es gefuellt, war es ein Programm. Die
  // Antwort sieht trotzdem nach Erfolg aus, damit niemand daran herumprobiert.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return jsonResponse({ ok: true }, 200);
  }

  const felder = {
    name: text(body.name, MAX.name),
    firma: text(body.firma, MAX.firma),
    email: text(body.email, MAX.email),
    wunsch: text(body.wunsch, MAX.wunsch),
    titel: text(body.titel, MAX.titel),
    heute: text(body.heute, MAX.heute),
    morgen: text(body.morgen, MAX.morgen),
    zeitgewinn: text(body.zeitgewinn, MAX.zeitgewinn),
    bemerkung: text(body.bemerkung, MAX.bemerkung),
  };
  const haeufigkeit = auswahl(body.haeufigkeit, HAEUFIGKEIT);
  const dauer = auswahl(body.dauer, DAUER);
  const sprache = body.lang === "en" ? "en" : "de";
  const quelle = body.quelle === "karte" ? "karte" : "box";

  if (Object.values(felder).some((v) => v === null) || haeufigkeit === null || dauer === null) {
    return jsonResponse({ ok: false, error: "invalid-payload" }, 400);
  }
  const f = felder as Record<keyof typeof felder, string>;
  if (
    !f.name ||
    !f.firma ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email) ||
    f.wunsch.length < 20 ||
    body.zustimmung !== true
  ) {
    return jsonResponse({ ok: false, error: "invalid-payload" }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  if (await zuVieleAnfragen(env, "wunsch", ip, MAX_PRO_STUNDE)) {
    return jsonResponse({ ok: false, error: "too-many-requests" }, 429);
  }

  const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
  if (!(await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip))) {
    return jsonResponse({ ok: false, error: "spam-check-failed" }, 400);
  }

  const jetzt = Date.now();
  const record: WunschRecord = {
    id: crypto.randomUUID(),
    createdAt: jetzt,
    lang: sprache,
    quelle,
    name: f.name,
    firma: f.firma,
    email: f.email,
    bemerkung: f.bemerkung,
    zettel: {
      wunsch: f.wunsch,
      haeufigkeit,
      dauer,
      titel: f.titel,
      heute: f.heute,
      morgen: f.morgen,
      zeitgewinn: f.zeitgewinn,
    },
    // Nachweis der Zustimmung zu den Teilnahmebedingungen: Zeitpunkt und Sprachfassung.
    zustimmung: { am: jetzt, fassung: `teilnahme-2027-${sprache}` },
  };

  await env.ADMIN_STORE.put(`${WUNSCH_PREFIX}${record.id}`, JSON.stringify(record), {
    expiration: LOESCHUNG_SEKUNDEN,
  });

  return jsonResponse({ ok: true, id: record.id }, 200);
}
