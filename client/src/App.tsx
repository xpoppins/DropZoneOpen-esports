import { Backdrop } from './components/Backdrop';
import { StatusBar } from './components/StatusBar';
import { Hero } from './sections/Hero';
import { PrizePool } from './sections/PrizePool';
import { Format } from './sections/Format';
import { Rules } from './sections/Rules';
import { Register } from './sections/Register';
import { Standings } from './sections/Standings';
import { Faq } from './sections/Faq';
import { Footer } from './sections/Footer';
import { useReveal } from './lib/useReveal';
import { useTournamentData } from './lib/useTournamentData';
import { ConsentProvider } from './lib/consent';

export default function App() {
  const { results, live, slots, event } = useTournamentData();

  useReveal([results]);

  const registration = event.schedule.registration;

  return (
    <ConsentProvider
      live={{
        closesAt: registration.endsAt || registration.startsAt,
        entryFee: event.entryFee,
        slotsTotal: slots.total,
        prizeTotal: event.prizePool.total,
      }}
    >
      <a className="skip-link" href="#register">
        Skip to registration
      </a>

      <Backdrop />
      <StatusBar slots={slots} event={event} />

      <div className="shell">
        <Hero slots={slots} event={event} />

        <main>
          <PrizePool event={event} />
          <Format event={event} results={results} />
          <Rules />
          <Register slots={slots} event={event} />
          <Standings results={results} live={live} />
          <Faq event={event} />
        </main>

        <Footer />
      </div>
    </ConsentProvider>
  );
}
