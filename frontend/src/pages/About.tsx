import { Navbar } from '../components/Navbar';
import AboutHero from './about/components/AboutHero';
import AboutProblem from './about/components/AboutProblem';
import AboutSolution from './about/components/AboutSolution';
import AboutAudience from './about/components/AboutAudience';
import AboutDiff from './about/components/AboutDiff';
import AboutCompany from './about/components/AboutCompany';
import AboutCta from './about/components/AboutCta';
import CtaFooter from './home/components/CtaFooter';

export function About() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <main className="flex-1 pt-20">
        <AboutHero />
        <AboutProblem />
        <AboutSolution />
        <AboutAudience />
        <AboutDiff />
        <AboutCompany />
        <AboutCta />
      </main>
      <CtaFooter />
    </div>
  );
}
