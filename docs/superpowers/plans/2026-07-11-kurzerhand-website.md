# kurzerhand.ch Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Statische Marketing-Webseite für die Brand «kurzerhand.» (Astro, 9 Routen), launch-fähig bis auf zentrale Platzhalter.

**Architecture:** Astro 5 mit rein statischem Output. Ein zentrales CSS-Design-System (Custom Properties, Light/Dark), ein `BaseLayout` mit Header/Nav/Footer/SEO-Meta, wiederverwendbare Astro-Komponenten, Seiten als `.astro`-Dateien, Insights als Markdown Content Collection. Einziges Frontend-JS: Burger-Navigation.

**Tech Stack:** Astro ^5, @astrojs/sitemap ^3, TypeScript (nur Config/Props), kein CSS-Framework, kein weiteres JS.

## Global Constraints

- Sprache: Schweizer Hochdeutsch. **Kein «ß»** (immer «ss»). **Kein em-Dash (—)** in `src/` (auch nicht in Kommentaren).
- Design-Tokens exakt: Light `--ground:#F7F6F2; --ink:#141311; --ink-soft:#4E4B44; --line:#D9D6CC; --accent:#0048C6; --card:#FFFFFF; --band:#ECEAE3`. Dark `--ground:#12120F; --ink:#F2F0EA; --ink-soft:#A7A398; --line:#33322C; --accent:#4D82F3; --card:#1B1A16; --band:#1F1E19`.
- Schrift: `"Helvetica Neue", Helvetica, Arial, sans-serif`. Content-Breite max. 1080px.
- Alle veränderlichen Werte (E-Mail, Formspree, Booking, Adresse, UID) **nur** in `src/config.ts`.
- Jede Seite hat individuelle `title` und `description`.
- `site: 'https://kurzerhand.ch'` in astro.config.mjs.
- Arbeitsverzeichnis: `~/Downloads/ClaudeCode - Temp/kurzerhand.ch` (Repo-Root). Nach jedem Task committen.

---

### Task 1: Projekt-Gerüst

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `public/robots.txt`, `src/config.ts`, `.github/workflows/build.yml`

**Interfaces:**
- Produces: `src/config.ts` exportiert `SITE_NAME`, `KONTAKT_EMAIL`, `FORMSPREE_ENDPOINT`, `BOOKING_URL`, `ADRESSE`, `UID` (alle `string`). `BOOKING_URL === ''` bedeutet: CTA zeigt auf `/kontakt`.

- [ ] **Step 1: Dateien anlegen**

`package.json`:
```json
{
  "name": "kurzerhand-website",
  "type": "module",
  "version": "0.1.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/sitemap": "^3.0.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.5.0"
  }
}
```

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kurzerhand.ch',
  integrations: [sitemap()],
});
```

`tsconfig.json`:
```json
{ "extends": "astro/tsconfigs/strict" }
```

`.gitignore`:
```
node_modules/
dist/
.astro/
```

`public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://kurzerhand.ch/sitemap-index.xml
```

`src/config.ts`:
```ts
// Zentrale Stellschrauben. Vor Launch von Sven zu befuellen.
export const SITE_NAME = 'kurzerhand.';
export const KONTAKT_EMAIL = 'PLATZHALTER_EMAIL';      // z.B. hallo@kurzerhand.ch
export const FORMSPREE_ENDPOINT = '';                   // leer = Formular deaktiviert, Hinweis wird angezeigt
export const BOOKING_URL = '';                          // leer = Termin-CTAs zeigen auf /kontakt
export const ADRESSE = 'PLATZHALTER_ADRESSE';           // ADVANIS AG, Strasse, PLZ Ort
export const UID = 'PLATZHALTER_UID';                   // CHE-...
```

`.github/workflows/build.yml`:
```yaml
name: build
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run build
```

- [ ] **Step 2: Installieren und Build prüfen**

Run: `npm install && npm run build`
Expected: Build schlägt fehl mit Hinweis auf fehlende `src/pages` (Astro braucht mindestens eine Seite) ODER läuft mit leerem Output durch, je nach Astro-Version. Falls Fehler «no pages found»: `mkdir -p src/pages && printf -- "---\n---\n<h1>bald.</h1>\n" > src/pages/index.astro` und erneut bauen.
Expected danach: `dist/index.html` existiert.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: Astro-Geruest, Config-Platzhalter, CI"
```

---

### Task 2: Design-System und BaseLayout

**Files:**
- Create: `src/styles/global.css`, `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro` (nutzt BaseLayout, Inhalt kommt in Task 4)

**Interfaces:**
- Produces: `BaseLayout.astro` mit Props `{ title: string; description: string; }`, rendert `<slot />` zwischen Header und Footer. CSS-Klassen für alle Folge-Tasks: `.wrap` (1080px-Container), `.eyebrow`, `.dot` (blauer Punkt), `.lede`, `.soft`, `.btn` (Akzent-Button), `.btn-ghost`, `section` (Padding + Trennlinie), `h1/h2/h3`-Skala.

- [ ] **Step 1: global.css schreiben**

