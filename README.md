# kurzerhand.ch

Marketing-Webseite der Brand «kurzerhand.» (eine Marke der ADVANIS AG). Astro, statischer Output.

## Entwicklung

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # statischer Output nach dist/
npm run preview    # dist/ lokal testen
npm run check      # Typ- und Template-Pruefung
```

## Vor dem Launch (Checkliste)

- [ ] `src/config.ts` befuellen: KONTAKT_EMAIL, FORMSPREE_ENDPOINT, BOOKING_URL, ADRESSE, UID
- [ ] Domain kurzerhand.ch registrieren, Hosting waehlen (Infomaniak/Cloudflare Pages), dist/ deployen
- [ ] Team-Nachnamen und Fotos auf /ueber-uns ergaenzen (`src/pages/ueber-uns.astro`)
- [ ] GL-Naming-Entscheid bestaetigt

## Struktur

- `src/config.ts` — alle veraenderlichen Werte an einer Stelle (Platzhalter bis Launch)
- `src/styles/global.css` — Design-Tokens (Light/Dark) und Basisstile
- `src/layouts/BaseLayout.astro` — Head/SEO, Header/Nav, Footer
- `src/components/` — CtaBanner, SaeulenGrid, QuerschnittBaender, PaketGrid
- `src/pages/` — alle Routen; `src/content/insights/` — Blog-Artikel als Markdown
- `docs/superpowers/` — Design-Spec und Implementierungsplan

## Bildnachweise

Alle Fotos via Unsplash (Unsplash-Lizenz: kommerzielle Nutzung erlaubt, keine Attribution noetig — Nennung als Geste):

- `hero-start.jpg` — Simon Infanger (unsplash.com/photos/hTC80VIVxoY)
- `hero-leistungen.jpg` — Ivy Tang (unsplash.com/photos/hB5wHFb9JpQ)
- `hero-plattform.jpg` — Minh Duc (unsplash.com/photos/lQIUbkn6jj4)
- `hero-pakete.jpg` — Annie Spratt (unsplash.com/photos/Csxx4yz6uaU)
- `hero-insights.jpg` — Alan Bowman (unsplash.com/photos/Jy8PdNvEp2w)
- `hero-ueber-uns.jpg` — Roger Benz (unsplash.com/photos/TL1lSPPCkj8)
- `hero-kontakt.jpg` — Wojciech Wyszkowski (unsplash.com/photos/Cscz8tPogHw)

SVG-Grafiken (BergLinie, NetzGrafik, PfadGrafik) sind Eigenentwicklungen im Brand-Stil.

## Konventionen

Schweizer Hochdeutsch, kein «ß», keine em-Dashes in `src/`. Tonalitaet nach ADVANIS-Styleguide: direkt, keine Superlative, keine Floskeln.
