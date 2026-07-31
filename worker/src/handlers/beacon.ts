import { recordPageview } from "../session-store";
import type { BeaconPayload, Env } from "../types";

const MAX_PATH_LENGTH = 512;
const MAX_DURATION_MS = 30 * 60 * 1000; // Kappen gegen manipulierte/kaputte Werte

function isValidPayload(body: unknown): body is BeaconPayload {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.sessionId === "string" &&
    b.sessionId.length > 0 &&
    b.sessionId.length <= 128 &&
    typeof b.path === "string" &&
    b.path.length > 0 &&
    b.path.length <= MAX_PATH_LENGTH &&
    typeof b.durationMs === "number" &&
    b.durationMs >= 0
  );
}

export async function handleBeacon(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  if (!isValidPayload(body)) {
    return new Response("invalid payload", { status: 400 });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const durationMs = Math.min(body.durationMs, MAX_DURATION_MS);

  await recordPageview(env, ip, body.sessionId, { path: body.path, durationMs });

  return new Response(null, { status: 204 });
}
