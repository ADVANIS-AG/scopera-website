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

function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab').forEach((t) => { t.hidden = true; });
      document.getElementById(`tab-${btn.dataset.tab}`).hidden = false;
    });
  });
  buttons[0]?.classList.add('active');
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
// Die Farbskala geht von kuehl nach heiss. Bewusst nur drei Stuetzpunkte: Mehr Farben
// suggerieren eine Genauigkeit, die ein 20-mal-50-Raster nicht hat.
function heatFarbe(anteil) {
  if (anteil < 0.5) {
    const t = anteil / 0.5;
    return `rgba(${Math.round(60 + t * 150)}, ${Math.round(130 + t * 70)}, 220, ${0.25 + t * 0.35})`;
  }
  const t = (anteil - 0.5) / 0.5;
  return `rgba(${Math.round(210 + t * 45)}, ${Math.round(200 - t * 140)}, ${Math.round(220 - t * 200)}, ${0.6 + t * 0.35})`;
}

const HEAT_BREITEN = { mobil: 390, tablet: 900, desktop: 1280 };

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

    const overlay = document.createElement('div');
    overlay.className = 'heat-overlay';
    const zellBreite = breite / daten.spalten;
    const zellHoehe = hoehe / daten.zeilen;
    const maximum = daten.maximum || 1;
    // Der Punkt ist absichtlich groesser als seine Zelle: zusammen mit dem Weichzeichner
    // ergibt das weiche Uebergaenge statt sichtbarer Kacheln.
    const durchmesser = Math.max(zellBreite, zellHoehe) * 1.8;

    for (const z of daten.zellen) {
      const punkt = document.createElement('div');
      punkt.className = 'heat-zelle';
      punkt.style.width = `${durchmesser}px`;
      punkt.style.height = `${durchmesser}px`;
      punkt.style.left = `${(z.spalte + 0.5) * zellBreite - durchmesser / 2}px`;
      punkt.style.top = `${(z.zeile + 0.5) * zellHoehe - durchmesser / 2}px`;
      punkt.style.background = heatFarbe(z.anzahl / maximum);
      overlay.appendChild(punkt);
    }
    flaeche.appendChild(overlay);

    // Breite Fensterklassen in die Buehne skalieren, ohne das Overlay gegen die Seite zu
    // verschieben: skaliert wird die gemeinsame Flaeche, nicht der Rahmen allein.
    const verfuegbar = buehne.clientWidth;
    const faktor = verfuegbar && breite > verfuegbar ? verfuegbar / breite : 1;
    flaeche.style.transform = `scale(${faktor})`;
    buehne.style.height = `${Math.min(hoehe * faktor, window.innerHeight * 0.75)}px`;

    const klicks = daten.zellen.reduce((summe, z) => summe + z.anzahl, 0);
    heatStatus(
      klicks === 0
        ? 'Noch keine Klicks für diese Seite und Fensterklasse.'
        : `${klicks} Klicks in ${daten.zellen.length} Zellen, stärkste Zelle ${maximum}.`,
    );
  });
}

const APOLLO_ERGEBNIS = {
  'ok': 'übertragen',
  'kein-konto': 'kein passendes Konto in Apollo',
  'felder-fehlen': 'Felder in Apollo fehlen',
  'fehler': 'Fehler',
};

async function loadApollo() {
  const koerper = document.getElementById('apollo-body');
  const status = document.getElementById('apollo-status');
  try {
    const daten = await api('/apollo');
    if (daten.error) {
      status.textContent = `Fehler: ${daten.error}`;
      koerper.innerHTML = `<tr><td colspan="5" class="soft">Fehler: ${esc(daten.error)}</td></tr>`;
      return;
    }
    status.textContent = daten.aktiv
      ? 'Aktiv. Je erkannte Firma höchstens eine Rückmeldung pro Tag, und erst ab der Lead-Schwelle.'
      : daten.hinweis;
    renderRows(koerper, daten.rueckmeldungen, 5, (r) => `
      <tr>
        <td>${esc(r.firma)}</td>
        <td>${esc(APOLLO_ERGEBNIS[r.ergebnis] || r.ergebnis)}</td>
        <td>${esc(r.score ?? '')}</td>
        <td>${esc(r.zeitpunkt ? new Date(r.zeitpunkt).toLocaleString('de-CH') : '')}</td>
        <td>${esc(r.meldung || '')}</td>
      </tr>
    `);
  } catch (err) {
    status.textContent = `Fehler: ${err.message}`;
    koerper.innerHTML = `<tr><td colspan="5" class="soft">Fehler: ${esc(err.message)}</td></tr>`;
  }
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

function initApollo() {
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
}

initTabs();
initCorsSave();
initIpAdd();
initHeatmap();
initApollo();
loadVisitors();
loadPages();
loadEngagement();
// Die Seitenauswahl stammt aus derselben Abfrage, wird aber bewusst getrennt geladen: Scheitert
// die eine, bleibt die andere bedienbar.
loadHeatPfade();
loadApollo();
loadLeads();
loadCrmStatus();
loadCorsConfig();
loadIpRules();
loadRateLimits();
