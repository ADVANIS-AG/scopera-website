async function api(path, options) {
  const res = await fetch(`/admin/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options && options.headers) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

/** Alles, was aus der API kommt, muss hier durch. Firmennamen stammen aus dem Apollo-Webhook
 *  und Fehlertexte aus CRM-Antworten, beides ist von aussen beeinflussbar - ohne Escaping waere
 *  das gespeichertes XSS auf einer Seite mit gueltiger Access-Sitzung. Deckt auch Attribute ab,
 *  deshalb sind Anfuehrungszeichen mit dabei. */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtTime(value) {
  if (!value) return '–';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('de-CH');
}

function fmtDauer(ms) {
  const zahl = Number(ms);
  if (!Number.isFinite(zahl) || zahl <= 0) return '–';
  const sekunden = Math.round(zahl / 1000);
  if (sekunden < 60) return `${sekunden}s`;
  return `${Math.floor(sekunden / 60)}m ${String(sekunden % 60).padStart(2, '0')}s`;
}

function renderRows(tbody, rows, colCount, rowFn) {
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="${colCount}" class="soft">Keine Einträge.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(rowFn).join('');
}

/** Eine Umschaltung fuer beide Ebenen, statt derselben Schleife zweimal.
 *
 *  `beiOeffnen` wird je Ziel hoechstens einmal aufgerufen. Damit laedt eine Ansicht erst, wenn
 *  sie jemand ansieht: Vorher holte die Konsole beim Start sechs Auswertungen auf einmal,
 *  darunter vier Abfragen gegen Analytics Engine, von denen die meisten niemand brauchte. */
function initUmschaltung(knopfKlasse, bereichKlasse, praefix, beiOeffnen) {
  const knoepfe = document.querySelectorAll(knopfKlasse);
  const geladen = new Set();

  function oeffne(knopf) {
    knoepfe.forEach((b) => b.classList.remove('active'));
    knopf.classList.add('active');
    document.querySelectorAll(bereichKlasse).forEach((t) => { t.hidden = true; });
    const ziel = knopf.dataset[praefix];
    document.getElementById(`${praefix}-${ziel}`).hidden = false;
    if (beiOeffnen && !geladen.has(ziel)) {
      geladen.add(ziel);
      beiOeffnen(ziel);
    }
  }

  knoepfe.forEach((knopf) => knopf.addEventListener('click', () => oeffne(knopf)));
  if (knoepfe[0]) oeffne(knoepfe[0]);
}

function initTabs() {
  initUmschaltung('.tab-btn', '.tab', 'tab', (ziel) => {
    if (ziel === 'leads') { loadLeads(); loadCrmStatus(); }
    if (ziel === 'security') { loadCorsConfig(); loadIpRules(); loadRateLimits(); }
  });
  initUmschaltung('.subtab-btn', '.subtab', 'subtab', (ziel) => {
    if (ziel === 'ueberblick') { loadVisitors(); loadPages(); }
    if (ziel === 'verhalten') loadEngagement();
    if (ziel === 'heatmap') loadHeatPfade();
    if (ziel === 'apollo') loadApollo();
  });
}

async function loadVisitors() {
  const tbody = document.getElementById('visitors-body');
  try {
    const { visitors } = await api('/visitors');
    renderRows(tbody, visitors, 5, (v) => `
      <tr><td>${esc(v.subject ?? '–')}</td><td>${esc(v.source ?? '–')}</td><td>${esc(v.score ?? 0)}</td><td>${esc(v.pages ?? 0)}</td><td>${esc(fmtTime(v.timestamp))}</td></tr>
    `);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="soft">Fehler: ${esc(err.message)}</td></tr>`;
  }
}

async function loadPages() {
  const tbody = document.getElementById('pages-body');
  try {
    const { pages } = await api('/pages');
    renderRows(tbody, pages, 3, (p) => `
      <tr><td>${esc(p.path)}</td><td>${esc(p.views ?? 0)}</td><td>${esc(fmtDauer(p.avgDurationMs))}</td></tr>
    `);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" class="soft">Fehler: ${esc(err.message)}</td></tr>`;
  }
}

