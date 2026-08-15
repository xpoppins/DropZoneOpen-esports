import { CONFIG } from './tournament';
import { formatIST, formatMoney } from '../lib/format';

/* ===========================================================================
   TERMS & CONDITIONS
   Shown in the dialog behind the "Terms & Conditions" link, and accepted with
   the checkbox before the registration form opens.

   Anything in [SQUARE BRACKETS] is a decision only you can make — city for
   jurisdiction, minimum age, your legal/org name. Search this file for "[" and
   fill every one in before you publish. Everything else pulls from
   tournament.ts, so dates, slots and prize money stay in one place.

   IMPORTANT: bump TERMS_VERSION whenever you change the wording. Everyone who
   already accepted is asked to accept again — which is the whole point of
   having a version.

   This is a solid community-tournament baseline, not legal advice. If real
   money is moving, have someone qualified read it once.
   ======================================================================== */

export const TERMS_VERSION = '2026-08-15';
export const TERMS_UPDATED = '15 August 2026';

export type TermsBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; head: [string, string]; rows: [string, string][] };

export type TermsSection = { n: number; title: string; blocks: TermsBlock[] };

const NAME = `${CONFIG.tournamentName} ${CONFIG.edition}`;
const ORG = CONFIG.organiser;
const SLOTS = CONFIG.slots.total;
const CLOSES = formatIST(CONFIG.registrationClosesAt);
const ENTRY = CONFIG.entryFee === 0 ? 'Free' : `${formatMoney(CONFIG.entryFee)} per squad`;

export const TERMS_INTRO = [
  `By registering, every player confirms they have read, understood and accepted these terms. Registration is not complete until this acceptance is given.`,
  `This is a community-organised tournament. It is not affiliated with, sponsored by, or endorsed by KRAFTON, Inc., Level Infinite, or Battlegrounds Mobile India.`,
];