`src/styles/global.css` (vollständig):
```css
:root {
  --ground:#F7F6F2; --ink:#141311; --ink-soft:#4E4B44; --line:#D9D6CC;
  --accent:#0048C6; --accent-ink:#FFFFFF; --card:#FFFFFF; --band:#ECEAE3;
}
@media (prefers-color-scheme: dark) {
  :root {
    --ground:#12120F; --ink:#F2F0EA; --ink-soft:#A7A398; --line:#33322C;
    --accent:#4D82F3; --accent-ink:#0B0B09; --card:#1B1A16; --band:#1F1E19;
  }
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0; background: var(--ground); color: var(--ink);
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  line-height: 1.55; -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
.eyebrow { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-soft); font-weight: 500; }
.dot { color: var(--accent); }
h1 { font-size: clamp(38px, 7vw, 72px); font-weight: 800; letter-spacing: -.04em; line-height: 1.0; margin: 16px 0 24px; text-wrap: balance; }
h2 { font-size: clamp(26px, 4vw, 38px); font-weight: 700; letter-spacing: -.025em; margin: 10px 0 20px; text-wrap: balance; }
h3 { font-size: 17px; font-weight: 700; letter-spacing: -.01em; margin: 0 0 10px; }
p { margin: 0 0 14px; }
.lede { font-size: 18px; max-width: 40em; }
.soft { color: var(--ink-soft); }
a { color: inherit; }
section { padding: 64px 0; border-bottom: 1px solid var(--line); }
.btn {
  display: inline-block; background: var(--accent); color: var(--accent-ink);
  padding: 12px 22px; font-weight: 700; text-decoration: none; font-size: 15px;
  border: 1px solid var(--accent);
}
.btn:hover { filter: brightness(1.08); }
.btn-ghost {
  display: inline-block; background: transparent; color: var(--ink);
  padding: 12px 22px; font-weight: 700; text-decoration: none; font-size: 15px;
  border: 1px solid var(--ink);
}
.karten { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.karten-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.karte { background: var(--card); border: 1px solid var(--line); padding: 20px 18px; }
.karte ul { list-style: none; margin: 0; padding: 0; }
.karte li { padding: 5px 0; border-top: 1px solid var(--line); font-size: 14px; color: var(--ink-soft); }
.tag { display: inline-block; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); font-weight: 600; margin-bottom: 8px; }
/* Header */
header.site { border-bottom: 2px solid var(--ink); background: var(--ground); position: sticky; top: 0; z-index: 10; }
.nav { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; max-width: 1080px; margin: 0 auto; }
.wortmarke { font-weight: 800; font-size: 22px; letter-spacing: -.03em; text-decoration: none; }
.nav-links { display: flex; align-items: center; gap: 22px; list-style: none; margin: 0; padding: 0; }
.nav-links a { text-decoration: none; font-size: 15px; font-weight: 500; }
.nav-links a:hover { color: var(--accent); }
.nav-links .btn { padding: 9px 16px; }
.burger { display: none; background: none; border: 1px solid var(--ink); padding: 8px 10px; font: inherit; color: var(--ink); cursor: pointer; }
/* Footer */
footer.site { padding: 40px 0 60px; }
footer.site nav { display: flex; flex-wrap: wrap; gap: 18px; margin-bottom: 18px; }
footer.site nav a { font-size: 14px; text-decoration: none; color: var(--ink-soft); }
footer.site nav a:hover { color: var(--accent); }
.absender { font-size: 13px; color: var(--ink-soft); }
@media (max-width: 760px) {
  .karten { grid-template-columns: 1fr 1fr; }
  .karten-2 { grid-template-columns: 1fr; }
  .burger { display: block; }
  .nav-links { display: none; position: absolute; top: 100%; left: 0; right: 0;
    flex-direction: column; align-items: flex-start; background: var(--ground);
    border-bottom: 2px solid var(--ink); padding: 16px 24px 20px; gap: 14px; }
  .nav-links.offen { display: flex; }
}
@media (max-width: 460px) { .karten { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

- [ ] **Step 2: BaseLayout.astro schreiben**

`src/layouts/BaseLayout.astro` (vollständig):
```astro
---
import '../styles/global.css';
import { SITE_NAME, BOOKING_URL } from '../config';
interface Props { title: string; description: string; }
const { title, description } = Astro.props;
const terminZiel = BOOKING_URL || '/kontakt';
const nav = [
  ['/leistungen', 'Leistungen'],
  ['/plattform', 'Plattform'],
  ['/pakete', 'Pakete'],
  ['/insights', 'Insights'],
  ['/ueber-uns', 'Über uns'],
];
---
<!doctype html>
<html lang="de-CH">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <link rel="canonical" href={new URL(Astro.url.pathname, Astro.site)} />
</head>
<body>
  <header class="site">
    <div class="nav">
      <a class="wortmarke" href="/">kurzerhand<span class="dot">.</span></a>
      <button class="burger" aria-expanded="false" aria-controls="nav-links">Menü</button>
      <ul class="nav-links" id="nav-links">
        {nav.map(([href, label]) => <li><a href={href}>{label}</a></li>)}
        <li><a class="btn" href={terminZiel}>Termin buchen</a></li>
      </ul>
    </div>
  </header>
  <main><slot /></main>
  <footer class="site">
    <div class="wrap">
      <nav>
        {nav.map(([href, label]) => <a href={href}>{label}</a>)}
        <a href="/kontakt">Kontakt</a>
        <a href="/impressum">Impressum</a>
        <a href="/datenschutz">Datenschutz</a>
      </nav>
      <p class="absender">{SITE_NAME} ist eine Marke der <a href="https://www.advanis.ch">ADVANIS AG</a>. Schweizer Qualität, AI-native Umsetzung.</p>
    </div>
  </footer>
  <script>
    const b = document.querySelector('.burger');
    const l = document.getElementById('nav-links');
    b?.addEventListener('click', () => {
      const offen = l?.classList.toggle('offen');
      b.setAttribute('aria-expanded', String(!!offen));
    });
  </script>
</body>
</html>
```

- [ ] **Step 3: index.astro auf Layout umstellen (Minimalinhalt)**

`src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="kurzerhand. | AI-Lösungen, die einfach laufen" description="AI-Lösungen für Schweizer Unternehmen. Geliefert in Wochen, nicht Monaten.">
  <section><div class="wrap"><h1>kurzerhand<span class="dot">.</span></h1></div></section>
</BaseLayout>
```

- [ ] **Step 4: Build prüfen**

Run: `npm run build`
Expected: exit 0, `dist/index.html` enthält `wortmarke`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: Design-System (Tokens, Light/Dark) und BaseLayout mit Nav/Footer"
```

---

### Task 3: Wiederverwendbare Komponenten

**Files:**
- Create: `src/components/CtaBanner.astro`, `src/components/SaeulenGrid.astro`, `src/components/QuerschnittBaender.astro`, `src/components/PaketGrid.astro`

**Interfaces:**
- Produces:
  - `CtaBanner.astro` Props `{ titel: string; text: string; }` (Button-Ziel intern: `BOOKING_URL || '/kontakt'`, Button-Text «Termin buchen», Zweitlink «Oder schreiben Sie uns» → `/kontakt`).
  - `SaeulenGrid.astro` keine Props; rendert die 4 Säulen fix.
  - `QuerschnittBaender.astro` keine Props; rendert die 3 Bänder fix (Vibe Engineering hervorgehoben).
  - `PaketGrid.astro` keine Props; rendert die 4 Pakete fix, «Preis auf Anfrage».

- [ ] **Step 1: CtaBanner.astro**

```astro
---
import { BOOKING_URL } from '../config';
interface Props { titel: string; text: string; }
const { titel, text } = Astro.props;
const ziel = BOOKING_URL || '/kontakt';
---
<section>
  <div class="wrap">
    <h2>{titel}</h2>
    <p class="lede soft">{text}</p>
    <p style="display:flex; gap:12px; flex-wrap:wrap; margin-top:22px;">
      <a class="btn" href={ziel}>Termin buchen</a>
      <a class="btn-ghost" href="/kontakt">Oder schreiben Sie uns</a>
    </p>
  </div>
</section>
```

- [ ] **Step 2: SaeulenGrid.astro**

```astro
---
const saeulen = [
  { titel: 'Strategy', punkte: ['AI Strategy', 'Assessments', 'Roadmaps', 'Governance by Design'] },
  { titel: 'Enterprise AI Platform', punkte: ['AI Agents', 'Workflows', 'Knowledge', 'Integrationen und Analytics'] },
  { titel: 'Managed AI', punkte: ['Monitoring', 'Support', 'Continuous Improvement', 'AI Lifecycle'] },
  { titel: 'Enablement', punkte: ['Training', 'Change und Adoption', 'CX und EX'] },
];
---
<div class="karten">
  {saeulen.map(s => (
    <div class="karte" style="border-top: 4px solid var(--ink);">
      <h3>{s.titel}</h3>
      <ul>{s.punkte.map(p => <li>{p}</li>)}</ul>
    </div>
  ))}
</div>
```

- [ ] **Step 3: QuerschnittBaender.astro**

