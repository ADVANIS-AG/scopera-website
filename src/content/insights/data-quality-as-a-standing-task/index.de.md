---
title: "Dreimal dieselbe Firma: Datenqualität als Daueraufgabe"
description: "Prüfregeln, Abgleich mit der Quelle und Erkennung von Mehrfacheinträgen. Wie eine Datenbasis sauber wird und in festen Abständen sauber bleibt."
pubDate: 2026-09-25
cover: ./karteikasten.jpg
coverAlt: "Eine Hand zieht eine Karte aus einem Karteikasten"
---

Dieselbe Firma steht dreimal im System, zweimal mit Tippfehler im Namen. Eine Postleitzahl fehlt, ein Rechnungsdatum liegt vor dem Auftragsdatum, eine Ansprechperson hat den Betrieb vor zwei Jahren verlassen. Jede Kleinigkeit für sich kostet wenig. Zusammen kosten sie das Vertrauen in die Auswertung, und irgendwann rechnet jemand wieder in Excel nach.

## Was geprüft wird

- **Vollständigkeit**: Pflichtfelder, die leer geblieben sind, und Datensätze ohne Bezug zu Kunde, Projekt oder Auftrag.
- **Format**: Telefonnummern, IBAN, Postleitzahlen, Länder und Rechtsformen. Einheitlich geschrieben, damit Filter und Auswertungen überhaupt greifen.
- **Plausibilität**: Werte, die einzeln richtig aussehen und im Zusammenhang nicht passen. Ein Vertragsende vor dem Vertragsbeginn zum Beispiel.
- **Mehrfacheinträge**: Zwei Datensätze, die dieselbe Firma oder Person meinen, obwohl kein Feld exakt übereinstimmt. Bewertet wird die Ähnlichkeit über mehrere Felder zusammen.
- **Aktualität**: Adressen, Funktionen und Zuständigkeiten, die nicht mehr gelten. Der Grundsatz der Richtigkeit im Datenschutz verlangt, unrichtige Daten zu berichtigen oder zu löschen.
- **Abgleich mit der Quelle**: Was in einem Register, im ERP oder im Dokument selbst steht, wird gegen den Datensatz gehalten. Eingescannte Unterlagen liest die Texterkennung mit.

Das gilt für Kunden- und Lieferantendaten genauso wie für Artikel, Verträge, Belege oder Freitextfelder, in denen über Jahre alles gelandet ist.

## Einmal reicht nicht

Eine Bereinigung vor dem Go-live ist Pflichtarbeit. Der eigentliche Teil beginnt danach. Jeder Import, jede Schnittstelle und jede manuelle Erfassung bringt neue Abweichungen. Darum laufen die Prüfungen weiter, in festen Abständen und je Bereich unterschiedlich getaktet. Neue Einträge werden schon bei der Erfassung geprüft, bevor der Fehler im Bestand ist. Was auffällt, wird zur Aufgabe mit verantwortlicher Person und Frist.

## Wer entscheidet

Eindeutige Fälle korrigiert die Plattform selbst, nach Regeln, die Sie vorher freigegeben haben. Alles Uneindeutige kommt als Vorschlag zu einer autorisierten Person. Das Zusammenführen von zwei Kundendatensätzen gehört immer in diese zweite Gruppe. Jede Änderung ist protokolliert und rücksetzbar, mit Angabe der Regel und der freigebenden Person. Im Dashboard sehen Sie, wie sich die Qualität über die Monate entwickelt.

## Womit anfangen?

Nehmen Sie das Feld, auf das sich Ihr Monatsrapport stützt. Wenn dort jede Zahl trägt, ist der Weg für den Rest klar.