async function loadEngagement() {
  const scrollBody = document.getElementById('scroll-body');
  const clicksBody = document.getElementById('clicks-body');
  try {
    const data = await api('/engagement');
    if (data.scrollError) {
      scrollBody.innerHTML = `<tr><td colspan="3" class="soft">Fehler: ${esc(data.scrollError)}</td></tr>`;
    } else {
      renderRows(scrollBody, data.scroll, 3, (s) => `
        <tr><td>${esc(s.path)}</td><td>${esc(Math.round(s.avgScroll ?? 0))}%</td><td>${esc(s.gemessen ?? 0)}</td></tr>
      `);
    }
    if (data.clicksError) {
      clicksBody.innerHTML = `<tr><td colspan="3" class="soft">Fehler: ${esc(data.clicksError)}</td></tr>`;
    } else {
      renderRows(clicksBody, data.clicks, 3, (c) => `
        <tr><td>${esc(c.path)}</td><td>${esc(c.target)}</td><td>${esc(c.clicks ?? 0)}</td></tr>
      `);
    }
  } catch (err) {
    const zeile = `<tr><td colspan="3" class="soft">Fehler: ${esc(err.message)}</td></tr>`;
    scrollBody.innerHTML = zeile;
    clicksBody.innerHTML = zeile;
  }
}

// --- Heatmap ---------------------------------------------------------------

/** Farbskala von kuehl nach heiss, in fuenf Stuetzpunkten.
 *
 *  Der Anteil geht als Wurzel ein, nicht linear. Grund: Bei einem Maximum von 40 waere eine
 *  Zelle mit einem Klick linear bei 2,5 Prozent und damit praktisch unsichtbar - gerade die
 *  vereinzelten Klicks will man aber sehen. Die Wurzel hebt den unteren Bereich an, ohne die
 *  Rangfolge zu verdrehen. Dazu eine Mindestdeckkraft, damit nichts voellig verschwindet. */
const HEAT_STUFEN = [
  [0.0, [70, 120, 220]],
  [0.25, [60, 190, 200]],
  [0.5, [120, 210, 90]],
  [0.75, [245, 200, 60]],
  [1.0, [230, 50, 35]],
];

function heatFarbe(anzahl, maximum, deckkraft) {
  const anteil = Math.sqrt(Math.max(0, Math.min(1, anzahl / (maximum || 1))));
  let i = 0;
  while (i < HEAT_STUFEN.length - 2 && anteil > HEAT_STUFEN[i + 1][0]) i++;
  const [p0, c0] = HEAT_STUFEN[i];
  const [p1, c1] = HEAT_STUFEN[i + 1];
  const t = p1 === p0 ? 0 : (anteil - p0) / (p1 - p0);
  const kanal = (k) => Math.round(c0[k] + (c1[k] - c0[k]) * t);
  const alpha = deckkraft === undefined ? 0.45 + anteil * 0.5 : deckkraft;
  return `rgba(${kanal(0)}, ${kanal(1)}, ${kanal(2)}, ${alpha})`;
}

/** Legende aus derselben Funktion aufbauen, nicht aus einer zweiten Farbliste: Sonst zeigt die
 *  Legende irgendwann etwas anderes als das Bild. */
function zeichneLegende(maximum) {
  const stufen = [];
  for (let i = 0; i <= 20; i++) {
    const anteil = i / 20;
    // Rueckwaerts: welche Anzahl ergaebe diesen Anteil nach der Wurzel?
    stufen.push(`${heatFarbe(anteil * anteil * maximum, maximum, 1)} ${anteil * 100}%`);
  }
  document.getElementById('heat-skala').style.background = `linear-gradient(to right, ${stufen.join(', ')})`;
  document.getElementById('heat-skala-max').textContent = String(maximum);
  document.getElementById('heat-legende').hidden = false;
}

const HEAT_BREITEN = { mobil: 390, tablet: 900, desktop: 1280 };

