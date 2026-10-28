import {
  apolloKonfiguriert, listeRueckmeldungen, pruefeVerbindung, sendeTestRueckmeldung, vergissFeldZuordnung,
} from "../../apollo-client";
import { jsonResponse } from "../../lib/json";
import type { Env } from "../../types";

/** GET /admin/api/apollo
 *
 *  Zeigt, ob die Rueckkopplung ueberhaupt aktiv ist und was zuletzt an Apollo ging. Ohne diese
 *  Ansicht waere ein abgelaufener Schluessel oder ein fehlendes Feld in Apollo nicht zu bemerken:
 *  Die Rueckmeldung laeuft im Hintergrund und darf nach aussen nichts kaputt machen, also
 *  schweigt sie auch, wenn sie scheitert. Hier wird sie laut. */
export async function handleGetApollo(env: Env): Promise<Response> {
  const aktiv = apolloKonfiguriert(env);
  if (!aktiv) {
    return jsonResponse(
      {
        ok: true,
        aktiv: false,
        hinweis: "APOLLO_API_KEY ist nicht gesetzt. Die Rueckkopplung ist damit abgeschaltet.",
        rueckmeldungen: [],
      },
      200,
    );
  }

  try {
    return jsonResponse({ ok: true, aktiv: true, rueckmeldungen: await listeRueckmeldungen(env) }, 200);
  } catch (err) {
    return jsonResponse({ ok: false, error: err instanceof Error ? err.message : "unbekannt" }, 200);
  }
}

/** POST /admin/api/apollo/felder-neu-laden
 *
 *  Nach dem Anlegen der Felder in Apollo zu druecken. Sonst greift die naechste Rueckmeldung
 *  noch bis zu sechs Stunden lang auf die alte, leere Zuordnung zu. */
export async function handleApolloFelderNeuLaden(env: Env): Promise<Response> {
  await vergissFeldZuordnung(env);
  return jsonResponse({ ok: true, hinweis: "Feldzuordnung verworfen, wird beim naechsten Mal neu geladen." }, 200);
}

/** POST /admin/api/apollo/pruefen
 *
 *  Tastet Apollo einmal ab und schreibt dabei nichts. Gedacht fuer den Moment, in dem der
 *  Schluessel gesetzt ist, die Felder aber noch nicht angelegt sind: Dann sagt die Antwort
 *  bereits, ob Schluessel und Rechte taugen, und spaeter, ob die Beschriftungen passen. */
export async function handleApolloPruefen(env: Env): Promise<Response> {
  try {
    return jsonResponse({ ok: true, pruefung: await pruefeVerbindung(env) }, 200);
  } catch (err) {
    return jsonResponse({ ok: false, error: err instanceof Error ? err.message : "unbekannt" }, 200);
  }
}

/** POST /admin/api/apollo/test  { firma, domain?, schreiben }
 *
 *  Simuliert eine Rueckmeldung, ohne auf einen echten Besuch zu warten. schreiben=false ist ein
 *  Probelauf ohne jede Aenderung in Apollo; schreiben=true schreibt Testwerte (Score 0) in das
 *  gefundene Konto und legt einen Protokolleintrag an. */
export async function handleApolloTest(request: Request, env: Env): Promise<Response> {
  if (!apolloKonfiguriert(env)) {
    return jsonResponse({ ok: false, error: "APOLLO_API_KEY ist nicht gesetzt" }, 200);
  }
  const body = (await request.json().catch(() => ({}))) as { firma?: unknown; domain?: unknown; schreiben?: unknown };
  const firma = typeof body.firma === "string" ? body.firma.trim().slice(0, 120) : "";
  const domain = typeof body.domain === "string" && body.domain.trim() ? body.domain.trim().slice(0, 120) : undefined;
  if (!firma) return jsonResponse({ ok: false, error: "Firmenname fehlt" }, 400);
  try {
    return jsonResponse({ ok: true, test: await sendeTestRueckmeldung(env, firma, domain, body.schreiben === true) }, 200);
  } catch (err) {
    return jsonResponse({ ok: false, error: err instanceof Error ? err.message : "unbekannt" }, 200);
  }
}
