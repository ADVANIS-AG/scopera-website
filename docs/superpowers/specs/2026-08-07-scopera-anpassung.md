# SCOPERA Website: Aufgabenstellung

Stand: 2026-08-07
Geltungsbereich: ausschliesslich www.scopera.ai (DE und EN). Kein OnePager, kein Pitch-Deck.

---

## 0. Ziel

Die Website beantwortet heute vier Fragen nicht, die jeder Besucher stellt:

1. Kaufe ich hier eine Plattform oder eine Dienstleistung?
2. Wo fange ich an?
3. Warum soll ich euch glauben?
4. Wie erreiche ich euch?

Dazu laufen sechs konkurrierende Ordnungsmodelle nebeneinander (Home "Was wir tun", Home "Warum SCOPERA", Leistungen, Produkt, Pakete, OnePager). Ziel dieser Aufgabenstellung: ein einziges Modell, vier klare Antworten, und keine Aussage auf der Website, die einer anderen Aussage auf der Website widerspricht.

Die Referenz für Inhalt und Tonalität ist der SCOPERA OnePager. Er ist an mehreren Stellen präziser als die Website. Wo Website und OnePager sich widersprechen, gewinnt der OnePager, ausser es ist unten anders vermerkt.

---

## 1. Verbindliche Grundlagen

Diese sechs Punkte sind entschieden. Alle Tasks setzen darauf auf. Kein Task darf ihnen widersprechen.

**G1 Kategorie.** SCOPERA ist eine Plattform. Beratung wird zusätzlich angeboten und ist auch unabhängig von der Plattform buchbar.

**G2 Das eine Ordnungsmodell.** Die fünf Stufen aus dem OnePager sind ab sofort die einzige verbindliche Struktur:

| Stufe | Name | Was der Kunde danach hat | Dauer | Angebot |
|---|---|---|---|---|
| 1 | Potenziale erkennen | Priorisierte Use-Case-Liste mit Aufwandschätzung | halber Tag | KI-Potenzial-Assessment |
| 2 | Prozess und Business Case entwickeln | Ablauf, Anforderungen, Nutzen, Aufwand, messbares Zielbild | ein Tag | AI-Strategie-Workshop |
| 3 | Prototyp entwickeln | Funktionsfähiger Prototyp am echten Prozess | Stunden bis Tage | Vibe your Issue |
| 4 | Produktiv starten | Lösung im Einsatz, inkl. Sicherheit, Integrationen, Tests, Berechtigungen | ein bis sechs Wochen | Starter, Professional |
| 5 | Betreiben und optimieren | Betrieb, Monitoring, laufende Weiterentwicklung | laufend | Enterprise, Managed AI, White-Label |

**G3 Preislogik Starter.** CHF 20 pro Monat und Mandant, unabhängig von der Nutzerzahl, ohne Zusatzkosten pro Nutzer oder Modul. Das ist der Beleg für das Versprechen "keine klassische Lizenzspirale pro Nutzer" und muss als solcher formuliert werden.

**G4 Weiterentwicklung nach dem Go-live.** Der Kunde entscheidet. SCOPERA kann weiterentwickeln, der Fachbereich kann selbst weiterentwickeln, beides ist möglich und jederzeit änderbar. Betrieb, Sicherheit und Monitoring liegen in jedem Fall bei SCOPERA. Die Wahlfreiheit ist die Botschaft. Formulierungen, die eine der beiden Varianten als einzige darstellen, sind zu entfernen.

**G5 Referenzen.** Es liegen keine Kundenfreigaben vor. Fallbeispiele werden anonymisiert mit harten Zahlen publiziert, ergänzt um das Angebot, auf Anfrage den direkten Kontakt zu einem Referenzkunden herzustellen. Keine erfundenen Testimonials, keine Fantasiezahlen.

**G6 Seitenstruktur.** Leistungen, Produkt und Pakete bleiben eigenständige Seiten. Sie bekommen alle dieselbe 5-Stufen-Klammer und Querverweise untereinander. Keine Seitenzusammenlegung, keine Navigationsumbenennung in dieser Runde.

---

## 2. Globale Regeln

