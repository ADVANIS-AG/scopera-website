// Zentrale Stellschrauben. Vor Launch von Sven zu befuellen.
export const SITE_NAME = 'SCOPERA';
export const KONTAKT_EMAIL = 'sven.brenner@advanis.ch';
export const TELEFON = '+41 52 355 35 35';
export const BOOKING_URL = 'https://bookings.cloud.microsoft/bookwithme/user/452f2f9d6d834ae7ae56406735b037b8%40advanis.ch?anonymous&ismsaljsauthenabled=true';
// Zwei Wege in die Plattform: Trial-Mandant und gebuchte Edition. Ohne ?edition= waehlt die
// Plattform die erste oeffentliche Edition vor. source landet in tenants.signup_source.
export const SIGNUP_TRIAL_URL = 'https://app.scopera.ai/signup/trial';
export const SIGNUP_URL = 'https://app.scopera.ai/signup';
export type Edition = 'solo' | 'duett' | 'trio' | 'quartett';

export function signupTrial(quelle = 'website'): string {
  return `${SIGNUP_TRIAL_URL}?source=${encodeURIComponent(quelle)}`;
}

export function signupEdition(edition?: Edition, quelle = 'website'): string {
  const parameter = new URLSearchParams();
  if (edition) parameter.set('edition', edition);
  parameter.set('source', quelle);
  return `${SIGNUP_URL}?${parameter}`;
}
export const ADRESSE = 'Bahnhofplatz 17, 8400 Winterthur';
export const UID = 'CHE-105.625.544';
export const HR_NUMMER = 'CH-020.4.003.168-4';
export const PLAUSIBLE_DOMAIN = '';                     // leer = Analytics deaktiviert; z.B. scopera.ai
export const WORKER_ENDPOINT = 'https://admin.scopera.ai';
export const TURNSTILE_SITE_KEY = '';                   // leer = keine Spam-Pruefung im Formular; Public Site Key von Cloudflare Turnstile (nicht der Secret Key!)
