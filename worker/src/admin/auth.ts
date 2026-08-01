import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AccessIdentity, Env } from "../types";

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedTeamDomain: string | null = null;

function getJwks(teamDomain: string) {
  if (!cachedJwks || cachedTeamDomain !== teamDomain) {
    cachedJwks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    cachedTeamDomain = teamDomain;
  }
  return cachedJwks;
}

/** Verifiziert das von Cloudflare Access gesetzte JWT (Verteidigung in der Tiefe - Access selbst
 *  gate't die Route bereits am Edge, siehe Plan). Anders als die uebrigen PLATZHALTER-Guards im
 *  Projekt gilt hier: fehlt die Konfiguration oder schlaegt die Pruefung fehl, wird der Zugriff
 *  verweigert (fail-closed), nicht uebersprungen - das ist die eigentliche Sicherheitsgrenze. */
export async function verifyAccessIdentity(request: Request, env: Env): Promise<AccessIdentity | null> {
  // Nur fuer lokale Entwicklung: DEV_BYPASS_ADMIN_AUTH kann ausschliesslich ueber `.dev.vars`
  // gesetzt werden (siehe .dev.vars.example), eine Datei, die laut .gitignore nie committet wird
  // und die `wrangler deploy` nachweislich nicht liest (nur `wrangler dev`) - kann also nicht
  // versehentlich in Produktion landen. Laut ausgeben, damit es im Log nie unbemerkt bleibt.
  if (env.DEV_BYPASS_ADMIN_AUTH === "true") {
    console.warn("DEV_BYPASS_ADMIN_AUTH aktiv - Access-Pruefung uebersprungen (nur lokal moeglich)");
    return { email: "dev-bypass@localhost" };
  }

  if (!env.CF_ACCESS_TEAM_DOMAIN || env.CF_ACCESS_TEAM_DOMAIN.startsWith("PLATZHALTER")) {
    console.warn("CF_ACCESS_TEAM_DOMAIN nicht konfiguriert - Admin-Bereich bleibt gesperrt");
    return null;
  }
  if (!env.CF_ACCESS_AUD || env.CF_ACCESS_AUD.startsWith("PLATZHALTER")) {
    console.warn("CF_ACCESS_AUD nicht konfiguriert - Admin-Bereich bleibt gesperrt");
    return null;
  }

  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwks(env.CF_ACCESS_TEAM_DOMAIN), {
      issuer: `https://${env.CF_ACCESS_TEAM_DOMAIN}`,
      audience: env.CF_ACCESS_AUD,
    });
    if (typeof payload.email !== "string") return null;
    return { email: payload.email };
  } catch (err) {
    console.warn("Access-JWT-Verifikation fehlgeschlagen:", err instanceof Error ? err.message : err);
    return null;
  }
}

export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