```astro
---
const baender = [
  { label: 'Trust und Governance', text: 'Schweizer Hosting, DSG/DSGVO, Nachvollziehbarkeit und Modellwahl. Nicht als Hindernis, sondern als Enabler.', motor: false },
  { label: 'Vibe Engineering', text: 'Unsere Delivery Engine: AI-natives Entwickeln auf erprobter Plattform. Der Grund, warum wir liefern, während andere planen.', motor: true },
  { label: 'Continuous Innovation', text: 'AI ist nie fertig. Jede Lösung lernt weiter, jeden Monat ein Stück besser.', motor: false },
];
---
<div style="display:grid; gap:12px; margin-top:14px;">
  {baender.map(b => (
    <div style={`display:flex; gap:14px; align-items:baseline; flex-wrap:wrap; padding:12px 16px; border:1px solid ${b.motor ? 'var(--accent)' : 'var(--line)'}; background:${b.motor ? 'var(--accent)' : 'var(--band)'}; color:${b.motor ? 'var(--accent-ink)' : 'inherit'};`}>
      <strong style="font-size:12px; letter-spacing:.12em; text-transform:uppercase; white-space:nowrap;">{b.label}</strong>
      <span style="font-size:14px; opacity:.9;">{b.text}</span>
    </div>
  ))}
</div>
```

- [ ] **Step 4: PaketGrid.astro**

```astro
---
const pakete = [
  { name: 'Starter', text: 'Der schnelle Einstieg: ein klar umrissener Use Case, fixer Rahmen, spürbares Ergebnis in Wochen.' },
  { name: 'Professional', text: 'Mehrere Module, SSO und API-Zugang. Für Unternehmen, die nach dem ersten Erfolg ausbauen.' },
  { name: 'Enterprise', text: 'Unbegrenzt skalierbar, mit Managed AI, Governance-Betrieb und garantierten Reaktionszeiten.' },
  { name: 'White-Label', text: 'Eigene Marke, eigene Domain, Reseller-Modell. Für Partner, die auf unserer Plattform aufbauen.' },
];
---
<div class="karten">
  {pakete.map(p => (
    <div class="karte">
      <h3>{p.name}</h3>
      <p style="font-size:14px;" class="soft">{p.text}</p>
      <p class="tag" style="margin-top:8px;">Preis auf Anfrage</p>
    </div>
  ))}
</div>
```

- [ ] **Step 5: Build prüfen und committen**

Run: `npm run build` — Expected: exit 0 (Komponenten sind noch unbenutzt, Astro baut trotzdem).
```bash
git add -A && git commit -m "feat: Kernkomponenten CtaBanner, SaeulenGrid, QuerschnittBaender, PaketGrid"
```

---

### Task 4: Startseite

**Files:**
- Modify: `src/pages/index.astro` (kompletter Inhalt)

**Interfaces:**
- Consumes: `BaseLayout`, `SaeulenGrid`, `QuerschnittBaender`, `CtaBanner`.

- [ ] **Step 1: Startseite schreiben** (vollständige Copy)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SaeulenGrid from '../components/SaeulenGrid.astro';
import QuerschnittBaender from '../components/QuerschnittBaender.astro';
import CtaBanner from '../components/CtaBanner.astro';
---
<BaseLayout title="kurzerhand. | AI-Lösungen, die einfach laufen" description="AI-Lösungen für Schweizer Unternehmen: von der Strategie bis zum laufenden Betrieb. Geliefert in Wochen, nicht Monaten. Eine Marke der ADVANIS AG.">
  <section style="padding: 96px 0 72px; border-bottom: 2px solid var(--ink);">
    <div class="wrap">
      <p class="eyebrow">AI für Schweizer Unternehmen</p>
      <h1>AI-Lösungen, die einfach laufen<span class="dot">.</span></h1>
      <p class="lede">Wir bauen intelligente Anwendungen für Unternehmen, die keine Lust auf monatelange IT-Projekte haben. Geliefert in Wochen. Kurzerhand, aber nie leichtfertig.</p>
      <p style="display:flex; gap:12px; flex-wrap:wrap; margin-top:26px;">
        <a class="btn" href="/kontakt">Termin buchen</a>
        <a class="btn-ghost" href="/plattform">Was wir gebaut haben</a>
      </p>
    </div>
  </section>

  <section>
    <div class="wrap">
      <p class="eyebrow">Warum kurzerhand</p>
      <h2>Verlässlich. Schnell. Wirtschaftlich. Sie müssen nicht mehr wählen.</h2>
      <div class="karten" style="grid-template-columns: repeat(3, 1fr);">
        <div class="karte">
          <h3>Verlässlich<span class="dot">.</span></h3>
          <p style="font-size:14px;" class="soft">Schweizer Hosting, DSG/DSGVO-konform, nachvollziehbare Modellwahl. Und ein Partner, der nach dem Go-live nicht verschwindet.</p>
        </div>
        <div class="karte">
          <h3>Schnell<span class="dot">.</span></h3>
          <p style="font-size:14px;" class="soft">Wir entwickeln AI-nativ auf einer erprobten Plattform. Was andere in Monaten planen, steht bei uns in Wochen im Betrieb.</p>
        </div>
        <div class="karte">
          <h3>Wirtschaftlich<span class="dot">.</span></h3>
          <p style="font-size:14px;" class="soft">Weniger Aufwand pro Lösung heisst tiefere Kosten. Sie zahlen für Ergebnisse, nicht für Konzeptpapiere.</p>
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <p class="eyebrow">Was wir tun</p>
      <h2>Von der Strategie bis zum kontinuierlich lernenden AI-Betrieb.</h2>
      <SaeulenGrid />
      <QuerschnittBaender />
      <p style="margin-top:18px;"><a href="/leistungen">Alle Leistungen im Detail →</a></p>
    </div>
  </section>

  <section>
    <div class="wrap">
      <p class="eyebrow">Beweise statt Versprechen</p>
      <h2>Läuft bereits. Bei Unternehmen wie Ihrem.</h2>
      <div class="karten-2">
        <div class="karte">
          <span class="tag">Fallbeispiel</span>
          <h3>Sicherheitstechnik: D365-Projektmodul ersetzt</h3>
          <p style="font-size:14px;" class="soft">Ein Schweizer Sicherheitstechnik-Unternehmen steuert Projekte, Offerten und Service-Einsätze jetzt in einer massgeschneiderten App. Gebaut in Tagen, integriert mit Dynamics 365.</p>
        </div>
        <div class="karte">
          <span class="tag">Plattform</span>
          <h3>Enterprise AI Platform</h3>
          <p style="font-size:14px;" class="soft">Multi-Tenant, AI-Gateway, White-Label-fähig, DSG/DSGVO-ready. Das Fundament, auf dem jede unserer Lösungen steht.</p>
        </div>
      </div>
      <p style="margin-top:18px;"><a href="/plattform">Zur Plattform und allen Lösungen →</a></p>
    </div>
  </section>

  <CtaBanner titel="Reden wir über Ihren ersten Use Case." text="30 Minuten genügen, um herauszufinden, wo AI in Ihrem Unternehmen am schnellsten Wirkung zeigt. Unverbindlich, konkret, auf Augenhöhe." />
</BaseLayout>
```

- [ ] **Step 2: Build und Sichtprüfung**

Run: `npm run build && grep -c "karte" dist/index.html`
Expected: exit 0, Treffer > 4.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: Startseite mit Hero, Mehrwerten, Saeulen-Teaser, Beweisen, CTA"
```

