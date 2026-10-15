import type { Env } from "../types";

const FENSTER_SEKUNDEN = 60 * 60;
const MAX_PRO_FENSTER = 5;

/** Schluessel aus der IP, aber als Hash. Die Drossel braucht die genaue Adresse, damit sie nicht
 *  ein ganzes Netz sperrt - gespeichert werden muss sie deswegen trotzdem nicht. */
async function schluesselFuer(ip: string): Promise<string> {
  const daten = new TextEncoder().encode(`contact:${ip}`);
  const hash = await crypto.subtle.digest("SHA-256", daten);
  const hex = [...new Uint8Array(hash)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `contact-rate:${hex}`;
}

/** Einfache Drossel je IP fuer das Kontaktformular.
 *
 *  Hintergrund: verifyTurnstile laesst ohne gesetztes Secret jede Anfrage durch (siehe dort).
 *  Solange Turnstile nicht auf beiden Seiten eingerichtet ist, war das Formular damit voellig
 *  ungeschuetzt. Diese Drossel greift unabhaengig davon. */
export async function zuVieleAnfragen(env: Env, ip: string): Promise<boolean> {
  if (!ip) return false;

  const schluessel = await schluesselFuer(ip);
  const bisher = Number((await env.ADMIN_STORE.get(schluessel)) ?? "0");
  if (bisher >= MAX_PRO_FENSTER) return true;

  // Kein put im gesperrten Fall: sonst wuerde die Frist bei jedem weiteren Versuch neu starten
  // und die Sperre liefe nie ab.
  await env.ADMIN_STORE.put(schluessel, String(bisher + 1), { expirationTtl: FENSTER_SEKUNDEN });
  return false;
}
