import type { CorsConfig, Env } from "../types";

export const CORS_CONFIG_KEY = "security-config:cors";

async function allowedOrigins(env: Env): Promise<string[]> {
  const stored = await env.ADMIN_STORE?.get<CorsConfig>(CORS_CONFIG_KEY, "json").catch(() => null);
  if (stored?.allowedOrigins?.length) return stored.allowedOrigins;

  return (env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function corsHeaders(request: Request, env: Env): Promise<HeadersInit> {
  const origin = request.headers.get("Origin");
  const allowed = await allowedOrigins(env);
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    // navigator.sendBeacon() attaches cookies for the target origin whenever present (e.g. a
    // Cloudflare Access session from admin.scopera.ai), regardless of caller intent - without
    // this header the browser rejects that credentialed response outright. Safe here: none of
    // the routes behind this helper (/beacon, /contact, /apollo-webhook) read cookies for auth.
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function handleOptions(request: Request, env: Env): Promise<Response> {
  return new Response(null, { status: 204, headers: await corsHeaders(request, env) });
}
