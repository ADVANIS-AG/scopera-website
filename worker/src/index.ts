import { handleAdminApi } from "./admin/router";
import { handleApolloWebhook } from "./handlers/apollo-webhook";
import { handleBeacon } from "./handlers/beacon";
import { handleContact } from "./handlers/contact";
import { corsHeaders, handleOptions } from "./lib/cors";
import type { Env } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // /admin/api/* wird von admin.scopera.ai aus same-origin aufgerufen (Admin-UI wird vom
    // gleichen Worker als statisches Asset ausgeliefert, siehe wrangler.toml
    // run_worker_first/[assets]) - kein CORS-Handling noetig, Auth siehe admin/router.ts.
    if (url.pathname.startsWith("/admin/api/")) {
      return handleAdminApi(request, env);
    }

    if (request.method === "OPTIONS") {
      return handleOptions(request, env);
    }

    let response: Response;
    if (request.method === "POST" && url.pathname === "/beacon") {
      response = await handleBeacon(request, env);
    } else if (request.method === "POST" && url.pathname === "/apollo-webhook") {
      response = await handleApolloWebhook(request, env);
    } else if (request.method === "POST" && url.pathname === "/contact") {
      response = await handleContact(request, env);
    } else if (url.pathname === "/health") {
      response = new Response("ok", { status: 200 });
    } else {
      response = new Response("not found", { status: 404 });
    }

    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(await corsHeaders(request, env))) {
      headers.set(key, value);
    }
    return new Response(response.body, { status: response.status, headers });
  },
};
