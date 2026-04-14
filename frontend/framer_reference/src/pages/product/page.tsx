import Navbar from "@/pages/home/components/Navbar";
import ProductHero from "./components/ProductHero";
import CapabilityOverview from "./components/CapabilityOverview";
import FeatureSplitSection from "./components/FeatureSplitSection";
import ProductHowItWorks from "./components/ProductHowItWorks";
import ProductOutput from "./components/ProductOutput";
import ProductUseCases from "./components/ProductUseCases";

export default function ProductPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <ProductHero />
      <CapabilityOverview />
      <FeatureSplitSection />
      <ProductHowItWorks />
      <ProductOutput />
      <ProductUseCases />
    </div>
  );
}
