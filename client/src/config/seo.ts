import { CONFIG, feeCopy } from './tournament';
import type { EventSettings, Results, ScheduleKey, StageKey } from '../lib/api';

/* ============================================================================
 * SEO — one place for everything search engines, social previews and AI
 * answer engines read.
 *
 * The one line you change when the domain changes is VITE_SITE_URL in
 * client/.env. Nothing else in the codebase hardcodes the address.
 * ==========================================================================*/

/** No trailing slash, ever — every URL below is built as `${SITE_URL}/path`. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://dropzoneopen-esports.onrender.com').replace(
  /\/+$/,
  '',
);

export const abs = (path = '/'): string => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** 1200x630, the size every social platform crops from. */
export const OG_IMAGE = abs('/og.png');

/**
 * The <title>. Under 60 characters so Google does not truncate it, leading
 * with what people actually type ("BGMI tournament") rather than the brand.
 */
export const PAGE_TITLE = `${CONFIG.tournamentName} — BGMI Squad TPP Tournament, India`;

/**
 * Under 155 characters. Written to be clicked, not to stuff keywords: it says
 * what it is, who it is for, and what you can do here.
 */
export const PAGE_DESCRIPTION =
  'Online BGMI Squad TPP tournament in India. Register your squad, get room IDs on WhatsApp, and follow live standings after every match.';

/**
 * Meta keywords carry no weight at Google and have not since 2009. They are
 * here because some smaller engines and internal site-search tools still read
 * them, and they cost nothing. Real keyword work is in the headings and copy.
 */
export const META_KEYWORDS = [
  'BGMI tournament',
  'BGMI tournament registration',
  'BGMI Squad TPP tournament',
  'BGMI scrims India',
  'BGMI custom room tournament',
  'Battlegrounds Mobile India tournament',
  'BGMI esports India',
  'online BGMI tournament 2026',
  'BGMI tournament with prize pool',
  'BGMI qualifiers and finals',
  CONFIG.tournamentName,
  `${CONFIG.tournamentName} ${CONFIG.edition}`,
].join(', ');

/** Profiles that prove the organiser is a real, findable entity. */
const socialProfiles = [CONFIG.contact.instagram, CONFIG.contact.discord].filter(
  // The shipped config carries placeholders; a placeholder in sameAs is worse
  // than an empty sameAs, because it points crawlers at a page that is not us.
  (url) => Boolean(url) && !/your-handle|your-invite|example\.com/i.test(url),
);

const SCHEDULE_LABEL: Record<ScheduleKey, string> = {
  registration: 'Registration window',
  qualifiers_a: 'Qualifiers Group A',
  qualifiers_b: 'Qualifiers Group B',
  finals: 'Grand finals',
};

type GraphInput = {
  event: EventSettings;
  results: Results;
  slots: { total: number; filled: number };
  registrationOpen: boolean;
};

/**
 * The whole schema.org graph as one object, built from live data so a fee or a
 * date changed in /admin is a fee or a date changed in the structured data.
 *
 * Everything is joined by @id, which is what lets a crawler understand that the
 * organisation running the event is the same organisation that publishes the
 * site, rather than three unrelated blobs.
 */
