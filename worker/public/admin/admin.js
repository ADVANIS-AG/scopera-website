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

initTabs();
initCorsSave();
initIpAdd();
loadVisitors();
loadPages();
loadLeads();
loadCrmStatus();
loadCorsConfig();
loadIpRules();
loadRateLimits();