- **Zweisprachigkeit:** Jede Textänderung ist in DE **und** EN umzusetzen. Kein Task gilt als erledigt, solange die EN-Variante fehlt.
- **Tonalität:** Schweizer Hochdeutsch, kein ß. Keine Superlative. Keine Gedankenstriche im Fliesstext. Keine Konstruktionen der Form "nicht X, sondern Y". Kurze Sätze, aktive Verben.
- **Konsistenzprüfung:** Nach jedem Task prüfen, ob dieselbe Aussage anderswo in alter Fassung überlebt hat. Volltextsuche über das Repo, inkl. Meta-Tags, OG-Tags, Footer, Alt-Texte und JSON-LD.
- **Keine neuen Versprechen:** Es darf nichts behauptet werden, was nicht belegbar oder in G1 bis G6 gedeckt ist.

---

## 3. Phase 0: Sofort

Ziel: keine kaputten oder widersprüchlichen Stellen mehr. Kein Task in dieser Phase braucht eine Designentscheidung.

### [ ] P0-1 Kontaktseite funktionsfähig machen

**Problem:** Auf /de/contact steht "Das Formular wird gerade eingerichtet. Die Kontaktdaten folgen in Kürze." Es gibt keine Telefonnummer, keine E-Mail, keine Adresse. Das ist die Seite, deren einziger Zweck Vertrauen ist.

**Zu tun:**
- Platzhaltertext entfernen.
- Telefonnummer ergänzen: **+41 52 355 35 35**, mit Erreichbarkeitsfenster (Vorschlag: Mo bis Fr, 08:00 bis 18:00).
- E-Mail ergänzen. **Zu klären:** persönliche Adresse `s.brenner@advanis.ch` (wie im OnePager) oder eine allgemeine SCOPERA-Adresse. Bis zur Klärung die OnePager-Adresse verwenden.
- Postadresse und UID der ADVANIS AG ergänzen, mindestens im Footer.
- Kontaktformular aktivieren. Falls das in dieser Runde nicht möglich ist: durch einen klar beschrifteten mailto-Link ersetzen. Ein sichtbarer "wird eingerichtet"-Hinweis ist keine akzeptable Zwischenlösung.

**Akzeptanz:** Ein Besucher kann SCOPERA auf drei Wegen erreichen (Termin, Telefon, Schriftlich), ohne die Seite zu verlassen. Kein Platzhaltertext mehr im DOM.

---

### [ ] P0-2 Aussage zur Selbstverbesserung ersetzen

**Problem:** "Jede Lösung lernt weiter, jeden Monat ein Stück besser." löst bei IT und Compliance die Sorge aus, dass sich Produktivsysteme unkontrolliert verändern.

**Zu tun:** Alle Vorkommen dieser oder sinngleicher Formulierungen durch die OnePager-Fassung plus eine Zeile ersetzen:

```
Sicher und anpassbar
Kontrollierter Betrieb und laufende Weiterentwicklung durch autorisierte Personen.
Jede Änderung ist protokolliert und rücksetzbar.
```

**Akzeptanz:** Volltextsuche nach "lernt weiter", "jeden Monat", "verbessert sich" liefert keine Treffer mehr.

---

### [ ] P0-3 Backronym ersetzen und Robotics entfernen

**Problem:** "Swiss Cognitive Operation Platform, Engineering, Robotics & Agentic" wirkt konstruiert, und Robotics ist ein Versprechen, das die Website nirgends einlöst.

**Zu tun:**
- Backronym vollständig entfernen. Volltextsuche nach "Robotics", "Cognitive Operation", "Swiss Cognitive".
- Auf **Über uns** die OnePager-Formel als kleine Grafik oder Textzeile setzen: `SCOPE + OPERA(TIV) = SCOPERA`
- Optional als Zusatzzeile auf Über uns: eine Erklärzeile, dass *opera* lateinisch für die Werke und das Wirken steht.
- Die Herkunftserklärung gehört **nicht** auf die Startseite.

**Akzeptanz:** Kein Treffer für "Robotics" im gesamten Repo, inkl. Meta-Beschreibungen und EN-Seiten.

---

### [ ] P0-4 Startseiten-Button ehrlich benennen

**Problem:** Der Hero-CTA heisst "Was wir gebaut haben" und führt auf eine Seite mit 13 Anwendungsgebieten. Das sind Fähigkeiten, keine Beweise. Wer auf Beweise klickt und Fähigkeiten findet, verliert Vertrauen.

**Zu tun:** Button umbenennen auf **"Was auf der Plattform schon läuft"**. Sekundär-CTA-Styling beibehalten.

**Akzeptanz:** Button-Label und Zielseiteninhalt decken sich.

---

### [ ] P0-5 Starter-Preis eindeutig ausschreiben