export const TERMS_SECTIONS: TermsSection[] = [
  {
    n: 1,
    title: 'Definitions',
    blocks: [
      {
        kind: 'table',
        head: ['Term', 'Meaning'],
        rows: [
          ['Organiser', `${ORG}, the entity conducting this tournament`],
          ['Admin', 'Any person authorised by the Organiser to enforce these rules'],
          ['Participant / Player', 'Any individual registered in a Team roster'],
          ['Team / Squad', 'A registered group of 4 players plus up to 1 substitute'],
          ['Captain', "The single point of contact for a Team, responsible for the Team's conduct"],
          ['Match', 'A single game in a custom room'],
          ['Round', 'A group of Matches forming a stage (Qualifier, Semi-Final, Final)'],
          ['Roster Lock', 'The deadline after which no player changes are permitted'],
        ],
      },
    ],
  },
  {
    n: 2,
    title: 'Eligibility',
    blocks: [
      {
        kind: 'list',
        items: [
          '2.1 Participants must be residents of India and play on an Indian BGMI server account.',
          '2.2 Minimum in-game level: 30. Accounts below this are not eligible.',
          "2.3 Minimum age: [16] years. Players under 18 must have a parent or legal guardian's consent; the Organiser may request written confirmation before prize payout.",
          '2.4 The BGMI account used must belong to the registered player. Account sharing, borrowing, or playing on behalf of another registered player is prohibited.',
          '2.5 Players under an active ban or suspension from BGMI, or from a previous edition of this tournament, are not eligible.',
          '2.6 Organisers, Admins, casters and their immediate family members may not compete.',
          '2.7 The Organiser may refuse or cancel any registration at its discretion, with reasons recorded.',
        ],
      },
    ],
  },
  {
    n: 3,
    title: 'Registration',
    blocks: [
      {
        kind: 'list',
        items: [
          '3.1 Registration is completed through the official form linked on the tournament website. Entries received through any other channel will not be counted.',
          `3.2 Registration closes on ${CLOSES} or once all ${SLOTS} slots are filled, whichever comes first.`,
          '3.3 Slots are allotted on a first-come, first-served basis after verification. Submitting the form does not by itself guarantee a slot; confirmation is sent to the Captain.',
          "3.4 Every roster entry must include: player IGN, BGMI numeric UID, in-game level, role (main/substitute), and the Captain's active WhatsApp number and Discord tag.",
          '3.5 Accuracy is the Team’s responsibility. A wrong UID, an unreachable Captain, or a mismatched IGN can cost the Team its slot with no appeal.',
          `3.6 Entry fee: ${ENTRY}. Where a fee applies, it is non-refundable once a slot is confirmed, except where the Organiser cancels the tournament entirely (see Clause 14).`,
          '3.7 One player may appear on only one roster. A player found on two rosters causes both Teams to be reviewed and potentially disqualified.',
          '3.8 A Team may register only once. Duplicate registrations by the same Captain will be removed.',
        ],
      },
    ],
  },
  {
    n: 4,
    title: 'Team composition and roster changes',
    blocks: [
      {
        kind: 'list',
        items: [
          '4.1 Each Team fields 4 players per Match, plus up to 1 substitute listed at registration.',
          '4.2 Roster Lock takes effect [48 hours before the first Match]. After this, no additions, removals or replacements are permitted.',
          '4.3 Before Roster Lock, changes must be requested by the Captain in writing to ' +
            CONFIG.contact.email +
            ' and are effective only once acknowledged by an Admin.',
          '4.4 A substitute may be brought in between Matches, not mid-Match.',
          '4.5 A Team may play with fewer than 4 players, but no extension, remake or compensation will be given for a short roster.',
          '4.6 Team names and tags must not contain profanity, slurs, sexual content, political or religious references, or impersonate a sponsor, organisation or Admin. The Organiser may rename a Team for broadcast.',
        ],
      },
    ],
  },
  {
    n: 5,
    title: 'Schedule, check-in and lobbies',
    blocks: [
      {
        kind: 'list',
        items: [
          '5.1 The published schedule is in Indian Standard Time (IST). Times may shift; the Organiser will notify Captains through the official Discord/WhatsApp group.',
          '5.2 Check-in opens 30 minutes and closes 10 minutes before each Round. Teams that fail to check in forfeit that Round.',
          '5.3 Room ID and password are shared 15 minutes before the Match, in the official group only. Sharing them outside the Team is a disqualifiable offence.',
          '5.4 A 10-minute grace period applies for joining the lobby. After that the Match starts regardless of who is present.',
          '5.5 Failure to appear for a Match ("no-show") scores zero for that Match. Two no-shows result in removal from the tournament.',
          '5.6 The Organiser may replace a withdrawn or disqualified Team with a standby Team before a Round begins.',
        ],
      },
    ],
  },
  {
    n: 6,
    title: 'Match rules',
    blocks: [
      {
        kind: 'p',
        text: `6.1 Mode: ${CONFIG.mode}. Perspective, map rotation and Match count per Round are as published on the tournament page.`,
      },
      { kind: 'p', text: '6.2 Scoring:' },
      {
        kind: 'table',
        head: ['Placement', 'Points'],
        rows: [
          ...CONFIG.points.placement.map((row) => [row.rank, String(row.pts)] as [string, string]),
          ['Each elimination', `+${CONFIG.points.perKill}`],
        ],
      },
      {
        kind: 'p',
        text: 'Total = placement points + elimination points across all Matches in the Round. Points carry within a stage, never across one.',
      },
      {
        kind: 'list',
        items: [
          '6.3 Tiebreakers, applied in order: (a) higher total eliminations, (b) higher single-Match placement, (c) better finish in the most recent Match, (d) Admin coin toss.',
          '6.4 In-game settings (room settings, loot, red zone, and so on) are set by the Admin and are final for that Match.',
          '6.5 A Match will only be restarted if the Admin determines that a fault in room setup or a server-wide outage affected the whole lobby. Individual disconnections, device issues, crashes or network problems are not grounds for a restart.',
        ],
      },
    ],
  },
  {
    n: 7,
    title: 'Fair play — prohibited conduct',
    blocks: [
      { kind: 'p', text: 'Any of the following results in immediate disqualification and forfeiture of prizes:' },
      {
        kind: 'list',
        items: [
          '7.1 Use of hacks, cheats, mods, scripts, third-party software, modified APKs, GFX tools that alter gameplay, or any tool granting an unfair advantage.',
          '7.2 Playing on an emulator, PC, tablet, or emulator-like environment, or using a mouse/keyboard/controller/trigger-mapping peripheral, unless expressly permitted in writing.',
          '7.3 Deliberate exploitation of bugs, glitches, map exploits, or out-of-bounds positions.',
          '7.4 Teaming — cooperating with, sparing, or coordinating with another Team in-game.',
          '7.5 Ghosting — receiving live information about enemy positions from streams, spectators, or anyone outside the Team.',
          '7.6 Intentionally losing, throwing, or manipulating results, including for betting purposes.',
          "7.7 Ringers / smurfs — fielding an unregistered player, or a player using another person's account.",
          '7.8 Stream sniping or spectating an ongoing Match a Team is competing in.',
          '7.9 Any form of betting, wagering, match-fixing, or approaching another Team to do so.',
          '7.10 Impersonating an Admin, or forging screenshots, results or communications.',
        ],
      },
    ],
  },
  {
    n: 8,
    title: 'Devices, network and recording',
    blocks: [
      {
        kind: 'list',
        items: [
          '8.1 Each Participant is solely responsible for their own device, internet connection, power supply, and game account. The Organiser bears no responsibility for lag, packet loss, crashes, battery failure, calls interrupting the game, or device overheating.',
          '8.2 Participants are strongly advised to record their own gameplay for the entire tournament and retain it for 7 days after the finals.',
          '8.3 If a Team is accused of cheating and cannot produce its recording, the Admin may draw an adverse inference and rule against the Team.',
          '8.4 The Organiser may require a live device check, screen share, or account inspection at any point. Refusal is treated as an admission.',
        ],
      },
    ],
  },
  {
    n: 9,
    title: 'Conduct',
    blocks: [
      {
        kind: 'list',
        items: [
          '9.1 Harassment, threats, sexual harassment, hate speech, casteist, communal, regional or gendered slurs, and doxxing are strictly prohibited — in voice, text, lobby, Discord, social media, and streams.',
          '9.2 Mild trash-talk is tolerated; targeted abuse is not. Admins decide where that line falls.',
          '9.3 Spamming the lobby, abusing the report system, or disrupting Admin communication is a punishable offence.',
          "9.4 The Captain is accountable for the conduct of all Team members and any of the Team's associated viewers or supporters acting on the Team's behalf.",
          '9.5 Admin instructions must be followed during Matches. Arguing in the lobby delays everyone; disputes go through the process in Clause 10.',
        ],
      },
    ],
  },
  {
    n: 10,
    title: 'Disputes and evidence',
    blocks: [
      {
        kind: 'list',
        items: [
          '10.1 Only the Captain may raise a dispute, in the designated channel, within 15 minutes of the end of the Match concerned. Disputes raised later will not be considered.',
          '10.2 A dispute must include: Team name, Match number, timestamp, description, and evidence (clear screenshot or video clip). Claims without evidence will not be entertained.',
          "10.3 Anonymous or third-party complaints may be investigated at the Admin's discretion but are not guaranteed a response.",
          '10.4 The Organiser will communicate its decision to the Captain. Admin decisions are final and binding. There is no external appeal.',
          '10.5 Results are provisional until the Organiser publishes them as final, which happens within 24 hours of the last Match of a Round.',
        ],
      },
    ],
  },
  {
    n: 11,
    title: 'Penalties',
    blocks: [
      { kind: 'p', text: 'The Organiser may impose, at its discretion and proportionate to the offence:' },
      {
        kind: 'list',
        items: [
          'Verbal or written warning',
          'Elimination-point deduction',
          'Placement-point deduction',
          'Match forfeiture (score set to zero)',
          'Disqualification of a player from the Team',
          'Disqualification of the entire Team',
          'Forfeiture of prize money already announced but not paid',
          'Ban from [1 season / all future editions] of this tournament',
          'Public disclosure of the Team name and the offence',
        ],
      },
      {
        kind: 'p',
        text: 'Cheating, teaming, ringers and match-fixing carry a presumption of full Team disqualification and a ban, regardless of whether the offence changed the outcome.',
      },
    ],
  },
  {
    n: 12,
    title: 'Prizes',
    blocks: [
      {
        kind: 'list',
        items: [
          `12.1 Prize pool: ${formatMoney(CONFIG.prizePool.total)}, distributed as published on the tournament page.`,
          "12.2 Prizes are awarded to the Team, transferred to the Captain's verified account. Internal distribution among Team members is entirely the Team's own responsibility, and the Organiser will not mediate in such disputes.",
          '12.3 To receive a prize, the Captain must provide: full name as per PAN, PAN number, a government photo ID, bank account/UPI details, and a signed acknowledgement of receipt.',
          '12.4 Taxes: prize winnings are subject to deduction of tax at source (TDS) under applicable Indian income tax law. Prizes are paid net of TDS, and the winner is responsible for their own income tax filing.',
          '12.5 Payouts are processed within 14 working days of the final results being declared and complete documents being received. Delays caused by incorrect or incomplete documents are not the Organiser’s responsibility.',
          '12.6 Prizes are non-transferable and cannot be exchanged for an alternative. Where a prize is a physical item or in-game currency, availability is subject to the supplier.',
          '12.7 If a Team is disqualified after results are declared but before payout, placements below it move up and prizes are redistributed accordingly.',
          '12.8 Unclaimed prizes lapse if documents are not submitted within 30 days of the request.',
        ],
      },
    ],
  },
  {
    n: 13,
    title: 'Media, streaming and publicity',
    blocks: [
      {
        kind: 'list',
        items: [
          '13.1 The Organiser and its authorised partners may broadcast, record, stream, clip and archive all Matches, including in-game footage, voice comms in the lobby, and the tournament Discord.',
          '13.2 By participating, each Participant grants the Organiser a non-exclusive, royalty-free right to use their IGN, Team name, logo, gameplay footage, and results for broadcast, highlights, and promotion of this and future editions, without further compensation.',
          '13.3 Participants may stream their own point of view only with a 2–5 minute delay during live Rounds, unless the Organiser announces otherwise.',
          '13.4 Participants must not stream or screenshot Admin-only channels, room credentials, or private conversations with Admins.',
        ],
      },
    ],
  },
  {
    n: 14,
    title: 'Changes, postponement and cancellation',
    blocks: [
      {
        kind: 'list',
        items: [
          '14.1 The Organiser may amend these terms, the format, schedule, map rotation, scoring, or prize structure at any time. Material changes will be announced through the official channels, and continued participation constitutes acceptance.',
          '14.2 The Organiser may postpone, shorten, restructure, or cancel the tournament — including for insufficient registrations, technical failure, game server outages, an in-game update that breaks custom rooms, or any event beyond its reasonable control (force majeure).',
          '14.3 If the tournament is cancelled before any Match is played, paid entry fees will be refunded. If cancelled after Matches have begun, the Organiser will decide, in good faith, whether to declare partial results, distribute a proportionate prize pool, or refund.',
        ],
      },
    ],
  },
  {
    n: 15,
    title: 'Limitation of liability',
    blocks: [
      {
        kind: 'list',
        items: [
          '15.1 The Organiser provides this tournament on an "as is" basis and makes no guarantee of uninterrupted service.',
          '15.2 To the extent permitted by law, the Organiser is not liable for any indirect, incidental or consequential loss, including loss of data, device damage, network charges, in-game account penalties imposed by KRAFTON, or loss of expected winnings.',
          "15.3 The Organiser's total liability to any Participant is limited to the entry fee paid by that Participant's Team (or ₹0 for a free-entry tournament).",
          '15.4 Participants indemnify the Organiser against claims arising from their own breach of these terms, their conduct, or their misuse of another person’s account.',
        ],
      },
    ],
  },
  {
    n: 16,
    title: 'Privacy and data',
    blocks: [
      {
        kind: 'list',
        items: [
          '16.1 Data collected at registration — name, IGN, BGMI UID, age, phone number, email, Discord tag, and payment details where applicable — is collected only to run the tournament, verify eligibility, and pay prizes.',
          "16.2 Registration data is collected through Google Forms and stored in Google Sheets; use of that platform is subject to Google's own privacy policy.",
          '16.3 Team names, IGNs and results will be published publicly. Phone numbers, email addresses and identity documents will not.',
          '16.4 Data is retained for 12 months after the tournament and then deleted, except where required to be kept longer for tax or legal purposes.',
          `16.5 Participants may request access to or deletion of their personal data by writing to ${CONFIG.contact.email}. Deletion requests received before prize payout may make payout impossible.`,
          '16.6 Data is not sold. It may be shared with sponsors only in aggregate or with separate express consent.',
          '16.7 This website stores one preference on your device: whether you accepted these terms, and whether you turned sound on. No tracking or advertising cookies are used.',
        ],
      },
    ],
  },
  {
    n: 17,
    title: 'Intellectual property',
    blocks: [
      {
        kind: 'list',
        items: [
          '17.1 BATTLEGROUNDS MOBILE INDIA, PUBG and all associated assets are the property of KRAFTON, Inc. This tournament is an independent community event with no affiliation to or endorsement by KRAFTON.',
          '17.2 All tournament branding, graphics, overlays and the website are the property of the Organiser.',
          '17.3 Teams retain rights to their own logos and grant the Organiser a licence to display them for tournament purposes.',
        ],
      },
    ],
  },
  {
    n: 18,
    title: 'Governing law',
    blocks: [
      {
        kind: 'list',
        items: [
          '18.1 These terms are governed by the laws of India.',
          '18.2 Courts at [YOUR CITY], [STATE] have exclusive jurisdiction over any dispute.',
          '18.3 Participants are responsible for ensuring their participation is lawful in their own state, particularly where an entry fee is involved.',
          '18.4 If any clause is found unenforceable, the remaining clauses continue in force.',
        ],
      },
    ],
  },
  {
    n: 19,
    title: 'Acceptance',
    blocks: [
      {
        kind: 'p',
        text: 'Ticking the acceptance box on this website or on the registration form, or joining a Match lobby, constitutes full acceptance of these terms by every member of the Team. The Captain confirms they have shared these terms with all Team members.',
      },
    ],
  },
];

export const TERMS_FOOTER = `${NAME} is organised by ${ORG}. Questions: ${CONFIG.contact.email}`;
