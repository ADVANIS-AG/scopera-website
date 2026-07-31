import {
  createIpAccessRule,
  createRateLimitRule,
  deleteIpAccessRule,
  listIpAccessRules,
  listRateLimitRules,
} from "../../cf-api-client";
import { CORS_CONFIG_KEY } from "../../lib/cors";
import { jsonResponse } from "../../lib/json";
import type { CorsConfig, Env } from "../../types";

/** GET /admin/api/security/cors */
export async function handleGetCorsConfig(env: Env): Promise<Response> {
  const stored = await env.ADMIN_STORE.get<CorsConfig>(CORS_CONFIG_KEY, "json");
  const fallback = (env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
  return jsonResponse({ ok: true, allowedOrigins: stored?.allowedOrigins ?? fallback, isOverride: !!stored }, 200);
}

/** PUT /admin/api/security/cors  Body: { allowedOrigins: string[] } */
export async function handlePutCorsConfig(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid-json" }, 400);
  }
  const origins = (body as { allowedOrigins?: unknown }).allowedOrigins;
  if (!Array.isArray(origins) || !origins.every((o) => typeof o === "string" && o.startsWith("https://"))) {
    return jsonResponse({ ok: false, error: "allowedOrigins muss ein Array von https://-URLs sein" }, 400);
  }
  const config: CorsConfig = { allowedOrigins: origins };
  await env.ADMIN_STORE.put(CORS_CONFIG_KEY, JSON.stringify(config));
  return jsonResponse({ ok: true, allowedOrigins: config.allowedOrigins }, 200);
}

/** GET /admin/api/security/ip-rules */
export async function handleListIpRules(env: Env): Promise<Response> {
  const result = await listIpAccessRules(env);
  if (!result.ok) return jsonResponse({ ok: false, error: result.errors?.join("; ") }, 502);
  return jsonResponse({ ok: true, rules: result.result ?? [] }, 200);
}

/** POST /admin/api/security/ip-rules  Body: { ip: string, notes?: string } */
export async function handleCreateIpRule(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid-json" }, 400);
  }
  const { ip, notes } = body as { ip?: unknown; notes?: unknown };
  if (typeof ip !== "string" || ip.trim().length === 0) {
    return jsonResponse({ ok: false, error: "ip fehlt" }, 400);
  }
  const result = await createIpAccessRule(env, ip, typeof notes === "string" ? notes : "via Admin-Panel");
  if (!result.ok) return jsonResponse({ ok: false, error: result.errors?.join("; ") }, 502);
  return jsonResponse({ ok: true, rule: result.result }, 200);
}

/** DELETE /admin/api/security/ip-rules/:id */
export async function handleDeleteIpRule(env: Env, ruleId: string): Promise<Response> {
  const result = await deleteIpAccessRule(env, ruleId);
  if (!result.ok) return jsonResponse({ ok: false, error: result.errors?.join("; ") }, 502);
  return jsonResponse({ ok: true }, 200);
}

/** GET /admin/api/security/rate-limits */
export async function handleListRateLimits(env: Env): Promise<Response> {
  const result = await listRateLimitRules(env);
  if (!result.ok) {
    return jsonResponse(
      { ok: false, error: result.errors?.join("; "), hint: "Evtl. auf eurem Cloudflare-Plan nicht verfuegbar - siehe Plan 'Offene Abhaengigkeit'." },
      502,
    );
  }
  return jsonResponse({ ok: true, rules: result.result?.rules ?? [] }, 200);
}

/** POST /admin/api/security/rate-limits  Body: { description, expression, requestsPerPeriod, periodSeconds, mitigationTimeoutSeconds } */
export async function handleCreateRateLimit(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid-json" }, 400);
  }
  const b = body as Record<string, unknown>;
  if (
    typeof b.description !== "string" ||
    typeof b.expression !== "string" ||
    typeof b.requestsPerPeriod !== "number" ||
    typeof b.periodSeconds !== "number" ||
    typeof b.mitigationTimeoutSeconds !== "number"
  ) {
    return jsonResponse({ ok: false, error: "invalid-payload" }, 400);
  }
  const result = await createRateLimitRule(env, {
    description: b.description,
    expression: b.expression,
    requestsPerPeriod: b.requestsPerPeriod,
    periodSeconds: b.periodSeconds,
    mitigationTimeoutSeconds: b.mitigationTimeoutSeconds,
  });
  if (!result.ok) {
    return jsonResponse(
      { ok: false, error: result.errors?.join("; "), hint: "Evtl. auf eurem Cloudflare-Plan nicht verfuegbar - siehe Plan 'Offene Abhaengigkeit'." },
      502,
    );
  }
  return jsonResponse({ ok: true, rule: result.result }, 200);
}
