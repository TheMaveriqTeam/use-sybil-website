/**
 * /llms.txt and /llms-full.txt: a plain, factual description of Use Sybil
 * for language models and answer engines (GEO). Built from the same facts
 * and copy as the pages, so the numbers never drift.
 * Format: https://llmstxt.org
 */
import { en } from '../i18n/en';
import { SITE, PLANS, PRICING } from './site';

const eur = (n: number) => `€${n} (EUR ${n})`;
const u = (path: string) => new URL(path, SITE.url).href;

const summary = `Use Sybil is pre-accounting software for Belgian business owners: owners of a management company, freelancers and small companies. Sybil, the assistant inside the app, reads receipts, bills, e-invoices and contracts, files each one as Professional or Personal, matches it to its bank payment, applies Belgian VAT and deductibility rules and hands the accountant a closed quarter. Pro costs ${eur(PLANS.pro.price)} and ManCo ${eur(PLANS.manco.price)} per month, excluding VAT.`;

const keyFacts = [
  `Name: Use Sybil. "Sybil" is the name of the assistant inside the app; she is software, not a person.`,
  `Website: ${SITE.url}. Web app: ${SITE.appUrl} (runs in the browser).`,
  'Market: Belgium. Built for Belgian VAT and deductibility rules.',
  `Website languages: English (${SITE.url}/), Dutch for Belgium (${SITE.url}/nl) and French for Belgium (${SITE.url}/fr).`,
  `Plans: Pro, ${eur(PLANS.pro.price)} per month excluding VAT, for freelancers and small companies, ${PLANS.pro.connectedAccounts} bank accounts or cards included. ManCo, ${eur(PLANS.manco.price)} per month excluding VAT, for management-company owners: everything in Pro plus contracts, ${PLANS.manco.connectedAccounts} bank accounts or cards included.`,
  `Each extra connected bank account or card costs ${eur(PRICING.extraAccountPrice)} per month, only while it is connected.`,
  `Free trial: no card needed. Free until ${PRICING.trialDocuments} documents or the first report. It starts with a Sybil Scan of the last quarter. After the trial, the account turns read-only unless a plan is chosen; documents stay in the vault.`,
  `Data: hosted in the EU, encrypted, never used to train AI. Every access is logged and visible to the customer. Documents can be locked so Sybil does not read them.`,
  `Retention: documents stay ${PRICING.vaultYears} years in the vault. Each completed year is returned to the customer as a full, indexed export, including the original e-invoices.`,
  'Accountant hand-off: each quarter the accountant receives a register (CSV), numbered proofs (PDF), the original Peppol e-invoices (UBL) and a VAT summary. Professional documents only.',
];

const notDo = [
  'It does not replace the accountant. Sybil prepares; the accountant signs off and stays in charge of the books and filings.',
  'It does not give advice. Sybil states facts and dates (for example a notice period that opens, or a bank account that changed); the customer decides. She never recommends a product.',
  'It does not sell data, and it does not use customer documents to train AI.',
  'It never sends personal documents to the accountant.',
  'It is not set up for tax rules outside Belgium.',
];

const pages = [
  ['Home', '/', 'what Use Sybil does, how it works, plans and prices, FAQ'],
  ['Security and your data', '/security', 'EU hosting, encryption, no AI training, access log, locked documents, 3-year vault and yearly export'],
  ['For accountants', '/for-accountants', 'what an accountant receives each quarter from a client on Use Sybil'],
] as const;

export function llmsTxt(): string {
  return [
    '# Use Sybil',
    '',
    `> ${summary}`,
    '',
    ...keyFacts.map((f) => `- ${f}`),
    '',
    '## What Use Sybil does not do',
    '',
    ...notDo.map((f) => `- ${f}`),
    '',
    '## Pages',
    '',
    ...pages.map(([name, path, desc]) => `- [${name}](${u(path)}): ${desc}`),
    `- [Use Sybil in Dutch](${u('/nl')}): the same site in Dutch (Belgium)`,
    `- [Use Sybil in French](${u('/fr')}): the same site in French (Belgium)`,
    `- [Full text for language models](${u('/llms-full.txt')}): every fact on this site in one plain file`,
    '',
    '## App',
    '',
    `- [Start the free trial](${SITE.registerUrl}): create an account, no card needed`,
    `- [Sign in](${SITE.signInUrl})`,
    '',
    '## Optional',
    '',
    `- [Privacy policy (draft)](${u('/privacy')}): draft, legal text to follow`,
    `- [Terms of use (draft)](${u('/terms')}): draft, legal text to follow`,
    `- [Sitemap](${u('/sitemap-index.xml')})`,
    '',
  ].join('\n');
}

