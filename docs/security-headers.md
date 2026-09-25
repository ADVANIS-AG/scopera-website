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
   umstellen. **Dieser Schritt muss zuerst erfolgen.** Der Verschlüsselungsmodus aus Schritt 2
   beschreibt die Strecke zwischen Cloudflare und Ursprung. Solange nichts geproxyt ist, gibt
   es diese Strecke nicht und die Einstellung greift ins Leere.
2. Unter **SSL/TLS** den Modus auf **"Full (strict)"** setzen. Nicht "Flexible", das würde
   zwischen Cloudflare und GitHub unverschlüsselt laufen.

   Falls sich der Modus **nicht auswählen lässt**, gibt es drei übliche Gründe:
   - Die Zone läuft auf **"Automatic SSL/TLS"**, wo Cloudflare den Modus selbst wählt. Dann
     zuerst auf **"Custom SSL/TLS"** umschalten, danach ist die Auswahl frei. Cloudflare rollt
     das schrittweise aus, ältere Zonen sehen diese Umschaltung noch nicht.
   - Schritt 1 ist noch offen, es ist also kein Record geproxyt.
   - Die eigene Rolle im Cloudflare-Konto erlaubt die Änderung nicht (Super Administrator nötig).
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

**Vorsicht beim Umstellen, Zertifikatserneuerung:** GitHub Pages erneuert sein Let's-Encrypt-
Zertifikat über eine HTTP-Abfrage unter `/.well-known/acme-challenge/`. Läuft Cloudflare davor
und leitet per "Always Use HTTPS" alles auf HTTPS um, kann diese Abfrage fehlschlagen. Die
Erneuerung bricht dann **stillschweigend** ab und fällt erst auf, wenn das Zertifikat ausläuft.

Gegenmassnahme vor dem Proxy-Wechsel: unter **Rules -> Configuration Rules** eine Regel
anlegen, die für Pfade unter `/.well-known/acme-challenge/` "Always Use HTTPS" deaktiviert.
Danach das Ablaufdatum im Auge behalten:

```bash
echo | openssl s_client -connect www.scopera.ai:443 -servername www.scopera.ai 2>/dev/null \
  | openssl x509 -noout -dates
```

Das aktuelle Zertifikat läuft bis November 2026. Wer diesen Aufwand vermeiden will, kann die
Header stattdessen bei einem Hoster setzen, der eigene Header erlaubt, statt GitHub Pages
hinter Cloudflare zu schieben.

**Prüfen nach der Umstellung:**

```bash
curl -sSI https://www.scopera.ai/ | grep -iE "strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy"
```

Erwartet werden fünf Zeilen. **Kommt gar nichts zurück, ist meist der lokale DNS-Cache schuld:**
Der eigene Rechner hält die alten GitHub-IPs noch, die Anfrage geht also an GitHub vorbei an
Cloudflare, und GitHub sendet diese Header nicht. Erst prüfen, wohin der Name zeigt:

```bash
dig +short www.scopera.ai
```

Erscheinen dort `185.199.*`, ist es noch GitHub. Bei Cloudflare stehen andere Adressen und die
Antwort enthält `server: cloudflare` sowie einen `cf-ray`-Header. Der Cache lässt sich unter
macOS leeren mit `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`.

## Stand seit der Umstellung (September 2026)

Umgesetzt und geprüft:

- `www.scopera.ai` läuft über Cloudflare, alle fünf Header werden ausgeliefert.
- `http` leitet auf `https` um, auch vom Apex aus, und zwar direkt ohne unverschlüsselten
  Zwischenschritt.
- Der Pfad `/.well-known/acme-challenge/` wird **nicht** zwangsweise auf HTTPS umgeleitet, die
  Zertifikatserneuerung von GitHub Pages ist damit nicht gefährdet.

**Reichweite von HSTS: erledigt.** Der Apex ist ebenfalls geproxyt und sendet dieselben Header,
`includeSubDomains` gilt damit für die gesamte Domain. Geprüft nach der Umstellung:

- Apex und `www` liefern alle fünf Header, Apex leitet weiterhin korrekt auf `www` um.
- `app`, `api`, `admin`, ein Mandanten-Host und ein frei erfundener Wildcard-Name liefern alle
  gültiges HTTPS. `includeSubDomains` bricht also nichts.
- Der ACME-Pfad ist auf **beiden** Hosts ohne Umleitung erreichbar.

**Dauerhaft beachten:** Jede **künftige** Subdomain braucht ab dem ersten Tag funktionierendes
HTTPS. Ohne gültiges Zertifikat ist sie im Browser nicht erreichbar, und zwar ohne Möglichkeit,
die Warnung wegzuklicken. Das betrifft auch neue Mandanten-Workspaces.

**Hinweis zur Zertifikatslage:** Seit der Umstellung terminiert Cloudflare die TLS-Verbindung,
Besuchende sehen also das Cloudflare-Zertifikat. Das GitHub-Zertifikat wird weiterhin für die
Strecke Cloudflare zu Ursprung gebraucht und von Full (strict) geprüft. Beide erneuern sich
automatisch, Laufzeiten aktuell bis Anfang November 2026.

`preload` sollte **nicht** ergänzt werden, solange das nicht bewusst entschieden ist. Ein
Eintrag in der Preload-Liste ist nur über ein langwieriges Verfahren wieder zu entfernen.

### HSTS auf die ganze Domain ausweiten

Es genügt **ein einziger Schritt**, weil die bestehende Transform Rule zonenweit greift und
nicht auf `www` eingeschränkt ist. Nachgewiesen daran, dass `admin.scopera.ai` dieselben fünf
Header ausliefert.

1. Cloudflare, **DNS -> Records**. Den Apex-Eintrag suchen, Name `scopera.ai` beziehungsweise
   `@`. Es sind vier A-Records auf `185.199.108.153` bis `185.199.111.153`.
2. Bei **jedem** dieser vier Records die graue Wolke auf **orange** stellen ("Proxied").
3. Fertig. Die Transform Rule greift automatisch, es braucht keine neue Regel.

Vorbedingungen sind geprüft und erfüllt:

- Das GitHub-Zertifikat deckt beide Namen ab, die SAN-Liste enthält `scopera.ai` **und**
  `www.scopera.ai`. Full (strict) funktioniert also auch für den Apex.
- Alle bekannten Subdomains liefern gültiges HTTPS (`app`, `api`, `admin`, Mandanten-Hosts).

Prüfen nach ein paar Minuten:

```bash
dig +short scopera.ai                 # darf nicht mehr 185.199.* sein
curl -sSI https://scopera.ai/ | grep -iE "^server:|strict-transport"
```

**Was das bringt und was nicht.** Wer `https://scopera.ai` besucht, dessen Browser merkt sich
für ein Jahr, dass die gesamte Domain samt Subdomains nur über HTTPS erreichbar ist. Wer
dagegen direkt zu `app.scopera.ai` geht, ohne den Apex je besucht zu haben, hat diesen Schutz
beim allerersten Aufruf noch nicht. Nur ein Eintrag in der Preload-Liste würde das schliessen,
und davon ist aus dem oben genannten Grund abzuraten.

**Nicht zusätzlich** die eingebaute HSTS-Option unter *SSL/TLS -> Edge Certificates* aktivieren.
Zusammen mit der Transform Rule würde der Header sonst doppelt gesetzt. Ein Mechanismus genügt,
und die Regel ist bereits eingerichtet.
