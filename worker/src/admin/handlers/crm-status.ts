import { jsonResponse } from "../../lib/json";
import type { Env } from "../../types";

/** GET /admin/api/crm/status - einfacher Erreichbarkeits-Check der konfigurierten CRM-API. */
export async function handleCrmStatus(env: Env): Promise<Response> {
  if (!env.CRM_API_BASE_URL || env.CRM_API_BASE_URL.startsWith("PLATZHALTER")) {
    return jsonResponse({ ok: true, configured: false, reachable: false }, 200);
  }

  try {
    const res = await fetch(env.CRM_API_BASE_URL, { method: "HEAD" });
    return jsonResponse({ ok: true, configured: true, reachable: res.status < 500, httpStatus: res.status, checkedAt: Date.now() }, 200);
  } catch (err) {
    return jsonResponse(
      { ok: true, configured: true, reachable: false, error: err instanceof Error ? err.message : "unknown", checkedAt: Date.now() },
      200,
    );
  }
}
