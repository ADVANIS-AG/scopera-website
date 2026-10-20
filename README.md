# scopera.ai

Marketing-Webseite der Brand «SCOPERA» — Swiss Cognitive Operation Platform, Engineering, Robotics & Agentic (powered by ADVANIS AG). Astro, statischer Output.

## Entwicklung

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # statischer Output nach dist/
npm run preview    # dist/ lokal testen
npm run check      # Typ- und Template-Pruefung
```

## Vor dem Launch (Checkliste)

- [ ] `src/config.ts` befuellen: KONTAKT_EMAIL, BOOKING_URL, ADRESSE, UID, PLAUSIBLE_DOMAIN, WORKER_ENDPOINT, TURNSTILE_SITE_KEY
- [x] Domains scopera.ch / scopera.ai registriert, `base` in `astro.config.mjs` auf `/` zurueckgesetzt, `public/CNAME` (scopera.ai) angelegt
- [ ] DNS von scopera.ai auf GitHub Pages zeigen (siehe github.com/ADVANIS-AG/&lt;repo&gt;/settings/pages fuer die aktuellen Zielwerte), scopera.at noch registrieren falls gewuenscht
- [ ] Team-Nachnamen und Fotos auf /ueber-uns ergaenzen (`src/pages/ueber-uns.astro`)
- [ ] GL-Naming-Entscheid bestaetigt
- [ ] `worker/` deployen (siehe `worker/README.md`): KV-Namespace, CRM-Endpunkte und Secrets setzen, danach `WORKER_ENDPOINT` oben befuellen

## Struktur

- `src/config.ts` — alle veraenderlichen Werte an einer Stelle (Platzhalter bis Launch)
- `src/styles/global.css` — Design-Tokens (Loge: dunkel Standard, helle Variante per Umschalter) und Basisstile
- `src/layouts/BaseLayout.astro` — Head/SEO, Header/Nav, Footer
- `src/components/` — CtaBanner, SaeulenGrid, QuerschnittBaender, PaketGrid
- `src/pages/` — alle Routen; `src/content/insights/` — Blog-Artikel: ein Ordner pro Artikel mit `index.de.md` + `index.en.md` und optional einem Titelbild (z.B. `cover.jpg`, im Frontmatter als `cover: ./cover.jpg` referenzieren)
- `docs/superpowers/` — Design-Spec und Implementierungsplan
- `worker/` — eigenstaendiges Cloudflare-Worker-Projekt (Lead-Gateway: Tracking-Beacon, Kontaktformular, CRM-Anbindung), eigenes `package.json`/Deploy, siehe `worker/README.md`

## Bewegung und 3D

- **Sitewide** ([src/scripts/motion.ts](src/scripts/motion.ts)): Lenis glättet das Scrollen, Überschriften und Karten blenden beim Erscheinen ein, die KlangLinie zeichnet sich. Bei `prefers-reduced-motion` passiert nichts davon.
- **Startseite** ([BuehneHero.astro](src/components/BuehneHero.astro), [StufenAkte.astro](src/components/StufenAkte.astro), Szene in `src/scripts/buehne/`): Der Vorhang öffnet sich auf eine Partitur. Die Notenlinien stehen für die bewährten Prozesse, die Lichtnoten für AI. Danach fährt die Kamera pro Stufe zur passenden Notengruppe.
- **/product und /partner** ([LichtNetz.astro](src/components/LichtNetz.astro)): Plattform-Grafiken als Lichtnetz. Die bisherigen SVG-Grafiken stecken im Slot und bleiben der Fallback.
- **Fallback-Regeln:** Ohne WebGL, bei `prefers-reduced-motion` oder `navigator.deviceMemory < 4` bleiben statische Grafiken stehen (SVG-Poster, StufenBand, SVG-Grafiken). Text liegt immer als HTML vor, nie im Canvas.
- **Farben** kommen zur Laufzeit aus den CSS-Tokens, die Szenen folgen dem Theme-Umschalter. Text über bewegtem Hintergrund steht immer auf einem Verlauf aus `--ground`. Für kleine goldene Schrift `--accent-text` verwenden (erfüllt WCAG AA in beiden Themes).
- **Budget:** GSAP und Lenis sitewide rund 50 kB gzip. three.js und die Szenen (rund 135 kB gzip) laden erst nach dem ersten Rendern bzw. wenn die Grafik in die Nähe des Viewports kommt. Gerendert wird nur, solange die Fläche sichtbar ist.
- Alles ist über npm gebündelt, darum braucht die CSP keine zusätzlichen Quellen.

## Bildnachweise

Alle Fotos via Unsplash (Unsplash-Lizenz: kommerzielle Nutzung erlaubt, keine Attribution noetig — Nennung als Geste):

- `hero-start.jpg` — Shinzan Murray (unsplash.com/photos/wTZPNaMhakk)
- `hero-leistungen.jpg` — Robert Katzki (unsplash.com/photos/8J3TaXShe-s)
- `hero-plattform.jpg` (Seite `/produkt`) — Lucas Alexander (unsplash.com/photos/njaQKSM365I)
- `hero-pakete.jpg` — Valentin Karisch (unsplash.com/photos/igNLOmbJBhg)
- `hero-insights.jpg` — Arindam Mahanta (unsplash.com/photos/VEOk8qUl9DU)
- `hero-ueber-uns.jpg` — Manuel Nägeli (unsplash.com/photos/7CcPLtywRso)
- `hero-kontakt.jpg` — Aurora Song (unsplash.com/photos/TZP_LpztcQE)
- `leistungen-assessment.jpg` — Josh Hild (unsplash.com/photos/f_ok0989Jng)
- `leistungen-readiness.jpg` — Beth Rufener (unsplash.com/photos/OgqntOgPUP4)
- `leistungen-workshop.jpg` — Larisa Birta (unsplash.com/photos/slbOcNlWNHA)
- `leistungen-vibe.jpg` — Jens Thekkeveettil (unsplash.com/photos/dBWvUqBoOU8)
- `hero-partner.jpg` (Seite `/partner`) — Aurora Song (unsplash.com/photos/xY8k70slet0)
- `hero-governance.jpg` (Seite `/governance`) — Miguel Alcântara (unsplash.com/photos/v1w415C_HWs)
- `ueber-uns-chor.jpg` (Seite `/about`, Gesangsszene) — Green Liu (unsplash.com/photos/ZaZcvU_WuF8)
- `photo-1633991810204-8f75dafdd324.avif` (Insight "Wo ist das Gerät?") — Sidney Pearce (unsplash.com/photos/4Qv1wRxondk)
- `kundendaten-dashboard.jpg` (Insight "Bereit vor jedem Kundenbesuch") — Bluestonex (unsplash.com/photos/Es33oEXaRrE)
- `team-chat-ki.jpg` (Insight "Erst fragen, dann bauen") — John (unsplash.com/photos/2FPjlAyMQTA)
- `massschneiderung.jpg` (Insight "Warum sich massgeschneiderte Apps...") — Pina Messina (unsplash.com/photos/qQKv7r1BaRw)
- `dreieck-lineal.jpg` (Insight "Gut, schnell, günstig") — KC Shum (unsplash.com/photos/hZej0jWoF8g)
- `portal-tuer.jpg` (Insight "Kundschaft einbinden") — Greg Rosenke (unsplash.com/photos/1dnMXxhJT_g)
- `whatsapp-nachricht.jpg` (Insight "WhatsApp im Kundenkontakt") — Jakub Żerdzicki (unsplash.com/photos/zVraN8Nnc4c)
- `skizze-prozess.jpg` (Insight "Von der Idee zur laufenden App") — Daniel McCullough (unsplash.com/photos/-FPFq_trr2Y)
- `rohbau-aufmass.jpg` (Insight "Aufmass per Scan") — Oceane Picq (unsplash.com/photos/QKHc27ij_K0)
- `geraete-holztisch.jpg` (Insight "Eine App für alle Geräte") — Andy Illarionov (unsplash.com/photos/-WW8jBak7bo)
- `planer-fristen.jpg` (Insight "Was gilt für uns?") — Eric Rothermel (unsplash.com/photos/FoKO4DpXamQ)
- `besprechungsraum.jpg` (Insight "Probezeit ohne Bauchgefühl") — Mateusz Zatorski (unsplash.com/photos/wN9oyogyjQc)
- `gemeinsam-am-tisch.jpg` (Insight "Warum ein Chatfenster noch keine Anwendung ist") — Koda Bookkeeping (unsplash.com/photos/EwmBLsCDIgo)
- `karteikasten.jpg` (Insight "Dreimal dieselbe Firma") — Daniel Forsman (unsplash.com/photos/Ph4ZJrwf4x8)

SVG-Grafiken (KlangLinie, NetzGrafik, PfadGrafik, `src/components/icons/*`) sind Eigenentwicklungen im Brand-Stil.

## Sicherheit

Security-Header, CSP und die offene Aufgabe "Enforce HTTPS" sind in
[`docs/security-headers.md`](docs/security-headers.md) dokumentiert. Wichtig: Wird ein neuer
externer Dienst eingebunden, muss die CSP in `src/layouts/BaseLayout.astro` ergaenzt werden,
sonst blockiert der Browser ihn stillschweigend.

## Konventionen

Schweizer Hochdeutsch, kein «ß», keine em-Dashes in `src/`. Tonalitaet nach ADVANIS-Styleguide: direkt, keine Superlative, keine Floskeln.
