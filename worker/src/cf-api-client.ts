import type { Env } from "./types";

// Duenner Wrapper um Cloudflares eigene Zone-APIs (IP Access Rules, Rate Limiting) - siehe Plan:
// "nicht selbst nachbauen, was es schon gibt". Nutzt CF_API_TOKEN/CF_ZONE_ID.

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

export interface CfApiResult<T> {
  ok: boolean;
  result?: T;
  errors?: string[];
}

function isConfigured(env: Env): boolean {
  return (
    !!env.CF_API_TOKEN &&
    !env.CF_API_TOKEN.startsWith("PLATZHALTER") &&
    !!env.CF_ZONE_ID &&
    !env.CF_ZONE_ID.startsWith("PLATZHALTER")
  );
}

async function cfFetch<T>(env: Env, path: string, init?: RequestInit): Promise<CfApiResult<T>> {
  if (!isConfigured(env)) {
    return { ok: false, errors: ["cf-api-not-configured (CF_API_TOKEN/CF_ZONE_ID fehlen)"] };
  }
  const res = await fetch(`${CF_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.CF_API_TOKEN}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = await res.json<{ success: boolean; result?: T; errors?: { message: string }[] }>();
  if (!data.success) {
    return { ok: false, errors: data.errors?.map((e) => e.message) ?? [`http-${res.status}`] };
  }
  return { ok: true, result: data.result };
}

export interface IpAccessRule {
  id: string;
  mode: "block" | "challenge" | "whitelist" | "js_challenge";
  notes?: string;
  configuration: { target: string; value: string };
}

export function listIpAccessRules(env: Env): Promise<CfApiResult<IpAccessRule[]>> {
  return cfFetch<IpAccessRule[]>(env, `/zones/${env.CF_ZONE_ID}/firewall/access_rules/rules?per_page=100`);
}

export function createIpAccessRule(env: Env, ip: string, notes: string): Promise<CfApiResult<IpAccessRule>> {
  return cfFetch<IpAccessRule>(env, `/zones/${env.CF_ZONE_ID}/firewall/access_rules/rules`, {
    method: "POST",
    body: JSON.stringify({ mode: "block", configuration: { target: "ip", value: ip }, notes }),
  });
}

export function deleteIpAccessRule(env: Env, ruleId: string): Promise<CfApiResult<{ id: string }>> {
  return cfFetch<{ id: string }>(env, `/zones/${env.CF_ZONE_ID}/firewall/access_rules/rules/${ruleId}`, {
    method: "DELETE",
  });
}

export interface RateLimitRule {
  id: string;
  description: string;
  expression: string;
  ratelimit: {
    characteristics: string[];
    period: number;
    requests_per_period: number;
    mitigation_timeout: number;
  };
}

// Cloudflare legt den Phase-Entrypoint fuer http_ratelimit erst beim ersten PUT an - solange
// noch nie eine Regel fuer die Zone angelegt wurde, antwortet GET auf den Entrypoint mit exakt
// dieser Fehlermeldung. Das ist ein normaler Zustand (0 Regeln), kein Fehler.
const NO_ENTRYPOINT_MARKER = "could not find entrypoint ruleset";

function isMissingEntrypoint(errors?: string[]): boolean {
  return !!errors?.some((e) => e.includes(NO_ENTRYPOINT_MARKER));
}

/** Best-effort: legt eine Zone-Rate-Limiting-Regel im http_ratelimit-Einstiegspunkt an. Erfordert
 *  laut Cloudflare-Doku mindestens Pro-Plan (nicht abschliessend dokumentiert) - schlaegt die
 *  Zone auf Free-Plan fehl, kommt Cloudflares Fehlermeldung 1:1 im Ergebnis durch, siehe Plan
 *  "Offene Abhaengigkeit" / Fallback (einfaches KV-Rate-Limiting) fuer diesen Fall. */
export async function createRateLimitRule(
  env: Env,
  options: { description: string; expression: string; requestsPerPeriod: number; periodSeconds: number; mitigationTimeoutSeconds: number },
): Promise<CfApiResult<RateLimitRule>> {
  const rule = {
    description: options.description,
    expression: options.expression,
    action: "block",
    ratelimit: {
      characteristics: ["ip.src"],
      period: options.periodSeconds,
      requests_per_period: options.requestsPerPeriod,
      mitigation_timeout: options.mitigationTimeoutSeconds,
    },
  };

  const entrypoint = await cfFetch<{ id: string; rules: RateLimitRule[] }>(
    env,
    `/zones/${env.CF_ZONE_ID}/rulesets/phases/http_ratelimit/entrypoint`,
  );

  if (entrypoint.ok && entrypoint.result) {
    return cfFetch<RateLimitRule>(env, `/zones/${env.CF_ZONE_ID}/rulesets/${entrypoint.result.id}/rules`, {
      method: "POST",
      body: JSON.stringify(rule),
    });
  }
  if (!isMissingEntrypoint(entrypoint.errors)) {
    return { ok: false, errors: entrypoint.errors };
  }

  // Erste Rate-Limit-Regel ueberhaupt fuer diese Zone: Entrypoint per PUT inkl. dieser Regel anlegen.
  const created = await cfFetch<{ id: string; rules: RateLimitRule[] }>(
    env,
    `/zones/${env.CF_ZONE_ID}/rulesets/phases/http_ratelimit/entrypoint`,
    { method: "PUT", body: JSON.stringify({ rules: [rule] }) },
  );
  if (!created.ok || !created.result) return { ok: false, errors: created.errors };
  return { ok: true, result: created.result.rules[created.result.rules.length - 1] };
}

export async function listRateLimitRules(env: Env): Promise<CfApiResult<{ id: string; rules: RateLimitRule[] }>> {
  const result = await cfFetch<{ id: string; rules: RateLimitRule[] }>(
    env,
    `/zones/${env.CF_ZONE_ID}/rulesets/phases/http_ratelimit/entrypoint`,
  );
  if (!result.ok && isMissingEntrypoint(result.errors)) {
    return { ok: true, result: { id: "", rules: [] } };
  }
  return result;
}

/** Fragt Workers Analytics Engine per SQL-API ab (Konto-Ebene, nicht Zone-Ebene - eigener Pfad). */
export async function queryAnalyticsEngine<T>(env: Env, sql: string): Promise<CfApiResult<T[]>> {
  if (!env.CF_API_TOKEN || env.CF_API_TOKEN.startsWith("PLATZHALTER") || !env.CF_ACCOUNT_ID || env.CF_ACCOUNT_ID.startsWith("PLATZHALTER")) {
    return { ok: false, errors: ["cf-api-not-configured (CF_API_TOKEN/CF_ACCOUNT_ID fehlen)"] };
  }
  const res = await fetch(`${CF_API_BASE}/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, "Content-Type": "text/plain" },
    body: sql,
  });
  if (!res.ok) {
    return { ok: false, errors: [`analytics-engine-sql-http-${res.status}`, await res.text()] };
  }
  const data = await res.json<{ data: T[] }>();
  return { ok: true, result: data.data };
}
