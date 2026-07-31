# scopera-lead-gateway

Cloudflare-Worker-Projekt: Integrations-Hub zwischen der statischen SCOPERA-Webseite (GitHub Pages)
und dem Schweizer CRM. Siehe Plan: `.claude/plans/zum-thema-webseitenbesucher-untersuche-dreamy-key.md`
im Hauptrepo für den vollständigen Kontext/die Architektur-Entscheidung.

Läuft komplett unabhängig vom Astro-Deploy (eigener Build/Deploy, eigene Runtime). Die Webseite
bleibt auf GitHub Pages, ruft diesen Worker nur per `fetch()` auf — analog zum bisherigen
Formspree-Muster im Kontaktformular.

## Routen

- `POST /beacon` — Pageview + Verweildauer vom eigenen Tracking-Skript auf der Webseite.
- `POST /apollo-webhook` — Firmenerkennungs-Ereignis von Apollo.
- `POST /contact` — Kontaktformular-Submission (ersetzt Formspree).
- `GET /health` — einfacher Erreichbarkeits-Check.

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
  nicht implementiert — folgt, sobald Variante A (Apollo) steht und getestet ist.

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars   # lokale Secrets für `wrangler dev` (siehe unten)
npm run dev                       # lokaler Dev-Server auf :8787
npm run typecheck
```

### Vor dem ersten Deploy zu befüllen

1. **KV-Namespace anlegen**: `npm run kv:create-sessions`, die ausgegebene ID in `wrangler.toml`
   unter `[[kv_namespaces]] id` eintragen (ersetzt `PLATZHALTER_KV_NAMESPACE_ID`).
2. **`wrangler.toml` → `[vars]`** befüllen: `ALLOWED_ORIGIN`, `CRM_API_BASE_URL`, `CRM_LOOKUP_PATH`,
   `CRM_LEAD_PATH` (alle aktuell `PLATZHALTER_...`).
3. **Secrets setzen** (nicht in `wrangler.toml`, da versioniert):
   ```bash
   npx wrangler secret put CRM_API_KEY
   npx wrangler secret put APOLLO_WEBHOOK_SECRET
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```
   Solange ein Secret nicht gesetzt ist, verhält sich der jeweilige Code-Pfad defensiv (Turnstile-Prüfung
   wird übersprungen statt zu blockieren, CRM-Aufrufe werden geloggt und übersprungen statt zu crashen)
   — der Worker lässt sich also schon vor der vollständigen Konfiguration deployen und testen.
4. `npm run deploy`.

## Deploy

Manuell über `npm run deploy`, oder über den GitHub-Actions-Workflow
`.github/workflows/deploy-worker.yml` im Hauptrepo (aktuell `workflow_dispatch`-only, da noch keine
Cloudflare-Secrets im Repo hinterlegt sind — auf Push umstellen, sobald `CLOUDFLARE_API_TOKEN` und
`CLOUDFLARE_ACCOUNT_ID` als Repo-Secrets gesetzt sind).
