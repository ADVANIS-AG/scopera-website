// Anwendungsfälle («Use Cases»): dieselben sechs Beispiele, mit denen die Bühne der Spielwiese
// einsteigt. Dort sieht sie kein Crawler (Rahmen, im Browser gerendert), darum stehen sie hier
// als Text: auf der Spielwiese-Seite, in der Übersicht /use-cases/ und je auf einer eigenen Seite.
//
// `id` ist der Schlüssel des Beispiels in der Plattform
// (advanis-ai-paas: frontend/src/components/playground/PlaygroundBuehne.tsx, BEISPIELE) und geht
// als ?example=<id> an die Spielwiese. Prompt und Schritte sind von dort übernommen
// (playground.stage.examples.<id>.*). Wer ein Beispiel ändert oder ergänzt, zieht beide Repos nach.
import type { Lang } from '../i18n/ui';

export interface BeispielText {
  /** H1 der Seite und Titel der Karte. */
  titel: string;
  /** Meta-Beschreibung und Teaser der Karte. */
  beschreibung: string;
  /** Wie es heute läuft. */
  heute: string;
  /** Der Satz, mit dem die Spielwiese einsteigt. */
  prompt: string;
  /** Was heute herumliegt. */
  unterlagen: string;
  schritte: { titel: string; text: string }[];
  /** Was danach anders ist. */
  danach: string;
}

export interface Beispiel {
  id: string;
  slug: string;
  de: BeispielText;
  en: BeispielText;
}

