import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SDHero from "./components/SDHero";
import SDCapabilities from "./components/SDCapabilities";
import SDWorkflow from "./components/SDWorkflow";
import SDTargetAudience from "./components/SDTargetAudience";
import SDCases from "./components/SDCases";

export default function ShortDramaLanding() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      {/* Light global nav */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 h-14 transition-all duration-300"
        style={{
          background: "#ffffff",
          borderBottom: scrolled ? "1px solid #EAEAEA" : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 6px rgba(0,0,0,0.04)" : "none",
        }}
      >
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 cursor-pointer group" style={{ textDecoration: "none" }}>
          <div
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
            style={{ background: "linear-gradient(135deg, #1D1D1F, #374151)" }}
          >
            <i className="ri-film-line text-white text-[13px]" />
          </div>
          <span
            className="text-[14px] font-bold whitespace-nowrap"
            style={{ fontFamily: "'Syne', sans-serif", color: "#1D1D1F" }}
          >
            ShortDrama
            <span
              className="ml-2 text-[11px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: "#F5F5F7", color: "#6E6E73", border: "1px solid #EAEAEA" }}
            >
              by GlobalPulseAI
            </span>
          </span>
        </a>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          {["能力", "流程", "案例"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-[13px] font-medium cursor-pointer transition-colors duration-200 whitespace-nowrap"
              style={{ color: "#8E8E93", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#1D1D1F"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#8E8E93"; }}
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-[13px] cursor-pointer whitespace-nowrap transition-colors duration-200"
            style={{ color: "#8E8E93", textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#1D1D1F"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#8E8E93"; }}
          >
            返回官网
          </a>
          <a
            href="/short-drama/create"
            className="px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap"
            style={{ background: "#1D1D1F", color: "#ffffff", textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#374151"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#1D1D1F"; }}
          >
            开始创建
          </a>
        </div>
      </header>

      <main>
        <SDHero />
        <SDCapabilities />
        <SDWorkflow />
        <SDTargetAudience />
        <SDCases />
      </main>

      {/* Footer */}
      <footer className="py-12 px-6" style={{ background: "#F7F8FA", borderTop: "1px solid #EAEAEA" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 flex items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg, #1D1D1F, #374151)" }}
            >
              <i className="ri-film-line text-white text-[11px]" />
            </div>
            <span className="text-[13px] font-medium" style={{ fontFamily: "'Syne', sans-serif", color: "#8E8E93" }}>
              ShortDrama Engine · Powered by GlobalPulseAI
            </span>
          </div>
          <p className="text-[12px]" style={{ color: "#AEAEB2" }}>© 2024 GlobalPulseAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
