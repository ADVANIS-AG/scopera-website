import { tagCompanyForIp } from "../session-store";
import type { Env } from "../types";

/** PLATZHALTER-HANDLER: Feldnamen und Auth-Mechanismus sind Annahmen, bis die echte
 *  Apollo-Webhook-/API-Dokumentation vorliegt (siehe offene Punkte im Plan). Bekannt ist bisher nur:
 *  der Webhook liefert den Firmennamen, aber (Stand jetzt) keine besuchten Seiten. Ob eine IP-Adresse
 *  oder ein Zeitstempel mitgeliefert wird, mit dem sich die Identifikation zuverlaessig einer Session
 *  zuordnen laesst, ist noch offen - ohne IP im Payload bleibt eine Identifikation unverknuepft
 *  (siehe session-store.tagCompanyForIp). */
export async function handleApolloWebhook(request: Request, env: Env): Promise<Response> {
  const providedSecret = request.headers.get("x-webhook-secret");
  if (!env.APOLLO_WEBHOOK_SECRET || env.APOLLO_WEBHOOK_SECRET.startsWith("PLATZHALTER")) {
    console.warn("APOLLO_WEBHOOK_SECRET nicht konfiguriert - Authentizitaetspruefung uebersprungen");
  } else if (providedSecret !== env.APOLLO_WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  // PLATZHALTER: an das echte Apollo-Payload-Schema anpassen, sobald bekannt.
  const companyName = (body.company_name ?? body.companyName ?? body.name) as string | undefined;
  const domain = (body.company_domain ?? body.domain) as string | undefined;
  const ip = (body.ip ?? body.visitor_ip) as string | undefined;

  if (!companyName) {
    return new Response("missing company name in payload", { status: 400 });
  }

  if (!ip) {
    console.warn(`Apollo-Ereignis fuer "${companyName}" ohne IP-Adresse im Payload - keine Verknuepfung moeglich`);
    return new Response("accepted, unlinked (no ip in payload)", { status: 202 });
  }

  const session = await tagCompanyForIp(env, ip, { name: companyName, domain, source: "apollo" });

  return new Response(session ? "linked" : "accepted, unlinked (no matching session)", {
    status: 200,
  });
}
