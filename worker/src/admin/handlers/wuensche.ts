import { WUNSCH_PREFIX } from "../../handlers/wunsch";
import { jsonResponse } from "../../lib/json";
import type { Env, WunschRecord } from "../../types";

/** GET /admin/api/wuensche - alle eingereichten Wunschzettel der Weihnachtsaktion, neueste zuerst.
 *  KV liefert hoechstens 1000 Schluessel je Seite, darum mit Cursor durchblaettern. */
export async function handleGetWuensche(env: Env): Promise<Response> {
  const namen: string[] = [];
  let cursor: string | undefined;
  do {
    const seite = await env.ADMIN_STORE.list({ prefix: WUNSCH_PREFIX, cursor });
    namen.push(...seite.keys.map((k) => k.name));
    cursor = seite.list_complete ? undefined : seite.cursor;
  } while (cursor);

  const eintraege = await Promise.all(namen.map((n) => env.ADMIN_STORE.get<WunschRecord>(n, "json")));
  const wuensche = eintraege
    .filter((w): w is WunschRecord => w !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
  return jsonResponse({ ok: true, wuensche }, 200);
}

/** DELETE /admin/api/wuensche/:id - einen Wunschzettel endgueltig loeschen (Tests, Spam oder auf
 *  Wunsch der Person). Nur UUIDs, damit kein anderer Schluessel in ADMIN_STORE erreichbar ist. */
export async function handleDeleteWunsch(env: Env, id: string): Promise<Response> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
    return jsonResponse({ ok: false, error: "invalid-id" }, 400);
  }
  const schluessel = `${WUNSCH_PREFIX}${id}`;
  if ((await env.ADMIN_STORE.get(schluessel)) === null) {
    return jsonResponse({ ok: false, error: "not-found" }, 404);
  }
  await env.ADMIN_STORE.delete(schluessel);
  return jsonResponse({ ok: true }, 200);
}
