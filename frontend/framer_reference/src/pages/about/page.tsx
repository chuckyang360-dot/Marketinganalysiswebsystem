import Navbar from "@/pages/home/components/Navbar";
import CtaFooter from "@/pages/home/components/CtaFooter";
import AboutHero from "./components/AboutHero";
import AboutProblem from "./components/AboutProblem";
import AboutSolution from "./components/AboutSolution";
import AboutAudience from "./components/AboutAudience";
import AboutDiff from "./components/AboutDiff";
import AboutCompany from "./components/AboutCompany";
import AboutCta from "./components/AboutCta";

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <AboutHero />
      <AboutProblem />
      <AboutSolution />
      <AboutAudience />
      <AboutDiff />
      <AboutCompany />
      <AboutCta />
      <CtaFooter />
    </div>
  );
}