/** Arbeitet auf den gerade vorhandenen Ebenen, statt sie in einen Abschluss einzusperren.
 *  Sonst haengte bei jedem Anzeigen ein weiterer Zuhoerer am Auswahlfeld, der auf laengst
 *  entfernte Elemente zeigt. */
function wendeDarstellungAn() {
  const art = document.getElementById('heat-darstellung').value;
  const overlay = document.querySelector('.heat-overlay');
  const raster = document.querySelector('.heat-raster');
  if (overlay) overlay.hidden = art === 'raster';
  if (raster) raster.hidden = art === 'verlauf';
}

function heatStatus(text) {
  document.getElementById('heat-status').textContent = text;
}

/** Fuellt die Seitenauswahl aus derselben Quelle wie die Tabelle "Meistbesuchte Seiten",
 *  damit dort nur Pfade stehen, zu denen es ueberhaupt Daten gibt. */
async function loadHeatPfade() {
  const auswahl = document.getElementById('heat-pfad');
  try {
    const { pages } = await api('/pages');
    const liste = (pages || []).filter((p) => p && p.path);
    if (!liste.length) {
      auswahl.innerHTML = '<option value="">Noch keine Seitendaten</option>';
      return;
    }
    auswahl.innerHTML = liste
      .map((p) => `<option value="${esc(p.path)}">${esc(p.path)}</option>`)
      .join('');
  } catch (err) {
    auswahl.innerHTML = `<option value="">Fehler: ${esc(err.message)}</option>`;
  }
}

