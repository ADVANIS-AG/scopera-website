export interface Env {
  SESSIONS: KVNamespace;
  ALLOWED_ORIGIN: string;
  CRM_API_BASE_URL: string;
  CRM_API_KEY: string;
  CRM_LOOKUP_PATH: string;
  CRM_LEAD_PATH: string;
  APOLLO_WEBHOOK_SECRET: string;
  TURNSTILE_SECRET_KEY: string;
  LEAD_SCORE_THRESHOLD: string;
}

export interface PageVisit {
  path: string;
  durationMs: number;
}

export interface CompanyMatch {
  name: string;
  domain?: string;
  source: "apollo" | "asn-fallback";
  matchedAt: number;
}

export interface SessionState {
  sessionId: string;
  ip: string;
  firstSeen: number;
  lastSeen: number;
  pages: PageVisit[];
  score: number;
  company?: CompanyMatch;
  leadSubmitted: boolean;
}

export interface BeaconPayload {
  sessionId: string;
  path: string;
  durationMs: number;
}

export interface ContactFormPayload {
  name: string;
  firma?: string;
  email: string;
  nachricht: string;
  turnstileToken: string;
}

export interface CrmLookupQuery {
  domain?: string;
  companyName?: string;
  email?: string;
}

export interface CrmLookupResult {
  exists: boolean;
  recordId?: string;
}

export interface CrmLeadPayload {
  source: "contact-form" | "company-identification";
  company?: string;
  companyDomain?: string;
  contactName?: string;
  contactEmail?: string;
  message?: string;
  score?: number;
  visitedPages?: string[];
}

export interface CrmLeadResult {
  ok: boolean;
  id?: string;
  error?: string;
}
