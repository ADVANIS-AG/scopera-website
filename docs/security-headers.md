# Security-Header und HTTPS

Ergebnis eines externen Security-Scans (August 2026) und was daraus umgesetzt wurde.

## Die vier Scan-Befunde

| Befund | Status | Ursache |
|---|---|---|
| HTTPS page has internal links to HTTP | offen, Punkt 1 unten | Seite ist über HTTP erreichbar |
| HTTP URLs | offen, Punkt 1 unten | dito |
| HTTPS URL contains a form posting to HTTP | offen, Punkt 1 unten | dito |
| Defence against XSS not implemented site-level | teilweise erledigt | fehlende CSP |

Die ersten drei Befunde haben **eine gemeinsame Ursache**: Der Scanner hat die Seite über
`http://www.scopera.ai` gecrawlt. Auf einer HTTP-Seite sind alle relativen Links automatisch
HTTP, und das Kontaktformular ohne `action`-Attribut zeigt implizit auf die aktuelle HTTP-URL.

Im Quellcode existiert kein einziges `http://`. Das Kontaktformular versendet per `fetch()`
an `https://admin.scopera.ai`. Es handelt sich also nicht um einen Code-Fehler.

## 1. HTTPS erzwingen (offen, erledigt Befunde 1 bis 3)

Ausgangslage im August 2026:

```
http://www.scopera.ai/  ->  200 OK   (keine Weiterleitung)
http://scopera.ai/      ->  301      ->  http://www.scopera.ai/   (bleibt auf HTTP)
```

**Zu tun:** Im GitHub-Repository unter **Settings -> Pages** die Option **"Enforce HTTPS"**
aktivieren. GitHub liefert danach automatisch `301 http -> https`.

Prüfen mit:

```bash
curl -sS -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://www.scopera.ai/
# Erwartet: 301 -> https://www.scopera.ai/
```

## 2. Content-Security-Policy (erledigt)

Umgesetzt als Meta-Tag in `src/layouts/BaseLayout.astro`, weil **GitHub Pages keine eigenen
HTTP-Header setzen kann**.

Erlaubte externe Origins und warum:

| Origin | Wofür |
|---|---|
| `www.googletagmanager.com` | Google Tag Manager |
| `assets.apollo.io` | Apollo-Tracker-Script (via GTM geladen) |
| `aplo-evnt.com` | Apollo-Tracking-Endpunkte |
| `admin.scopera.ai` | Kontaktformular und Besucher-Beacon (Cloudflare Worker) |
| `api.scopera.ai` | Angebots-Banner-iframe auf `/product` |
| `plausible.io` | Analytics, aktuell über `PLAUSIBLE_DOMAIN` deaktiviert, vorsorglich erlaubt |

**Wichtige Einschränkung:** `script-src` enthält `'unsafe-inline'`. Das ist nötig für die fünf
Inline-Skripte (Theme-Umschalter, Consent-Logik, Beacon, Cookie-Banner) und für Google Tag
Manager, der selbst Inline-Ausführung braucht. Eine strikte CSP mit Nonces oder Hashes ist mit
GTM auf statischem Hosting nicht sinnvoll umsetzbar. Die CSP schützt damit gegen externe
Script-Injection, aber nicht gegen Inline-XSS. Wer echten Inline-Schutz will, müsste GTM
ablösen.

`upgrade-insecure-requests` ist gesetzt: Der Browser hebt allfällige HTTP-Subressourcen
automatisch auf HTTPS. Das ersetzt Punkt 1 aber **nicht**, weil es nur innerhalb einer bereits
geladenen Seite wirkt.

### Nach Änderungen an externen Diensten

Wird ein neuer externer Dienst eingebunden (weiteres Tracking, eingebettetes Video, Webfont),
muss die CSP ergänzt werden, sonst blockiert der Browser ihn stillschweigend. Test:

```bash
npm run dev
# Danach im Browser die Konsole auf "Refused to ..." bzw. "Content Security Policy" prüfen.
```

Beim Einbau der CSP wurde genau so entdeckt, dass Apollo neben `assets.apollo.io` zusätzlich
`aplo-evnt.com` kontaktiert. Ohne diesen Eintrag wäre das Tracking still ausgefallen.

## 3. Vollständiger Header-Satz über Cloudflare (empfohlen, offen)

Per Meta-Tag **nicht** möglich sind `Strict-Transport-Security`, `X-Frame-Options` und
`Permissions-Policy`. Browser ignorieren diese als Meta-Tag, sie wirken nur als echte
HTTP-Header.

Die DNS von `scopera.ai` läuft bereits über Cloudflare (`shane.ns.cloudflare.com`,
`suzanne.ns.cloudflare.com`), die Records stehen aber auf **"DNS only"** (graue Wolke), zeigen
also direkt auf die GitHub-Pages-IPs. Damit sieht Cloudflare den Traffic nicht und kann keine
Header setzen.

**Vorgehen:**

1. In Cloudflare unter **DNS** den `www`-Record (und den Apex) auf **"Proxied"** (orange Wolke)
   umstellen.
2. Unter **SSL/TLS** den Modus auf **"Full (strict)"** setzen. Nicht "Flexible", das würde
   zwischen Cloudflare und GitHub unverschlüsselt laufen.
3. Unter **Rules -> Transform Rules -> Modify Response Header** eine Regel für alle Anfragen
   anlegen und folgende Header setzen:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
```

Die CSP kann dort ebenfalls als Header gesetzt werden. Falls das gemacht wird, sollte das
Meta-Tag in `BaseLayout.astro` entfernt werden, damit es nur **eine** Quelle für die Policy
gibt. Zwei sich widersprechende Policies gelten kumulativ, also jeweils die strengere Regel,
was in der Fehlersuche schwer nachvollziehbar ist.

**Vorsicht beim Umstellen:** GitHub Pages braucht für die Zertifikatsausstellung zeitweise
direkten Zugriff. Wenn das GitHub-Zertifikat bereits ausgestellt ist (aktuell ja, Let's Encrypt
bis November 2026), funktioniert die Umstellung problemlos. Bei einem späteren Domainwechsel
den Proxy vorübergehend wieder deaktivieren.

**Prüfen nach der Umstellung:**

```bash
curl -sSI https://www.scopera.ai/ | grep -iE "strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy"
```
