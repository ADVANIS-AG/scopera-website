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
