// Weihnachtsaktion «Wünsch dir was. Für 2027.» (src/components/wunsch/Wunschseite.astro).
//
// Ablauf: Start, Wunsch, zwei Fragen, Wunschzettel, Prototyp mit Abschicken, Dank. Alles bis zum
// Abschicken bleibt im Browser (sessionStorage, damit ein Neuladen nichts verliert). Erst
// «Wunschzettel abschicken» sendet an den Worker (POST /wunsch).
//
// Prototyp: Der Rahmen laedt die Spielwiese mit `mode=wunsch`, beim Laden geht der Wunsch als
// `scopera:playground:prefill` hinein. Im Wunsch-Modus baut die Spielwiese daraus sofort die App
// und bestaetigt mit `scopera:playground:wish-ready`. Bleibt die Bestaetigung aus (Plattform noch
// ohne Wunsch-Modus), erscheint als Rueckfall die Kopierhilfe.
//
// Abschicken: Im Wunsch-Modus fragt die Seite den Rahmen zuerst mit `scopera:playground:wish-submit`
// nach einem Schluessel zur gebauten App (erst mit dem Abschicken stimmt die Person der
// Aufbewahrung zu). Antwort `scopera:playground:wish-built {key, expires_at}`; der Schluessel geht
// als `prototyp` mit an den Worker. Kommt nach WARTE_AUF_SCHLUESSEL nichts, geht der Wunsch ohne.

const URSPRUNG = 'https://playground.scopera.ai';
const SPEICHER = 'scopera_wunsch_2027';
const MAX_PROMPT = 600;

type Ansicht = 'start' | 'eingabe' | 'frage' | 'zettel' | 'proto' | 'dank';
type Satz = {
  haeufigkeit: Record<string, string>;
  dauer: Record<string, string>;
  vorkommen: string;
  ideal: string;
  wieOft: string;
  gewinnKlein: string;
  gewinnStunden: string;
  gewinnTage: string;
};
interface Laufzeit {
  lang: 'de' | 'en';
  variante: 'box' | 'karte';
  zettel: { zaehler: string; zaehlerStart: string; felder: Record<'titel' | 'heute' | 'morgen' | 'gewinn', string> };
  endpunkt: string;
  kontakt: string;
  schnee: { aus: string; an: string };
  warten: string[];
  du: string;
  f1: Record<string, string>;
  f2: Record<string, string>;
  beispiel: string;
  satz: Satz;
  dank: { hand: string; handOhneName: string };
  proto: { kopiert: string; kopierFehler: string };
  mic: { start: string; stopp: string; bereit: string; hoert: string; fertig: string };
  micFehler: { erlaubt: string; still: string; netz: string; allgemein: string };
  formular: Record<'knopf' | 'sendet' | 'fehlerFelder' | 'fehlerOk' | 'fehlerSenden' | 'fehlerZuViele' | 'fehlerGeschlossen', string>;
}
// Web Speech API: in Chrome, Edge und Safari vorhanden (teils mit Praefix), in Firefox nicht.
// Die Erkennung laeuft beim Hersteller des Browsers, darum der Hinweis unter dem Feld und der
// Absatz in der Datenschutzerklaerung. Ton nimmt die Seite selbst nie auf.
interface ErkennungsErgebnis { isFinal: boolean; 0: { transcript: string } }
interface Erkennung {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult: ((e: { results: ArrayLike<ErkennungsErgebnis> }) => void) | null;
}
type ErkennungsKlasse = new () => Erkennung;

interface Zustand {
  wunsch: string;
  haeufigkeit: string;
  dauer: string;
  titel: string;
  heute: string;
  morgen: string;
  gewinn: string;
  ansicht: Ansicht;
}

const wurzel = document.getElementById('wz');
const laufzeitEl = document.getElementById('wz-laufzeit');
if (wurzel && laufzeitEl) starte(wurzel, JSON.parse(laufzeitEl.textContent || '{}') as Laufzeit);