**Problem:** "CHF 20 / Monat" neben der Beschreibung "ein klar umrissener Use Case, fixer Rahmen, spürbares Ergebnis in Wochen" liest sich wie ein Nutzerpreis für ein Projekt. Der Leser weiss nicht, was er kauft.

**Zu tun:** Preiszeile auf der Paketseite ersetzen durch:

```
CHF 20 pro Monat und Mandant
Unabhängig von der Nutzerzahl. Keine Zusatzkosten pro Nutzer oder Modul.
```

Und darunter, als Verbindung zum Versprechen aus dem OnePager:

```
Deshalb gibt es bei uns keine Lizenzspirale pro Nutzer: Sie zahlen für den Mandanten, nicht für Köpfe.
```

*(Hinweis für die Umsetzung: falls die einmalige Umsetzung nicht im Abo enthalten ist, muss hier zwingend eine zweite Zahl stehen. Vor dem Livegang einmal gegen die interne Kalkulation prüfen.)*

**Akzeptanz:** Ein Leser kann nach zehn Sekunden sagen, was CHF 20 abdecken und was nicht.

---

### [ ] P0-6 Nutzentriade vereinheitlichen

**Problem:** Die Website führt "Verlässlich. Schnell. Wirtschaftlich." Der OnePager führt "Schnell. Wirtschaftlich. Sicher und anpassbar." Zwei Versprechen an dieselbe Zielgruppe.

**Zu tun:** Auf die OnePager-Fassung vereinheitlichen, weil sie die Governance-Botschaft trägt und bereits gedruckt im Umlauf ist:

```
Schnell
Prototyp innert Stunden oder Tagen. Produktive Anwendung bei überschaubarem Umfang ab ein bis zwei Wochen.

Wirtschaftlich
Kurze Projektzeiten und keine klassische Lizenzspirale pro Nutzer.

Sicher und anpassbar
Kontrollierter Betrieb und laufende Weiterentwicklung durch autorisierte Personen.
```

**Akzeptanz:** "Verlässlich" kommt als Triaden-Element nicht mehr vor. Website und OnePager führen dieselben drei Begriffe.

---

### [ ] P0-7 Hosting-Aussage schärfen

**Problem:** Der Hero sagt "Hosting in der Schweiz, auf Wunsch weltweit". Die FAQ sagt "Standardmässig in der Schweiz. Auf Wunsch in Ihrer eigenen Cloud oder On-Premises." Die FAQ-Fassung klingt nach Kontrolle, die Hero-Fassung nach Beliebigkeit.

**Zu tun:** FAQ-Fassung auf Startseite und Produktseite übernehmen. Kurzform für die Vertrauensleiste:

```
Daten in der Schweiz. Auf Wunsch in Ihrer eigenen Cloud oder On-Premises.
```

**Akzeptanz:** "auf Wunsch weltweit" kommt nicht mehr vor.

---

### [ ] P0-8 revDSG ergänzen

**Problem:** Produktseite und FAQ argumentieren nur mit DSGVO. Für Schweizer KMU ist das revDSG die massgebliche Norm. Bei einer Marke mit Schweizer Positionierung fällt die Lücke auf.

**Zu tun:** Überall wo "DSGVO" steht, auf **"revDSG und DSGVO"** erweitern. Betrifft mindestens: Produktseite Governance-Baustein, FAQ, Footer-Claims.

**Akzeptanz:** Kein alleinstehendes "DSGVO" mehr auf produktbezogenen Seiten.

---

## 4. Phase 1: Struktur

Ziel: ein einziges Ordnungsmodell auf allen Seiten, und ein Besucher, der in zehn Sekunden weiss, wo er anfängt.

### [ ] P1-1 Hero neu aufbauen

**Problem:** "Software, die versteht, wie Sie wirklich arbeiten" verkauft Individualsoftware. Laut G1 ist SCOPERA eine Plattform. Die Kategorie fehlt.

**Zu tun:** Dreiteiliger Hero. Kicker klein über der H1, H1 unverändert stark, Subline neu:

```
Kicker:  Die Plattform für individuelle Fachprozesse

H1:      Software, die versteht, wie Sie wirklich arbeiten.

Sub:     Startklar in Wochen, nicht Monaten. Aus Ihren Fachprozessen
         werden produktive AI-Anwendungen auf einer abgesicherten Plattform.
         Beratung buchen Sie dazu, oder unabhängig davon.

CTA 1:   Termin buchen
CTA 2:   Was auf der Plattform schon läuft
```

