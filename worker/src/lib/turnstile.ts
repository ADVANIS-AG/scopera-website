interface TurnstileVerifyResponse {
  success: boolean;
  [key: string]: unknown;
}

/** Verifiziert ein Cloudflare-Turnstile-Token gegen die siteverify-API.
 *
 *  Ohne gesetztes Secret wird die Pruefung uebersprungen, statt legitime Anfragen zu blockieren.
 *  Den Grundschutz uebernimmt dann die Drossel je IP (siehe lib/ratelimit.ts).
 *
 *  ACHTUNG, Konfigurationsfalle: Site-Key und Secret gehoeren zusammen. Ist nur das Secret
 *  gesetzt, schickt die Seite mangels TURNSTILE_SITE_KEY einen leeren Token und jede Absendung
 *  scheitert hier mit "spam-check-failed". Immer beide Seiten gleichzeitig einrichten. */
export async function verifyTurnstile(token: string, secret: string, remoteIp: string): Promise<boolean> {
  if (!secret || secret.startsWith("PLATZHALTER")) {
    console.warn("Turnstile nicht konfiguriert - Spam-Pruefung uebersprungen (Platzhalter aktiv)");
    return true;
  }
  if (!token) return false;

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: remoteIp }),
  });

  const data = await res.json<TurnstileVerifyResponse>();
  return data.success === true;
}