function starte(wz: HTMLElement, L: Laufzeit): void {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STUFE: Record<Ansicht, number> = { start: 1, eingabe: 2, frage: 3, zettel: 4, proto: 5, dank: 6 };
  const TITEL: Record<Ansicht, string> = {
    start: 'wz-t-start', eingabe: 'wz-t-eingabe', frage: 'wz-t-frage', zettel: 'wz-t-zettel', proto: 'wz-t-proto', dank: 'wz-t-dank',
  };

  const leer = (): Zustand => ({ wunsch: '', haeufigkeit: '', dauer: '', titel: '', heute: '', morgen: '', gewinn: '', ansicht: 'start' });
  let z: Zustand = leer();
  let bereit = false;

  // ---------- Speicher (nur fuer diesen Tab) ----------
  function sichern(): void {
    try { sessionStorage.setItem(SPEICHER, JSON.stringify(z)); } catch { /* privates Fenster o.ae. */ }
  }
  function laden(): Zustand | null {
    try {
      const roh = sessionStorage.getItem(SPEICHER);
      return roh ? { ...leer(), ...(JSON.parse(roh) as Partial<Zustand>) } : null;
    } catch { return null; }
  }
  function vergessen(): void {
    try { sessionStorage.removeItem(SPEICHER); } catch { /* egal */ }
  }

  // ---------- Ansichten ----------
  const ansichten: Ansicht[] = ['start', 'eingabe', 'frage', 'zettel', 'proto', 'dank'];
  function zeige(ansicht: Ansicht): void {
    ansichten.forEach((a) => { $(`wz-${a}`).hidden = a !== ansicht; });
    wz.dataset.szene = ansicht;
    document.querySelectorAll('.wz-fortschritt span').forEach((el, i) => el.classList.toggle('an', i < STUFE[ansicht]));
    if (ansicht !== 'eingabe') brecheAufnahmeAb();
    if (ansicht === 'dank') brieflug(); else stoppeFlug();
    if (ansicht === 'proto') ladeSpielwiese();
    if (ansicht !== 'dank') { z.ansicht = ansicht; sichern(); }
    if (bereit) {
      const h = $(TITEL[ansicht]);
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
      wz.scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth', block: 'start' });
    }
  }
  document.querySelectorAll<HTMLElement>('[data-zu]').forEach((b) => b.addEventListener('click', () => zeige(b.dataset.zu as Ansicht)));

  // ---------- Schritt 1: Wunsch ----------
  const feld = $<HTMLTextAreaElement>('wz-wunsch');
  function pruefeWunsch(): void {
    const n = feld.value.trim().length;
    $('wz-zaehler').textContent = String(feld.value.length);
    $<HTMLButtonElement>('wz-zur-frage').disabled = n < 20;
    $('wz-zu-kurz').hidden = n === 0 || n >= 20;
  }
  feld.addEventListener('input', pruefeWunsch);
  document.querySelectorAll<HTMLElement>('[data-anstoss]').forEach((b) => b.addEventListener('click', () => {
    if (!feld.value.trim()) feld.value = b.dataset.anstoss || '';
    feld.focus();
    feld.setSelectionRange(feld.value.length, feld.value.length);
    pruefeWunsch();
  }));
  $('wz-beispiel').addEventListener('click', () => { feld.value = L.beispiel; pruefeWunsch(); feld.focus(); });
  $('wz-los').addEventListener('click', () => eintauchen(() => { zeige('eingabe'); }));

  // ---------- Sprechen statt schreiben ----------
  const w = window as unknown as { SpeechRecognition?: ErkennungsKlasse; webkitSpeechRecognition?: ErkennungsKlasse };
  const Klasse = w.SpeechRecognition || w.webkitSpeechRecognition;
  const kannSprechen = !!Klasse && window.isSecureContext;
  let erkennung: Erkennung | null = null;
  let nimmtAuf = false;
  let basis = '';
  let fehlerGemeldet = false;
  let neuStarten = false;
  // de-CH schreibt ohne scharfes s, wie die Seite. Kennt der Dienst es nicht, geht es mit de-DE weiter.
  let sprache = L.lang === 'de' ? 'de-CH' : 'en-GB';
  const mic = $<HTMLButtonElement>('wz-mic');
  function micStatus(text: string, fehlerton = false): void {
    const el = $('wz-mic-status');
    el.textContent = text;
    el.classList.toggle('wz-fehlerton', fehlerton);
  }
  function micAnzeige(an: boolean): void {
    mic.classList.toggle('wz-laeuft', an);
    mic.setAttribute('aria-pressed', String(an));
    mic.setAttribute('aria-label', an ? L.mic.stopp : L.mic.start);
  }
  function brecheAufnahmeAb(): void {
    if (erkennung && nimmtAuf) { neuStarten = false; erkennung.abort(); }
  }
  function starteAufnahme(): void {
    if (!Klasse) return;
    if (nimmtAuf && erkennung) { erkennung.stop(); return; }
    const e = new Klasse();
    e.lang = sprache;
    e.continuous = true;
    e.interimResults = true;
    basis = feld.value.trim();
    fehlerGemeldet = false;
    neuStarten = false;
    e.onstart = () => { nimmtAuf = true; micAnzeige(true); micStatus(L.mic.hoert); };
    e.onresult = (ev) => {
      let fest = '', zwischen = '';
      for (let i = 0; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) fest += r[0].transcript; else zwischen += r[0].transcript;
      }
      fest = fest.replace(/\s+/g, ' ').trim();
      if (!basis && fest) fest = fest.charAt(0).toUpperCase() + fest.slice(1);
      feld.value = (basis && fest ? `${basis} ${fest}` : basis || fest).slice(0, 500);
      $('wz-zwischen').textContent = zwischen.trim();
      pruefeWunsch();
    };
    e.onerror = (ev) => {
      if (ev.error === 'aborted') return;
      if (ev.error === 'language-not-supported' && sprache === 'de-CH') { sprache = 'de-DE'; neuStarten = true; return; }
      fehlerGemeldet = true;
      const text = ev.error === 'not-allowed' || ev.error === 'service-not-allowed' ? L.micFehler.erlaubt
        : ev.error === 'no-speech' ? L.micFehler.still
        : ev.error === 'network' ? L.micFehler.netz
        : L.micFehler.allgemein;
      micStatus(text, true);
    };
    e.onend = () => {
      nimmtAuf = false;
      micAnzeige(false);
      $('wz-zwischen').textContent = '';
      if (neuStarten) { starteAufnahme(); return; }
      if (!fehlerGemeldet) micStatus(feld.value.trim() ? L.mic.fertig : L.mic.bereit);
    };
    erkennung = e;
    try { e.start(); } catch { micStatus(L.micFehler.allgemein, true); }
  }
  if (kannSprechen) {
    $('wz-los').hidden = true;
    $('wz-los-sprechen').hidden = false;
    $('wz-los-schreiben').hidden = false;
    $('wz-aufnahme').hidden = false;
    $('wz-mic-hinweis').hidden = false;
    $('wz-diktat').hidden = true;
    mic.addEventListener('click', starteAufnahme);
    // Direkt im Klick starten: Manche Browser erlauben das Mikrofon nur aus einer Nutzeraktion.
    $('wz-los-sprechen').addEventListener('click', () => { starteAufnahme(); eintauchen(() => { zeige('eingabe'); }); });
    $('wz-los-schreiben').addEventListener('click', () => eintauchen(() => { zeige('eingabe'); feld.focus(); }));
  }

  // ---------- Schritt 2: zwei Fragen ----------
  function blase(id: string, text: string): void {
    const el = $(id);
    el.textContent = '';
    const wer = document.createElement('span');
    wer.className = 'wz-wer';
    wer.textContent = L.du;
    el.append(wer, document.createTextNode(text));
    el.hidden = false;
  }
  function frageZuruecksetzen(): void {
    ['wz-antwort-1', 'wz-frage-2', 'wz-chips-2', 'wz-antwort-2', 'wz-warten'].forEach((id) => { $(id).hidden = true; });
    $('wz-chips-1').hidden = false;
  }
  $('wz-zur-frage').addEventListener('click', () => {
    const neu = feld.value.trim();
    // Neuer Wunschtext: Zettel neu aufsetzen. Gleicher Text: Bearbeitungen am Zettel behalten.
    if (neu !== z.wunsch) { z.wunsch = neu; z.titel = ''; z.heute = ''; z.morgen = ''; z.gewinn = ''; }
    z.haeufigkeit = ''; z.dauer = '';
    $('wz-zitat').textContent = z.wunsch;
    frageZuruecksetzen();
    zeige('frage');
  });
  document.querySelectorAll<HTMLElement>('[data-frage]').forEach((gruppe) => {
    gruppe.querySelectorAll<HTMLElement>('.wz-chip').forEach((chip) => chip.addEventListener('click', () => {
      const wert = chip.dataset.wert || '';
      gruppe.hidden = true;
      if (gruppe.dataset.frage === 'haeufigkeit') {
        z.haeufigkeit = wert;
        blase('wz-antwort-1', L.f1[wert] || '');
        $('wz-frage-2').hidden = false;
        $('wz-chips-2').hidden = false;
        ($('wz-chips-2').querySelector('button') as HTMLButtonElement | null)?.focus();
      } else {
        z.dauer = wert;
        blase('wz-antwort-2', L.f2[wert] || '');
        schreibeZettel();
      }
      sichern();
    }));
  });

  function schreibeZettel(): void {
    $('wz-warten').hidden = false;
    let i = 0;
    $('wz-wartetext').textContent = L.warten[0];
    const t = setInterval(() => { i = (i + 1) % L.warten.length; $('wz-wartetext').textContent = L.warten[i]; }, 900);
    setTimeout(() => {
      clearInterval(t);
      // Ohne eigene Bearbeitung kommen Wunschtext und Schaetzung frisch aus den Antworten.
      if (!z.heute) z.heute = z.wunsch;
      z.gewinn = zeitgewinn(z.haeufigkeit, z.dauer);
      fuelleZettel();
      zeige('zettel');
    }, ruhig ? 250 : 1800);
  }

  // ---------- Schritt 3: Wunschzettel ----------
  const MAL_PRO_JAHR: Record<string, number> = { taeglich: 220, woechentlich: 46, monatlich: 11, seltener: 4 };
  const STUNDEN_PRO_MAL: Record<string, number> = { minuten: 0.15, halbestunde: 0.5, stunde: 1, stunden: 3 };
  function zahl(n: number): string { return n.toLocaleString(L.lang === 'de' ? 'de-CH' : 'en-GB'); }
  function zeitgewinn(oft: string, dauer: string): string {
    const h = (MAL_PRO_JAHR[oft] || 0) * (STUNDEN_PRO_MAL[dauer] || 0);
    if (h < 1.5) return L.satz.gewinnKlein;
    const gerundet = h >= 100 ? Math.round(h / 10) * 10 : Math.round(h);
    if (h < 40) return L.satz.gewinnStunden.replace('{h}', zahl(gerundet));
    return L.satz.gewinnTage.replace('{h}', zahl(gerundet)).replace('{d}', zahl(Math.round(h / 8.4)));
  }
  function wieOft(): string {
    const oft = L.satz.haeufigkeit[z.haeufigkeit];
    const dauer = L.satz.dauer[z.dauer];
    if (!oft || !dauer) return '';
    const s = L.satz.wieOft.replace('{oft}', oft).replace('{dauer}', dauer);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const zettelFelder: [keyof Zustand, string][] = [['titel', 'wz-z-titel'], ['heute', 'wz-z-heute'], ['morgen', 'wz-z-morgen'], ['gewinn', 'wz-z-gewinn']];
  function fuelleZettel(): void {
    zettelFelder.forEach(([k, id]) => { $(id).textContent = String(z[k] || ''); });
    $('wz-z-oft').textContent = wieOft();
  }
  function textAus(el: HTMLElement): string {
    return (el.innerText || '').replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }
  // Grenzen wie im Worker (worker/src/handlers/wunsch.ts). Der Zaehler unter dem Zettel zeigt sie beim Bearbeiten.
  const MAX_ZETTEL: Record<string, number> = { titel: 140, heute: 800, morgen: 600, gewinn: 120 };
  const zaehler = $('wz-z-zaehler');
  function markiert(): number { return (window.getSelection()?.toString() || '').length; }
  function meldeZaehler(k: string, el: HTMLElement): void {
    const max = MAX_ZETTEL[k];
    const n = textAus(el).length;
    zaehler.textContent = L.zettel.zaehler
      .replace('{feld}', L.zettel.felder[k as keyof Laufzeit['zettel']['felder']])
      .replace('{n}', String(n))
      .replace('{max}', String(max));
    zaehler.classList.toggle('wz-zuviel', n >= max);
  }
  zettelFelder.forEach(([k, id]) => {
    const el = $(id);
    const max = MAX_ZETTEL[k];
    el.addEventListener('input', () => {
      (z[k] as string) = textAus(el);
      // Sonst bleibt ein <br> stehen und der Platzhalter erscheint nicht mehr.
      if (!z[k]) el.textContent = '';
      sichern();
      meldeZaehler(k, el);
    });
    el.addEventListener('focus', () => meldeZaehler(k, el));
    el.addEventListener('blur', () => { zaehler.textContent = L.zettel.zaehlerStart; zaehler.classList.remove('wz-zuviel'); });
    el.addEventListener('beforeinput', (e) => {
      const ev = e as InputEvent;
      if (ev.inputType.startsWith('insert') && ev.inputType !== 'insertFromPaste' && textAus(el).length - markiert() >= max) e.preventDefault();
    });
    // Nur Text einfuegen, keine Formatierung aus Word oder E-Mails, und nur so viel, wie noch Platz hat.
    el.addEventListener('paste', (e) => {
      e.preventDefault();
      const frei = Math.max(0, max - textAus(el).length + markiert());
      const text = (e.clipboardData?.getData('text/plain') || '').slice(0, frei);
      if (text) document.execCommand('insertText', false, text);
    });
    // Titel und Zeitgewinn sind einzeilig.
    if (id === 'wz-z-titel' || id === 'wz-z-gewinn') {
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
    }
  });
  $('wz-zum-proto').addEventListener('click', () => zeige('proto'));
  function vonVorne(): void {
    z = leer();
    vergessen();
    feld.value = '';
    pruefeWunsch();
    ($('wz-formular') as HTMLFormElement).reset();
    $('wz-fehler').textContent = '';
    zeige('start');
  }
  $('wz-neu').addEventListener('click', vonVorne);
  $('wz-nochmal').addEventListener('click', vonVorne);

  // ---------- Prototyp ----------
  function promptText(): string {
    const teile = [z.heute || z.wunsch];
    const oft = L.satz.haeufigkeit[z.haeufigkeit];
    const dauer = L.satz.dauer[z.dauer];
    if (oft && dauer) teile.push(L.satz.vorkommen.replace('{oft}', oft).replace('{dauer}', dauer));
    if (z.morgen) teile.push(`${L.satz.ideal} ${z.morgen}`);
    let text = teile.join(' ').replace(/\s+/g, ' ').trim();
    if (text.length > MAX_PROMPT) text = text.slice(0, MAX_PROMPT - 1).replace(/\s+\S*$/, '') + '…';
    return text;
  }
  const rahmen = $<HTMLIFrameElement>('wz-rahmen');
  const theme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  // Rueckfall: ohne Bestaetigung der Spielwiese nach WARTE_AUF_SPIELWIESE die Kopierhilfe zeigen.
  const WARTE_AUF_SPIELWIESE = 5000;
  let wunschModus = false;
  let hilfeTimer = 0;
  function sendePrefill(): void {
    rahmen.contentWindow?.postMessage({ type: 'scopera:playground:prefill', prompt: promptText() }, URSPRUNG);
    window.clearTimeout(hilfeTimer);
    if (!wunschModus) hilfeTimer = window.setTimeout(() => { if (!wunschModus) $('wz-proto-hilfe').hidden = false; }, WARTE_AUF_SPIELWIESE);
  }
  // Schluessel zur gebauten App, damit das Team den Zugang ohne Neubau verschicken kann.
  type Prototyp = { key: string; bis: string };
  const KEIN_PROTOTYP: Prototyp = { key: '', bis: '' };
  const WARTE_AUF_SCHLUESSEL = 4000;
  let gesichert: Prototyp | null = null;
  let schluesselAntwort: ((p: Prototyp) => void) | null = null;
  function holePrototyp(): Promise<Prototyp> {
    if (gesichert) return Promise.resolve(gesichert);
    const ziel = rahmen.contentWindow;
    if (!wunschModus || !ziel) return Promise.resolve(KEIN_PROTOTYP);
    return new Promise((fertig) => {
      const timer = window.setTimeout(() => { schluesselAntwort = null; fertig(KEIN_PROTOTYP); }, WARTE_AUF_SCHLUESSEL);
      schluesselAntwort = (p) => {
        window.clearTimeout(timer);
        schluesselAntwort = null;
        if (p.key) gesichert = p;
        fertig(p);
      };
      ziel.postMessage({ type: 'scopera:playground:wish-submit' }, URSPRUNG);
    });
  }
  function ladeSpielwiese(): void {
    $<HTMLTextAreaElement>('wz-prompt').value = promptText();
    $('wz-kopier-status').textContent = '';
    if (!rahmen.src && rahmen.dataset.src) {
      rahmen.src = `${rahmen.dataset.src}&theme=${theme()}`;
      rahmen.addEventListener('load', () => {
        rahmen.contentWindow?.postMessage({ type: 'scopera:playground:prefs', theme: theme() }, URSPRUNG);
        sendePrefill();
      });
    } else {
      sendePrefill();
    }
  }
  new MutationObserver(() => {
    rahmen.contentWindow?.postMessage({ type: 'scopera:playground:prefs', theme: theme() }, URSPRUNG);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('message', (e) => {
    if (e.origin !== URSPRUNG) return;
    const d = e.data as { type?: string; height?: unknown; key?: unknown; expires_at?: unknown } | null;
    if (d && d.type === 'scopera:playground:wish-built') {
      const key = typeof d.key === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(d.key) ? d.key : '';
      const bis = key && typeof d.expires_at === 'string' ? d.expires_at.slice(0, 40) : '';
      schluesselAntwort?.({ key, bis });
      return;
    }
    if (d && d.type === 'scopera:playground:wish-ready') {
      wunschModus = true;
      window.clearTimeout(hilfeTimer);
      $('wz-proto-hilfe').hidden = true;
      return;
    }
    if (!d || d.type !== 'scopera:playground:height') return;
    const hoehe = Number(d.height);
    if (!Number.isFinite(hoehe) || hoehe < 200 || hoehe > 20000) return;
    rahmen.style.minHeight = '0';
    rahmen.style.height = `${hoehe}px`;
  });
  $('wz-kopieren').addEventListener('click', async () => {
    const feldPrompt = $<HTMLTextAreaElement>('wz-prompt');
    const status = $('wz-kopier-status');
    try {
      await navigator.clipboard.writeText(feldPrompt.value);
      status.textContent = L.proto.kopiert;
    } catch {
      feldPrompt.focus();
      feldPrompt.select();
      status.textContent = document.execCommand('copy') ? L.proto.kopiert : L.proto.kopierFehler;
    }
  });

  // ---------- Abschicken ----------
  const formular = $<HTMLFormElement>('wz-formular');
  const fehler = $('wz-fehler');
  formular.addEventListener('submit', async (e) => {
    e.preventDefault();
    const wert = (id: string) => $<HTMLInputElement>(id).value.trim();
    const name = wert('wz-f-name');
    const firma = wert('wz-f-firma');
    const email = wert('wz-f-mail');
    if (!name || !firma || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { fehler.textContent = L.formular.fehlerFelder; return; }
    if (!$<HTMLInputElement>('wz-f-ok').checked) { fehler.textContent = L.formular.fehlerOk; return; }
    fehler.textContent = '';

    const knopf = $<HTMLButtonElement>('wz-senden');
    knopf.disabled = true;
    $('wz-senden-text').textContent = L.formular.sendet;
    const daten = new FormData(formular);
    try {
      const prototyp = await holePrototyp();
      const res = await fetch(L.endpunkt, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang: L.lang,
          quelle: L.variante,
          name, firma, email,
          bemerkung: wert('wz-f-bemerkung'),
          website: wert('wz-f-website'),
          wunsch: z.wunsch,
          haeufigkeit: z.haeufigkeit,
          dauer: z.dauer,
          titel: z.titel,
          heute: z.heute,
          morgen: z.morgen,
          zeitgewinn: z.gewinn,
          prototyp: prototyp.key,
          prototypBis: prototyp.bis,
          zustimmung: true,
          turnstileToken: daten.get('cf-turnstile-response') || '',
        }),
      });
      if (res.status === 429) throw new Error(L.formular.fehlerZuViele);
      if (res.status === 410) throw new Error(L.formular.fehlerGeschlossen);
      const antwort = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !antwort.ok) throw new Error('');
      const vorname = name.split(/\s+/)[0];
      $('wz-d-hand').textContent = vorname ? L.dank.hand.replace('{name}', vorname) : L.dank.handOhneName;
      vergessen();
      zeige('dank');
    } catch (err) {
      const text = err instanceof Error && err.message ? err.message : '';
      if (text) {
        fehler.textContent = text;
      } else {
        fehler.textContent = `${L.formular.fehlerSenden} `;
        const a = document.createElement('a');
        a.href = `mailto:${L.kontakt}`;
        a.textContent = L.kontakt;
        fehler.append(a, '.');
      }
    } finally {
      knopf.disabled = false;
      $('wz-senden-text').textContent = L.formular.knopf;
      // Turnstile-Token gilt nur einmal.
      (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
    }
  });

  // ---------- Szene: Tannen als Strichzeichnung, fester Zufall ----------
  const SVGNS = 'http://www.w3.org/2000/svg';
  function zufall(s: number): () => number { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function tanne(x: number, boden: number, hoehe: number, r: () => number): string {
    const stufen = 4 + Math.floor(r() * 2), breite = hoehe * .4, top = boden - hoehe, krone = hoehe;
    const j = () => (r() - .5) * hoehe * .025;
    const li: number[][] = [], re: number[][] = [];
    for (let i = 1; i <= stufen; i++) {
      const y = top + krone * i / stufen, w = breite * (i / stufen) * (.85 + r() * .3);
      li.push([x - w + j(), y + j()]); re.push([x + w + j(), y + j()]);
      if (i < stufen) { const yi = y - krone / stufen * .2; li.push([x - w * .42, yi]); re.push([x + w * .42, yi]); }
    }
    const pkt = [[x, top], ...li, [x, top + krone - hoehe * .07], ...re.reverse()];
    return 'M' + pkt.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
  }
  function pfad(svg: Element, d: string, linie = false): void {
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('pathLength', '1');
    if (linie) p.setAttribute('class', 'wz-linie');
    svg.appendChild(p);
  }
  function reihe(id: string, seed: number, abstand: number, hmin: number, hmax: number): void {
    const svg = document.getElementById(id);
    if (!svg) return;
    const r = zufall(seed), baeume: number[][] = [];
    for (let x = -40; x < 1660; x += abstand * (.6 + r() * .8)) baeume.push([x, hmin + r() * (hmax - hmin)]);
    baeume.sort((a, b) => a[1] - b[1]).forEach(([x, hh]) => pfad(svg, tanne(x, 392 + r() * 8, hh, r)));
    pfad(svg, 'M-40 396 C300 384 520 402 800 392 S1300 386 1640 398', true);
  }
  reihe('wz-reihe-hinten', 7, 46, 60, 125);
  reihe('wz-reihe-mitte', 21, 120, 130, 230);
  ([['wz-vorne-links', 33], ['wz-vorne-rechts', 51]] as [string, number][]).forEach(([id, seed]) => {
    const svg = document.getElementById(id);
    if (!svg) return;
    const r = zufall(seed), aussen = id.endsWith('links') ? 1 : -1, x0 = aussen > 0 ? 0 : 400;
    [[150, 640], [300, 400], [40, 300]].sort((a, b) => a[1] - b[1]).forEach(([dx, hh]) => pfad(svg, tanne(x0 + aussen * dx, 696, hh, r)));
  });

  // Tiefe: Ebenen folgen Maus und Scroll unterschiedlich stark
  const lagen = [...document.querySelectorAll<HTMLElement>('.wz-lage')];
  let mx = 0, my = 0;
  function setzeTiefe(): void {
    const sy = Math.min(scrollY, 900);
    lagen.forEach((l) => {
      const t = Number(l.dataset.tiefe);
      l.style.translate = `${(mx * t * -18).toFixed(1)}px ${(my * t * -8 + sy * t * .22).toFixed(1)}px`;
    });
  }
  if (!ruhig) {
    if (matchMedia('(pointer: fine)').matches) {
      addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; setzeTiefe(); }, { passive: true });
    }
    addEventListener('scroll', setzeTiefe, { passive: true });
  }

  // Eintauchen: die Szene kommt naeher, warmes Licht, dann der erste Schritt
  function eintauchen(fertig: () => void): void {
    if (ruhig) { fertig(); return; }
    wz.classList.add('wz-eintauchen');
    lagen.forEach((l) => { l.style.scale = String(1 + Number(l.dataset.tiefe) * .55); });
    setTimeout(() => {
      fertig();
      wz.classList.remove('wz-eintauchen');
      lagen.forEach((l) => { l.style.scale = ''; });
    }, 720);
  }

  // Ueberschrift Buchstabe fuer Buchstabe, Woerter bleiben beim Umbruch zusammen
  document.querySelectorAll<HTMLElement>('.wz-zeichenweise').forEach((el) => {
    const text = (el.textContent || '').trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    let n = 0;
    text.split(' ').forEach((w, wi, alle) => {
      const ws = document.createElement('span');
      ws.className = 'wz-wort';
      ws.setAttribute('aria-hidden', 'true');
      [...w].forEach((c) => {
        const s = document.createElement('span');
        s.className = 'wz-zeichen';
        s.textContent = c;
        s.style.setProperty('--i', String(n++));
        ws.appendChild(s);
      });
      el.appendChild(ws);
      if (wi < alle.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  // Dank: Brief fliegt zum Stern, der Stern leuchtet kurz auf
  let flugTimer: ReturnType<typeof setTimeout> | undefined;
  let flugAnim: Animation | null = null;
  function stoppeFlug(): void {
    clearTimeout(flugTimer);
    if (flugAnim) { flugAnim.cancel(); flugAnim = null; }
  }
  function brieflug(): void {
    stoppeFlug();
    if (ruhig) return;
    flugTimer = setTimeout(() => {
      const u = $('wz-umschlag');
      const s = document.querySelector<HTMLElement>('.wz-stern');
      if (!s) return;
      const a = u.getBoundingClientRect(), ziel = s.getBoundingClientRect();
      const dx = ziel.left + ziel.width / 2 - (a.left + a.width / 2), dy = ziel.top + ziel.height / 2 - (a.top + a.height / 2);
      flugAnim = u.animate([
        { transform: 'none', opacity: 1 },
        { transform: `translate(${dx * .3}px, ${dy * .45 - 30}px) rotate(-5deg) scale(.7)`, opacity: 1, offset: .45 },
        { transform: `translate(${dx}px, ${dy}px) rotate(-14deg) scale(.06)`, opacity: 0 },
      ], { duration: 1300, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
      flugAnim.onfinish = () => { s.classList.remove('wz-aufleuchten'); void s.offsetWidth; s.classList.add('wz-aufleuchten'); };
    }, 1950);
  }

  // Schneefall mit Tiefe; Flocken weichen dem Zeiger aus; abschaltbar
  const cv = $<HTMLCanvasElement>('wz-schnee');
  const cx = cv.getContext('2d');
  let flocken: { x: number; y: number; r: number; v: number; p: number; vx: number; a: number }[] = [];
  let b = 0, h = 0, farbe = '', schneit = true, laeuft = false, zx = -999, zy = -999;
  function groesse(): void {
    if (!cx) return;
    const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    b = r.width; h = r.height; cv.width = b * d; cv.height = h * d; cx.setTransform(d, 0, 0, d, 0, 0);
    const n = Math.round(Math.min(90, b * h / 9000));
    flocken = Array.from({ length: n }, () => {
      const nah = Math.random() < .1, rr = nah ? 2.6 + Math.random() * 1.4 : .6 + Math.random() * 1.8;
      return { x: Math.random() * b, y: Math.random() * h, r: rr, v: .12 + rr * .2, p: Math.random() * 6.28, vx: 0, a: nah ? .5 : 1 };
    });
    farbe = getComputedStyle(wz).getPropertyValue('--wz-snow').trim();
    if (ruhig || !schneit) male();
  }
  function male(): void {
    if (!cx) return;
    cx.clearRect(0, 0, b, h);
    if (!schneit) return;
    cx.fillStyle = farbe;
    for (const f of flocken) { cx.globalAlpha = f.a; cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, 6.283); cx.fill(); }
    cx.globalAlpha = 1;
  }
  function schritt(): void {
    if (!schneit || document.hidden) { laeuft = false; male(); return; }
    for (const f of flocken) {
      const dx = f.x - zx, dy = f.y - zy, d2 = dx * dx + dy * dy;
      if (d2 < 8100) { const d = Math.sqrt(d2) || 1; f.vx += dx / d * .6; f.y += dy / d * .4; }
      f.vx *= .92; f.y += f.v; f.p += .01; f.x += Math.sin(f.p) * .25 + f.vx;
      if (f.y > h + 4) { f.y = -4; f.x = Math.random() * b; }
    }
    male();
    requestAnimationFrame(schritt);
  }
  function starteSchnee(): void { if (!ruhig && schneit && !laeuft) { laeuft = true; requestAnimationFrame(schritt); } }
  wz.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); zx = e.clientX - r.left; zy = e.clientY - r.top; });
  wz.addEventListener('pointerleave', () => { zx = zy = -999; });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) starteSchnee(); });
  $('wz-schnee-knopf').addEventListener('click', (e) => {
    schneit = !schneit;
    const k = e.currentTarget as HTMLElement;
    const label = schneit ? L.schnee.aus : L.schnee.an;
    k.setAttribute('aria-pressed', String(schneit));
    k.setAttribute('aria-label', label);
    k.title = label;
    if (schneit) { if (ruhig) male(); else starteSchnee(); } else male();
  });
  groesse();
  let groesseTimer: ReturnType<typeof setTimeout> | undefined;
  new ResizeObserver(() => { clearTimeout(groesseTimer); groesseTimer = setTimeout(groesse, 120); }).observe(wz);
  new MutationObserver(groesse).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  starteSchnee();

  // ---------- Start: angefangenen Wunsch aus diesem Tab wiederherstellen ----------
  const alt = laden();
  if (alt && alt.wunsch) {
    z = alt;
    feld.value = z.wunsch;
    $('wz-zitat').textContent = z.wunsch;
    if (z.haeufigkeit && z.dauer) {
      fuelleZettel();
      zeige(z.ansicht === 'proto' ? 'proto' : 'zettel');
    } else {
      zeige('eingabe');
    }
  } else {
    zeige('start');
  }
  pruefeWunsch();
  bereit = true;
}
