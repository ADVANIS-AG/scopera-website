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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function handleOptions(request: Request, env: Env): Promise<Response> {
  return new Response(null, { status: 204, headers: await corsHeaders(request, env) });
}