export const BEISPIELE: Beispiel[] = [
  {
    id: 'spesen',
    slug: 'expenses',
    de: {
      titel: 'Spesen ohne Excel und Mail',
      beschreibung: 'Spesen digital erfassen, von KI prüfen und von Vorgesetzten freigeben lassen. So wird aus Excel-Listen und Mails ein nachvollziehbarer Ablauf.',
      heute: 'Belege werden fotografiert, in eine Excel-Liste übertragen und per Mail zur Freigabe geschickt. Wer was wann freigegeben hat, steht in Postfächern. Und wer einen Beleg rasch von einem privaten KI-Konto auslesen lässt, gibt Firmendaten aus der Hand.',
      prompt: 'Spesen sollen nicht mehr per Excel und Mail laufen.',
      unterlagen: 'Excel-Listen, Belege, Mails.',
      schritte: [
        { titel: 'Beleg erfassen', text: 'Aus deiner Beschreibung wird ein Ablauf mit Feldern und Zuständigkeiten.' },
        { titel: 'KI prüft Betrag und Beleg', text: 'Mit einem freigegebenen Modell, nicht mit einem privaten Konto.' },
        { titel: 'Vorgesetzte gibt frei', text: 'Der Mensch entscheidet, wo es zählt.' },
        { titel: 'Auszahlung, protokolliert', text: 'Ein Ablauf auf einer gesicherten Plattform. Ohne Schatten-KI.' },
      ],
      danach: 'Jeder Beleg ist ein Datensatz mit Status, zuständiger Person und Verlauf. Die Buchhaltung sieht, was offen ist, ohne nachzufragen.',
    },
    en: {
      titel: 'Expenses without Excel and email',
      beschreibung: 'Capture expenses digitally, have AI check them and managers approve them. Excel sheets and emails become one traceable process.',
      heute: 'Receipts are photographed, copied into an Excel sheet and emailed for approval. Who approved what, and when, sits in inboxes. And whoever quickly has a private AI account read a receipt hands company data to a third party.',
      prompt: 'Expenses should no longer run on Excel and email.',
      unterlagen: 'Excel sheets, receipts, emails.',
      schritte: [
        { titel: 'Capture the receipt', text: 'Your description becomes a process with fields and responsibilities.' },
        { titel: 'AI checks amount and receipt', text: 'With an approved model, not a private account.' },
        { titel: 'The manager approves', text: 'A person decides where it matters.' },
        { titel: 'Payout, on record', text: 'One process on a secured platform. No shadow AI.' },
      ],
      danach: 'Every receipt is a record with a status, a responsible person and a history. Accounting sees what is open without having to ask.',
    },
  },
  {
    id: 'angebot',
    slug: 'quotes',
    de: {
      titel: 'Angebote im CRM statt in Excel',
      beschreibung: 'Angebote im CRM erfassen, von KI entwerfen und von der Verkaufsleitung freigeben lassen, statt sie in Excel zu kalkulieren und per Mail abzustimmen.',
      heute: 'Die Kalkulation liegt in einer Excel-Datei auf dem Laufwerk, das Angebot als PDF im Postfach, die Freigabe des Rabatts in einer Mail. Im CRM steht davon nichts. Welcher Stand gilt und wer nachfassen soll, weiss nur, wer das Angebot geschrieben hat.',
      prompt: 'Angebote entstehen bei uns in Excel. Ich will sie im CRM erfassen und freigeben lassen.',
      unterlagen: 'Excel-Kalkulationen, Angebote, Mails.',
      schritte: [
        { titel: 'Kunde und Bedarf erfassen', text: 'Das Angebot hängt am Kunden im CRM, nicht mehr an einer Datei auf dem Laufwerk.' },
        { titel: 'KI entwirft Positionen und Preise', text: 'Aus eurer Preisliste, mit einem freigegebenen Modell.' },
        { titel: 'Verkaufsleitung gibt frei', text: 'Rabatte und Sonderkonditionen entscheidet ein Mensch.' },
        { titel: 'Angebot geht raus, Nachfassen inklusive', text: 'Jeder Stand ist nachvollziehbar. Ohne Schatten-KI.' },
      ],
      danach: 'Das Angebot hängt am Kunden, mit Positionen, Stand und Freigabe. Der Vertrieb sieht, welche Angebote offen sind und wo nachgefasst werden muss.',
    },
    en: {
      titel: 'Quotes in the CRM instead of Excel',
      beschreibung: 'Capture quotes in the CRM, have AI draft them and sales management approve them, instead of calculating in Excel and aligning by email.',
      heute: 'The calculation sits in an Excel file on a drive, the quote as a PDF in an inbox, the discount approval in an email. None of it is in the CRM. Which version counts and who should follow up is known only to the person who wrote the quote.',
      prompt: 'We build our quotes in Excel. I want to capture them in the CRM and have them approved.',
      unterlagen: 'Excel calculations, quotes, emails.',
      schritte: [
        { titel: 'Capture customer and need', text: 'The quote belongs to the customer in the CRM, not to a file on a drive.' },
        { titel: 'AI drafts items and prices', text: 'From your price list, with an approved model.' },
        { titel: 'Sales management approves', text: 'Discounts and special terms are decided by a person.' },
        { titel: 'The quote goes out, follow-up included', text: 'Every version is traceable. No shadow AI.' },
      ],
      danach: 'The quote belongs to the customer, with items, version and approval. Sales sees which quotes are open and where a follow-up is due.',
    },
  },
  {
    id: 'statusbericht',
    slug: 'status-reports',
    de: {
      titel: 'Statusberichte aus den Projektdaten',
      beschreibung: 'Projekt-Statusberichte, die sich aus Terminen, Aufwand und Risiken selbst schreiben. Die KI entwirft, die Projektleitung prüft und ergänzt.',
      heute: 'Jede Woche trägt die Projektleitung Termine, Aufwand und Risiken aus mehreren Dateien zusammen und schreibt daraus einen Bericht. Das kostet Stunden, und beim Versand sind die Zahlen schon wieder alt.',
      prompt: 'Unsere Projekt-Statusberichte sollen sich aus den Projektdaten selbst schreiben.',
      unterlagen: 'Statusberichte, Pläne, Listen.',
      schritte: [
        { titel: 'Projektdaten zusammenführen', text: 'Termine, Aufwand und Risiken liegen an einem Ort statt in fünf Dateien.' },
        { titel: 'KI entwirft den Statusbericht', text: 'Aus den echten Zahlen, mit einem freigegebenen Modell.' },
        { titel: 'Projektleitung prüft und ergänzt', text: 'Der Mensch entscheidet, was im Bericht steht.' },
        { titel: 'Bericht geht ans Steuergremium', text: 'Nachvollziehbar und protokolliert. Ohne Schatten-KI.' },
      ],
      danach: 'Der Bericht entsteht aus den Daten, die ohnehin gepflegt werden. Die Projektleitung prüft und ergänzt, statt abzutippen.',
    },
    en: {
      titel: 'Status reports from the project data',
      beschreibung: 'Project status reports that write themselves from dates, effort and risks. AI drafts, the project lead reviews and adds.',
      heute: 'Every week the project lead collects dates, effort and risks from several files and writes a report from them. It takes hours, and by the time it is sent the numbers are already out of date.',
      prompt: 'Our project status reports should write themselves from the project data.',
      unterlagen: 'Status reports, plans, lists.',
      schritte: [
        { titel: 'Bring the project data together', text: 'Dates, effort and risks live in one place instead of five files.' },
        { titel: 'AI drafts the status report', text: 'From the real numbers, with an approved model.' },
        { titel: 'The project lead reviews and adds', text: 'A person decides what goes into the report.' },
        { titel: 'The report goes to the steering committee', text: 'Traceable and on record. No shadow AI.' },
      ],
      danach: 'The report comes from data that is maintained anyway. The project lead reviews and adds instead of retyping.',
    },
  },
  {
    id: 'vertraege',
    slug: 'contracts',
    de: {
      titel: 'Verträge durchsuchbar, Fristen im Blick',
      beschreibung: 'Verträge aus Aktenordnern digital erfassen, von KI Fristen und Parteien auslesen lassen und rechtzeitig vor dem Ablauf erinnert werden.',
      heute: 'Verträge stehen in Aktenordnern oder liegen als Scans auf dem Laufwerk. Wann eine Kündigungsfrist abläuft, weiss, wer sich daran erinnert. Wer eine Klausel sucht, blättert.',
      prompt: 'Unsere Aktenordner mit Verträgen sollen durchsuchbar werden und Fristen melden.',
      unterlagen: 'Aktenordner, Verträge, Notizen.',
      schritte: [
        { titel: 'Verträge erfassen', text: 'Aus dem Ordner wird ein Datensatz mit Feldern und Zuständigkeiten.' },
        { titel: 'KI liest Fristen und Parteien', text: 'Mit einem freigegebenen Modell, nicht mit einem privaten Konto.' },
        { titel: 'Zuständige Person bestätigt', text: 'Der Mensch entscheidet, wo es zählt.' },
        { titel: 'Erinnerung vor Ablauf', text: 'Niemand muss mehr im Ordner nachschlagen. Ohne Schatten-KI.' },
      ],
      danach: 'Jeder Vertrag ist ein Datensatz mit Parteien, Laufzeit und Frist. Vor dem Ablauf meldet sich die Plattform bei der zuständigen Person.',
    },
    en: {
      titel: 'Searchable contracts, deadlines in view',
      beschreibung: 'Capture contracts from binders digitally, have AI read deadlines and parties, and get a reminder in time before they expire.',
      heute: 'Contracts sit in binders or as scans on a drive. When a notice period ends is known to whoever remembers it. Looking for a clause means leafing through pages.',
      prompt: 'Our binders full of contracts should become searchable and flag deadlines.',
      unterlagen: 'Binders, contracts, notes.',
      schritte: [
        { titel: 'Capture the contracts', text: 'The binder becomes a record with fields and responsibilities.' },
        { titel: 'AI reads deadlines and parties', text: 'With an approved model, not a private account.' },
        { titel: 'The responsible person confirms', text: 'A person decides where it matters.' },
        { titel: 'A reminder before it expires', text: 'Nobody has to look it up in a binder any more. No shadow AI.' },
      ],
      danach: 'Every contract is a record with parties, term and deadline. Before it expires, the platform notifies the responsible person.',
    },
  },
  {
    id: 'geraete',
    slug: 'equipment',
    de: {
      titel: 'Geräteausgabe ohne Zettel',
      beschreibung: 'Geräte per QR-Code ausgeben und zurücknehmen. Wer welches Gerät hat, steht in einem Datensatz statt auf einem Ausgabeschein, und die Wartung meldet sich selbst.',
      heute: 'Wer welches Gerät hat, steht auf einem Ausgabeschein oder in einer Liste, die jemand nachführen muss. Fehlt ein Gerät, beginnt das Herumfragen. Die Wartungstermine stehen in einem anderen Kalender.',
      prompt: 'Wer hat welches Gerät? Die Ausgabe soll nicht mehr auf Zetteln stehen.',
      unterlagen: 'Zettel, Listen, Ausgabescheine.',
      schritte: [
        { titel: 'Gerät per QR-Code ausgeben', text: 'Aus deiner Beschreibung wird ein Ablauf, der auf dem Handy läuft.' },
        { titel: 'Person und Standort sind erfasst', text: 'Jede Ausgabe ist ein Datensatz, kein Zettel.' },
        { titel: 'Rückgabe wird bestätigt', text: 'Der Mensch entscheidet, wo es zählt.' },
        { titel: 'Wartung meldet sich von selbst', text: 'Ein Ablauf auf einer gesicherten Plattform. Ohne Schatten-KI.' },
      ],
      danach: 'Jede Ausgabe und jede Rückgabe ist ein Datensatz mit Person, Standort und Zeitpunkt. Die Wartung meldet sich, bevor sie fällig ist.',
    },
    en: {
      titel: 'Equipment handover without paper slips',
      beschreibung: 'Hand out and take back equipment by QR code. Who has which device is a record instead of a paper slip, and maintenance announces itself.',
      heute: 'Who has which device is written on a handover form or in a list that someone has to keep up to date. When a device is missing, the asking around begins. Maintenance dates live in a different calendar.',
      prompt: 'Who has which device? Handing them out should no longer live on paper slips.',
      unterlagen: 'Paper slips, lists, handover forms.',
      schritte: [
        { titel: 'Hand out a device by QR code', text: 'Your description becomes a process that runs on a phone.' },
        { titel: 'Person and location are recorded', text: 'Every handover is a record, not a slip of paper.' },
        { titel: 'The return is confirmed', text: 'A person decides where it matters.' },
        { titel: 'Maintenance announces itself', text: 'One process on a secured platform. No shadow AI.' },
      ],
      danach: 'Every handover and every return is a record with person, location and time. Maintenance announces itself before it is due.',
    },
  },
  {
    id: 'probezeit',
    slug: 'probation',
    de: {
      titel: 'Probezeitgespräche als geführter Ablauf',
      beschreibung: 'Probezeitgespräche vorbereiten, festhalten und bestätigen in einem geführten Ablauf mit klaren Rechten, statt in Word-Vorlagen und Mails.',
      heute: 'Die Vorlage ist ein Word-Dokument, die Notizen liegen in Mails, der Termin steht im Kalender. Ob das Gespräch stattgefunden hat und was vereinbart wurde, lässt sich später schwer belegen. Und vertrauliche Inhalte liegen in Postfächern.',
      prompt: 'Probezeitgespräche sollen nicht mehr in Word-Vorlagen und Mails verschwinden.',
      unterlagen: 'Vorlagen, Notizen, Mails.',
      schritte: [
        { titel: 'Gespräch vorbereiten', text: 'Aus der Vorlage wird ein geführter Ablauf für beide Seiten.' },
        { titel: 'Beide Seiten halten Punkte fest', text: 'Vertraulich, mit klaren Rechten statt Dateien im Postfach.' },
        { titel: 'Vorgesetzte und Person bestätigen', text: 'Der Mensch entscheidet, wo es zählt.' },
        { titel: 'Erinnerung zum nächsten Termin', text: 'Ein Ablauf auf einer gesicherten Plattform. Ohne Schatten-KI.' },
      ],
      danach: 'Beide Seiten bereiten sich im selben Ablauf vor, halten ihre Punkte fest und bestätigen das Ergebnis. Die Inhalte sieht nur, wer sie sehen darf.',
    },
    en: {
      titel: 'Probation reviews as a guided process',
      beschreibung: 'Prepare, record and confirm probation reviews in a guided process with clear permissions, instead of Word templates and emails.',
      heute: 'The template is a Word document, the notes sit in emails, the appointment in a calendar. Whether the review took place and what was agreed is hard to prove later. And confidential content sits in inboxes.',
      prompt: 'Probation reviews should no longer disappear into Word templates and emails.',
      unterlagen: 'Templates, notes, emails.',
      schritte: [
        { titel: 'Prepare the review', text: 'The template becomes a guided process for both sides.' },
        { titel: 'Both sides note their points', text: 'Confidential, with clear permissions instead of files in an inbox.' },
        { titel: 'Manager and employee confirm', text: 'A person decides where it matters.' },
        { titel: 'A reminder for the next meeting', text: 'One process on a secured platform. No shadow AI.' },
      ],
      danach: 'Both sides prepare in the same process, note their points and confirm the outcome. Only those who are allowed to see the content can see it.',
    },
  },
];

