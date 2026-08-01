# scopera-lead-gateway

Cloudflare-Worker-Projekt: Integrations-Hub zwischen der statischen SCOPERA-Webseite (GitHub Pages)
und dem Schweizer CRM, plus ein internes Betriebs-Dashboard. Siehe Pläne im Hauptrepo:
`.claude/plans/zum-thema-webseitenbesucher-untersuche-dreamy-key.md` (aktuell: Admin-Dashboard;
Versionshistorie enthält auch den ursprünglichen Lead-Gateway-Plan).

Läuft komplett unabhängig vom Astro-Deploy (eigener Build/Deploy, eigene Runtime). Die Webseite
bleibt auf GitHub Pages, ruft diesen Worker nur per `fetch()` auf — analog zum bisherigen
Formspree-Muster im Kontaktformular.

## Routen

Öffentlich (keine Auth, von der Webseite aus aufgerufen):
- `POST /beacon` — Pageview + Verweildauer vom eigenen Tracking-Skript auf der Webseite.
- `POST /apollo-webhook` — Firmenerkennungs-Ereignis von Apollo.
- `POST /contact` — Kontaktformular-Submission (ersetzt Formspree).
- `GET /health` — einfacher Erreichbarkeits-Check.

Intern, nur über `admin.scopera.ai` erreichbar und durch Cloudflare Access geschützt:
- `GET /admin/*` — statische Admin-UI (`public/admin/`).
- `GET /admin/api/visitors` — letzte Firmenbesuche (Workers Analytics Engine).
- `GET /admin/api/leads`, `GET /admin/api/leads/failed`, `POST /admin/api/leads/failed/:id/retry`
- `GET /admin/api/crm/status`
- `GET`/`PUT /admin/api/security/cors`, `GET`/`POST`/`DELETE /admin/api/security/ip-rules[/:id]`,
  `GET`/`POST /admin/api/security/rate-limits`

## Bekannte Einschränkungen / offene Punkte (siehe Plan)

- **Apollo-Payload unbekannt**: `handlers/apollo-webhook.ts` geht von Feldnamen wie `company_name`
  und `ip` aus — reine Annahme. Sobald die echte Apollo-Webhook-/API-Doku vorliegt, Feldnamen prüfen
  und anpassen. Ohne IP im Payload kann eine Firmenerkennung nicht mit einer Session verknüpft
  werden (wird dann nur geloggt, siehe `202 accepted, unlinked`).
- **IP→Session-Zuordnung ist eine Vereinfachung**: `session-store.ts` merkt sich pro IP die zuletzt
  aktive `sessionId` (30 Minuten TTL). Bei mehreren gleichzeitigen Besuchern hinter derselben
  IP (z.B. Firmen-NAT) kann das zur falschen Session führen — für den Start bewusst einfach gehalten,
  ggf. später verfeinern (z.B. über einen von Apollo mitgelieferten Zeitstempel).
- **CRM-Client ist ein Platzhalter**: `crm-client.ts` nimmt ein generisches REST/JSON-Schema mit
  Bearer-Auth an. Anzupassen, sobald die echte Lead-API-Doku vorliegt (Auth-Verfahren, Feldnamen,
  Response-Shape für Lookup und Lead-Erstellung).
- **ASN/WHOIS-Fallback fehlt noch**: laut Plan als Zusatzquelle neben Apollo vorgesehen, aber noch
  nicht implementiert.
- **Rate-Limiting-API evtl. plan-abhängig**: `cf-api-client.ts` `createRateLimitRule`/`listRateLimitRules`
  nutzen Cloudflares Zone-Rulesets-API — auf manchen (insb. Free-)Plänen evtl. nicht verfügbar.
  Cloudflares Fehlermeldung kommt 1:1 im Admin-Panel an (kein Absturz). Fallback bei Bedarf: eigenes
  KV-Zähler-basiertes Rate-Limiting im Worker (noch nicht gebaut).
- **Access/Analytics Engine lokal nicht vollständig testbar**: `wrangler dev` kennt weder echte
  Cloudflare-Access-Logins noch schreibt es zuverlässig in Analytics Engine — Endverifikation braucht
  einen echten Deploy (siehe Verifikation im Plan).

## Admin-Bereich lokal testen, solange Cloudflare Access noch nicht eingerichtet ist

`/admin/api/*` ist standardmässig **fail-closed** — ohne echtes Access-Setup bekommt niemand Zugriff,
auch nicht lokal. Für den Testmodus gibt es einen expliziten, sicher eingegrenzten Dev-Bypass:

```bash
cp .dev.vars.example .dev.vars
# In .dev.vars die Zeile "# DEV_BYPASS_ADMIN_AUTH=true" auskommentieren (# entfernen)
npm run dev
```

Danach ist `http://localhost:8787/admin/` ohne Login erreichbar. Warum das nicht versehentlich in
Produktion landen kann: `.dev.vars` ist per `.gitignore` nie im Repo, und `wrangler deploy` liest
diese Datei nachweislich nicht (nur `wrangler dev` tut das) — die Variable existiert unter einem
echten Deploy schlicht nicht, siehe `src/admin/auth.ts`. Jede Nutzung wird zusätzlich laut geloggt
(`console.warn`), damit sie nie unbemerkt bleibt.

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars   # lokale Secrets für `wrangler dev` (siehe unten)
npm run dev                       # lokaler Dev-Server auf :8787
npm run typecheck
```

### Vor dem ersten Deploy zu befüllen

1. **KV-Namespaces anlegen**: `npm run kv:create-sessions` und `npm run kv:create-admin-store`,
   die ausgegebenen IDs in `wrangler.toml` unter den jeweiligen `[[kv_namespaces]] id` eintragen
   (ersetzt `PLATZHALTER_KV_NAMESPACE_ID` / `PLATZHALTER_ADMIN_STORE_NAMESPACE_ID`).
2. **`wrangler.toml` → `[vars]`** befüllen: `ALLOWED_ORIGIN`, `CRM_API_BASE_URL`, `CRM_LOOKUP_PATH`,
   `CRM_LEAD_PATH`, `CF_ACCOUNT_ID`, `CF_ZONE_ID`, `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD` (alle
   aktuell `PLATZHALTER_...`).
3. **Secrets setzen** (nicht in `wrangler.toml`, da versioniert):
   ```bash
   npx wrangler secret put CRM_API_KEY
   npx wrangler secret put APOLLO_WEBHOOK_SECRET
   npx wrangler secret put TURNSTILE_SECRET_KEY
   npx wrangler secret put CF_API_TOKEN
   ```
   Solange ein Secret/eine Config fehlt, verhält sich der jeweilige Code-Pfad defensiv (Turnstile-Prüfung
   wird übersprungen statt zu blockieren, CRM-Aufrufe werden geloggt und übersprungen statt zu crashen)
   — **Ausnahme: der Admin-Bereich (`/admin/api/*`) ist fail-closed** (bleibt gesperrt, statt bei
   fehlender Konfiguration offen zu sein, siehe `admin/auth.ts`).
4. `npm run deploy`.

### Cloudflare-seitiges Setup für den Admin-Bereich (Dashboard, nicht CLI)

1. Custom Domain `admin.scopera.ai` an diesen Worker binden (Workers & Pages → scopera-lead-gateway
   → Settings → Domains & Routes).
2. Zero Trust → Settings → Authentication: Microsoft Entra ID als Identity Provider verbinden
   (braucht eine App-Registrierung in Entra ID: Application ID, Application Secret, Directory ID).
3. Zero Trust → Access → Applications: neue "Self-hosted application" für `admin.scopera.ai`,
   Policy auf `@advanis.ch` beschränken. Der AUD-Tag dieser Application → `CF_ACCESS_AUD` oben.
4. Team-Domain (z.B. `advanis.cloudflareaccess.com`) → `CF_ACCESS_TEAM_DOMAIN` oben.
5. Scoped API-Token erzeugen (mind. Zone: Firewall Services: Edit, Account: Account Analytics: Read)
   → als `CF_API_TOKEN`-Secret setzen.
6. Zone-ID von scopera.ai/scopera.ch → `CF_ZONE_ID`; Account-ID → `CF_ACCOUNT_ID` (beide im
   Cloudflare-Dashboard rechts sichtbar).
7. **Vorab prüfen**: aktueller Cloudflare-Plan, siehe "Bekannte Einschränkungen" oben (Rate-Limiting-API).

## Deploy

Manuell über `npm run deploy`, oder über den GitHub-Actions-Workflow
`.github/workflows/deploy-worker.yml` im Hauptrepo (aktuell `workflow_dispatch`-only, da noch keine
Cloudflare-Secrets im Repo hinterlegt sind — auf Push umstellen, sobald `CLOUDFLARE_API_TOKEN` und
`CLOUDFLARE_ACCOUNT_ID` als Repo-Secrets gesetzt sind).