Der Begriff "Agentic Engineering" bleibt aus dem Hero draussen. Er erschliesst sich erst über die FAQ und gehört dorthin, wo die Erklärung danebensteht (Sektion "Was wir tun" oder Produktseite).

**Akzeptanz:** Ein Besucher weiss nach dem Hero, dass er eine Plattform ansieht und dass Beratung separat verfügbar ist.

---

### [ ] P1-2 Vertrauensleiste mit harten Aussagen

**Problem:** Die stärksten Kaufargumente stehen auf Position 3 und 4 einer FAQ-Unterseite. Die Startseite zeigt stattdessen "28 Jahre" und "300+ Unternehmen", also Zahlen einer anderen Firma.

**Zu tun:** Direkt unter dem Hero eine Leiste mit drei Kacheln, jede eine überprüfbare Tatsache:

```
Der Code gehört Ihnen.
Individuelle Entwicklungen gehen in Ihr Eigentum über.

Daten in der Schweiz.
Auf Wunsch in Ihrer eigenen Cloud oder On-Premises.

Keine Jahresverträge.
Editionen monatlich anpassbar, nach oben wie nach unten.
```

Jede Kachel verlinkt auf die zugehörige FAQ-Antwort.

**Akzeptanz:** Die drei Aussagen sind ohne Klick auf der Startseite sichtbar.

---

### [ ] P1-3 Fünf-Stufen-Band auf die Startseite

**Problem:** Der Kunde muss die Übersetzung zwischen Leistungen, Produkt und Paketen selbst leisten.

**Zu tun:** Neue Sektion auf der Startseite, unterhalb der Vertrauensleiste, mit der Tabelle aus G2. Anforderungen:

- Fünf Stufen als horizontales Band (Desktop) beziehungsweise gestapelte Karten (Mobile).
- Jede Stufe zeigt: Nummer, Titel, ein Satz was passiert, **was der Kunde danach hat**, Dauer, verlinktes Angebot.
- Stufe 1 und 2 sichtbar als **eine** Kaufentscheidung gruppieren (gemeinsame Klammer oder Hinweiszeile), damit der Weg nicht länger wirkt, als er ist.
- Stufe 5 Text gemäss G4:

```
Betreiben und optimieren
Wir übernehmen Betrieb, Sicherheit und Monitoring. Die fachliche
Weiterentwicklung machen Sie selbst oder Sie geben sie an uns.
Sie entscheiden, und Sie können die Entscheidung jederzeit ändern.
```

**Akzeptanz:** Jedes Angebot der Website (4 Beratungsformate, 4 Pakete, Trial) ist genau einer Stufe zugeordnet und von dort erreichbar.

---

### [ ] P1-4 Wegweiser "Wo stehen Sie gerade"

**Problem:** Die Website bietet fünf Einstiege (Potenzial-Assessment, Readiness-Assessment, Strategie-Workshop, Vibe your Issue, Trial) ohne Hilfestellung.

**Zu tun:** Sektion direkt unter dem Stufen-Band. Vier Kacheln in der Ich-Form des Kunden, plus Auffangzeile:

```
Wo stehen Sie gerade?

"Ich weiss, dass AI helfen könnte, aber nicht wo."
→ KI-Potenzial-Assessment, ein halber Tag        [Assessment anfragen]

"Ich habe einen konkreten Fall und will wissen, ob es geht."
→ Vibe your Issue, Prototyp innert Stunden       [Issue einreichen]

"Wir haben entschieden und wollen umsetzen."
→ Starter, Professional oder Enterprise          [Pakete ansehen]

"Ich will es zuerst selbst anschauen, ohne Termin."
→ Kostenlose Trial-Lizenz                        [Trial starten]

Unsicher? In einem kostenlosen 30-minütigen Gespräch klären wir, ob
SCOPERA für Ihren Prozess geeignet ist und welcher Einstieg sinnvoll ist.
                                                  [Termin buchen]
```

**Akzeptanz:** Jeder Besuchertyp findet ohne Nachdenken einen Weg. Der Trial ist ab hier von der Startseite erreichbar, nicht nur von der Produktseite.

---

### [ ] P1-5 Sektion "Was wir tun" auflösen

**Problem:** "Strategy / Enterprise AI Platform / Managed AI / Enablement" ist die interne Leistungsstruktur und konkurriert auf der Startseite mit dem Stufen-Modell.

**Zu tun:** Sektion von der Startseite entfernen. Die vier Begriffe bleiben als Zuordnung erhalten, aber nur noch als Beschriftung innerhalb des Stufen-Bands beziehungsweise auf Über uns.

