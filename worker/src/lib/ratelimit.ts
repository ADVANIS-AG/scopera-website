import type { Env } from "../types";

const FENSTER_SEKUNDEN = 60 * 60;
/** Standard fuer das Kontaktformular. Aufrufer mit anderem Bedarf geben ihr Maximum mit. */
const MAX_PRO_FENSTER = 5;

/** Schluessel aus Zweck und IP, aber als Hash. Die Drossel braucht die genaue Adresse, damit sie
 *  nicht ein ganzes Netz sperrt - gespeichert werden muss sie deswegen trotzdem nicht. */
async function schluesselFuer(kennung: string): Promise<string> {
  const daten = new TextEncoder().encode(kennung);
  const hash = await crypto.subtle.digest("SHA-256", daten);
  const hex = [...new Uint8Array(hash)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `rate:${hex}`;
}

/** Einfache Drossel je Zweck und IP.
 *
 *  Hintergrund Kontaktformular: verifyTurnstile laesst ohne gesetztes Secret jede Anfrage durch
 *  (siehe dort). Solange Turnstile nicht auf beiden Seiten eingerichtet ist, war das Formular
 *  damit voellig ungeschuetzt. Diese Drossel greift unabhaengig davon.
 *
 *  Hintergrund Apollo-Webhook: dort ist das Secret in Produktion nicht gesetzt, der Endpunkt
 *  nimmt also jede Anfrage an. Die Drossel begrenzt, was ein Fremder damit anrichten kann.
 *
 *  `zweck` haelt die Zaehler der Aufrufer auseinander, damit sie sich nicht gegenseitig
 *  verbrauchen. Ohne bekannte IP wird nicht gedrosselt: ein leerer Wert wuerde alle Aufrufer in
 *  einen gemeinsamen Zaehler werfen und sie gegenseitig aussperren. */
export async function zuVieleAnfragen(env: Env, zweck: string, ip: string, max = MAX_PRO_FENSTER): Promise<boolean> {
  if (!ip) return false;

  const schluessel = await schluesselFuer(`${zweck}:${ip}`);
  const bisher = Number((await env.ADMIN_STORE.get(schluessel)) ?? "0");
  if (bisher >= max) return true;

  // Kein put im gesperrten Fall: sonst wuerde die Frist bei jedem weiteren Versuch neu starten
  // und die Sperre liefe nie ab.
  await env.ADMIN_STORE.put(schluessel, String(bisher + 1), { expirationTtl: FENSTER_SEKUNDEN });
  return false;
}
