interface TurnstileVerifyResponse {
  success: boolean;
  [key: string]: unknown;
}

/** Verifiziert ein Cloudflare-Turnstile-Token gegen die siteverify-API. Solange
 *  TURNSTILE_SECRET_KEY noch ein Platzhalter ist (Turnstile im Frontend noch nicht eingerichtet),
 *  wird die Pruefung uebersprungen statt legitime Anfragen zu blockieren. */
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