export function buildStructuredData({ event, results, slots, registrationOpen }: GraphInput) {
  const fee = event.entryFee;
  const pool = event.prizePool;
  const registration = event.schedule.registration;

  // The tournament runs from the first qualifier night to the final.
  const startDate = event.schedule.qualifiers_a.startsAt;
  const endDate = event.schedule.finals.endsAt || event.schedule.finals.startsAt;

  const slotsLeft = Math.max(0, slots.total - slots.filled);
  const stageKeys: StageKey[] = ['qualifiers_a', 'qualifiers_b', 'finals'];

  const organisation = {
    '@type': 'Organization',
    '@id': abs('/#organization'),
    name: CONFIG.organiser,
    url: abs('/'),
    email: CONFIG.contact.email,
    description: `Community esports organiser running ${CONFIG.tournamentName}, an online BGMI Squad TPP tournament for players in India.`,
    logo: { '@type': 'ImageObject', url: abs('/icon-512.png'), width: 512, height: 512 },
    ...(socialProfiles.length > 0 ? { sameAs: socialProfiles } : {}),
  };

  const website = {
    '@type': 'WebSite',
    '@id': abs('/#website'),
    url: abs('/'),
    name: CONFIG.tournamentName,
    description: PAGE_DESCRIPTION,
    publisher: { '@id': abs('/#organization') },
    inLanguage: 'en-IN',
  };

  const webPage = {
    '@type': 'WebPage',
    '@id': abs('/#webpage'),
    url: abs('/'),
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    isPartOf: { '@id': abs('/#website') },
    about: { '@id': abs('/#event') },
    primaryImageOfPage: { '@type': 'ImageObject', url: OG_IMAGE },
    inLanguage: 'en-IN',
    // What a voice assistant should read aloud if it is asked about this page.
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['#hero h1', '#hero p', '#format h2', '#prize h2'],
    },
  };

  /** Each night of the tournament, so a crawler can see the full calendar. */
  const subEvents = stageKeys.map((key) => {
    const window = event.schedule[key];
    const stage = results.stages[key];
    return {
      '@type': 'SportsEvent',
      '@id': abs(`/#stage-${key}`),
      name: `${CONFIG.tournamentName} — ${stage?.label ?? SCHEDULE_LABEL[key]}`,
      startDate: window.startsAt,
      ...(window.endsAt ? { endDate: window.endsAt } : {}),
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      // EventStatusType has no "finished" member — a night that has been played
      // still went ahead as scheduled, so this stays EventScheduled either way.
      eventStatus: 'https://schema.org/EventScheduled',
      location: { '@type': 'VirtualLocation', url: abs('/#standings') },
      organizer: { '@id': abs('/#organization') },
    };
  });

  const event_ = {
    '@type': 'SportsEvent',
    '@id': abs('/#event'),
    name: `${CONFIG.tournamentName} ${CONFIG.edition}`,
    description: `${CONFIG.mode} BGMI tournament across ${CONFIG.maps.join(', ')}. ${slots.total} squads, two qualifier groups and a grand final, with live standings after every match.`,
    sport: 'Esports',
    startDate,
    ...(endDate ? { endDate } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    // An online tournament has no street address; VirtualLocation is the
    // correct answer and stops Google asking for a postal address.
    location: { '@type': 'VirtualLocation', url: abs('/') },
    image: [OG_IMAGE],
    url: abs('/'),
    organizer: { '@id': abs('/#organization') },
    isAccessibleForFree: fee <= 0,
    maximumAttendeeCapacity: slots.total,
    remainingAttendeeCapacity: slotsLeft,
    inLanguage: 'en-IN',
    audience: { '@type': 'Audience', audienceType: 'BGMI players in India', geographicArea: { '@type': 'Country', name: 'India' } },
    offers: {
      '@type': 'Offer',
      name: 'Squad entry',
      url: abs('/#register'),
      price: String(fee),
      priceCurrency: 'INR',
      availability: registrationOpen && slotsLeft > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      validFrom: registration.startsAt,
      ...(registration.endsAt ? { validThrough: registration.endsAt } : {}),
      category: fee <= 0 ? 'Free entry' : 'Paid entry',
    },
    subEvent: subEvents,
    ...(typeof pool.total === 'number' && pool.total > 0
      ? {
          // Cash on the line, in the field Google reads for competitions.
          award: `Prize pool of ₹${pool.total.toLocaleString('en-IN')}`,
        }
      : {}),
  };

  /**
   * Answer-engine bait, in the good sense: the exact questions people ask,
   * answered in one or two sentences each. This is what gets quoted by voice
   * assistants and AI answers, so the entry-fee answer is the live one.
   */
  const faq = {
    '@type': 'FAQPage',
    '@id': abs('/#faq'),
    isPartOf: { '@id': abs('/#webpage') },
    mainEntity: CONFIG.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'liveAnswer' in item && item.liveAnswer === 'entryFee' ? feeCopy(fee).faq : item.a,
      },
    })),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [organisation, website, webPage, event_, faq],
  };
}
