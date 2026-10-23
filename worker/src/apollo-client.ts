import type { Env, SessionState } from "./types";

const APOLLO_BASE = "https://api.apollo.io/api/v1";

/** Erlaubt, die Gegenstelle umzubiegen. Gedacht fuer Pruefungen gegen einen nachgebauten Apollo:
 *  Ohne das laesst sich dieser Pfad nur in Produktion ausprobieren, also genau dort, wo ein
 *  Fehler in fremde Firmenkonten schreibt. In Produktion ist die Variable nicht gesetzt. */
function basis(env: Env): string {
  return env.APOLLO_API_BASE && !env.APOLLO_API_BASE.startsWith("PLATZHALTER")
    ? env.APOLLO_API_BASE.replace(/\/+$/, "")
    : APOLLO_BASE;
}

/** Feldbeschriftungen, die in Apollo am Konto angelegt sein muessen. Gesucht wird ueber die
 *  Beschriftung, nicht ueber die ID: IDs muesste jemand von Hand abschreiben und bei jeder
 *  Neuanlage nachfuehren, Beschriftungen stehen in Apollo sichtbar vor Augen. */
const FELD_SCORE = "scopera score";
const FELD_LETZTER_BESUCH = "scopera letzter besuch";
const FELD_SEITEN = "scopera seiten";

const FELD_CACHE_SCHLUESSEL = "apollo:feldzuordnung";
const FELD_CACHE_TTL = 60 * 60 * 6;
/** Je Firma hoechstens eine Rueckmeldung pro Tag. Apollo erlaubt 600 Aufrufe je Stunde und
 *  Endpunkt; wichtiger ist aber, dass ein Besucher mit vielen Seitenaufrufen nicht dutzendfach
 *  dasselbe Konto beschreibt. */
const RUECKMELDUNG_TTL = 60 * 60 * 24;
const PROTOKOLL_SCHLUESSEL = "apollo:rueckmeldungen";
const PROTOKOLL_MAX = 50;

export interface RueckmeldungsProtokoll {
  firma: string;
  zeitpunkt: string;
  ergebnis: "ok" | "kein-konto" | "fehler" | "felder-fehlen";
  meldung?: string;
  score?: number;
}

export function apolloKonfiguriert(env: Env): boolean {
  return !!env.APOLLO_API_KEY && !env.APOLLO_API_KEY.startsWith("PLATZHALTER");
}

