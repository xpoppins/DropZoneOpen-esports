/* ============================================================================
 * HOW TO CONNECT YOUR GOOGLE FORM
 * ----------------------------------------------------------------------------
 * 1. Open your registration form at https://forms.google.com
 * 2. Click  Send  (top right)
 * 3. Pick the  link  tab (the chain icon 🔗)
 * 4. Copy the URL. A shortened  https://forms.gle/xxxxxxxx  link works too.
 * 5. Paste it below as  registrationFormUrl , between the quotes.
 * 6. Save this file, then rebuild:  npm run build   (or just restart  npm run dev )
 *
 * Make sure the form is accepting responses — Responses tab → the toggle at the
 * top must be ON. A closed form shows visitors "no longer accepting responses"
 * and the button on this site will still look like it worked.
 *
 * Everything else on this page — name, dates, prize money, rules, FAQ, contact
 * links — is edited in this one file. Nothing is hardcoded in the components.
 * Live numbers (slots filled, standings) come from the API; see README.
 * ==========================================================================*/

export const CONFIG = {
  // ── SWAP THIS ONE LINE WITH YOUR GOOGLE FORM LINK ──
  registrationFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScow3CMevRw5aQrQbKbWYlONlmUCpizTiDG92NIXWFvZtpB7g/viewform',

  tournamentName: 'Drop Zone Open',
  edition: 'Season 1',
  tagline: 'No second circle.',
  organiser: 'Drop Zone Collective',
  region: 'India · Asia server',

  // ISO 8601 with the +05:30 offset so the countdown is correct for every visitor,
  // wherever they are, while still meaning "midnight IST" to you.
  registrationClosesAt: '2026-09-15T23:59:00+05:30',
  tournamentStartsAt: '2026-09-20T18:00:00+05:30',

  mode: 'Squad TPP',
  maps: ['Erangel', 'Miramar', 'Sanhok'],

  // Fallback values. If the API is reachable these are replaced by live counts.
  slots: { total: 32, filled: 11 },

  // Each prize is either CASH (a plain number, in rupees) or TEXT in quotes for
  // anything that is not money — 'Certificates', 'Gaming mouse', 'Merch pack'.
  // Cash prizes get a proportional bar on the page; text prizes do not.
  // Keep `total` equal to the cash prizes added up, or the page contradicts itself.
  prizePool: {
    currency: 'INR',
    total: 1300,
    first: 1000,
    second: 200,
    third: 100,
    mvp: 'Certificate',
    mostKills: 'Certificate',
    // The line under the five prizes. Set it to '' to hide that box entirely.
    participationNote: 'Every other squad that plays a match gets a participation certificate.',
  },

  entryFee: 200,

  contact: {
    email: 'dropzone.lobby@gmail.com',
    whatsapp: 'https://wa.me/919000000000',
    discord: 'https://discord.gg/your-invite',
    instagram: 'https://instagram.com/your-handle',
  },

  // false → the CTA becomes a disabled "Registrations closed" state everywhere.
  registrationOpen: true,

  // Pulse the HUD countdown in --flare once the deadline is this close.
  urgentThresholdHours: 72,

  // Points system, printed in the Format section and used nowhere else.
  points: {
    placement: [
      { rank: '#1', pts: 10 },
      { rank: '#2', pts: 6 },
      { rank: '#3', pts: 5 },
      { rank: '#4', pts: 4 },
      { rank: '#5', pts: 3 },
      { rank: '#6', pts: 2 },
      { rank: '#7–8', pts: 1 },
      { rank: '#9–16', pts: 0 },
    ],
    perKill: 1,
  },

  schedule: [
    {
      id: 'registration',
      label: 'Registration window',
      window: '25 Aug – 15 Sep',
      detail: 'Squads submit the form. Slots are confirmed in the order they arrive.',
      maps: [] as string[],
      matches: '',
    },
    {
      id: 'qualifiers',
      label: 'Qualifiers',
      window: '20 – 21 Sep · 6:00 PM IST',
      detail: '256 squads across 16 groups. Top 4 of every group advance.',
      maps: ['Erangel', 'Sanhok'],
      matches: '4 matches per group',
    },
    {
      id: 'semis',
      label: 'Semi-finals',
      window: '27 Sep · 6:00 PM IST',
      detail: '64 squads, 4 lobbies. Top 4 per lobby move to the grand finals.',
      maps: ['Erangel', 'Miramar', 'Sanhok'],
      matches: '5 matches per lobby',
    },
    {
      id: 'finals',
      label: 'Grand finals',
      window: '4 Oct · 7:00 PM IST',
      detail: '16 squads, one lobby, casted live. Cumulative points decide it.',
      maps: ['Erangel', 'Miramar', 'Erangel'],
      matches: '6 matches',
    },
  ],

  // What a captain should have open in another tab before starting the form.
  registrationChecklist: [
    'In-game names for all 4 players, plus 1 substitute',
    'BGMI numeric UID for every player (Profile → the number under your IGN)',
    "Captain's WhatsApp number — room IDs go here",
    'Discord tag of the captain',
    'Player levels — every account must be 30+',
  ],

  rules: [
    {
      q: 'Eligibility',
      a: 'Open to players resident in India, playing on the Asia server. Every account must be level 30 or above and in good standing — no active bans or restrictions. Minimum age 16; if you are under 18 you need a parent or guardian to okay it before the finals payout. Emulators, tablets running emulated clients, PC clients, and controllers/triggers that automate input are not allowed. Phones and tablets running the official Android or iOS build only.',
    },
    {
      q: 'Squad size and substitutes',
      a: 'Four players per squad and one named substitute, registered before the deadline. The substitute may replace any player between matches, never during one. A squad may play a match with three players; two or fewer is a forfeit for that match. Players cannot appear in two squads — the second registration is removed, not the first.',
    },
    {
      q: 'Banned items and third-party software',
      a: 'Any hack, mod menu, aimbot, wallhack, recoil script, macro, GFX tool that alters hitboxes or object rendering, or modified game file results in an immediate permanent ban for the whole squad and forfeit of any prize money. Screen recorders, voice apps and standard performance modes are fine. Playing alongside a hacker who is not on your squad is not your fault; teaming with one to gain an advantage is.',
    },
    {
      q: 'Device and connection rules',
      a: 'Bring your own device and connection. Ping is your responsibility — matches are not restarted for a single squad disconnecting. If more than half the lobby drops before the plane, admins restart. Use of VPNs to change region is a disqualification. Keep your device in airplane-mode-with-wifi or Do Not Disturb; an incoming call is not a valid restart request.',
    },
    {
      q: 'Teaming, griefing and match conduct',
      a: 'No teaming with other squads, no intentional stalling in the final circle, no throwing a match to help another squad qualify. Abusive voice or text chat aimed at players, admins or casters gets a warning first and a squad removal second. Post-match trash talk in the group chat is not a rules matter until it is targeted harassment — then it is.',
    },
    {
      q: 'Disqualification and appeals',
      a: 'Admins may remove a squad mid-event for any of the above. Removals are posted in the results channel with the reason and the match number. You have 24 hours to appeal with evidence — the match recording is the only evidence that settles anything, so record your matches. Admin decisions after an appeal are final.',
    },
    {
      q: 'Disputes and reporting',
      a: 'Report a problem during a match to the lobby admin in the room chat immediately, and follow up in the dispute channel with the room ID, match number, timestamp and clip. Disputes raised more than 24 hours after a match are not reviewed. Contact for anything the channels cannot solve: the organiser email in the footer.',
    },
  ],

  faq: [
    {
      q: 'Is there an entry fee?',
      a: 'No. Registration is free for every stage, from qualifiers through the grand finals. Nobody from the organising team will ever ask you for money to hold a slot — if someone does, screenshot it and send it to the organiser email.',
    },
    {
      q: 'How do I get the room ID and password?',
      a: "They go to the captain's WhatsApp number 15 minutes before each match, and to the Discord announcements channel at the same time. Add the number you get the first message from to your contacts so it does not land in spam. Enter the lobby within 10 minutes of receiving the ID.",
    },
    {
      q: 'Which server and what ping should I expect?',
      a: 'All matches are on the Asia server. Most Indian players see 40–90ms on a stable 4G or wifi connection. Anything above 150ms will feel rough in close fights, and there is no ping-based rematch, so test your connection during the qualifiers window rather than on finals night.',
    },
    {
      q: 'What happens if my squad does not show up?',
      a: 'A squad that has not entered the lobby 10 minutes after the room ID goes out is marked no-show for that match and scores zero. Two no-shows in a stage removes the squad and the slot goes to the next team on the waitlist. Tell an admin in advance if you are running late — it does not undo the rule, but it helps us hold the lobby.',
    },
    {
      q: 'When is prize money paid out?',
      a: 'Within 14 working days of the grand finals, by UPI or bank transfer to the captain, who splits it with the squad. We need a PAN card for any single payout above ₹10,000 — that is a tax requirement, not a preference. Payouts are announced publicly in the results channel once sent.',
    },
    {
      q: 'Can I stream my own POV?',
      a: 'Yes, with a 2-minute delay during semis and finals so nobody streamsnipes you. The official cast covers the finals lobby only. Clip anything you want and tag the organiser handle — the best plays go on the recap.',
    },
    {
      q: 'Can I change my squad after registering?',
      a: 'You can swap players up to 48 hours before your first qualifier by replying to your registration confirmation email with the new IGN and UID. After that the roster is locked, and your registered substitute is the only change you can make.',
    },
    {
      q: 'Is this an official Krafton event?',
      a: 'No. This is a community tournament run by independent organisers. It is not affiliated with, sponsored by, or endorsed by Krafton or BGMI.',
    },
  ],
} as const;

export type TournamentConfig = typeof CONFIG;
