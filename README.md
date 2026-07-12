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

## Konventionen

Schweizer Hochdeutsch, kein «ß», keine em-Dashes in `src/`. Tonalitaet nach ADVANIS-Styleguide: direkt, keine Superlative, keine Floskeln.
