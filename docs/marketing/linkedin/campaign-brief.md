# LinkedIn-Kampagne: "Vom ersten Ton zur ganzen Sinfonie"

Erste Content-Serie für den Markteintritt von SCOPERA, Kanal LinkedIn. 8 Posts, 1 pro Woche. Nutzt das bestehende 5-Stufen-Modell der Website (`src/data/stufen.ts`) als roten Faden und das Musik-/Opern-Motiv der Marke (SCOPE + OPERA(TIV) = SCOPERA) als wiederkehrende Bildsprache.

## Konzept

Die Serie erzählt die 5 Stufen des Kundenwegs (Potenziale erkennen → Prozess/Business Case → Prototyp → Produktiv starten → Betreiben/Optimieren) als Lernkurve vom ersten Ton zur ganzen Sinfonie. Dazwischen: ein Kickoff-Post, ein reiner Experten-Content-Post (AI-Mythen, nicht stufengebunden) und ein Wrap-up. Mix aus Firmenseiten-Posts (Ankündigung/Recap) und persönlichen Team-Posts (die eigentliche Bildungsserie).

## Tonalität (verbindlich für alle zukünftigen Posts dieser Serie)

- Schweizer Hochdeutsch, kein «ß»
- Keine Gedankenstriche im Fliesstext
- Keine "nicht X, sondern Y"-Konstruktion in einem Satz (zwei kurze Sätze sind erlaubt: "Nicht Projekt. Partnerschaft.")
- Kurze Sätze, aktive Verben
- Keine unbelegten neuen Behauptungen, nur was Website/5-Stufen-Modell bereits tragen
- Jeder Post endet mit einer konkreten Frage, nicht mit einer Floskel

Hinweis: Ein externer "(LinkedIn-)ADVANIS-Styleguide" wird in zwei Docs referenziert (`docs/superpowers/specs/2026-07-11-kurzerhand-website-design.md`, `README.md`), liegt aber nicht in diesem Repo. Diese Kampagne folgt den oben abgeleiteten Regeln. Bei Zugriff auf den echten Styleguide lohnt sich ein Abgleich.

## Serienübersicht

| # | Datei | Stufe | Stimme | Bild |
|---|---|---|---|---|
| 1 | `posts/01-kickoff.md` | Kickoff | Firmenseite | `cards/01-kickoff.png` |
| 2 | `posts/02-stufe-1-sarah.md` | 1 – Potenziale erkennen | Sarah, AI Consultant | `cards/02-stufe-1.png` |
| 3 | `posts/03-stufe-2-thomas.md` | 2 – Prozess und Business Case | Thomas, AI Value Engineer | `cards/03-stufe-2.png` |
| 4 | `posts/04-stufe-3-alex.md` | 3 – Prototyp entwickeln | Alex, AI Tech Consultant | `cards/04-stufe-3.png` |
| 5 | `posts/05-mythen-sven.md` | (kein Stufenbezug) | Sven, CTO/AI Strategist | `photos/mythen-kompass.jpg` |
| 6 | `posts/06-stufe-4-joel.md` | 4 – Produktiv starten | Joel, AI Architect | `cards/06-stufe-4.png` |
| 7 | `posts/07-stufe-5-sven.md` | 5 – Betreiben und optimieren | Sven, CTO/AI Strategist | `photos/stufe-5-hero-start.jpg` |
| 8 | `posts/08-wrapup.md` | Wrap-up | Firmenseite | `cards/08-wrapup.png` |

Vorschlag Kadenz: 1 Post/Woche, Dienstag oder Mittwoch vormittags. Annahme: eine SCOPERA-LinkedIn-Unternehmensseite existiert oder wird vor Post 1 erstellt.

## Bildmaterial

Grafikkarten (`cards/`): ein HTML-Template (`cards/template.html`) im SCOPERA-Look, 1200×1200px, aus den echten Design-Tokens von `src/styles/global.css` gebaut. 6 Varianten daraus per Playwright-Screenshot zu PNG gerendert.

Fotos (`photos/`): 2 Stück, gesichtslose Objekt-/Handmotive statt gestellter Personenfotos (Details und Lizenznachweis in `README.md` dieses Ordners).

## Was fehlt / offene Punkte

- Bestätigung, ob eine SCOPERA-Unternehmensseite auf LinkedIn existiert (für Post 1 und 8).
- Freigabe der 5 Teammitglieder, unter eigenem Namen zu posten (Text ist vorbereitet, Veröffentlichung liegt bei ihnen).
- Der referenzierte externe ADVANIS-Styleguide für einen möglichen Tonalitäts-Abgleich.