async function zeigeHeatmap() {
  const pfad = document.getElementById('heat-pfad').value;
  const viewport = document.getElementById('heat-viewport').value;
  const buehne = document.getElementById('heat-buehne');
  if (!pfad) { heatStatus('Keine Seite gewählt.'); return; }

  heatStatus('Lädt…');
  buehne.textContent = '';
  document.getElementById('heat-legende').hidden = true;
  document.getElementById('heat-ablesung').textContent = 'Mit der Maus über das Bild fahren';
  document.getElementById('heat-liste-titel').hidden = true;
  document.getElementById('heat-liste-tabelle').hidden = true;

  let daten;
  try {
    daten = await api(`/heatmap?path=${encodeURIComponent(pfad)}&viewport=${encodeURIComponent(viewport)}`);
  } catch (err) {
    heatStatus(`Fehler: ${err.message}`);
    return;
  }
  if (daten.error) { heatStatus(`Fehler: ${daten.error}`); return; }

  const breite = HEAT_BREITEN[viewport] || 1280;
  const flaeche = document.createElement('div');
  flaeche.className = 'heat-flaeche';
  flaeche.style.width = `${breite}px`;

  const rahmen = document.createElement('iframe');
  rahmen.src = `/admin/api/preview?path=${encodeURIComponent(pfad)}`;
  rahmen.width = String(breite);
  rahmen.height = '800';
  // Kein allow-scripts: Die Vorschau ist bereits skriptfrei, der Sandkasten haelt das fest.
  rahmen.setAttribute('sandbox', 'allow-same-origin');
  flaeche.appendChild(rahmen);
  buehne.appendChild(flaeche);

  rahmen.addEventListener('load', () => {
    // Gleiche Herkunft, also ist die echte Dokumenthoehe lesbar. Der Rahmen wird darauf
    // gezogen, damit er nicht selbst scrollt und Zeile 23 von 50 wirklich bei 46 Prozent liegt.
    let hoehe = 800;
    try {
      const d = rahmen.contentDocument;
      hoehe = Math.max(d.documentElement.scrollHeight, d.body ? d.body.scrollHeight : 0) || 800;
    } catch (err) {
      heatStatus('Vorschau nicht lesbar, Höhe geschätzt.');
    }
    rahmen.height = String(hoehe);
    flaeche.style.height = `${hoehe}px`;

    const zellBreite = breite / daten.spalten;
    const zellHoehe = hoehe / daten.zeilen;
    const maximum = daten.maximum || 1;

    // Nachschlagwerk fuer die Ablesung unter der Maus.
    const nachZelle = new Map(daten.zellen.map((z) => [`${z.spalte}:${z.zeile}`, z.anzahl]));

    // Ebene 1: der weiche Verlauf. Der Punkt ist absichtlich groesser als seine Zelle,
    // zusammen mit dem Weichzeichner ergibt das Uebergaenge statt sichtbarer Kacheln.
    const overlay = document.createElement('div');
    overlay.className = 'heat-overlay';
    const durchmesser = Math.max(zellBreite, zellHoehe) * 1.8;
    for (const z of daten.zellen) {
      const punkt = document.createElement('div');
      punkt.className = 'heat-zelle';
      punkt.style.width = `${durchmesser}px`;
      punkt.style.height = `${durchmesser}px`;
      punkt.style.left = `${(z.spalte + 0.5) * zellBreite - durchmesser / 2}px`;
      punkt.style.top = `${(z.zeile + 0.5) * zellHoehe - durchmesser / 2}px`;
      punkt.style.background = heatFarbe(z.anzahl, maximum);
      overlay.appendChild(punkt);
    }
    flaeche.appendChild(overlay);

    // Ebene 2: dieselben Zellen scharf umrissen und beziffert. Der Verlauf zeigt, wo etwas
    // los ist, das Raster zeigt, wie viel - ohne Zahl bleibt es Deuten.
    const raster = document.createElement('div');
    raster.className = 'heat-raster';
    for (const z of daten.zellen) {
      const kachel = document.createElement('div');
      kachel.className = 'heat-zahl';
      kachel.style.width = `${zellBreite}px`;
      kachel.style.height = `${zellHoehe}px`;
      kachel.style.left = `${z.spalte * zellBreite}px`;
      kachel.style.top = `${z.zeile * zellHoehe}px`;
      kachel.style.background = heatFarbe(z.anzahl, maximum, 0.3);
      kachel.textContent = String(z.anzahl);
      raster.appendChild(kachel);
    }
    flaeche.appendChild(raster);

    wendeDarstellungAn();

    // Breite Fensterklassen in die Buehne skalieren, ohne das Overlay gegen die Seite zu
    // verschieben: skaliert wird die gemeinsame Flaeche, nicht der Rahmen allein.
    const verfuegbar = buehne.clientWidth;
    const faktor = verfuegbar && breite > verfuegbar ? verfuegbar / breite : 1;
    flaeche.style.transform = `scale(${faktor})`;
    buehne.style.height = `${Math.min(hoehe * faktor, window.innerHeight * 0.75)}px`;

    // Ablesung: Die Flaeche ist skaliert, getBoundingClientRect liefert also die skalierten
    // Masse. Der Anteil darin ist derselbe wie im unskalierten Raster, darum wird ueber den
    // Anteil gerechnet und nicht ueber Pixel.
    const ablesung = document.getElementById('heat-ablesung');
    flaeche.addEventListener('mousemove', (e) => {
      const r = flaeche.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const sp = Math.min(daten.spalten - 1, Math.floor(((e.clientX - r.left) / r.width) * daten.spalten));
      const ze = Math.min(daten.zeilen - 1, Math.floor(((e.clientY - r.top) / r.height) * daten.zeilen));
      if (sp < 0 || ze < 0) return;
      const anzahl = nachZelle.get(`${sp}:${ze}`) || 0;
      ablesung.textContent = `Spalte ${sp + 1} von ${daten.spalten}, Zeile ${ze + 1} von ${daten.zeilen}: ${anzahl} Klicks`;
    });
    flaeche.addEventListener('mouseleave', () => {
      ablesung.textContent = 'Mit der Maus über das Bild fahren';
    });

    // Uebersicht ueber alle Stellen. Bei 50 Zeilen auf einer 7600 Pixel hohen Seite muesste man
    // sonst durch das ganze Bild scrollen, um zu sehen, wo ueberhaupt etwas ist.
    const liste = document.getElementById('heat-liste');
    const sortiert = [...daten.zellen].sort((a, c) => c.anzahl - a.anzahl).slice(0, 15);
    liste.innerHTML = sortiert.map((z) => {
      const vonOben = Math.round(((z.zeile + 0.5) / daten.zeilen) * 100);
      const quer = Math.round(((z.spalte + 0.5) / daten.spalten) * 100);
      const breiteBalken = Math.max(6, Math.round((z.anzahl / maximum) * 90));
      return `<tr>
        <td><span class="heat-balken" style="width:${breiteBalken}px;background:${heatFarbe(z.anzahl, maximum, 1)}"></span>${esc(z.anzahl)}</td>
        <td>${esc(vonOben)}% von oben (rund ${esc(Math.round(((z.zeile + 0.5) / daten.zeilen) * hoehe))} px)</td>
        <td>${esc(quer)}% von links</td>
        <td>Spalte ${esc(z.spalte + 1)}, Zeile ${esc(z.zeile + 1)}</td>
      </tr>`;
    }).join('');
    const listeSichtbar = sortiert.length > 0;
    document.getElementById('heat-liste-titel').hidden = !listeSichtbar;
    document.getElementById('heat-liste-tabelle').hidden = !listeSichtbar;

    const klicks = daten.zellen.reduce((summe, z) => summe + z.anzahl, 0);
    if (klicks === 0) {
      document.getElementById('heat-legende').hidden = true;
      heatStatus('Noch keine Klicks für diese Seite und Fensterklasse.');
    } else {
      zeichneLegende(maximum);
      heatStatus(`${klicks} Klicks in ${daten.zellen.length} von ${daten.spalten * daten.zeilen} Zellen, stärkste Zelle ${maximum}. Eine Zeile entspricht rund ${Math.round(zellHoehe)} Pixeln Seitenhöhe.`);
    }
  });
}

