import { recordLeadEvent, recordVisitorEvent } from "./analytics";
import { createLead, lookupExisting } from "./crm-client";
import { REPEAT_VISIT_BONUS, REPEAT_VISIT_WINDOW_MS, scorePages } from "./lead-scoring";
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

export async function recordPageview(env: Env, ip: string, sessionId: string, page: PageVisit): Promise<SessionState> {
  const session = await getSession(env, sessionId, ip);
  session.pages.push(page);
  session.lastSeen = Date.now();
  session.score = scorePages(session.pages);
  await saveSession(env, session);
  await rememberIpToSession(env, ip, sessionId);
  recordVisitorEvent(env, session);
  await maybeSubmitLead(env, session);
  return session;
}

/** Wird vom Apollo-Webhook aufgerufen, sobald eine Firma zu einer IP identifiziert wurde. */
export async function tagCompanyForIp(env: Env, ip: string, company: Omit<CompanyMatch, "matchedAt">): Promise<SessionState | null> {
  const sessionId = await findSessionIdByIp(env, ip);
  if (!sessionId) {
    console.warn(`Kein aktives Session-Fenster fuer IP ${ip} gefunden - Firmenerkennung "${company.name}" bleibt unverknuepft`);
    return null;
  }

  const session = await getSession(env, sessionId, ip);
  const lastSeen = await env.SESSIONS.get(companyHistoryKey(company.name));
  const isRepeatVisit = lastSeen !== null && Date.now() - Number(lastSeen) < REPEAT_VISIT_WINDOW_MS;

  session.company = { ...company, matchedAt: Date.now() };
  session.score = scorePages(session.pages) + (isRepeatVisit ? REPEAT_VISIT_BONUS : 0);
  await saveSession(env, session);
  await env.SESSIONS.put(companyHistoryKey(company.name), String(Date.now()), {
    expirationTtl: COMPANY_HISTORY_TTL_SECONDS,
  });

  recordVisitorEvent(env, session);
  await maybeSubmitLead(env, session);
  return session;
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
