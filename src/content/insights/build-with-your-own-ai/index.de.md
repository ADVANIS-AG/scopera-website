---
title: "Mit eigener KI bauen: Ihr Abo, Ihr Git, unsere Prüfung"
description: "Apps, Workflows und freie Oberflächen entstehen jetzt auch im eigenen KI-Client, etwa Claude Code. SCOPERA prüft jeden Plan, wendet ihn probeweise an und ruft dafür selbst kein Modell auf."
pubDate: 2026-11-16
cover: ./hobelbank.jpg
coverAlt: "Hobelbank in einer Schreinerwerkstatt im warmen Gegenlicht, mit Handhobeln, Holzklüpfel und einem gezinkten Holzrahmen"
---

Viele IT-Teams arbeiten längst mit einem eigenen KI-Client. Das Abo ist bezahlt, die Arbeitsweise eingespielt, Änderungen landen im eigenen Git und gehen durch ein Review. Für eine weitere Plattform einen zweiten Assistenten mit eigenem Kontingent einzuführen, leuchtet dort niemandem ein. Gleichzeitig soll keine KI, egal welche, ungeprüft eine Anwendung ändern, mit der das Unternehmen täglich arbeitet.

## Wie ein Bau abläuft

- **Verbinden**: Der Client meldet sich über MCP bei SCOPERA an. Das Recht «Apps und Oberflächen bauen» erteilt die Person dabei ausdrücklich.
- **Kontext holen**: Die KI erhält den Aufbau Ihrer Apps und das Schema, in dem SCOPERA Apps beschreibt. Datensätze sind nicht dabei.
- **Plan schreiben**: Der Bauplan entsteht als YAML-Datei im Git Ihres Teams. Soll eine bestehende App geändert werden, beginnt die KI beim exportierten aktuellen Stand.
- **Prüfen**: SCOPERA prüft den Plan und wendet ihn probeweise an. Die KI bessert nach, bis der Plan gültig ist. Fehler zeigen sich vor dem Anwenden, nicht danach.
- **Vorlegen und anwenden**: Der Plan geht zur Bestätigung in den Client oder in SCOPERA, oder er wird direkt angewendet. Daraus entsteht eine neue Fassung, und zu einer früheren lässt sich zurückspringen.

So entstehen Apps, Entitäten und Workflows. Freie Oberflächen laufen gleich, mit Dateien statt YAML: Ein grüner Bau ergibt eine Fassung, veröffentlicht wird mit Bestätigung oder direkt.

## Wer was trägt

- **Die KI-Kosten**: Ihr eigenes Abo. SCOPERA ruft für die Prüfung kein Modell auf.
- **Die Prüfung**: SCOPERA. Jeder Plan durchläuft Prüfung und Probelauf, egal welcher Client ihn geschrieben hat.
- **Die Geschichte**: Ihr Git hält die Pläne, SCOPERA die angewendeten Fassungen.
- **Das Recht zu bauen**: Admins und technische Admins Ihres Unternehmens.

## Welcher Weg für wen

Im [Gespräch in SCOPERA](/de/insights/build-plan-before-change/) beschreiben Fachleute eine App, ohne etwas einzurichten. Die Modellaufrufe laufen dort über SCOPERA. Der eigene Client passt zu Teams, die schon mit KI im Git arbeiten und Bauten behandeln wollen wie Code: versioniert, im Review, mit nachvollziehbarer Herkunft.

Voraussetzung sind die KI-Verbindungen (MCP). SCOPERA speichert pro Aufruf nur Werkzeug, Ergebnis, Dauer und Umfang, keine Eingaben und keine Antworten. Mehr dazu auf der Seite [Governance](/de/governance/).

## Womit anfangen?

Nehmen Sie eine kleine bestehende App, legen Sie ihren exportierten Stand in Ihr Git und lassen Sie Ihre KI eine einzelne Änderung planen. Am Ergebnis der Prüfung sehen Sie schnell, wie gut Client und Plattform zusammenspielen.