async function loadLeads() {
  const leadsBody = document.getElementById('leads-body');
  try {
    const { leads } = await api('/leads');
    renderRows(leadsBody, leads, 5, (l) => `
      <tr><td>${esc(l.company || l.subject || '–')}</td><td>${esc(l.source ?? '–')}</td><td>${esc(l.outcome ?? '–')}</td><td>${esc(l.score ?? 0)}</td><td>${esc(fmtTime(l.timestamp))}</td></tr>
    `);
  } catch (err) {
    leadsBody.innerHTML = `<tr><td colspan="5" class="soft">Fehler: ${esc(err.message)}</td></tr>`;
  }

  const failedBody = document.getElementById('failed-leads-body');
  try {
    const { failed } = await api('/leads/failed');
    renderRows(failedBody, failed, 4, (f) => `
      <tr>
        <td>${esc(f.payload.company || f.payload.contactEmail || '–')}</td>
        <td>${esc(f.error)}</td>
        <td>${esc(fmtTime(f.createdAt))}</td>
        <td><button data-retry="${esc(f.id)}">Retry</button></td>
      </tr>
    `);
    failedBody.querySelectorAll('[data-retry]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '…';
        try {
          await api(`/leads/failed/${btn.dataset.retry}/retry`, { method: 'POST' });
          loadLeads();
        } catch (err) {
          alert(`Retry fehlgeschlagen: ${err.message}`);
          btn.disabled = false;
          btn.textContent = 'Retry';
        }
      });
    });
  } catch (err) {
    failedBody.innerHTML = `<tr><td colspan="4" class="soft">Fehler: ${esc(err.message)}</td></tr>`;
  }
}

async function loadCrmStatus() {
  const el = document.getElementById('crm-status');
  try {
    const status = await api('/crm/status');
    if (!status.configured) {
      el.textContent = 'CRM noch nicht konfiguriert (Platzhalter aktiv).';
    } else {
      el.textContent = status.reachable
        ? `Erreichbar (HTTP ${status.httpStatus}), geprüft ${fmtTime(status.checkedAt)}.`
        : `Nicht erreichbar: ${status.error || 'HTTP ' + status.httpStatus}, geprüft ${fmtTime(status.checkedAt)}.`;
    }
  } catch (err) {
    el.textContent = `Fehler: ${err.message}`;
  }
}

