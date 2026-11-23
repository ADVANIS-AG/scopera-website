---
title: "Wenn Automationen scheitern: Notbremse und Workflow-Monitor"
description: "Ein kaputter Workflow läuft nicht endlos weiter, und Fehler bleiben nicht unsichtbar. Was SCOPERA tut, wenn eine Automation scheitert."
pubDate: 2026-11-04
cover: ./motor-stop.jpg
coverAlt: "Roter Knopf unter einem Schild mit der Aufschrift «Motor Stop» auf einer abgenutzten Metallplatte"
---

Ein geplanter Workflow verschickt jede Nacht Erinnerungen. Seit einer Änderung am Modul scheitert er bei jedem Lauf, und niemand merkt es. Oder alle merken es, weil bei jedem Fehlversuch eine Meldung kommt und bald niemand mehr hinschaut. Beides ist unangenehm, und beides lässt sich vermeiden.

## Die Notbremse

Scheitert ein Workflow im Hintergrund mehrmals in Folge, hält SCOPERA ihn an, ab Werk nach fünf Fehlläufen. In der Oberfläche steht er dann auf «Pausiert», zusammen mit dem Grund.

- **Eine Nachricht je Fehlerserie**: Die Person, die den Workflow erstellt hat, bekommt genau eine Nachricht. Ist sie nicht mehr dabei, geht sie an die technischen Admins.
- **Ein einzelner Aussetzer stört niemanden**: Ein erfolgreicher Lauf setzt den Zähler zurück.
- **Wieder aktivieren**: Ist die Ursache behoben, schaltest du den Workflow wieder ein. Auch das setzt den Zähler zurück.

Angehalten wird nur, was im Hintergrund läuft, wo niemand den Fehler direkt sieht. Prüfungen beim Speichern und Aktionen, auf deren Ergebnis jemand wartet, bleiben aktiv: Dort scheitert der Schritt sichtbar. Auch Eingangs-Webhooks werden nicht pausiert. Und eine bewusste Ablehnung durch eine Prüfregel zählt gar nicht als Fehler.

## Der Workflow-Monitor

Im Monitor sehen Business- und technische Admins, was schiefgelaufen ist:

- **Ein Eintrag je Fehllauf**, mit dem Originaltext der Fehlermeldung und den Daten, mit denen der Lauf gestartet ist. Daten ab 100 KB werden gekürzt.
- **Filter und Detailansicht**, damit sich ein Muster schneller zeigt als in einzelnen Meldungen.
- **90 Tage Aufbewahrung**, danach werden die Einträge automatisch gelöscht.

Wer einen Lauf selbst auslöst, sieht in der Glocke zudem eine Meldung «Fehlerhafte Workflows», eine je Lauf. Portal-Nutzer bekommen keine solche Meldung.

## Womit anfangen?

Öffne den Monitor und schau, welcher Workflow am häufigsten auftaucht. Oft steckt hinter vielen Einträgen eine einzige Ursache, etwa ein umbenanntes Feld.
