/**
 * Schema.org JSON-LD builders. Every page emits one @graph with the
 * Organization, the WebSite and its own WebPage; pages add more nodes
 * (SoftwareApplication, FAQPage, BreadcrumbList).
 */
import { SITE, PLANS } from './site';

const abs = (path: string) => new URL(path, SITE.url).href;

export const ORG_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;
export const APP_ID = `${SITE.url}/#software`;

const belgium = { '@type': 'Country', name: 'Belgium', identifier: 'BE' };

export function organization() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    url: `${SITE.url}/`,
    logo: {
      '@type': 'ImageObject',
      url: abs('/icon-512.png'),
      width: 512,
      height: 512,
    },
    description:
      'Use Sybil makes pre-accounting software for Belgian business owners: receipts, bills, contracts, payments and the quarter for the accountant.',
    areaServed: belgium,
    // TODO(Arthur): add "legalName" and "vatID" once the company name and
    // Belgian VAT number are known. Do not fill them with placeholders.
  };
}

export function website(lang: string) {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE.url}/`,
    name: SITE.name,
    inLanguage: lang,
    publisher: { '@id': ORG_ID },
  };
}

export function webPage(opts: {
  url: string;
  title: string;
  description: string;
  lang: string;
  type?: string;
  breadcrumb?: boolean;
}) {
  return {
    '@type': opts.type ?? 'WebPage',
    '@id': `${opts.url}#webpage`,
    url: opts.url,
    name: opts.title,
    description: opts.description,
    inLanguage: opts.lang,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': APP_ID },
    publisher: { '@id': ORG_ID },
    ...(opts.breadcrumb ? { breadcrumb: { '@id': `${opts.url}#breadcrumb` } } : {}),
  };
}

function monthlyOffer(name: string, price: number, description: string) {
  return {
    '@type': 'Offer',
    name,
    description,
    url: SITE.registerUrl,
    price: price.toFixed(2),
    priceCurrency: SITE.currency,
    eligibleRegion: belgium,
    areaServed: belgium,
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: price.toFixed(2),
      priceCurrency: SITE.currency,
      unitCode: 'MON',
      unitText: 'month',
      referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
      valueAddedTaxIncluded: false,
    },
  };
}

export function softwareApplication(lang: string, description: string, features: string[]) {
  return {
    '@type': 'SoftwareApplication',
    '@id': APP_ID,
    name: SITE.name,
    url: `${SITE.url}/`,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Pre-accounting',
    operatingSystem: 'Web',
    inLanguage: lang,
    description,
    image: abs(SITE.ogImage),
    areaServed: belgium,
    publisher: { '@id': ORG_ID },
    featureList: features,
    offers: [
      monthlyOffer(
        PLANS.pro.name,
        PLANS.pro.price,
        `For freelancers and small companies. ${PLANS.pro.connectedAccounts} bank accounts or cards included. Price per month, excluding VAT.`,
      ),
      monthlyOffer(
        PLANS.manco.name,
        PLANS.manco.price,
        `For management-company owners: everything in Pro plus contracts. ${PLANS.manco.connectedAccounts} bank accounts or cards included. Price per month, excluding VAT.`,
      ),
    ],
  };
}

export function faqPage(url: string, items: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    url,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function breadcrumbList(url: string, trail: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function graph(nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

/** Serialise for a <script type="application/ld+json"> block. */
export function serialise(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