**Akzeptanz:** Auf der Startseite existiert genau ein Ordnungsmodell.

---

### [ ] P1-6 Stufen-Klammer auf Leistungen, Produkt und Pakete

**Zu tun:** Auf jeder der drei Seiten oben eine kurze Einordnung, plus Querverweise:

- **Leistungen:** "Diese Formate decken Stufe 1 bis 3 ab." Bestehende Einleitung "Beratung, die auch ohne unsere Plattform trägt" beibehalten, sie ist gut. Querverweis auf Pakete für Stufe 4 und 5.
- **Produkt:** "Das ist die Plattform, auf der ab Stufe 3 gebaut wird." Querverweis auf Leistungen für Stufe 1 und 2.
- **Pakete:** "Diese Editionen decken Stufe 4 und 5 ab." Querverweis auf Leistungen für den Einstieg.

Auf allen drei Seiten dasselbe kompakte Stufen-Element wiederverwenden (eine Komponente, kein dreifacher Code).

**Akzeptanz:** Von jeder der drei Seiten kommt man in einem Klick zu den anderen beiden, mit erklärter Begründung.

---

### [ ] P1-7 Readiness-Assessment einordnen

**Problem:** Vier gleichrangige Beratungsformate erzeugen dieselbe Wahlüberforderung wie vorher. Das Readiness-Assessment ist aus Kundensicht kein eigener Einstieg.

**Zu tun:** Readiness-Assessment als Zusatzbaustein innerhalb von Stufe 1 darstellen, optisch untergeordnet zum Potenzial-Assessment, mit einem Satz, wann es sinnvoll ist:

```
Ergänzend zum Potenzial-Assessment, wenn unklar ist, ob Ihre Daten
und Systeme heute schon tragen.
```

Zusätzlich die fehlende Dauerangabe ergänzen (aktuell nicht spezifiziert).

**Akzeptanz:** Auf der Leistungsseite stehen drei gleichrangige Formate plus ein untergeordnetes.

---

## 5. Phase 2: Substanz

### [ ] P2-1 Fallbeispiele nach festem Raster, anonymisiert

**Problem:** Die Sektion heisst "Beweise statt Versprechen" und liefert keine Beweise. Diese Überschrift kostet mehr Glaubwürdigkeit, als sie bringt.

**Zu tun:** Mindestens zwei Fallbeispiele nach diesem Raster. Jedes Feld ist Pflicht:

1. Ausgangslage in einem Satz, **mit einer Zahl darin**
2. Was gebaut wurde
3. Projektdauer von Kickoff bis Go-live, in Kalenderwochen
4. Eine harte Wirkungszahl: gesparte Stunden pro Monat, Durchlaufzeit vorher und nachher, oder Fehlerquote
5. Echter Screenshot, anonymisiert
6. Branche und Unternehmensgrösse statt Kundenname
7. Eine Zeile Technik und Hosting

Darunter, gemäss G5:

```
Die Kundenfreigaben für die namentliche Nennung laufen. Auf Anfrage
stellen wir Ihnen den direkten Kontakt zu einem Referenzkunden her.
                                             [Referenz anfragen]
```

**Akzeptanz:** Jedes Fallbeispiel enthält mindestens zwei Zahlen. Kein erfundenes Zitat, keine erfundene Kennzahl.

---

### [ ] P2-2 ADVANIS-Transfer explizit machen

**Problem:** "28 Jahre Erfahrung" und "300+ Unternehmen begleitet" stehen unverbunden im Hero und lesen sich als fremde Zahlen.

**Zu tun:** Einen Satz ergänzen, der die Zahlen an SCOPERA bindet:

```
Dieselben Leute, die seit 1998 CRM- und ERP-Projekte für über 300
Schweizer Unternehmen liefern, bauen SCOPERA.
```

Jahreszahl vor Livegang gegen die ADVANIS-Gründung prüfen.

**Akzeptanz:** Die Zahlen stehen nicht mehr ohne Bezug zu SCOPERA.

---

### [ ] P2-3 "Was im Erstgespräch passiert" auf der Kontaktseite

**Problem:** Der Besucher soll einen Termin buchen und weiss nicht, was ihn erwartet und was danach kommt.

**Zu tun:** Block unterhalb der Kontaktwege:

