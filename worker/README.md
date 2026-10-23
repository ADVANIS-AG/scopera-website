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
- Apollo-Rückkopplung: `GET /admin/api/apollo`,
  `POST /admin/api/apollo/pruefen` (tastet Apollo ab, schreibt nichts),
  `POST /admin/api/apollo/felder-neu-laden`
- Besucherauswertung: `GET /admin/api/pages`, `GET /admin/api/engagement`,
  `GET /admin/api/heatmap?path=…&viewport=mobil|tablet|desktop`
- `GET /admin/api/preview?path=…` — liefert eine Seite der öffentlichen Webseite skriptfrei aus,
  damit die Konsole sie einbetten und die Heatmap darüberlegen kann. Nötig, weil www.scopera.ai
  `X-Frame-Options: SAMEORIGIN` sendet. Kein öffentlicher Spiegel: liegt unter `/admin/api/` und
  damit hinter Access. Beide Endpunkte nehmen nur Pfade an, die einer engen Erlaubnisliste
  genügen (`/^\/[A-Za-z0-9/_.-]*$/`), weil der Wert in eine SQL-Abfrage beziehungsweise in einen
  ausgehenden `fetch` wandert.

## Bekannte Einschränkungen / offene Punkte (siehe Plan)

- **Apollo-Payload unbekannt**: `handlers/apollo-webhook.ts` geht von Feldnamen wie `company_name`
  und `ip` aus — reine Annahme. Damit das aufhört, Annahme zu sein, protokolliert der Handler jeden
  eingehenden Payload vollständig (`console.info("Apollo-Payload: …")`, auf 2000 Zeichen gekappt).
  **Beim nächsten echten Apollo-Aufruf also `npx wrangler tail` mitlaufen lassen** — dann steht das
  reale Schema im Log und die Zuordnung lässt sich darauf festziehen. Ohne IP im Payload kann eine
  Firmenerkennung nicht mit einer Session verknüpft werden (wird dann nur geloggt, siehe
  `202 accepted, unlinked`).
- **Apollo-Webhook läuft ohne Secret, aber nicht offen**: solange `APOLLO_WEBHOOK_SECRET` nicht
  gesetzt ist, nimmt der Endpunkt Aufrufe weiterhin an (sonst wäre die Firmenerkennung tot), aber:
  Drossel von 60 Aufrufen pro Stunde und IP, und ein unbestätigter Aufruf darf die Session zwar
  markieren (lebt 30 Minuten, selbstbegrenzt), **keinen Lead anlegen** — Lead-Einträge liegen ein
  Jahr im Posteingang und wären sonst zumüllbar. Sobald das Secret gesetzt ist, schaltet der
  Endpunkt von selbst auf strikt um (401 bei fehlendem oder falschem Header, zeitkonstanter
  Vergleich), ohne Codeänderung. Setzen mit `npx wrangler secret put APOLLO_WEBHOOK_SECRET`.
- **IP→Session-Zuordnung ist eine Vereinfachung**: `session-store.ts` merkt sich pro IP die zuletzt
  aktive `sessionId` (30 Minuten TTL). Bei mehreren gleichzeitigen Besuchern hinter derselben
  IP (z.B. Firmen-NAT) kann das zur falschen Session führen — für den Start bewusst einfach gehalten,
  ggf. später verfeinern (z.B. über einen von Apollo mitgelieferten Zeitstempel).