export function llmsFullTxt(buildDate: string): string {
  const h = en.home;
  const steps = h.how.steps;
  return [
    '# Use Sybil',
    '',
    `> ${summary}`,
    '',
    `Source: ${SITE.url}. Last updated: ${buildDate}.`,
    '',
    '## What is Use Sybil?',
    '',
    ...h.whatIs.body.flatMap((p) => [p, '']),
    '## Key facts',
    '',
    ...keyFacts.map((f) => `- ${f}`),
    '',
    '## Who it is for',
    '',
    '- Owners of a Belgian management company (ManCo plan).',
    '- Belgian freelancers and small companies (Pro plan).',
    '- People who keep business and personal paperwork side by side: every document is filed as Professional or Personal, and projects work in both plans.',
    '',
    '## How it works',
    '',
    `1. ${steps.you.title}. ${steps.you.text}`,
    `2. ${steps.sybil.title}. ${steps.sybil.text}`,
    `3. ${steps.together.title}. ${steps.together.text} Answers from Ask Sybil come with their source.`,
    '',
    '## What changes for the customer',
    '',
    ...h.outcomes.items.map((o) => `- ${o.title}${o.manco ? ' (ManCo plan)' : ''}: ${o.text}`),
    '- Stop: when Sybil cannot vouch for who is being paid (an unknown supplier, a changed bank account, an account name that does not match), she puts the payment on hold until the customer confirms.',
    '',
    '## Plans and prices',
    '',
    'All prices are per month, excluding VAT, in euro.',
    '',
    ...h.pricing.plans.flatMap((p) => [
      `### ${p.name}: ${eur(p.id === 'pro' ? PLANS.pro.price : PLANS.manco.price)} per month excluding VAT`,
      '',
      `${p.audience}.`,
      '',
      ...p.features.map((f) => `- ${f}`),
      '',
    ]),
    `Extra connected bank account or card: ${eur(PRICING.extraAccountPrice)} per month, only while it is connected.`,
    '',
    `Free trial: no card. Free until ${PRICING.trialDocuments} documents or the first report. It starts with a Sybil Scan of the last quarter. Sign up at ${SITE.registerUrl}.`,
    '',
    '## Security and data',
    '',
    ...en.security.sections.map((s) => `- ${s.title}: ${s.text}`),
    '',
    '## For accountants',
    '',
    en.accountants.lead,
    '',
    ...en.accountants.pack.map((p) => `- ${p.title}: ${p.text}`),
    `- ${en.accountants.professionalTitle}: ${en.accountants.professionalText}`,
    ...en.accountants.how.map((l) => `- ${l}`),
    `- ${en.accountants.deliveryTitle}: ${en.accountants.deliveryText}`,
    '',
    '## What Use Sybil does not do',
    '',
    ...notDo.map((f) => `- ${f}`),
    '',
    '## Frequently asked questions',
    '',
    ...h.faq.items.flatMap((f) => [`### ${f.q}`, '', f.a, '']),
    '## Company',
    '',
    '- Brand: Use Sybil.',
    '- Legal entity name and Belgian VAT number: to be published on the website.',
    '',
    '## Links',
    '',
    `- Website: ${SITE.url}/ (Dutch: ${u('/nl')}, French: ${u('/fr')})`,
    ...pages.slice(1).map(([name, path]) => `- ${name}: ${u(path)}`),
    `- Free trial: ${SITE.registerUrl}`,
    `- Sign in: ${SITE.signInUrl}`,
    '',
  ].join('\n');
}
