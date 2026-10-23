import { tagCompanyForIp } from "../session-store";
import { zuVieleAnfragen } from "../lib/ratelimit";
import type { Env } from "../types";

/** Grosszuegig: Apollo soll nie anstehen, aber ein Fremder nicht beliebig oft anklopfen. */
const MAX_PRO_STUNDE = 60;
/** Gekappte Fassung des Payloads fuer das Protokoll, damit ein Riesen-Body das Log nicht flutet. */
const MAX_LOG_LAENGE = 2000;

/** Zeitkonstanter Vergleich: ein `===` auf Zeichenketten bricht beim ersten Unterschied ab und
 *  verraet damit ueber die Laufzeit, wie viele Zeichen stimmten. */
function gleichLang(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Nimmt Apollo-Firmenerkennungen entgegen.
 *
 *  Zum Stand der Dinge, damit die Entscheidungen hier nachvollziehbar sind:
 *  - APOLLO_WEBHOOK_SECRET ist in Produktion **nicht** gesetzt. Deshalb wird nicht hart
 *    abgewiesen, sondern unauthentifiziert weitergearbeitet. Sobald das Secret gesetzt ist,
 *    schaltet dieser Endpunkt von selbst auf strikt um, ohne Codeaenderung.
 *  - Unauthentifizierte Aufrufe duerfen die Session markieren (lebt 30 Minuten, selbstbegrenzt),
 *    aber **keinen Lead anlegen**. Lead-Eintraege liegen ein Jahr und sind der Posteingang -
 *    wer die Adresse kennt, koennte ihn sonst zumuellen.
 *  - Die erwarteten Feldnamen sind weiterhin geraten. Darum wird der vollstaendige Payload
 *    protokolliert: Beim naechsten echten Apollo-Aufruf ist im Worker-Log zu sehen, wie er
 *    tatsaechlich aussieht, und die Zuordnung unten laesst sich darauf festziehen. */
export async function handleApolloWebhook(request: Request, env: Env): Promise<Response> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  if (await zuVieleAnfragen(env, "apollo", ip, MAX_PRO_STUNDE)) {
    return new Response("too many requests", { status: 429 });
  }

  const secretGesetzt = !!env.APOLLO_WEBHOOK_SECRET && !env.APOLLO_WEBHOOK_SECRET.startsWith("PLATZHALTER");
  let authentifiziert = false;

  if (secretGesetzt) {
    const geliefert = request.headers.get("x-webhook-secret") ?? "";
    if (!gleichLang(geliefert, env.APOLLO_WEBHOOK_SECRET)) {
      return new Response("unauthorized", { status: 401 });
    }
    authentifiziert = true;
  } else {
    console.warn("APOLLO_WEBHOOK_SECRET nicht gesetzt - Aufruf wird angenommen, aber kein Lead erzeugt");
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  // Vollstaendig protokollieren, solange das echte Schema unbekannt ist.
  console.info("Apollo-Payload:", JSON.stringify(body).slice(0, MAX_LOG_LAENGE));

  // PLATZHALTER: an das echte Apollo-Schema anpassen, sobald das Log es zeigt.
  const companyName = (body.company_name ?? body.companyName ?? body.name) as string | undefined;
  const domain = (body.company_domain ?? body.domain) as string | undefined;
  const ipImPayload = (body.ip ?? body.visitor_ip) as string | undefined;

  if (!companyName) {
    console.warn("Apollo-Aufruf ohne erkennbaren Firmennamen - Feldnamen pruefen, siehe Payload oben");
    return new Response("missing company name in payload", { status: 400 });
  }

  if (!ipImPayload) {
    console.warn(`Apollo-Ereignis fuer "${companyName}" ohne IP-Adresse im Payload - keine Verknuepfung moeglich`);
    return new Response("accepted, unlinked (no ip in payload)", { status: 202 });
  }

  const session = await tagCompanyForIp(env, ipImPayload, { name: companyName, domain, source: "apollo" }, authentifiziert);

  if (!session) return new Response("accepted, unlinked (no matching session)", { status: 200 });
  return new Response(authentifiziert ? "linked" : "linked, unverified (no secret configured)", { status: 200 });
}
