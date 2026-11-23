---
title: "Wer darf die KI was? Freigaben statt Vertrauen"
description: "Die KI sieht nie mehr als die fragende Person und dazu nur, was freigegeben ist. Wie Freigaben und Schreibmodus in SCOPERA zusammenspielen."
pubDate: 2026-10-28
cover: ./gitter-schloss.jpg
coverAlt: "Geschlossenes Scherengitter aus Metall mit Kette und messingfarbenem Vorhängeschloss"
---

«Darf die KI eigentlich auch unsere Lohndaten lesen?» Wer eine KI in die eigenen Abläufe holt, bekommt diese Frage früher oder später. Eine beruhigende Antwort hilft dann wenig. Hilfreich ist eine Einstellung, die man zeigen kann.

## Zwei Grenzen beim Lesen

- **Die Rechte der Person**: Die KI arbeitet mit den Rechten der Person, die fragt. Was diese Person nicht sehen darf, sieht auch die KI für sie nicht.
- **Die Freigaben**: Zusätzlich muss der Bereich für die KI freigegeben sein. Apps, Module, Integrationen und Bereiche haben dafür je einen eigenen Eintrag.

Unter Verwaltung → KI-Einstellungen → «Zugriffe» legen die technischen Admins fest, was gilt.

## Eine Kette, die nur einschränkt

Freigaben laufen von der Plattform über den Provider zum Mandanten. Jede Ebene kann nur einschränken, keine kann etwas erweitern, das weiter oben gesperrt ist. Fehlt ein Eintrag, ist der Zugriff aus. Kommt es zu einer Störung und die Kette lässt sich nicht lesen, ist ebenfalls alles aus. Im Zweifel bleibt die Tür also zu.

## Schreiben ist eine eigene Frage

Lesen dürfen heisst noch lange nicht ändern dürfen. Darum gibt es je Kategorie einen eigenen Schreibmodus:

- **Aus**: Die KI ändert in dieser Kategorie nichts.
- **Bestätigen**: Die KI schlägt die Änderung vor, ein Mensch gibt sie frei.
- **Automatisch**: Die KI führt die Änderung selbst aus.

In einem Workflow gilt «Bestätigen» als verweigert, weil dort niemand da ist, der bestätigen könnte. Verweigerte Schritte stehen im Protokoll, so bleibt nachvollziehbar, woran ein Lauf gescheitert ist.

## Was den Anbieter erreicht

Bevor eine Anfrage an ein KI-Modell geht, werden Felder der KI-Datenklasse «Reguliert» maskiert und erkennbare Muster wie E-Mail-Adressen, AHV-, IBAN-, Telefon- und Kartennummern entfernt. Eine Mustererkennung findet nicht jede Schreibweise, und einzelne Funktionen wie die Transkription brauchen den Originalinhalt. Darum bleibt die Freigabe die erste Grenze. Mehr dazu auf der Seite [Governance](/de/governance/).

## Womit anfangen?

Öffne die «Zugriffe» und geh die Liste einmal mit der Person durch, die für den Datenschutz zuständig ist. Stell dann die Kategorie auf «Bestätigen», bei der dir eine zweite Prüfung am wichtigsten ist.
