import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ProblemSection from "./components/ProblemSection";
import GrowthEngineSection from "./components/GrowthEngineSection";
import HowItWorksSection from "./components/HowItWorksSection";
import OutputSection from "./components/OutputSection";
import UseCasesSection from "./components/UseCasesSection";
import ShortDramaSection from "./components/ShortDramaSection";
import CtaFooter from "./components/CtaFooter";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: "#ffffff" }}>
      <Navbar />
      <section><HeroSection /></section>
      <section><ProblemSection /></section>
      <section><GrowthEngineSection /></section>
      <section><HowItWorksSection /></section>
      <section><OutputSection /></section>
      <section><UseCasesSection /></section>
      <section><ShortDramaSection /></section>
      <CtaFooter />
    </div>
  );
}
