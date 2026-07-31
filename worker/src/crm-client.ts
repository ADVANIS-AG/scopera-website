import { recordLeadEvent } from "./analytics";
import type { CrmLeadPayload, CrmLeadResult, CrmLookupQuery, CrmLookupResult, Env, FailedLeadRecord } from "./types";

// PLATZHALTER-MODUL: Request/Response-Form an die echte CRM-API anpassen, sobald die Doku vorliegt.
// Angenommen wird vorerst ein simples REST/JSON-Schema mit Bearer-Auth - beides ist zu bestaetigen.

const FAILED_LEAD_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 Tage, siehe Plan M3

export function failedLeadKey(id: string): string {
  return `failed-lead:${id}`;
}

async function persistFailedLead(env: Env, payload: CrmLeadPayload, error: string): Promise<void> {
  const record: FailedLeadRecord = { id: crypto.randomUUID(), payload, error, createdAt: Date.now() };
  await env.ADMIN_STORE.put(failedLeadKey(record.id), JSON.stringify(record), {
    expirationTtl: FAILED_LEAD_TTL_SECONDS,
  });
}

function isConfigured(env: Env): boolean {
  return (
    !!env.CRM_API_BASE_URL &&
    !env.CRM_API_BASE_URL.startsWith("PLATZHALTER") &&
    !!env.CRM_API_KEY
  );
}

/** Prueft, ob Firma/Kontakt bereits im CRM bekannt ist (Dubletten-Schutz, Bestandskunden-Erkennung). */
export async function lookupExisting(env: Env, query: CrmLookupQuery): Promise<CrmLookupResult> {
  if (!isConfigured(env)) {
    console.warn("CRM nicht konfiguriert - lookupExisting uebersprungen (Platzhalter aktiv)");
    return { exists: false };
  }

  const url = new URL(env.CRM_LOOKUP_PATH, env.CRM_API_BASE_URL);
  if (query.domain) url.searchParams.set("domain", query.domain);
  if (query.companyName) url.searchParams.set("company", query.companyName);
  if (query.email) url.searchParams.set("email", query.email);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.CRM_API_KEY}` },
  });

  if (!res.ok) {
    console.error(`CRM-Lookup fehlgeschlagen: ${res.status} ${await res.text()}`);
    return { exists: false };
  }

  // PLATZHALTER: an echtes Response-Schema anpassen.
  const data = await res.json<{ found: boolean; id?: string }>();
  return { exists: data.found, recordId: data.id };
}

/** Legt einen neuen Lead im CRM an. */
export async function createLead(env: Env, payload: CrmLeadPayload): Promise<CrmLeadResult> {
  if (!isConfigured(env)) {
    console.warn("CRM nicht konfiguriert - createLead uebersprungen (Platzhalter aktiv)", payload);
    await persistFailedLead(env, payload, "crm-not-configured");
    recordLeadEvent(env, payload, "failed");
    return { ok: false, error: "crm-not-configured" };
  }

  const url = new URL(env.CRM_LEAD_PATH, env.CRM_API_BASE_URL);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CRM_API_KEY}`,
        "Content-Type": "application/json",
      },
      // PLATZHALTER: Feldnamen an das echte Lead-API-Schema anpassen.
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "network-error";
    console.error(`CRM-Lead-Erstellung fehlgeschlagen (Netzwerk): ${message}`);
    await persistFailedLead(env, payload, message);
    recordLeadEvent(env, payload, "failed");
    return { ok: false, error: message };
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`CRM-Lead-Erstellung fehlgeschlagen: ${res.status} ${errorText}`);
    await persistFailedLead(env, payload, `${res.status} ${errorText}`);
    recordLeadEvent(env, payload, "failed");
    return { ok: false, error: errorText };
  }

  const data = await res.json<{ id?: string }>();
  recordLeadEvent(env, payload, "ok");
  return { ok: true, id: data.id };
}