/** Texte, die auf jeder Seite der Anwendungsfälle gleich sind. */
export const GEMEINSAM: Record<Lang, {
  eyebrow: string;
  uebersichtTitel: string;
  uebersichtBeschreibung: string;
  uebersichtLede: string;
  heuteEyebrow: string;
  heute: string;
  promptEyebrow: string;
  promptTitel: string;
  promptText: string;
  schritteEyebrow: string;
  schritteTitel: string;
  danachEyebrow: string;
  danachTitel: string;
  schattenEyebrow: string;
  schattenTitel: string;
  schatten: string[];
  ausprobieren: string;
  ansehen: string;
  alle: string;
  weitere: string;
  unterlagen: string;
  eigener: string;
}> = {
  de: {
    eyebrow: 'Anwendungsfälle',
    uebersichtTitel: 'Vom manuellen Ablauf zum digitalen Prozess',
    uebersichtBeschreibung: 'Sechs Beispiele, wie Fachabteilungen manuelle Abläufe aus Excel, Mail und Papier in digitale, intelligente Prozesse umwandeln. Auf einer gesicherten Plattform, ohne Schatten-KI.',
    uebersichtLede: 'Als Fachanwender wandelst du heutige manuelle Abläufe in digitale, intelligente Prozesse um. Du beschreibst sie in eigenen Worten, wie du es von einem KI-Chat gewohnt bist. Der Unterschied: Der Ablauf läuft danach auf einer gesicherten Plattform und nicht in einem privaten Konto.',
    heuteEyebrow: 'Ausgangslage',
    heute: 'Wie es heute läuft.',
    promptEyebrow: 'Der Einstieg',
    promptTitel: 'Ein Satz genügt für den Anfang.',
    promptText: 'Du beschreibst den Ablauf so, wie du ihn einer Kollegin erklären würdest. Daraus entstehen eine App, die du gleich bedienen kannst, und der Prozess dahinter. Danach schärfst du nach.',
    schritteEyebrow: 'Der Ablauf',
    schritteTitel: 'Was daraus wird.',
    danachEyebrow: 'Das Ergebnis',
    danachTitel: 'Was danach anders ist.',
    schattenEyebrow: 'Ohne Schatten-KI',
    schattenTitel: 'Prompten wie gewohnt. Nur nicht mehr im Schatten.',
    schatten: [
      'Viele Fachabteilungen lösen solche Aufgaben heute mit privaten KI-Konten. Das geht schnell. Aber die Daten verlassen das Unternehmen, niemand sieht, was damit passiert, und das Ergebnis lebt in einem Chatfenster.',
      'Auf SCOPERA läuft derselbe Ablauf mit Rollen und Rechten, einem Änderungsprotokoll und KI-Modellen, die dein Unternehmen freigegeben hat. Die Plattformdaten liegen standardmässig in der Schweiz. Auf Wunsch läuft SCOPERA in deiner eigenen Cloud oder bei dir im Haus. Bestehende Systeme bindest du über MCP, APIs und Standardadapter an.',
    ],
    ausprobieren: 'In der Spielwiese ausprobieren',
    ansehen: 'Ablauf ansehen',
    alle: 'Alle Anwendungsfälle',
    weitere: 'Weitere Anwendungsfälle',
    unterlagen: 'Was heute herumliegt',
    eigener: 'Dein Ablauf ist nicht dabei? Beschreib ihn in der Spielwiese.',
  },
  en: {
    eyebrow: 'Use cases',
    uebersichtTitel: 'From a manual routine to a digital process',
    uebersichtBeschreibung: 'Six examples of how business teams turn manual routines in Excel, email and paper into digital, intelligent processes. On a secured platform, without shadow AI.',
    uebersichtLede: 'As a business user you turn today’s manual routines into digital, intelligent processes. You describe them in your own words, the way you are used to from an AI chat. The difference: the process then runs on a secured platform and not in a private account.',
    heuteEyebrow: 'Starting point',
    heute: 'How it works today.',
    promptEyebrow: 'The start',
    promptTitel: 'One sentence is enough to begin.',
    promptText: 'You describe the process the way you would explain it to a colleague. That becomes an app you can use right away and the process behind it. Then you refine it.',
    schritteEyebrow: 'The process',
    schritteTitel: 'What it becomes.',
    danachEyebrow: 'The outcome',
    danachTitel: 'What is different afterwards.',
    schattenEyebrow: 'No shadow AI',
    schattenTitel: 'Prompt the way you always do. Just not in the shadows.',
    schatten: [
      'Many business teams solve tasks like this with private AI accounts today. It is quick. But the data leaves the company, nobody sees what happens to it, and the result lives in a chat window.',
      'On SCOPERA the same process runs with roles and permissions, a change log and AI models your company has approved. Platform data is stored in Switzerland by default. On request, SCOPERA runs in your own cloud or on your premises. You connect existing systems through MCP, APIs and standard adapters.',
    ],
    ausprobieren: 'Try it in the playground',
    ansehen: 'See the process',
    alle: 'All use cases',
    weitere: 'More use cases',
    unterlagen: 'What is lying around today',
    eigener: 'Your process is not listed? Describe it in the playground.',
  },
};

export function beispielNachSlug(slug: string): Beispiel | undefined {
  return BEISPIELE.find((b) => b.slug === slug);
}
