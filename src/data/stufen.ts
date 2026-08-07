export interface Stufe {
  nr: number;
  titel: { de: string; en: string };
  wasPassiert: { de: string; en: string };
  ergebnis: { de: string; en: string };
  dauer: { de: string; en: string };
  angebot: { de: string; en: string };
  pfad: string;
}

export const stufen: Stufe[] = [
  {
    nr: 1,
    titel: { de: 'Potenziale erkennen', en: 'Identify potential' },
    wasPassiert: {
      de: 'Wir schauen uns Ihre Prozesse an und zeigen, wo AI den grössten Hebel hat.',
      en: 'We look at your processes and show where AI has the biggest impact.',
    },
    ergebnis: {
      de: 'Priorisierte Use-Case-Liste mit Aufwandschätzung',
      en: 'Prioritized use-case list with an effort estimate',
    },
    dauer: { de: 'Halber Tag', en: 'Half a day' },
    angebot: { de: 'KI-Potenzial-Assessment', en: 'AI Potential Assessment' },
    pfad: 'services',
  },
  {
    nr: 2,
    titel: { de: 'Prozess und Business Case entwickeln', en: 'Develop process and business case' },
    wasPassiert: {
      de: 'Wir erarbeiten gemeinsam Ablauf, Anforderungen und Nutzen für den gewählten Use Case.',
      en: 'Together we work out the flow, requirements and value for the chosen use case.',
    },
    ergebnis: {
      de: 'Ablauf, Anforderungen, Nutzen, Aufwand, messbares Zielbild',
      en: 'Flow, requirements, value, effort, measurable target picture',
    },
    dauer: { de: 'Ein Tag', en: 'One day' },
    angebot: { de: 'AI-Strategie-Workshop', en: 'AI Strategy Workshop' },
    pfad: 'services',
  },
  {
    nr: 3,
    titel: { de: 'Prototyp entwickeln', en: 'Build a prototype' },
    wasPassiert: {
      de: 'Wir entwickeln live mit AI-nativer Entwicklung an Ihrem echten Prozess.',
      en: 'We develop live, AI-native, on your real process.',
    },
    ergebnis: {
      de: 'Funktionsfähiger Prototyp am echten Prozess',
      en: 'Working prototype on your real process',
    },
    dauer: { de: 'Stunden bis Tage', en: 'Hours to days' },
    angebot: { de: 'Vibe your Issue', en: 'Vibe your Issue' },
    pfad: 'services',
  },
  {
    nr: 4,
    titel: { de: 'Produktiv starten', en: 'Go live' },
    wasPassiert: {
      de: 'Die Lösung geht mit Sicherheit, Integrationen, Tests und Berechtigungen in den produktiven Einsatz.',
      en: 'The solution goes into production with security, integrations, tests and permissions.',
    },
    ergebnis: {
      de: 'Lösung im Einsatz, inkl. Sicherheit, Integrationen, Tests, Berechtigungen',
      en: 'Solution in use, incl. security, integrations, tests, permissions',
    },
    dauer: { de: 'Ein bis sechs Wochen', en: 'One to six weeks' },
    angebot: { de: 'Starter, Professional', en: 'Starter, Professional' },
    pfad: 'packages',
  },
  {
    nr: 5,
    titel: { de: 'Betreiben und optimieren', en: 'Operate and optimize' },
    wasPassiert: {
      de: 'Wir übernehmen Betrieb, Sicherheit und Monitoring. Die fachliche Weiterentwicklung machen Sie selbst oder Sie geben sie an uns. Sie entscheiden, und Sie können die Entscheidung jederzeit ändern.',
      en: 'We take care of operations, security and monitoring. You handle further development yourself, or hand it to us. You decide, and you can change that decision anytime.',
    },
    ergebnis: {
      de: 'Betrieb, Monitoring, laufende Weiterentwicklung',
      en: 'Operations, monitoring, ongoing development',
    },
    dauer: { de: 'Laufend', en: 'Ongoing' },
    angebot: { de: 'Enterprise, Managed AI, White-Label', en: 'Enterprise, Managed AI, White-Label' },
    pfad: 'packages',
  },
];
