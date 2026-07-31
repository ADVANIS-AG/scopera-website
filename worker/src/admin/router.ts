import { unauthorizedResponse, verifyAccessIdentity } from "./auth";
import { handleCrmStatus } from "./handlers/crm-status";
import { handleGetFailedLeads, handleGetLeads, handleRetryFailedLead } from "./handlers/leads";
import {
  handleCreateIpRule,
  handleCreateRateLimit,
  handleDeleteIpRule,
  handleGetCorsConfig,
  handleListIpRules,
  handleListRateLimits,
  handlePutCorsConfig,
} from "./handlers/security";
import { handleGetVisitors } from "./handlers/visitors";
import { jsonResponse } from "../lib/json";
import type { Env } from "../types";

/** Alles unter /admin/api/* laeuft hier durch - siehe wrangler.toml `run_worker_first`, das
 *  sicherstellt, dass diese Pfade nie als statische Assets ausgeliefert werden. Cloudflare Access
 *  gate't die gesamte admin.scopera.ai-Hostname bereits am Edge (siehe Plan); die JWT-Pruefung
 *  hier ist Verteidigung in der Tiefe, siehe admin/auth.ts. */
export async function handleAdminApi(request: Request, env: Env): Promise<Response> {
  const identity = await verifyAccessIdentity(request, env);
  if (!identity) return unauthorizedResponse();

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/admin\/api/, "") || "/";
  const method = request.method;

  if (method === "GET" && path === "/visitors") return handleGetVisitors(env);

  if (method === "GET" && path === "/leads") return handleGetLeads(env);
  if (method === "GET" && path === "/leads/failed") return handleGetFailedLeads(env);
  const retryMatch = path.match(/^\/leads\/failed\/([^/]+)\/retry$/);
  if (method === "POST" && retryMatch) return handleRetryFailedLead(env, retryMatch[1]);

  if (method === "GET" && path === "/crm/status") return handleCrmStatus(env);

  if (method === "GET" && path === "/security/cors") return handleGetCorsConfig(env);
  if (method === "PUT" && path === "/security/cors") return handlePutCorsConfig(request, env);
  if (method === "GET" && path === "/security/ip-rules") return handleListIpRules(env);
  if (method === "POST" && path === "/security/ip-rules") return handleCreateIpRule(request, env);
  const ipRuleMatch = path.match(/^\/security\/ip-rules\/([^/]+)$/);
  if (method === "DELETE" && ipRuleMatch) return handleDeleteIpRule(env, ipRuleMatch[1]);
  if (method === "GET" && path === "/security/rate-limits") return handleListRateLimits(env);
  if (method === "POST" && path === "/security/rate-limits") return handleCreateRateLimit(request, env);

  return jsonResponse({ ok: false, error: "not-found" }, 404);
}