async function apolloAnfrage(env: Env, pfad: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${basis(env)}${pfad}`, {
    ...init,
    headers: {
      "x-api-key": env.APOLLO_API_KEY,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      ...(init.headers ?? {}),
    },
  });
}

interface FeldZuordnung {
  score?: string;
  letzterBesuch?: string;
  seiten?: string;
}

/** Sucht die IDs der drei Konto-Felder ueber ihre Beschriftung.
 *
 *  Zwei Feinheiten der Apollo-API, die hier Arbeit machen:
 *  1. /fields liefert IDs in der Form "account.<hash>", PATCH /accounts erwartet unter
 *     typed_custom_fields aber den blossen Hash. Das Praefix wird darum abgeschnitten.
 *  2. Dieselbe Beschriftung kann es am Kontakt und am Konto geben. Nur modality "account"
 *     zaehlt, sonst schreibt man ins Leere. */
async function ladeFeldZuordnung(env: Env): Promise<FeldZuordnung> {
  const gecacht = await env.ADMIN_STORE.get(FELD_CACHE_SCHLUESSEL);
  if (gecacht) {
    try {
      return JSON.parse(gecacht) as FeldZuordnung;
    } catch {
      // Kaputter Cache-Eintrag: neu laden statt daran scheitern.
    }
  }

  const res = await apolloAnfrage(env, "/fields?source=custom", { method: "GET" });
  if (!res.ok) throw new Error(`fields ${res.status}`);
  const daten = (await res.json()) as { fields?: Array<{ id?: string; label?: string; modality?: string }> };

  const zuordnung: FeldZuordnung = {};
  for (const feld of daten.fields ?? []) {
    if (feld.modality !== "account" || !feld.id || !feld.label) continue;
    const id = feld.id.replace(/^account\./, "");
    const beschriftung = feld.label.trim().toLowerCase();
    if (beschriftung === FELD_SCORE) zuordnung.score = id;
    else if (beschriftung === FELD_LETZTER_BESUCH) zuordnung.letzterBesuch = id;
    else if (beschriftung === FELD_SEITEN) zuordnung.seiten = id;
  }

  await env.ADMIN_STORE.put(FELD_CACHE_SCHLUESSEL, JSON.stringify(zuordnung), {
    expirationTtl: FELD_CACHE_TTL,
  });
  return zuordnung;
}

/** Sucht das Konto ueber den Firmennamen.
 *
 *  Die Apollo-Suche kennt keinen Filter auf die Domain, nur q_organization_name als
 *  Stichwortsuche. Darum wird das Ergebnis hier gegengeprueft: Nur ein Konto, dessen Name oder
 *  Domain wirklich passt, wird genommen. Ohne diese Pruefung wuerde "Meier AG" das erstbeste
 *  "Meier Holding" treffen und fremde Konten beschreiben. */
async function findeKontoId(env: Env, firma: string, domain?: string): Promise<string | null> {
  const res = await apolloAnfrage(env, "/accounts/search", {
    method: "POST",
    body: JSON.stringify({ q_organization_name: firma, per_page: 10 }),
  });
  if (!res.ok) throw new Error(`accounts/search ${res.status}`);
  const daten = (await res.json()) as { accounts?: Array<{ id?: string; name?: string; domain?: string }> };

  const gesuchterName = firma.trim().toLowerCase();
  const gesuchteDomain = (domain ?? "").trim().toLowerCase().replace(/^www\./, "");

  for (const konto of daten.accounts ?? []) {
    if (!konto.id) continue;
    const kontoDomain = (konto.domain ?? "").trim().toLowerCase().replace(/^www\./, "");
    if (gesuchteDomain && kontoDomain && kontoDomain === gesuchteDomain) return konto.id;
    if ((konto.name ?? "").trim().toLowerCase() === gesuchterName) return konto.id;
  }
  return null;
}

async function schreibeProtokoll(env: Env, eintrag: RueckmeldungsProtokoll): Promise<void> {
  try {
    const roh = await env.ADMIN_STORE.get(PROTOKOLL_SCHLUESSEL);
    const bisher = roh ? (JSON.parse(roh) as RueckmeldungsProtokoll[]) : [];
    const neu = [eintrag, ...bisher].slice(0, PROTOKOLL_MAX);
    await env.ADMIN_STORE.put(PROTOKOLL_SCHLUESSEL, JSON.stringify(neu));
  } catch (err) {
    console.warn("Apollo-Protokoll nicht schreibbar:", err instanceof Error ? err.message : err);
  }
}

/** Verwirft die zwischengespeicherte Feldzuordnung.
 *
 *  Ohne das wuerde eine in Apollo neu angelegte Feldgruppe bis zu sechs Stunden lang nicht
 *  erkannt, und die Konsole meldete weiter "Felder in Apollo fehlen", obwohl sie da sind. */
export async function vergissFeldZuordnung(env: Env): Promise<void> {
  await env.ADMIN_STORE.delete(FELD_CACHE_SCHLUESSEL);
}

export async function listeRueckmeldungen(env: Env): Promise<RueckmeldungsProtokoll[]> {
  const roh = await env.ADMIN_STORE.get(PROTOKOLL_SCHLUESSEL);
  if (!roh) return [];
  try {
    return JSON.parse(roh) as RueckmeldungsProtokoll[];
  } catch {
    return [];
  }
}

/** Meldet die Auswertung einer Sitzung an das Apollo-Konto der erkannten Firma zurueck.
 *
 *  Zurueck fliessen drei Angaben: Punktzahl, Zeitpunkt des letzten Besuchs und die besuchten
 *  Seiten. Bewusst nicht zurueck fliessen die IP-Adresse, die Sitzungs-ID und alles aus der
 *  Heatmap - das sind Daten ueber eine Person beziehungsweise ohne Firmenbezug, waehrend hier
 *  nur das Interesse einer Firma gemeldet wird.
 *
 *  Scheitert irgendetwas davon, bleibt es bei einem Protokolleintrag. Die Rueckmeldung darf den
 *  Seitenaufruf des Besuchers nie aufhalten und erst recht nicht die Lead-Erfassung gefaehrden. */
export async function sendeRueckmeldung(env: Env, session: SessionState): Promise<void> {
  if (!apolloKonfiguriert(env)) return;
  const firma = session.company?.name;
  if (!firma) return;

  const sperrschluessel = `apollo:gesendet:${firma.toLowerCase()}`;
  if (await env.ADMIN_STORE.get(sperrschluessel)) return;
  // Sperre vor dem Senden setzen: Scheitert der Aufruf, soll nicht bei jedem weiteren
  // Seitenaufruf erneut gegen Apollo gelaufen werden.
  await env.ADMIN_STORE.put(sperrschluessel, "1", { expirationTtl: RUECKMELDUNG_TTL });

  const zeitpunkt = new Date().toISOString();
  try {
    const felder = await ladeFeldZuordnung(env);
    if (!felder.score && !felder.letzterBesuch && !felder.seiten) {
      await schreibeProtokoll(env, {
        firma,
        zeitpunkt,
        ergebnis: "felder-fehlen",
        meldung: `Keines der Konto-Felder "${FELD_SCORE}", "${FELD_LETZTER_BESUCH}", "${FELD_SEITEN}" in Apollo gefunden`,
      });
      return;
    }

    const kontoId = await findeKontoId(env, firma, session.company?.domain);
    if (!kontoId) {
      await schreibeProtokoll(env, { firma, zeitpunkt, ergebnis: "kein-konto", score: session.score });
      return;
    }

    const seiten = [...new Set(session.pages.map((p) => p.path))].slice(0, 20).join(", ");
    const werte: Record<string, string> = {};
    if (felder.score) werte[felder.score] = String(session.score);
    if (felder.letzterBesuch) werte[felder.letzterBesuch] = zeitpunkt;
    if (felder.seiten) werte[felder.seiten] = seiten.slice(0, 500);

    const res = await apolloAnfrage(env, `/accounts/${kontoId}`, {
      method: "PATCH",
      body: JSON.stringify({ typed_custom_fields: werte }),
    });
    if (!res.ok) {
      const text = (await res.text()).slice(0, 200);
      await schreibeProtokoll(env, { firma, zeitpunkt, ergebnis: "fehler", meldung: `PATCH ${res.status}: ${text}`, score: session.score });
      return;
    }

    await schreibeProtokoll(env, { firma, zeitpunkt, ergebnis: "ok", score: session.score });
  } catch (err) {
    await schreibeProtokoll(env, {
      firma,
      zeitpunkt,
      ergebnis: "fehler",
      meldung: err instanceof Error ? err.message : String(err),
      score: session.score,
    });
  }
}
