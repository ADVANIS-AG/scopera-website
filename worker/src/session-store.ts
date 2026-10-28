import { recordClickEvents, recordLeadEvent, recordVisitorEvent, recordHeatEvents } from "./analytics";
import { sendeRueckmeldung } from "./apollo-client";
import { createLead, lookupExisting } from "./crm-client";
import { REPEAT_VISIT_WINDOW_MS, scoreSession } from "./lead-scoring";
import type { CompanyMatch, Env, PageVisit, SessionState } from "./types";

const SESSION_TTL_SECONDS = 30 * 60; // Session laeuft 30min nach letzter Aktivitaet ab
const COMPANY_HISTORY_TTL_SECONDS = Math.ceil(REPEAT_VISIT_WINDOW_MS / 1000);

function sessionKey(sessionId: string): string {
  return `session:${sessionId}`;
}

function companyHistoryKey(companyName: string): string {
  return `company-last-seen:${companyName.toLowerCase()}`;
}

async function getSession(env: Env, sessionId: string, ip: string): Promise<SessionState> {
  const existing = await env.SESSIONS.get<SessionState>(sessionKey(sessionId), "json");
  if (existing) return existing;
  const now = Date.now();
  return {
    sessionId,
    ip,
    firstSeen: now,
    lastSeen: now,
    pages: [],
    score: 0,
    leadSubmitted: false,
  };
}

async function saveSession(env: Env, session: SessionState): Promise<void> {
  await env.SESSIONS.put(sessionKey(session.sessionId), JSON.stringify(session), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
}

/** Letzten bekannten Sitzungs-Schluessel fuer eine IP merken, damit der Apollo-Webhook (der keine
 *  sessionId kennt) die passende Session wiederfinden kann. Grobe, dokumentierte Vereinfachung -
 *  siehe README "Bekannte Einschraenkungen". */
async function rememberIpToSession(env: Env, ip: string, sessionId: string): Promise<void> {
  await env.SESSIONS.put(`ip-session:${ip}`, sessionId, { expirationTtl: SESSION_TTL_SECONDS });
}

async function findSessionIdByIp(env: Env, ip: string): Promise<string | null> {
  return env.SESSIONS.get(`ip-session:${ip}`);
}

export async function recordPageview(
  env: Env,
  ip: string,
  sessionId: string,
  page: PageVisit,
  klicks: string[] = [],
  viewport = "",
  heat: Array<{ spalte: number; zeile: number }> = [],
): Promise<SessionState> {
  const session = await getSession(env, sessionId, ip);
  session.pages.push(page);
  session.lastSeen = Date.now();
  session.score = scoreSession(session.pages, session.repeatVisit === true);
  await saveSession(env, session);
  await rememberIpToSession(env, ip, sessionId);
  recordVisitorEvent(env, session, page);
  // Kennung nur fuer diesen einen Seitenaufruf, bewusst ohne Bezug zur Sitzung (siehe analytics.ts).
  const aufruf = crypto.randomUUID().slice(0, 12);
  recordClickEvents(env, page.path, klicks, aufruf);
  recordHeatEvents(env, page.path, viewport, heat, aufruf);
  await maybeSubmitLead(env, session);
  await vielleichtApolloMelden(env, session);
  return session;
}

/** Wird vom Apollo-Webhook aufgerufen, sobald eine Firma zu einer IP identifiziert wurde.
 *  Markiert die laufende Session einer IP mit der erkannten Firma.
 *
 *  `darfLeadErzeugen` trennt die beiden Wirkungen bewusst: Die Markierung lebt nur so lange wie
 *  das Session-Fenster und ist damit selbstbegrenzt, ein Lead-Eintrag liegt dagegen ein Jahr im
 *  Posteingang. Solange der Apollo-Webhook ohne Secret laeuft und jeden Aufruf annimmt, darf ein
 *  unbestaetigter Aufruf deshalb markieren, aber keinen Eintrag anlegen. */
export async function tagCompanyForIp(
  env: Env,
  ip: string,
  company: Omit<CompanyMatch, "matchedAt">,
  darfLeadErzeugen = true,
): Promise<SessionState | null> {
  const sessionId = await findSessionIdByIp(env, ip);
  if (!sessionId) {
    console.warn(`Kein aktives Session-Fenster fuer IP ${ip} gefunden - Firmenerkennung "${company.name}" bleibt unverknuepft`);
    return null;
  }

  const session = await getSession(env, sessionId, ip);
  const lastSeen = await env.SESSIONS.get(companyHistoryKey(company.name));
  const isRepeatVisit = lastSeen !== null && Date.now() - Number(lastSeen) < REPEAT_VISIT_WINDOW_MS;

  session.company = { ...company, matchedAt: Date.now() };
  // Auf der Session merken, sonst rechnet der naechste Beacon den Bonus wieder weg.
  session.repeatVisit = isRepeatVisit;
  session.score = scoreSession(session.pages, isRepeatVisit);
  await saveSession(env, session);
  await env.SESSIONS.put(companyHistoryKey(company.name), String(Date.now()), {
    expirationTtl: COMPANY_HISTORY_TTL_SECONDS,
  });

  recordVisitorEvent(env, session);
  if (darfLeadErzeugen) await maybeSubmitLead(env, session);
  // Auch ohne Lead-Erlaubnis nicht melden: Ein unbestaetigter Webhook-Aufruf koennte sonst eine
  // beliebige Firma benennen und wir schrieben in deren Apollo-Konto.
  if (darfLeadErzeugen) await vielleichtApolloMelden(env, session);
  return session;
}

/** Rueckmeldung an Apollo, sobald eine erkannte Firma die Schwelle erreicht.
 *
 *  Dieselbe Schwelle wie beim Lead: Unterhalb davon ist ein Besuch kein Signal, und ein Konto
 *  mit einer Punktzahl von 10 zu beschreiben waere Rauschen im Vertrieb.
 *
 *  Der Aufruf ist bewusst nicht awaited eingebettet, sondern faengt jeden Fehler selbst ab:
 *  Apollo ist ein fremder Dienst, und weder ein Ausfall dort noch ein abgelaufener Schluessel
 *  darf einen Seitenaufruf oder die Lead-Erfassung zu Fall bringen. */
async function vielleichtApolloMelden(env: Env, session: SessionState): Promise<void> {
  if (!session.company?.name) return;
  const schwelle = Number(env.LEAD_SCORE_THRESHOLD || "50");
  if (session.score < schwelle) return;
  try {
    await sendeRueckmeldung(env, session);
  } catch (err) {
    console.warn("Apollo-Rueckmeldung fehlgeschlagen:", err instanceof Error ? err.message : err);
  }
}

async function maybeSubmitLead(env: Env, session: SessionState): Promise<void> {
  if (session.leadSubmitted) return;

  const threshold = Number(env.LEAD_SCORE_THRESHOLD || "50");
  if (session.score < threshold) return;

  const lookup = await lookupExisting(env, {
    companyName: session.company?.name,
    domain: session.company?.domain,
  });
  if (lookup.exists) {
    console.info(`Firma "${session.company?.name}" bereits im CRM bekannt (${lookup.recordId}) - kein neuer Lead`);
    recordLeadEvent(env, { source: "company-identification", company: session.company?.name, score: session.score }, "existing");
    session.leadSubmitted = true;
    await saveSession(env, session);
    return;
  }

  const result = await createLead(env, {
    source: "company-identification",
    company: session.company?.name,
    companyDomain: session.company?.domain,
    score: session.score,
    visitedPages: session.pages.map((p) => p.path),
  });

  session.leadSubmitted = result.ok;
  await saveSession(env, session);
}
