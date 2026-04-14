import Navbar from "@/pages/home/components/Navbar";
import CaseHero from "./components/CaseHero";
import CaseStudy from "./components/CaseStudy";
import CaseSummary from "./components/CaseSummary";
import CaseCta from "./components/CaseCta";
import { CASES } from "@/mocks/cases";

export default function CasePage() {
  return (
    <div className="min-h-screen" style={{ background: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <CaseHero />
      {CASES.map((c) => (
        <CaseStudy key={c.index} data={c} />
      ))}
      <CaseSummary />
      <CaseCta />
    </div>
  );
}
