import type { Env } from "../../types";

const MAX_PATH_LENGTH = 512;

/** Siehe handlers/heatmap.ts - dieselbe Erlaubnisliste, damit der Proxy nicht mehr erreicht als
 *  die Auswertung. */
function istErlaubterPfad(pfad: string): boolean {
  return pfad.length > 0 && pfad.length <= MAX_PATH_LENGTH && /^\/[A-Za-z0-9/_.-]*$/.test(pfad);
}

/** Erste Herkunft aus ALLOWED_ORIGIN, also die oeffentliche Webseite. */
function webseitenHerkunft(env: Env): string {
  return (env.ALLOWED_ORIGIN ?? "").split(",")[0].trim().replace(/\/+$/, "");
}

/** GET /admin/api/preview?path=/de/product/
 *
 *  Liefert eine Seite der oeffentlichen Webseite so aus, dass die Konsole sie einbetten und die
 *  Heatmap darueberlegen kann.
 *
 *  Warum ein Proxy und keine Screenshots: www.scopera.ai sendet X-Frame-Options: SAMEORIGIN,
 *  admin.scopera.ai darf die Seite also nicht direkt einbetten. Das abzuschwaechen waere der
 *  falsche Handel - der Klickjacking-Schutz der oeffentlichen Seite gegen eine interne
 *  Bequemlichkeit. Vorgerenderte Screenshots waeren die Alternative, aber sie veralten bei jedem
 *  Deploy still. Dieser Weg zeigt immer den aktuellen Stand.
 *
 *  Drei Eingriffe am Dokument, jeder mit Grund:
 *  1. Alle <script> entfernt. Sonst wuerde die Vorschau den eigenen Besucher-Beacon abschicken
 *     und die Heatmap mit den Aufrufen derjenigen fuellen, die sie gerade ansehen.
 *  2. CSP-Meta entfernt. Darin steht default-src 'self', und 'self' ist hier admin.scopera.ai -
 *     damit wuerden Stylesheets und Bilder von www.scopera.ai blockiert.
 *  3. <base> eingefuegt. Damit loesen auch absolute Pfade wie /_astro/x.css gegen
 *     www.scopera.ai auf, ohne dass im Dokument eine einzige URL umgeschrieben werden muss.
 *
 *  Der Endpunkt liegt unter /admin/api/, also hinter Cloudflare Access und hinter der
 *  JWT-Pruefung des Workers. Er ist kein oeffentlicher Spiegel der Webseite. */
export async function handleGetPreview(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pfad = url.searchParams.get("path") ?? "";
  if (!istErlaubterPfad(pfad)) {
    return new Response("invalid path", { status: 400 });
  }

  const herkunft = webseitenHerkunft(env);
  if (!herkunft) {
    return new Response("ALLOWED_ORIGIN nicht konfiguriert", { status: 500 });
  }

  const antwort = await fetch(`${herkunft}${pfad}`, {
    headers: { "User-Agent": "scopera-admin-preview" },
    redirect: "follow",
  });
  if (!antwort.ok) {
    return new Response(`Vorschau nicht abrufbar (${antwort.status})`, { status: 502 });
  }

  let html = await antwort.text();
  html = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "");
  html = html.replace(/<head(\s[^>]*)?>/i, (treffer) => `${treffer}<base href="${herkunft}/">`);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      // Eingebettet wird sie nur von admin.scopera.ai selbst, und das ist dieselbe Herkunft.
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