- **Apollo-Rückkopplung braucht Einrichtung in Apollo**: Ohne gesetztes `APOLLO_API_KEY` ist sie
  abgeschaltet, der Rest läuft unverändert weiter. Zum Einschalten sind drei Schritte nötig:
  1. In Apollo drei Felder am **Konto** anlegen (nicht am Kontakt), mit genau diesen
     Beschriftungen: `SCOPERA Score`, `SCOPERA Letzter Besuch`, `SCOPERA Seiten`. Gesucht wird
     über die Beschriftung, nicht über die Feld-ID: IDs müsste man von Hand abschreiben und bei
     jeder Neuanlage nachführen.
  2. Einen API-Schlüssel erzeugen, der `api/v1/fields/index`, `api/v1/accounts/search` und
     `api/v1/accounts/update` umfasst (oder einen Master-Key). Fehlt ein Recht, antwortet Apollo
     mit 403 und das steht in der Konsole.
  3. `npx wrangler secret put APOLLO_API_KEY`, danach in der Konsole auf
     **Feldzuordnung neu laden** drücken.

  Ausgelöst wird je erkannte Firma höchstens einmal täglich, und erst ab `LEAD_SCORE_THRESHOLD`.
  Ein unbestätigter Webhook-Aufruf löst nie aus, sonst könnte jemand eine fremde Firma benennen
  und wir schrieben in deren Apollo-Konto. Fällt Apollo aus, bleibt es bei einem Eintrag in der
  Konsole: Weder Beacon noch Lead-Erfassung dürfen daran scheitern.

  `APOLLO_API_BASE` biegt die Gegenstelle um und ist nur für Prüfungen gegen einen nachgebauten
  Apollo gedacht. In Produktion bleibt die Variable ungesetzt.
- **CRM-Client ist ein Platzhalter**: `crm-client.ts` nimmt ein generisches REST/JSON-Schema mit
  Bearer-Auth an. Anzupassen, sobald die echte Lead-API-Doku vorliegt (Auth-Verfahren, Feldnamen,
  Response-Shape für Lookup und Lead-Erstellung).
- **ASN/WHOIS-Fallback fehlt noch**: laut Plan als Zusatzquelle neben Apollo vorgesehen, aber noch
  nicht implementiert.
- **Rate-Limiting-API evtl. plan-abhängig**: `cf-api-client.ts` `createRateLimitRule`/`listRateLimitRules`
  nutzen Cloudflares Zone-Rulesets-API — auf manchen (insb. Free-)Plänen evtl. nicht verfügbar.
  Cloudflares Fehlermeldung kommt 1:1 im Admin-Panel an (kein Absturz). Für das Kontaktformular
  gibt es inzwischen eine eigene Drossel im Worker (`src/lib/ratelimit.ts`, 5 Anfragen je Stunde
  und IP, Schlüssel als Hash). Sie ist unabhängig von den Cloudflare-Zonenregeln und taucht im
  Reiter Rate-Limits deshalb **nicht** auf.
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

1. **KV-Namespaces**: bereits angelegt, die IDs stehen in `wrangler.toml`. Nur bei einem neuen
   Konto nötig: `npm run kv:create-sessions` und `npm run kv:create-admin-store`, dann die
   ausgegebenen IDs unter den jeweiligen `[[kv_namespaces]] id` eintragen.
2. **`wrangler.toml` → `[vars]`**: `ALLOWED_ORIGIN`, `CF_ACCOUNT_ID`, `CF_ZONE_ID`,
   `CF_ACCESS_TEAM_DOMAIN` und `CF_ACCESS_AUD` sind gesetzt. Offen sind nur noch die drei
   CRM-Werte (`CRM_API_BASE_URL`, `CRM_LOOKUP_PATH`, `CRM_LEAD_PATH`), alle drei noch
   `PLATZHALTER_...`. Solange das so ist, landet jede Kontaktanfrage in KV statt im CRM, siehe
   Reiter „Kontaktanfragen" im Admin-Panel.
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
`.github/workflows/deploy-worker.yml` im Hauptrepo. Der löst bei jedem Push auf `main` aus, der
etwas unter `worker/**` ändert, zusätzlich manuell über `workflow_dispatch`. `CLOUDFLARE_API_TOKEN`
und `CLOUDFLARE_ACCOUNT_ID` sind als Repo-Secrets hinterlegt.
