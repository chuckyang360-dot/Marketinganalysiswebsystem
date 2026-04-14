import { Navbar } from "../components/Navbar";
import { CASES } from "../mocks/cases";
import CaseCta from "./case/components/CaseCta";
import CaseHero from "./case/components/CaseHero";
import CaseStudy from "./case/components/CaseStudy";
import CaseSummary from "./case/components/CaseSummary";

export function Cases() {
  return (
    <div className="min-h-screen" style={{ background: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <CaseHero />
      {CASES.map((item) => (
        <CaseStudy key={item.index} data={item} />
      ))}
      <CaseSummary />
      <CaseCta />
    </div>
  );
}