async function loadCorsConfig() {
  const textarea = document.getElementById('cors-origins');
  try {
    const { allowedOrigins } = await api('/security/cors');
    textarea.value = allowedOrigins.join('\n');
  } catch (err) {
    textarea.value = '';
    document.getElementById('cors-status').textContent = `Fehler: ${err.message}`;
  }
}

function initCorsSave() {
  document.getElementById('cors-save').addEventListener('click', async () => {
    const status = document.getElementById('cors-status');
    const origins = document.getElementById('cors-origins').value
      .split('\n').map((s) => s.trim()).filter(Boolean);
    status.textContent = 'Speichere…';
    try {
      await api('/security/cors', { method: 'PUT', body: JSON.stringify({ allowedOrigins: origins }) });
      status.textContent = 'Gespeichert.';
    } catch (err) {
      status.textContent = `Fehler: ${err.message}`;
    }
  });
}

async function loadIpRules() {
  const tbody = document.getElementById('ip-rules-body');
  try {
    const { rules } = await api('/security/ip-rules');
    const blocked = rules.filter((r) => r.mode === 'block');
    renderRows(tbody, blocked, 3, (r) => `
      <tr><td>${esc(r.configuration?.value ?? '–')}</td><td>${esc(r.notes ?? '')}</td>
      <td><button class="danger" data-delete-ip="${esc(r.id)}">Entsperren</button></td></tr>
    `);
    tbody.querySelectorAll('[data-delete-ip]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await api(`/security/ip-rules/${btn.dataset.deleteIp}`, { method: 'DELETE' });
          loadIpRules();
        } catch (err) {
          alert(`Fehler: ${err.message}`);
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" class="soft">Fehler: ${esc(err.message)}</td></tr>`;
  }
}

function initIpAdd() {
  document.getElementById('ip-add').addEventListener('click', async () => {
    const ip = document.getElementById('ip-input').value.trim();
    const notes = document.getElementById('ip-notes').value.trim();
    if (!ip) return;
    try {
      await api('/security/ip-rules', { method: 'POST', body: JSON.stringify({ ip, notes }) });
      document.getElementById('ip-input').value = '';
      document.getElementById('ip-notes').value = '';
      loadIpRules();
    } catch (err) {
      alert(`Fehler: ${err.message}`);
    }
  });
}

async function loadRateLimits() {
  const tbody = document.getElementById('rate-limits-body');
  const hint = document.getElementById('rate-limit-hint');
  try {
    const { rules } = await api('/security/rate-limits');
    hint.textContent = '';
    renderRows(tbody, rules, 2, (r) => `
      <tr><td>${esc(r.description)}</td><td>${esc(r.ratelimit?.requests_per_period ?? '–')} / ${esc(r.ratelimit?.period ?? '–')}s</td></tr>
    `);
  } catch (err) {
    hint.textContent = `Nicht verfügbar: ${err.message} (evtl. Plan-Einschränkung, siehe worker/README.md).`;
    tbody.innerHTML = '';
  }
}

/** Macht aus der Pruefung einen Text, den man ohne Vorwissen lesen kann. Absichtlich
 *  Klartext statt roher JSON-Ausgabe: Die Frage lautet "woran liegt es", nicht "wie sieht das
 *  Objekt aus". */
function apolloPruefungText(p) {
  const zeilen = [];
  const ja = (b) => (b ? 'ja' : 'nein');

  if (!p.schluesselGesetzt) {
    return 'APOLLO_API_KEY ist nicht gesetzt. Nichts zu prüfen.';
  }

  const deutung = (teil, recht) => {
    if (teil.ok) return 'ok';
    if (teil.status === 401) return 'Schlüssel ungültig (401)';
    if (teil.status === 403) return `Schlüssel gültig, aber Recht "${recht}" fehlt (403)`;
    if (teil.status === 429) return 'Apollo drosselt gerade (429), später nochmals';
    if (teil.status === 0) return `nicht erreichbar: ${teil.meldung || 'unbekannt'}`;
    return `Fehler ${teil.status}: ${teil.meldung || ''}`;
  };

  zeilen.push(`Felder lesen    : ${deutung(p.felderAbruf, 'api/v1/fields/index')}`);
  zeilen.push(`Konten suchen   : ${deutung(p.kontosuche, 'api/v1/accounts/search')}`);
  zeilen.push('');

  // Nur zeigen, was wir wirklich wissen: Scheitert der Abruf, waere ein "nein" hier eine
  // Falschaussage - wir haben die Felder dann nicht gesehen, nicht ihr Fehlen festgestellt.
  if (p.felderAbruf.ok) {
    zeilen.push('Erwartete Felder am Konto:');
    zeilen.push(`  SCOPERA Score          : ${ja(p.erwartet.score)}`);
    zeilen.push(`  SCOPERA Letzter Besuch : ${ja(p.erwartet.letzterBesuch)}`);
    zeilen.push(`  SCOPERA Seiten         : ${ja(p.erwartet.seiten)}`);
    zeilen.push('');
    zeilen.push(p.kontoFelder.length
      ? `In Apollo am Konto gefunden (${p.kontoFelder.length}): ${p.kontoFelder.join(', ')}`
      : 'In Apollo sind am Konto bisher keine eigenen Felder angelegt.');
  } else {
    zeilen.push('Ob die drei Felder in Apollo angelegt sind, liess sich nicht feststellen:');
    zeilen.push('die Feldliste war nicht lesbar (siehe oben).');
  }
  zeilen.push('');

  if (p.bereit) {
    zeilen.push('Ergebnis: bereit. Die nächste erkannte Firma über der Schwelle wird gemeldet.');
  } else if (!p.felderAbruf.ok || !p.kontosuche.ok) {
    zeilen.push('Ergebnis: noch nicht bereit. Zuerst Schlüssel beziehungsweise Rechte klären.');
  } else {
    zeilen.push('Ergebnis: Schlüssel und Rechte sind in Ordnung, die Felder fehlen noch.');
    zeilen.push('Nach dem Anlegen in Apollo auf «Feldzuordnung neu laden» drücken.');
  }
  return zeilen.join('\n');
}

function initApollo() {
  document.getElementById('apollo-pruefen').addEventListener('click', async (e) => {
    const knopf = e.currentTarget;
    const feld = document.getElementById('apollo-pruefung');
    knopf.disabled = true;
    feld.hidden = false;
    feld.textContent = 'Prüft…';
    try {
      const daten = await api('/apollo/pruefen', { method: 'POST' });
      feld.textContent = apolloPruefungText(daten.pruefung);
    } catch (err) {
      feld.textContent = `Fehler: ${err.message}`;
    } finally {
      knopf.disabled = false;
    }
  });

  document.getElementById('apollo-felder-neu').addEventListener('click', async (e) => {
    const knopf = e.currentTarget;
    knopf.disabled = true;
    try {
      await api('/apollo/felder-neu-laden', { method: 'POST' });
      document.getElementById('apollo-status').textContent =
        'Feldzuordnung verworfen. Die nächste Rückmeldung lädt sie neu.';
    } catch (err) {
      document.getElementById('apollo-status').textContent = `Fehler: ${err.message}`;
    } finally {
      knopf.disabled = false;
    }
  });
}

function initHeatmap() {
  document.getElementById('heat-laden').addEventListener('click', zeigeHeatmap);
  document.getElementById('heat-darstellung').addEventListener('change', wendeDarstellungAn);
}

// Reihenfolge: erst die Knoepfe verdrahten, dann umschalten. initTabs oeffnet den jeweils
// ersten Reiter und stoesst damit das Laden an - die Knoepfe darin muessen vorher stehen.
initCorsSave();
initIpAdd();
initHeatmap();
initApollo();
initTabs();
