---
title: "Dreimal dieselbe Firma: Datenqualität als Daueraufgabe"
description: "Prüfregeln, Abgleich mit der Quelle und Erkennung von Mehrfacheinträgen. Wie eine Datenbasis im Projekt sauber wird und im Betrieb sauber bleibt."
pubDate: 2026-09-25
cover: ./karteikasten.jpg
coverAlt: "Eine Hand zieht eine Karte aus einem Karteikasten"
---

Dieselbe Firma steht dreimal im System, zweimal mit Tippfehler im Namen. Eine Postleitzahl fehlt, ein Rechnungsdatum liegt vor dem Auftragsdatum, eine Ansprechperson hat den Betrieb vor zwei Jahren verlassen. Jede Kleinigkeit für sich kostet wenig. Zusammen kosten sie das Vertrauen in die Auswertung, und irgendwann rechnet jemand wieder in Excel nach.

## Was wir im Projekt prüfen

Das klären wir mit dir vor der Migration, je nach Datenbestand:

- **Vollständigkeit**: Pflichtfelder, die leer geblieben sind, und Datensätze ohne Bezug zu Kunde, Projekt oder Auftrag.
- **Format**: Telefonnummern, IBAN, Postleitzahlen, Länder und Rechtsformen. Einheitlich geschrieben, damit Filter und Auswertungen überhaupt greifen.
- **Plausibilität**: Werte, die einzeln richtig aussehen und im Zusammenhang nicht passen. Ein Vertragsende vor dem Vertragsbeginn zum Beispiel.
- **Mehrfacheinträge**: Zwei Datensätze, die dieselbe Firma oder Person meinen, obwohl kein Feld exakt übereinstimmt. Bewertet wird die Ähnlichkeit über mehrere Felder zusammen.
- **Aktualität**: Adressen, Funktionen und Zuständigkeiten, die nicht mehr gelten. Der Grundsatz der Richtigkeit im Datenschutz verlangt, unrichtige Daten zu berichtigen oder zu löschen.
- **Abgleich mit der Quelle**: Was in einem Register, im ERP oder im Dokument selbst steht, wird gegen den Datensatz gehalten. Eingescannte Unterlagen liest die Texterkennung mit.

Das gilt für Kunden- und Lieferantendaten genauso wie für Artikel, Verträge, Belege oder Freitextfelder, in denen über Jahre alles gelandet ist.

## Einmal reicht nicht

Eine Bereinigung vor dem Go-live ist Pflichtarbeit. Der eigentliche Teil beginnt danach. Jeder Import, jede Schnittstelle und jede manuelle Erfassung bringt neue Abweichungen. In der Plattform prüfen Feldregeln neue Eingaben schon bei der Erfassung, bevor der Fehler im Bestand ist. Bei Geschäftspartnern hilft die Dublettenprüfung, Mehrfacheinträge zu finden. Wo es sich lohnt, legen wir im Projekt fest, welche Prüfungen wiederkehrend laufen sollen und wer das Ergebnis bekommt.

## Wer entscheidet

Die Regeln für die Bereinigung gibst du frei, bevor wir sie anwenden. Alles Uneindeutige kommt als Vorschlag zu einer berechtigten Person. Das Zusammenführen von zwei Kundendatensätzen gehört immer dazu: Es wird protokolliert, und rückgängig machen lässt es sich nicht auf Knopfdruck. Darum entscheidet hier ein Mensch.

## Womit anfangen?

Nimm das Feld, auf das sich dein Monatsrapport stützt. Wenn dort jede Zahl trägt, ist der Weg für den Rest klar.