```
Was in den 30 Minuten passiert

10 Minuten   Sie schildern den Fachprozess, der Sie stört.
10 Minuten   Wir zeigen, was auf der Plattform dafür schon existiert.
10 Minuten   Einschätzung zu Machbarkeit, Dauer und Kostenrahmen.

Danach
Sie erhalten innert zwei Arbeitstagen eine schriftliche Kurzeinschätzung
mit Grobkosten. Ob es weitergeht, entscheiden Sie.

Dabei
Sven Brenner, CTO und AI Strategist       [Foto]

Nützlich, falls vorhanden
Eine Prozessbeschreibung oder ein Beispieldokument.
```

Zusätzlich der Aufforderungssatz aus dem OnePager, prominent über dem Buchungs-CTA:

```
Bringen Sie Ihren Fachprozess mit. Gemeinsam prüfen wir, wie SCOPERA
ihn digitalisiert.
```

**Akzeptanz:** Vor der Buchung ist bekannt, was passiert, wer dabei ist, und was der Besucher danach in der Hand hat.

---

### [ ] P2-4 FAQ ergänzen

Die FAQ ist die stärkste Seite der Website. Drei Fragen fehlen:

```
Wer entwickelt die Lösung nach dem Go-live weiter?
Sie entscheiden. Betrieb, Sicherheit und Monitoring liegen bei uns.
Die fachliche Weiterentwicklung machen Sie im Fachbereich selbst,
ohne Softwareentwickler zu sein, oder Sie geben sie an uns.
Beides ist möglich und jederzeit änderbar.

Was kostet der Einstieg?
Der Starter kostet CHF 20 pro Monat und Mandant, unabhängig von der
Nutzerzahl. Assessments und Workshops haben feste Preise, die wir
vor dem Start vereinbaren.

Ändert sich unsere Lösung von selbst?
Nein. SCOPERA erkennt Verbesserungspotenzial und schlägt es vor.
Was umgesetzt wird, entscheiden autorisierte Personen bei Ihnen.
Jede Änderung ist protokolliert und rücksetzbar.
```

**Akzeptanz:** Die drei häufigsten Rückfragen aus Erstgesprächen sind ohne Termin beantwortet.

---

### [ ] P2-5 Zielgruppensektion bereinigen

**Problem:** Die Sektion kündigt vier Gruppen an und listet fünf. "Provider & Dienstleister" ist eine andere Kategorie als vier interne Rollen.

**Zu tun:** Provider aus der Reihe herausnehmen und dem White-Label-Strang zuordnen, entweder als eigener Block unterhalb oder als Verweis auf die Paketseite. Zähler im Einleitungstext korrigieren.

**Akzeptanz:** Angekündigte und gezeigte Anzahl stimmen überein.

---

## 6. Offene Punkte

Diese Punkte blockieren keinen Task, müssen aber vor dem Livegang geklärt sein:

- [ ] E-Mail-Adresse für die Kontaktseite: persönlich oder allgemein (betrifft P0-1)
- [ ] Postadresse und UID der ADVANIS AG (betrifft P0-1)
- [ ] Ist die einmalige Umsetzung im Starter-Abo enthalten (betrifft P0-5)
- [ ] Dauerangabe für das AI Readiness Assessment (betrifft P1-7)
- [ ] Zahlenmaterial für mindestens zwei Fallbeispiele (betrifft P2-1)
- [ ] Foto von Sven Brenner für die Kontaktseite (betrifft P2-3)
- [ ] Gründungsjahr ADVANIS zur Prüfung des Transfersatzes (betrifft P2-2)

---

## 7. Abnahme

Die Umsetzung gilt als fertig, wenn ein Aussenstehender die Website öffnet und ohne Nachfrage sagen kann:

1. SCOPERA ist eine Plattform, Beratung gibt es dazu.
2. Es gibt fünf Stufen, und ich sehe, auf welcher ich stehe.
3. Ich weiss, wo ich anfange, und ich habe vier Wege zur Auswahl.
4. Ich kenne drei überprüfbare Fakten, die mir Sicherheit geben.
5. Ich weiss, wie ich anrufe, schreibe oder buche, und was danach passiert.

Zusätzlich, technisch:

- [ ] Alle Änderungen in DE und EN
- [ ] Volltextsuche liefert keine Treffer für: "Robotics", "lernt weiter", "Verlässlich" (als Triaden-Element), "auf Wunsch weltweit", "wird gerade eingerichtet"
- [ ] Kein alleinstehendes "DSGVO" auf Produktseiten
- [ ] Alle CTAs führen auf eine existierende Zielseite
- [ ] Mobile: Stufen-Band und Wegweiser lesbar ohne horizontales Scrollen