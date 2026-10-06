/**
 * Facts used across pages, JSON-LD, llms.txt and the OG image.
 * Change a price or a limit here and every page follows.
 */
export const SITE = {
  name: 'Use Sybil',
  url: 'https://usesybil.pro',
  appUrl: 'https://app.usesybil.pro',
  registerUrl: 'https://app.usesybil.pro/register',
  signInUrl: 'https://app.usesybil.pro/login',
  country: 'BE',
  currency: 'EUR',
  themeColor: '#1E4D3A',
  backgroundColor: '#FBF8F1',
  ogImage: '/og.png',
  ogImageAlt: 'Use Sybil logo and the line "Got admin? Use Sybil." on warm paper, next to a drawing of Sybil at her desk.',
} as const;

/**
 * Placeholders that stay visibly marked until Arthur supplies real values.
 * Never replace them with invented data.
 */
export const PLACEHOLDER = {
  companyName: '[Company name]',
  vatNumber: 'BE [VAT number]',
  contactEmail: '[contact e-mail]',
  securityEmail: '[security contact e-mail]',
  customerQuote: '[Pilot customer quote · Name, Company]',
  accountantQuote: '[Accountant endorsement · Name, Office]',
} as const;

export const PLANS = {
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 39,
    connectedAccounts: 2,
  },
  manco: {
    id: 'manco',
    name: 'ManCo',
    price: 69,
    connectedAccounts: 4,
  },
} as const;

export const PRICING = {
  extraAccountPrice: 7,
  trialDocuments: 25,
  vaultYears: 3,
} as const;

/** Belgian money format: "€ 39", "€ 86,40" (narrow no-break space after €). */
export function euro(amount: number, decimals = Number.isInteger(amount) ? 0 : 2): string {
  const fixed = amount.toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `€ ${grouped}${dec ? `,${dec}` : ''}`;
}
