export interface Env {
  SESSIONS: KVNamespace;
  ADMIN_STORE: KVNamespace;
  VISITOR_EVENTS: AnalyticsEngineDataset;
  ALLOWED_ORIGIN: string;
  CRM_API_BASE_URL: string;
  CRM_API_KEY: string;
  CRM_LOOKUP_PATH: string;
  CRM_LEAD_PATH: string;
  APOLLO_WEBHOOK_SECRET: string;
  TURNSTILE_SECRET_KEY: string;
  LEAD_SCORE_THRESHOLD: string;
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  CF_ZONE_ID: string;
  CF_ACCESS_TEAM_DOMAIN: string;
  CF_ACCESS_AUD: string;
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

/** Verifizierte Identitaet aus dem Cloudflare-Access-JWT (siehe src/admin/auth.ts). */
export interface AccessIdentity {
  email: string;
}

export interface FailedLeadRecord {
  id: string;
  payload: CrmLeadPayload;
  error: string;
  createdAt: number;
}

export interface CorsConfig {
  allowedOrigins: string[];
}
