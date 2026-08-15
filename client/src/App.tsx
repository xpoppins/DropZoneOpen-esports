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

export default function App() {
  const { results, live, slots } = useTournamentData();

  useReveal([results]);

  return (
    <>
      <a className="skip-link" href="#register">
        Skip to registration
      </a>

      <Backdrop />
      <StatusBar slots={slots} />

      <div className="shell">
        <Hero slots={slots} />

        <main>
          <PrizePool />
          <Format />
          <Rules />
          <Register slots={slots} />
          <Standings results={results} live={live} />
          <Faq />
        </main>

        <Footer />
      </div>
    </>
  );
}