---

### Task 5: Leistungen

**Files:**
- Create: `src/pages/leistungen.astro`

**Interfaces:**
- Consumes: `BaseLayout`, `SaeulenGrid`, `QuerschnittBaender`, `CtaBanner`.

- [ ] **Step 1: Seite schreiben**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SaeulenGrid from '../components/SaeulenGrid.astro';
import QuerschnittBaender from '../components/QuerschnittBaender.astro';
import CtaBanner from '../components/CtaBanner.astro';
const details = [
  { titel: 'Strategy', text: 'Wir starten nicht mit Technologie, sondern mit Ihrem Geschäft: Wo entsteht mit AI echter Mehrwert? Assessments zeigen Potenziale und Risiken, Roadmaps machen sie planbar, Governance by Design sorgt dafür, dass Datenschutz und Compliance von Anfang an eingebaut sind statt nachgerüstet.' },
  { titel: 'Enterprise AI Platform', text: 'Unsere Plattform bringt mit, was jedes AI-Vorhaben braucht: AI Agents, Workflows, Wissensmanagement, Integrationen in Ihre Systeme (Microsoft 365, Dynamics, SAP, Salesforce) und Analytics. Multi-Tenant, White-Label-fähig, betrieben in der Schweiz oder in Ihrer Umgebung.' },
  { titel: 'Managed AI', text: 'Nach dem Go-live fängt unsere Arbeit erst an. Wir überwachen Qualität und Kosten, halten Modelle und Integrationen aktuell und verbessern die Lösung kontinuierlich. Sie bekommen einen Betrieb, der mitdenkt, mit klaren Reaktionszeiten.' },
  { titel: 'Enablement', text: 'Die beste Lösung nützt nichts, wenn niemand sie nutzt. Wir schulen Ihre Teams, begleiten die Einführung und gestalten Employee und Customer Experience so, dass die neue Arbeitsweise selbstverständlich wird.' },
];
const ablauf = [
  ['Verstehen', 'Wir hören zu, schauen uns Ihre Prozesse an und finden den Use Case mit dem besten Verhältnis von Aufwand zu Wirkung.'],
  ['Bauen', 'AI-natives Entwickeln auf unserer Plattform: erster funktionierender Stand in Tagen, produktive Lösung in Wochen.'],
  ['Betreiben', 'Monitoring, Support und Governance im laufenden Betrieb. Verlässlich und messbar.'],
  ['Weiterentwickeln', 'Ihre Lösung lernt dazu: neue Anforderungen, neue Modelle, neue Möglichkeiten, laufend integriert.'],
];
---
<BaseLayout title="Leistungen | kurzerhand." description="AI Strategy, Enterprise AI Platform, Managed AI und Enablement: vier Säulen, getragen von Trust, Governance und Vibe Engineering.">
  <section style="padding: 88px 0 64px;">
    <div class="wrap">
      <p class="eyebrow">Leistungen</p>
      <h1>Vier Säulen. Ein Versprechen<span class="dot">.</span></h1>
      <p class="lede">Alles aus einer Hand: von der ersten Idee bis zum Betrieb, der nie stillsteht. Getragen von Prinzipien, die jede Leistung durchziehen.</p>
    </div>
  </section>
  <section>
    <div class="wrap">
      <SaeulenGrid />
      <QuerschnittBaender />
    </div>
  </section>
  <section>
    <div class="wrap">
      <p class="eyebrow">Im Detail</p>
      {details.map(d => (
        <div style="padding: 22px 0; border-top: 1px solid var(--line);">
          <h3 style="font-size: 22px;">{d.titel}<span class="dot">.</span></h3>
          <p class="soft" style="max-width: 46em;">{d.text}</p>
        </div>
      ))}
    </div>
  </section>
  <section>
    <div class="wrap">
      <p class="eyebrow">So arbeiten wir</p>
      <h2>Vier Schritte. Kein Wasserfall.</h2>
      <div class="karten">
        {ablauf.map(([t, x], i) => (
          <div class="karte">
            <p class="tag">Schritt {i + 1}</p>
            <h3>{t}</h3>
            <p style="font-size:14px;" class="soft">{x}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
  <CtaBanner titel="Welcher Use Case zuerst?" text="Bringen Sie einen Prozess mit, der Sie nervt. Wir sagen Ihnen in 30 Minuten, ob und wie schnell AI ihn übernehmen kann." />
</BaseLayout>
```

- [ ] **Step 2: Build prüfen und committen**

Run: `npm run build` — Expected: exit 0, `dist/leistungen/index.html` existiert.
```bash
git add -A && git commit -m "feat: Leistungsseite mit Saeulen-Details und Ablauf"
```

---

### Task 6: Plattform

**Files:**
- Create: `src/pages/plattform.astro`

**Interfaces:**
- Consumes: `BaseLayout`, `CtaBanner`.

- [ ] **Step 1: Seite schreiben**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import CtaBanner from '../components/CtaBanner.astro';
const features = [
  ['AI Agents', 'Assistenten, die Aufgaben erledigen statt nur antworten: mit Zugriff auf Ihre Daten, Regeln und Systeme.'],
  ['Workflows', 'Automatisierte Abläufe über Systemgrenzen hinweg, mit Freigaben durch Menschen, wo es darauf ankommt.'],
  ['Knowledge', 'Ihr Firmenwissen, durchsuchbar und nutzbar: Dokumente, Systeme und Erfahrung an einem Ort.'],
  ['Integrationen', 'Microsoft 365, Dynamics 365, SAP, Salesforce und mehr: wir docken an, was Sie schon haben.'],
  ['Analytics', 'Nutzung, Qualität und Kosten jeder AI-Funktion, transparent im Dashboard.'],
  ['Governance', 'Rollen, Audit-Log, Feldverschlüsselung, DSG/DSGVO-Werkzeuge: eingebaut, nicht angeflanscht.'],
];
const faelle = [
  { tag: 'Sicherheitstechnik', titel: 'Projektmanagement statt D365-Modul', text: 'Ein Schweizer Sicherheitstechnik-Unternehmen ersetzt sein Dynamics-365-Projektmodul: Offerten mit Kalkulation, Projektstrukturen, Service-Disposition mit mobilem Rapport und Kundenunterschrift, vollständige D365-Integration. Vom Konzept zur getesteten Anwendung in Tagen.' },
  { tag: 'Bauwirtschaft', titel: 'Branchen-Plattform mit Lizenzmodell', text: 'Multi-Tenant-Plattform für die Bauwirtschaft: Onboarding-Wizard, Rollenmodell für alle Beteiligten vom Generalunternehmer bis zum Lieferanten, DSG/DSGVO-Modul und White-Label-Fähigkeit für Partner.' },
  { tag: 'Human Resources', titel: 'HR-Plattform mit AI-Assistent', text: 'Interne HR-Plattform mit Microsoft-365-Integration, Analytics-Dashboards und AI-Assistent mit Governance-Regeln: Schulungen, Zertifikate und Prozesse an einem Ort.' },
  { tag: 'Portale', titel: 'Self-Service für Kunden und Partner', text: 'Produktionsreife Blaupause für Kundenportale: vier Portale auf einer Plattform, von der öffentlichen Landing Page über Verwaltung und Partnerzugang bis zum Teilnehmerbereich mit Magic-Link-Login.' },
];
---
<BaseLayout title="Plattform und Lösungen | kurzerhand." description="Die Enterprise AI Platform von kurzerhand: AI Agents, Workflows, Knowledge, Integrationen. Und die Lösungen, die bereits darauf laufen.">
  <section style="padding: 88px 0 64px;">
    <div class="wrap">
      <p class="eyebrow">Plattform</p>
      <h1>Wir fangen nie bei null an<span class="dot">.</span></h1>
      <p class="lede">Jede kurzerhand-Lösung steht auf unserer Enterprise AI Platform: erprobt, sicher, White-Label-fähig. Darum sind wir schnell, ohne leichtfertig zu sein.</p>
    </div>
  </section>
  <section>
    <div class="wrap">
      <p class="eyebrow">Was die Plattform mitbringt</p>
      <h2>Das Fundament jeder Lösung.</h2>
      <div class="karten" style="grid-template-columns: repeat(3, 1fr);">
        {features.map(([t, x]) => (
          <div class="karte">
            <h3>{t}</h3>
            <p style="font-size:14px;" class="soft">{x}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
  <section>
    <div class="wrap">
      <p class="eyebrow">Fallbeispiele</p>
      <h2>Läuft bereits.</h2>
      <div class="karten-2">
        {faelle.map(f => (
          <div class="karte">
            <span class="tag">{f.tag}</span>
            <h3>{f.titel}</h3>
            <p style="font-size:14px;" class="soft">{f.text}</p>
          </div>
        ))}
      </div>
      <p class="soft" style="margin-top:16px; font-size:13px;">Aus Diskretion nennen wir hier keine Kundennamen. Im Gespräch zeigen wir gerne mehr.</p>
    </div>
  </section>
  <CtaBanner titel="Sehen statt glauben." text="Wir zeigen Ihnen die Plattform und ein Fallbeispiel aus Ihrer Branche. Live, nicht auf Folien." />
</BaseLayout>
```

- [ ] **Step 2: Build prüfen und committen**

Run: `npm run build` — Expected: exit 0, `dist/plattform/index.html` existiert.
```bash
git add -A && git commit -m "feat: Plattformseite mit Features und anonymisierten Fallbeispielen"
```

---

### Task 7: Pakete

**Files:**
- Create: `src/pages/pakete.astro`

**Interfaces:**
- Consumes: `BaseLayout`, `PaketGrid`, `CtaBanner`.

- [ ] **Step 1: Seite schreiben**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PaketGrid from '../components/PaketGrid.astro';
import CtaBanner from '../components/CtaBanner.astro';
const faq = [
  ['Wie schnell geht es wirklich?', 'Der erste funktionierende Stand steht in der Regel nach wenigen Tagen, die produktive Lösung nach zwei bis sechs Wochen, je nach Umfang und Integrationen. Sie sehen von Anfang an Zwischenstände statt Statusberichte.'],
  ['Wem gehört der Code?', 'Ihnen. Individuelle Entwicklungen gehen in Ihr Eigentum über. Die Plattform nutzen Sie als Lizenz, bei White-Label auch unter Ihrer eigenen Marke.'],
  ['Wo liegen unsere Daten?', 'Standardmässig in der Schweiz. Auf Wunsch in Ihrer eigenen Cloud oder On-Premises. Die Modellwahl (auch Schweizer und europäische Anbieter) treffen wir gemeinsam und dokumentieren sie.'],
  ['Ersetzt ihr unsere IT?', 'Nein, wir ergänzen sie. Wir integrieren uns in bestehende Systeme und übergeben so, dass Ihre IT jederzeit mitreden und übernehmen kann.'],
  ['Was ist Vibe Engineering?', 'Unsere Art zu arbeiten: Wir entwickeln mit AI, auf einer erprobten Plattform, in kurzen Zyklen mit täglich sichtbarem Fortschritt. Sie müssen den Begriff nicht kennen. Sie merken ihn am Tempo.'],
];
---
<BaseLayout title="Pakete | kurzerhand." description="Vier Pakete von Starter bis White-Label. Einsteigen, wachsen, skalieren: immer mit klarem Rahmen und ohne Überraschungen.">
  <section style="padding: 88px 0 64px;">
    <div class="wrap">
      <p class="eyebrow">Pakete</p>
      <h1>Einsteigen, wachsen, skalieren<span class="dot">.</span></h1>
      <p class="lede">Jedes Engagement beginnt mit einem klaren Rahmen: Umfang, Zeit und Budget vereinbart, bevor wir starten. Keine Überraschungen, kein Kleingedrucktes.</p>
    </div>
  </section>
  <section>
    <div class="wrap">
      <PaketGrid />
    </div>
  </section>
  <section>
    <div class="wrap">
      <p class="eyebrow">Häufige Fragen</p>
      <h2>Klartext.</h2>
      {faq.map(([f, a]) => (
        <details style="border-top: 1px solid var(--line); padding: 14px 0;">
          <summary style="font-weight: 700; cursor: pointer; font-size: 17px;">{f}</summary>
          <p class="soft" style="margin-top: 10px; max-width: 46em;">{a}</p>
        </details>
      ))}
    </div>
  </section>
  <CtaBanner titel="Welches Paket passt?" text="Sagen Sie uns, was Sie vorhaben. Wir sagen Ihnen ehrlich, welches Paket es braucht und welches nicht." />
</BaseLayout>
```

- [ ] **Step 2: Build prüfen und committen**

Run: `npm run build` — Expected: exit 0, `dist/pakete/index.html` existiert.
```bash
git add -A && git commit -m "feat: Paketseite mit vier Paketen und FAQ"
```

---

### Task 8: Insights (Content Collection)

**Files:**
- Create: `src/content.config.ts`, `src/content/insights/dreieck-gilt-nicht-mehr.md`, `src/content/insights/kmu-eigene-apps.md`, `src/pages/insights/index.astro`, `src/pages/insights/[slug].astro`

**Interfaces:**
- Produces: Collection `insights` mit Schema `{ title: string; description: string; pubDate: Date }`. Artikel-URLs: `/insights/<dateiname-ohne-endung>`.

- [ ] **Step 1: content.config.ts**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
  }),
});

export const collections = { insights };
```

- [ ] **Step 2: Artikel 1** — `src/content/insights/dreieck-gilt-nicht-mehr.md`

```markdown
---
title: "Gut, schnell, günstig: warum das Dreieck nicht mehr gilt"
description: "Jahrzehntelang galt: wähle zwei von drei. AI-natives Entwickeln bricht diese Regel. Was das für Schweizer Unternehmen bedeutet."
pubDate: 2026-07-11
---

Jeder, der einmal ein IT-Projekt eingekauft hat, kennt die Regel: gut, schnell, günstig. Wähle zwei. Wer Qualität und Tempo wollte, zahlte. Wer Qualität und Preis wollte, wartete.

Diese Regel stammt aus einer Welt, in der jede Zeile Code von Hand geschrieben, jedes Konzept in Workshops verhandelt und jede Anpassung neu beauftragt wurde. Diese Welt gibt es noch. Aber sie ist nicht mehr die einzige.

## Was sich geändert hat

AI-natives Entwickeln bedeutet: Ein grosser Teil der Arbeit, die früher Wochen kostete, passiert heute in Stunden. Nicht, weil weniger sorgfältig gearbeitet wird, sondern weil die Werkzeuge andere sind. Der Mensch entscheidet, prüft und verantwortet. Die Routine übernimmt die Maschine.

Dazu kommt der zweite Hebel: die Plattform. Wer jedes Projekt bei null beginnt, bezahlt jedes Mal das Fundament neu. Wer auf einer erprobten Plattform baut, bezahlt nur noch das, was sein Unternehmen einzigartig macht.

## Woran Sie seriöse Anbieter erkennen

Tempo allein ist kein Qualitätsmerkmal. Drei Fragen helfen:

1. **Zeigt der Anbieter laufende Lösungen statt Folien?** Wer liefern kann, zeigt Software. Wer nicht, zeigt Roadmaps.
2. **Ist Governance eingebaut oder ein Kapitel im Angebot?** Datenschutz, Nachvollziehbarkeit und Modellwahl gehören ins Fundament, nicht in den Anhang.
3. **Was passiert nach dem Go-live?** AI-Lösungen sind nie fertig. Ohne Betrieb und Weiterentwicklung veralten sie schneller als klassische Software.

Das Dreieck war nie ein Naturgesetz. Es war der Preis einer Arbeitsweise. Die Arbeitsweise hat sich geändert.
```

- [ ] **Step 3: Artikel 2** — `src/content/insights/kmu-eigene-apps.md`

```markdown
---
title: "Warum sich massgeschneiderte Apps jetzt auch für KMU rechnen"
description: "Individualsoftware war Grossunternehmen vorbehalten. Mit AI-nativer Entwicklung ändert sich die Rechnung, und zwar deutlich."
pubDate: 2026-07-11
---

Standardsoftware ist ein guter Deal, solange Ihre Prozesse Standard sind. Sobald sie es nicht sind, beginnt das Verbiegen: Excel-Inseln neben dem ERP, Doppelerfassung, Workarounds, die nur eine Person versteht.

Die Alternative, eine eigene Anwendung, war bisher eine Frage der Firmengrösse. Sechsstellige Budgets, zwölf Monate Projektlaufzeit, danach ein Wartungsvertrag. Für ein Unternehmen mit 50 Mitarbeitenden selten zu rechtfertigen.

## Die neue Rechnung

AI-native Entwicklung auf einer erprobten Plattform verändert beide Seiten der Gleichung:

- **Die Kosten sinken**, weil Routine-Entwicklung automatisiert ist und das Fundament (Login, Rechte, Datenschutz, Integrationen) schon steht.
- **Der Nutzen steigt**, weil die App exakt Ihren Prozess abbildet statt eines Branchendurchschnitts. Und weil AI-Funktionen (Assistenten, Automatisierung, Auswertungen) von Anfang an eingebaut sind.

Konkret: Was vor drei Jahren ein Jahresprojekt war, ist heute in Wochen produktiv. Ein Beispiel aus unserer Arbeit: Ein Schweizer Unternehmen der Sicherheitstechnik ersetzt sein Dynamics-365-Projektmodul durch eine massgeschneiderte Anwendung. Offerten, Projektstrukturen, Service-Einsätze mit mobilem Rapport. Erster lauffähiger Stand: nach Tagen.

## Womit anfangen?

Nicht mit dem grössten Problem, sondern mit dem nervigsten wiederkehrenden. Der Prozess, bei dem Ihre Leute seufzen. Genau dort zeigt eine massgeschneiderte Lösung am schnellsten, was sie kann. Danach wächst sie mit.
```

- [ ] **Step 4: Übersicht** — `src/pages/insights/index.astro`

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
const artikel = (await getCollection('insights')).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
const datumFmt = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
---
<BaseLayout title="Insights | kurzerhand." description="Klartext zu AI im Unternehmen: was funktioniert, was nicht, und woran Sie den Unterschied erkennen.">
  <section style="padding: 88px 0 64px;">
    <div class="wrap">
      <p class="eyebrow">Insights</p>
      <h1>Klartext zu AI<span class="dot">.</span></h1>
      <p class="lede">Keine Trends, keine Panik. Was in Schweizer Unternehmen wirklich funktioniert.</p>
    </div>
  </section>
  <section>
    <div class="wrap">
      {artikel.map(a => (
        <article style="padding: 22px 0; border-top: 1px solid var(--line);">
          <p class="eyebrow">{datumFmt.format(a.data.pubDate)}</p>
          <h2 style="margin: 6px 0 8px;"><a href={`/insights/${a.id.replace(/\.md$/, '')}`} style="text-decoration:none;">{a.data.title}</a></h2>
          <p class="soft" style="max-width: 46em;">{a.data.description}</p>
        </article>
      ))}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 5: Artikelseite** — `src/pages/insights/[slug].astro`

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection, render } from 'astro:content';
export async function getStaticPaths() {
  const artikel = await getCollection('insights');
  return artikel.map(a => ({ params: { slug: a.id.replace(/\.md$/, '') }, props: { a } }));
}
const { a } = Astro.props;
const { Content } = await render(a);
const datumFmt = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
---
<BaseLayout title={`${a.data.title} | kurzerhand.`} description={a.data.description}>
  <section style="padding: 88px 0 40px;">
    <div class="wrap" style="max-width: 760px;">
      <p class="eyebrow">{datumFmt.format(a.data.pubDate)}</p>
      <h1 style="font-size: clamp(30px, 5vw, 48px);">{a.data.title}</h1>
    </div>
  </section>
  <section style="border-bottom: none;">
    <div class="wrap" style="max-width: 760px; font-size: 17px;">
      <Content />
      <p style="margin-top: 40px;"><a href="/insights">← Alle Insights</a></p>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 6: Build prüfen und committen**

Run: `npm run build`
Expected: exit 0; `dist/insights/index.html`, `dist/insights/dreieck-gilt-nicht-mehr/index.html`, `dist/insights/kmu-eigene-apps/index.html` existieren.
```bash
git add -A && git commit -m "feat: Insights mit Content Collection und zwei Launch-Artikeln"
```

---

### Task 9: Über uns

**Files:**
- Create: `src/pages/ueber-uns.astro`

**Interfaces:**
- Consumes: `BaseLayout`, `CtaBanner`.

- [ ] **Step 1: Seite schreiben**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import CtaBanner from '../components/CtaBanner.astro';
const team = [
  { name: 'Thomas', rolle: 'CEO', statement: 'Ich glaube an Technologie, die man nicht erklären muss, weil sie einfach funktioniert.' },
  { name: 'Sven', rolle: 'CTO', statement: 'Die beste Architektur ist die, die morgen noch Antworten hat auf Fragen, die heute niemand stellt.' },
  { name: 'Joel', rolle: 'Senior AI Architect', statement: 'AI wird dann stark, wenn sie sich in bestehende Systeme einfügt statt neue Silos zu bauen.' },
  { name: 'Alex', rolle: 'AI Architect', statement: 'Gute Lösungen erkennt man daran, dass die Nutzer nach einer Woche nicht mehr ohne wollen.' },
  { name: 'Sarah', rolle: 'AI Consultant', statement: 'Mein Job ist übersetzen: aus Geschäftsproblemen werden Anforderungen, aus Technologie wird Nutzen.' },
];
const dna = [
  ['Wir vereinfachen', 'Keine unnötige Komplexität.'],
  ['Wir liefern', 'Keine endlosen Konzepte.'],
  ['Wir übernehmen Verantwortung', 'Nicht Projekt. Partnerschaft.'],
  ['Wir entwickeln mit AI', 'Nicht trotz AI.'],
  ['Wir denken unternehmerisch', 'Nicht technisch.'],
  ['Wir schaffen Vertrauen', 'Immer.'],
];
---
<BaseLayout title="Über uns | kurzerhand." description="kurzerhand ist eine Marke der ADVANIS AG: ein Team aus AI-Architekten und Beratern, das Unternehmen von der Strategie bis zum Betrieb begleitet.">
  <section style="padding: 88px 0 64px;">
    <div class="wrap">
      <p class="eyebrow">Über uns</p>
      <h1>Neu als Marke. Nicht neu im Geschäft<span class="dot">.</span></h1>
      <p class="lede">kurzerhand ist eine Marke der ADVANIS AG, einem Schweizer Beratungsunternehmen mit über 28 Jahren Erfahrung und mehr als 300 begleiteten Unternehmen. Wir haben kurzerhand gegründet, weil AI eine neue Art zu arbeiten möglich macht: schneller, direkter, mit Produkten statt Projekten.</p>
    </div>
  </section>
  <section>
    <div class="wrap">
      <p class="eyebrow">Woran wir uns halten</p>
      <h2>Sechs Sätze. Kein Kleingedrucktes.</h2>
      {dna.map(([satz, erg]) => (
        <div style="display:flex; gap:16px; align-items:baseline; flex-wrap:wrap; padding: 14px 0; border-top: 1px solid var(--line);">
          <strong style="font-size: clamp(18px, 2.4vw, 24px); letter-spacing: -.02em;">{satz}<span class="dot">.</span></strong>
          <span class="soft">{erg}</span>
        </div>
      ))}
    </div>
  </section>
  <section>
    <div class="wrap">
      <p class="eyebrow">Team</p>
      <h2>Menschen, die liefern.</h2>
      <div class="karten" style="grid-template-columns: repeat(3, 1fr);">
        {team.map(t => (
          <div class="karte">
            <div aria-hidden="true" style="width:52px; height:52px; border:1px solid var(--line); background: var(--band); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:20px; margin-bottom:12px;">{t.name.charAt(0)}</div>
            <h3>{t.name}</h3>
            <p class="tag">{t.rolle}</p>
            <p style="font-size:14px;" class="soft">«{t.statement}»</p>
          </div>
        ))}
      </div>
    </div>
  </section>
  <CtaBanner titel="Lernen Sie uns kennen." text="Am schnellsten merkt man im Gespräch, ob es passt. Wir freuen uns darauf." />
</BaseLayout>
```

- [ ] **Step 2: Build prüfen und committen**

Run: `npm run build` — Expected: exit 0, `dist/ueber-uns/index.html` existiert.
```bash
git add -A && git commit -m "feat: Ueber-uns mit Story, Brand-DNA und Team"
```

---

### Task 10: Kontakt

**Files:**
- Create: `src/pages/kontakt.astro`

**Interfaces:**
- Consumes: `BaseLayout`, `config.ts` (`KONTAKT_EMAIL`, `FORMSPREE_ENDPOINT`, `BOOKING_URL`).

- [ ] **Step 1: Seite schreiben**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { KONTAKT_EMAIL, FORMSPREE_ENDPOINT, BOOKING_URL } from '../config';
const formularAktiv = FORMSPREE_ENDPOINT.length > 0;
const emailAktiv = !KONTAKT_EMAIL.startsWith('PLATZHALTER');
---
<BaseLayout title="Kontakt | kurzerhand." description="Termin buchen oder Nachricht schreiben: Der erste Schritt zu Ihrer AI-Lösung dauert 30 Minuten.">
  <section style="padding: 88px 0 64px;">
    <div class="wrap">
      <p class="eyebrow">Kontakt</p>
      <h1>Reden wir<span class="dot">.</span></h1>
      <p class="lede">30 Minuten genügen für eine ehrliche Einschätzung: Was ist möglich, was kostet es ungefähr, wie schnell geht es. Unverbindlich.</p>
    </div>
  </section>
  <section>
    <div class="wrap">
      <div class="karten-2">
        <div class="karte" style="padding: 26px;">
          <h3>Termin buchen</h3>
          <p style="font-size:14px;" class="soft">Der direkteste Weg: Wählen Sie einen Termin, der Ihnen passt.</p>
          {BOOKING_URL
            ? <a class="btn" href={BOOKING_URL}>Termin wählen</a>
            : <p class="soft" style="font-size:14px;"><strong>Online-Buchung folgt in Kürze.</strong> Bis dahin erreichen Sie uns über das Formular{emailAktiv ? ' oder per E-Mail' : ''}.</p>}
        </div>
        <div class="karte" style="padding: 26px;">
          <h3>Nachricht schreiben</h3>
          {formularAktiv ? (
            <form method="POST" action={FORMSPREE_ENDPOINT} style="display:grid; gap:12px;">
              <label style="font-size:13px; font-weight:600;">Name<br /><input name="name" required style="width:100%; padding:10px; border:1px solid var(--line); background:var(--ground); color:var(--ink); font:inherit;" /></label>
              <label style="font-size:13px; font-weight:600;">Firma<br /><input name="firma" style="width:100%; padding:10px; border:1px solid var(--line); background:var(--ground); color:var(--ink); font:inherit;" /></label>
              <label style="font-size:13px; font-weight:600;">E-Mail<br /><input name="email" type="email" required style="width:100%; padding:10px; border:1px solid var(--line); background:var(--ground); color:var(--ink); font:inherit;" /></label>
              <label style="font-size:13px; font-weight:600;">Nachricht<br /><textarea name="nachricht" rows="5" required style="width:100%; padding:10px; border:1px solid var(--line); background:var(--ground); color:var(--ink); font:inherit;"></textarea></label>
              <button class="btn" type="submit" style="border:none; cursor:pointer;">Senden</button>
            </form>
          ) : (
            <p class="soft" style="font-size:14px;"><strong>Das Formular wird gerade eingerichtet.</strong> {emailAktiv ? <>Schreiben Sie uns direkt: <a href={`mailto:${KONTAKT_EMAIL}`}>{KONTAKT_EMAIL}</a></> : 'Die Kontaktdaten folgen in Kürze.'}</p>
          )}
        </div>
      </div>
      {emailAktiv && <p class="soft" style="margin-top:18px; font-size:14px;">Oder direkt per E-Mail: <a href={`mailto:${KONTAKT_EMAIL}`}>{KONTAKT_EMAIL}</a></p>}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Build prüfen und committen**

Run: `npm run build` — Expected: exit 0; `dist/kontakt/index.html` enthält «Formular wird gerade eingerichtet» (da Endpoint leer).
```bash
git add -A && git commit -m "feat: Kontaktseite mit Formular-/Booking-Zustaenden aus config"
```

---

### Task 11: Impressum und Datenschutz

**Files:**
- Create: `src/pages/impressum.astro`, `src/pages/datenschutz.astro`

**Interfaces:**
- Consumes: `BaseLayout`, `config.ts` (`ADRESSE`, `UID`, `KONTAKT_EMAIL`).

- [ ] **Step 1: impressum.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { ADRESSE, UID, KONTAKT_EMAIL } from '../config';
---
<BaseLayout title="Impressum | kurzerhand." description="Impressum von kurzerhand, einer Marke der ADVANIS AG.">
  <section style="padding: 88px 0;">
    <div class="wrap" style="max-width: 720px;">
      <h1 style="font-size: clamp(30px, 5vw, 44px);">Impressum</h1>
      <p><strong>kurzerhand</strong> ist eine Marke der ADVANIS AG.</p>
      <p>ADVANIS AG<br />{ADRESSE}<br />UID: {UID}</p>
      <p>Kontakt: {KONTAKT_EMAIL.startsWith('PLATZHALTER') ? 'siehe Kontaktseite' : KONTAKT_EMAIL}</p>
      <p class="soft" style="font-size:14px;">Inhaltlich verantwortlich: ADVANIS AG. Alle Angaben ohne Gewähr.</p>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: datenschutz.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { ADRESSE } from '../config';
---
<BaseLayout title="Datenschutz | kurzerhand." description="Datenschutzerklärung von kurzerhand, einer Marke der ADVANIS AG.">
  <section style="padding: 88px 0;">
    <div class="wrap" style="max-width: 720px;">
      <h1 style="font-size: clamp(30px, 5vw, 44px);">Datenschutzerklärung</h1>
      <p class="soft">Stand: Juli 2026. Diese Erklärung richtet sich nach dem Schweizer Datenschutzgesetz (DSG) und, soweit anwendbar, der DSGVO.</p>
      <h3 style="margin-top:28px;">Verantwortliche Stelle</h3>
      <p>ADVANIS AG, {ADRESSE}. Erreichbar über die Kontaktseite.</p>
      <h3 style="margin-top:28px;">Welche Daten wir bearbeiten</h3>
      <p><strong>Server-Logs:</strong> Beim Besuch dieser Webseite verarbeitet unser Hosting-Anbieter technisch notwendige Daten (IP-Adresse, Zeitpunkt, abgerufene Seite) zur Auslieferung und Sicherheit. Diese Daten werden nicht mit anderen Quellen verknüpft.</p>
      <p><strong>Kontaktformular:</strong> Wenn Sie uns über das Formular schreiben, werden die eingegebenen Daten (Name, Firma, E-Mail, Nachricht) über den Dienst Formspree an uns übermittelt und ausschliesslich zur Bearbeitung Ihrer Anfrage verwendet.</p>
      <p><strong>Keine Cookies, kein Tracking:</strong> Diese Webseite setzt keine Cookies und verwendet keine Analyse- oder Werbedienste.</p>
      <h3 style="margin-top:28px;">Ihre Rechte</h3>
      <p>Sie haben das Recht auf Auskunft, Berichtigung und Löschung Ihrer Personendaten. Wenden Sie sich dazu an die verantwortliche Stelle.</p>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 3: Build prüfen und committen**

Run: `npm run build` — Expected: exit 0; beide Seiten in `dist/`.
```bash
git add -A && git commit -m "feat: Impressum und Datenschutz mit Platzhaltern aus config"
```

---

### Task 12: Qualitätssicherung und Abschluss

**Files:**
- Create: `README.md`
- Modify: keine (Prüfungen)

- [ ] **Step 1: Sprach-Checks**

Run: `grep -rn "ß" src/ ; echo "exit: $?"`
Expected: keine Treffer, exit 1 (grep findet nichts).
Run: `grep -rn "—" src/ ; echo "exit: $?"`
Expected: keine Treffer, exit 1.
Falls Treffer: Stelle korrigieren (ss bzw. Satz umbauen), erneut prüfen.

- [ ] **Step 2: Voll-Build mit Check**

Run: `npm run check && npm run build`
Expected: `astro check` 0 errors; Build exit 0; `dist/sitemap-index.xml` existiert; alle 9 Routen plus 2 Artikel in `dist/`:
`ls dist dist/insights` zeigt `index.html, leistungen, plattform, pakete, insights, ueber-uns, kontakt, impressum, datenschutz` und die zwei Artikel-Ordner.

- [ ] **Step 3: Visuelle Prüfung**

`npm run preview` starten (Port 4321), im Browser-Pane prüfen: Startseite Desktop (1280px) und Mobile (375px, Burger-Menü öffnet), eine Innenseite, ein Insights-Artikel, Dark Mode (colorScheme dark). Erwartung: keine horizontalen Scrollbalken, Nav funktioniert, Punkt-Akzent sichtbar.

- [ ] **Step 4: README.md**

```markdown
# kurzerhand.ch

Marketing-Webseite der Brand «kurzerhand.» (eine Marke der ADVANIS AG). Astro, statischer Output.

## Entwicklung

npm install
npm run dev        # http://localhost:4321
npm run build      # statischer Output nach dist/
npm run preview    # dist/ lokal testen

## Vor dem Launch (Checkliste)

- [ ] `src/config.ts` befuellen: KONTAKT_EMAIL, FORMSPREE_ENDPOINT, BOOKING_URL, ADRESSE, UID
- [ ] Domain kurzerhand.ch registrieren, Hosting waehlen (Infomaniak/Cloudflare Pages), dist/ deployen
- [ ] Team-Nachnamen und Fotos auf /ueber-uns ergaenzen (src/pages/ueber-uns.astro)
- [ ] GL-Naming-Entscheid bestaetigt

## Konventionen

Schweizer Hochdeutsch, kein «ß», keine em-Dashes in src/. Design-Tokens in src/styles/global.css.
```

- [ ] **Step 5: Commit und Push**

```bash
git add -A && git commit -m "chore: README mit Launch-Checkliste; QS-Durchlauf"
git push origin main
```

---

## Self-Review (ausgeführt beim Planschreiben)

- **Spec-Abdeckung:** Alle 9 Routen (Tasks 4 bis 11), Design-System (Task 2), Komponenten (Task 3), Insights-Collection mit 2 Artikeln (Task 8), Platzhalter zentral in config.ts (Task 1), SEO/Sitemap/robots (Tasks 1 und 2), CI (Task 1), QS inkl. Sprach-Checks und Mobile/Dark (Task 12). Lighthouse-Zielwerte aus der Spec werden über die visuelle Prüfung und zero-JS-Architektur plausibilisiert; ein formaler Lighthouse-Lauf ist Launch-Aufgabe (Hosting nötig).
- **Platzhalter-Scan:** Die PLATZHALTER_-Werte in config.ts sind Spec-Anforderung (§7), keine Plan-Lücken. Keine TBD/TODO-Schritte.
- **Typ-Konsistenz:** `BaseLayout` Props `{title, description}` überall identisch; config-Exporte in Tasks 10/11 stimmen mit Task 1 überein; Insights-Schema (Task 8 Step 1) passt zu den Frontmatter-Feldern der Artikel und zur Nutzung in index/[slug].
