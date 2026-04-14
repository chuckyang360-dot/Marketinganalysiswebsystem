interface PricingHeroProps {
  isYearly: boolean;
  setIsYearly: (v: boolean) => void;
}

export default function PricingHero({ isYearly, setIsYearly }: PricingHeroProps) {
  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#ffffff" }}>
      <div className="relative z-10 w-full mx-auto px-6 lg:px-10 pt-32 pb-12 text-center" style={{ maxWidth: "720px" }}>
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
            style={{ background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.2)" }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[11.5px] font-semibold" style={{ color: "#059669" }}>
              多数团队选择 Pro，因为它能直接带来结果
            </span>
          </span>
        </div>

        {/* Title */}
        <h1
          className="font-extrabold leading-[1.12] tracking-[-0.03em] mb-3"
          style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 4vw, 48px)", color: "#111111" }}
        >
          选择适合你
          <span
            className="ml-2"
            style={{
              background: "linear-gradient(120deg, #7B61FF 0%, #5B8CFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            增长阶段
          </span>
          的方案
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto leading-relaxed mb-10"
          style={{ fontSize: "clamp(13px, 1vw, 15px)", color: "#888888", maxWidth: "460px" }}
        >
          不是购买功能，而是购买一套可持续增长的能力
        </p>

        {/* ── Billing toggle ── */}
        <div className="flex items-center justify-center">
          <div
            className="relative flex items-center p-1 rounded-full"
            style={{
              background: "#F7F8FA",
              border: "1px solid #EAEAEA",
            }}
          >
            {/* Sliding pill */}
            <div
              className="absolute top-1 h-[calc(100%-8px)] rounded-full transition-all duration-300 pointer-events-none"
              style={{
                width: "calc(50% - 4px)",
                left: isYearly ? "calc(50% + 0px)" : "4px",
                background: isYearly ? "linear-gradient(135deg, #7B61FF, #5B8CFF)" : "#ffffff",
                border: isYearly ? "none" : "1px solid #EAEAEA",
              }}
            />

            {/* Monthly */}
            <button
              onClick={() => setIsYearly(false)}
              className="relative z-10 px-6 py-2 rounded-full text-[13px] font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap"
              style={{ color: !isYearly ? "#111111" : "#888888" }}
            >
              按月付费
            </button>

            {/* Yearly */}
            <button
              onClick={() => setIsYearly(true)}
              className="relative z-10 px-6 py-2 rounded-full text-[13px] font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap flex items-center gap-2"
              style={{ color: isYearly ? "#ffffff" : "#888888" }}
            >
              按年付费
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200"
                style={{
                  background: isYearly ? "rgba(255,255,255,0.2)" : "rgba(5,150,105,0.1)",
                  color: isYearly ? "#ffffff" : "#059669",
                  border: isYearly ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(5,150,105,0.25)",
                }}
              >
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Yearly savings note */}
        <div
          className="mt-4 transition-all duration-300"
          style={{ opacity: isYearly ? 1 : 0, transform: isYearly ? "translateY(0)" : "translateY(-4px)" }}
        >
          <p className="text-[12px]" style={{ color: "#059669" }}>
            <i className="ri-gift-line mr-1.5" />
            按年付费每月仅 $15，相比月付每年省下 <strong style={{ color: "#059669" }}>$48</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
