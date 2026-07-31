import { recordLeadEvent } from "../analytics";
import { createLead, lookupExisting } from "../crm-client";
import { jsonResponse } from "../lib/json";
import { verifyTurnstile } from "../lib/turnstile";
import type { ContactFormPayload, Env } from "../types";

function isValidPayload(body: unknown): body is ContactFormPayload {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.name === "string" &&
    b.name.trim().length > 0 &&
    typeof b.email === "string" &&
    b.email.includes("@") &&
    typeof b.nachricht === "string" &&
    b.nachricht.trim().length > 0 &&
    typeof b.turnstileToken === "string"
  );
}

export async function handleContact(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid-json" }, 400);
  }

  if (!isValidPayload(body)) {
    return jsonResponse({ ok: false, error: "invalid-payload" }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  const turnstileOk = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
  if (!turnstileOk) {
    return jsonResponse({ ok: false, error: "spam-check-failed" }, 400);
  }

  // Formular-Leads gelten laut Plan unabhaengig vom Score sofort als Lead - aber trotzdem erst
  // gegen bestehende CRM-Kontakte pruefen, um keine Dubletten anzulegen.
  const lookup = await lookupExisting(env, { email: body.email, companyName: body.firma });
  if (lookup.exists) {
    recordLeadEvent(env, { source: "contact-form", company: body.firma, contactEmail: body.email }, "existing");
    return jsonResponse({ ok: true, existing: true }, 200);
  }

  const result = await createLead(env, {
    source: "contact-form",
    company: body.firma,
    contactName: body.name,
    contactEmail: body.email,
    message: body.nachricht,
  });

  return jsonResponse({ ok: result.ok, error: result.error }, result.ok ? 200 : 502);
}
