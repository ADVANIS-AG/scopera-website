import { apolloKonfiguriert, listeRueckmeldungen, vergissFeldZuordnung } from "../../apollo-client";
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
