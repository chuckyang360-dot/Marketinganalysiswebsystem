import { useState } from "react";
import Navbar from "@/pages/home/components/Navbar";
import PricingHero from "./components/PricingHero";
import PricingCards from "./components/PricingCards";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: "#F7F8FA" }}>
      <Navbar />
      <PricingHero isYearly={isYearly} setIsYearly={setIsYearly} />
      <PricingCards isYearly={isYearly} />
    </div>
  );
}
