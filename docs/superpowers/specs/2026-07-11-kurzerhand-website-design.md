# Design-Spec: kurzerhand.ch — Marketing-Webseite

**Datum:** 2026-07-11 · **Status:** Zur Review durch Sven
**Kontext:** Erster Go-to-market-Schritt der neuen ADVANIS Sub-Brand «kurzerhand.» (GL-Entscheid zum Naming ausstehend; Kandidat 1 wird vorgebaut). Grundlage: Brand Strategy Draft (Juli 2026), freigegebene Brand-Seite (HTML-Artifact), Naming-Recherche.

## 1. Ziel und Scope

Statisch generierte Marketing-Webseite für kurzerhand.ch. Zielgruppe: Entscheider in Deutschschweizer Unternehmen von 20 bis 5000 Mitarbeitenden, alle Branchen. Sprache: Deutsch (CH), kein ß, keine em-Dashes im Fliesstext. Ziel der Seite: Vertrauen aufbauen, Mehrwerte zeigen, Erstkontakt auslösen (Termin oder Formular).

**Nicht im Scope:** Login/Portal, i18n, CMS, Tracking/Analytics (später allenfalls cookiefreies Plausible), echte Preise, Kundenlogos.

## 2. Technik

- **Framework:** Astro (aktuelle stabile Version), rein statischer Output (`astro build` → `dist/`).
- **Styling:** Zentrale `src/styles/global.css` mit Design-Tokens (CSS Custom Properties). Kein Tailwind, kein CSS-Framework — das Design-System ist klein und eigen.
- **JS im Frontend:** Nur mobile Navigation (Burger-Toggle). Sonst zero JS.
- **Inhalte:** Seiten als `.astro`-Dateien; Insights-Artikel als Markdown in einer Astro Content Collection (`src/content/insights/`).
- **Komponenten:** `BaseLayout.astro` (Head/Meta/OG, Header, Footer), `Hero.astro`, `SaeulenGrid.astro`, `QuerschnittBand.astro`, `ProduktKarte.astro`, `PaketKarte.astro`, `TeamKarte.astro`, `CtaBanner.astro`.
- **SEO:** Sitemap (`@astrojs/sitemap`), `robots.txt`, individuelle Title/Description/OG pro Seite, semantisches HTML, saubere Heading-Hierarchie.
- **Repo:** `ADVANIS-AG/kurzerhand.ch` (dieses Repo). Deployment-Ziel: statisches Hosting (Infomaniak oder Cloudflare Pages), Entscheid separat.
- **CI (minimal):** GitHub Action: `npm ci && npm run build` als Prüfschritt bei jedem Push.

## 3. Seitenarchitektur

| Route | Zweck | Kernelemente |
|---|---|---|
| `/` | Überzeugen + Erstkontakt | Hero (Wortmarke, Claim «AI-Lösungen, die einfach laufen.», Sub «Geliefert in Wochen, nicht Monaten. Kurzerhand, aber nie leichtfertig.»), 3 Mehrwerte (verlässlich/schnell/wirtschaftlich), Säulen-Teaser (4 Karten), Produkt-Teaser (Plattform + 2 Verticals), anonymisierte Referenz-Zeilen, CTA-Banner |
| `/leistungen` | Leistungsportfolio | Die 4 Säulen im Detail; darunter die 3 horizontalen Querschnitts-Bänder (Trust & Governance, Vibe Engineering hervorgehoben, Continuous Innovation); Ablauf in 4 Schritten (Verstehen → Bauen → Betreiben → Weiterentwickeln) |
| `/plattform` | Produkt-Beweis | Enterprise AI Platform (Multi-Tenant, AI-Gateway, Meta-Engine, DSG/DSGVO, White-Label); Vertikal-Lösungen als anonymisierte Fallbeschreibungen: PM Sicherheitstechnik (D365-Modul-Ersatz), Bau-Plattform, HR-Plattform, Portal-Blaupause |
| `/pakete` | Kaufpfad | 4 Pakete ohne Preise (Starter/Professional/Enterprise/White-Label) mit Leistungsumfang, «Preis auf Anfrage»; FAQ: Geschwindigkeit, Code-Eigentum, Datenhaltung, Zusammenarbeit mit bestehender IT, Was ist Vibe Engineering? |
| `/insights` | Content-Marketing | Artikel-Liste aus Content Collection; zum Launch 2 Artikel (Themen: «Warum KMU jetzt eigene Apps bauen lassen können» und «Gut, schnell, günstig: warum das Dreieck nicht mehr gilt»); Navigation zeigt Insights ab Launch |
| `/ueber-uns` | Vertrauen | Story (ADVANIS-Herkunft: «eine Marke der ADVANIS AG», 28+ Jahre Beratungserfahrung im Rücken), Brand-DNA-Manifest (6 Sätze), Team-Grid |
| `/kontakt` | Konversion | Formular (Name, Firma, E-Mail, Nachricht) → Formspree-POST (Platzhalter-Endpoint `FORMSPREE_ENDPOINT`), Termin-CTA (Platzhalter-Link `BOOKING_URL`), E-Mail-Adresse (Platzhalter `KONTAKT_EMAIL`) |
| `/impressum` | Pflicht | «kurzerhand — eine Marke der ADVANIS AG», Adresse/UID als markierte Platzhalter (`[ADRESSE]`, `[UID]`) |
| `/datenschutz` | Pflicht | DSG-konforme Erklärung: Hosting-Logs, Formular-Daten (Formspree), keine Cookies, kein Tracking; Verantwortliche: ADVANIS AG (Platzhalter-Adresse) |

**Navigation:** Leistungen · Plattform · Pakete · Insights · Über uns + Button «Termin buchen» (→ `/kontakt`, bis Booking-Link existiert). Footer: Navigation, Impressum/Datenschutz, «Eine Marke der ADVANIS AG», Link advanis.ch.

## 4. Design-System

Aus der freigegebenen Brand-Seite übernommen:

- **Typografie:** "Helvetica Neue", Helvetica, Arial. Grosse, fette, eng gespationierte Headlines; Fliesstext ~65 Zeichen Breite.
- **Farben (Light):** Grund `#F7F6F2`, Tinte `#141311`, Soft `#4E4B44`, Linie `#D9D6CC`, Akzent Verkehrsblau `#0048C6`, Karten `#FFFFFF`.
- **Farben (Dark):** Grund `#12120F`, Tinte `#F2F0EA`, Akzent `#4D82F3`; via `prefers-color-scheme`.
- **Markenzeichen:** Der blaue Punkt — Wortmarke «kurzerhand.», Abschluss der DNA-Sätze, Listen-Marker.
- **Layout:** max. 1080px, asymmetrisch links ausgerichtet, harte 1px-Linien als Trenner, keine Rundungen über 2px, keine Schatten, keine Stock-Fotos.

## 5. Tonalität

Nach LinkedIn-ADVANIS-Styleguide: Schweizer Hochdeutsch, direkt, menschlich, keine Superlative, keine «nicht X sondern Y»-Rhetorik, keine em-Dashes. Jede Seite endet mit einer konkreten Einladung, nicht mit einer Floskel.

## 6. Team (Über uns)

| Name | Rolle |
|---|---|
| Thomas | CEO |
| Sven | CTO |
| Joel | Senior AI Architect |
| Alex | AI Architect |
| Sarah | AI Consultant |

Nachnamen und Fotos folgen; Layout sieht Foto-Slot vor (Platzhalter-Initialen bis dahin). Kurz-Statements pro Person schreibe ich als Entwurf.

## 7. Platzhalter bis Launch

`FORMSPREE_ENDPOINT` (Formspree-Konto noch nicht aktiv) · `BOOKING_URL` (nur CTA, Ziel folgt) · `KONTAKT_EMAIL` · `[ADRESSE]`/`[UID]` im Impressum — alle zentral in `src/config.ts` gepflegt, damit Sven sie an einer Stelle einträgt.

## 8. Qualität & Abnahme

- `npm run build` fehlerfrei; Links intern konsistent (Astro check).
- Visuelle Prüfung Desktop + Mobile (375px), Light + Dark.
- Lighthouse-Zielwerte: Performance ≥ 95, SEO ≥ 95, Accessibility ≥ 95.
- Texte: kein ß, keine em-Dashes (automatisierter grep-Check).
- Launch-Checkliste (separat vom Build): Domain kurzerhand.ch registrieren, Hosting wählen, Formspree-Konto, Platzhalter füllen, GL-Naming-Entscheid bestätigt.

## 9. Risiken

- **GL-Entscheid steht aus:** Falls die GL nicht «kurzerhand» wählt, bleibt die Struktur wiederverwendbar (Design-Tokens und Wortmarke sind zentralisiert; Umbenennung ist ein überschaubarer Umbau).
- **Domain noch nicht registriert:** kurzerhand.ch war am 11.07.2026 frei; Registrierung ist Voraussetzung für Launch und sollte sofort erfolgen (durch Sven).
