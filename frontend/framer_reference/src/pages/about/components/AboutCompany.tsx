import { useEffect, useRef, useState } from "react";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.style.opacity = "1"; el.style.transform = "translateY(0)"; } }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return ref;
}

const EMAIL = "chuckyang360@gmail.com";

export default function AboutCompany() {
  const ref = useReveal();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(EMAIL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <section className="w-full py-28" style={{ background: "#F7F8FA", borderTop: "1px solid #EAEAEA" }}>
      <div className="mx-auto px-6 lg:px-10" style={{ maxWidth: "1100px" }}>
        <div ref={ref} style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-5" style={{ color: "#7B61FF" }}>Company</p>
          <h2 className="font-extrabold leading-[1.12] tracking-[-0.03em] mb-14"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 3.4vw, 44px)", color: "#111111" }}>
            关于我们
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Company info */}
            <div className="rounded-2xl p-8 flex flex-col gap-6" style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 flex items-center justify-center rounded-xl shrink-0"
                  style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)" }}>
                  <i className="ri-building-2-line text-white text-[18px]" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: "#AAAAAA" }}>公司主体</p>
                  <p className="text-[15px] font-semibold leading-snug" style={{ color: "#111111" }}>杭州越响信息科技有限公司</p>
                </div>
              </div>
              <div className="h-px" style={{ background: "#EAEAEA" }} />
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 flex items-center justify-center rounded-xl shrink-0" style={{ background: "#F7F8FA", border: "1px solid #EAEAEA" }}>
                  <i className="ri-user-line text-[18px]" style={{ color: "#888888" }} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: "#AAAAAA" }}>联系人</p>
                  <p className="text-[15px] font-semibold" style={{ color: "#111111" }}>查克杨 · Chuck Yang</p>
                </div>
              </div>
            </div>
            {/* Contact */}
            <div className="rounded-2xl p-8 flex flex-col gap-6" style={{ background: "rgba(123,97,255,0.04)", border: "1px solid rgba(123,97,255,0.18)" }}>
              <p className="text-[13px] leading-[1.8]" style={{ color: "#888888" }}>
                如果你在思考增长，希望探讨合作，或者只是想聊聊我们在做什么——直接发邮件就行，回复很快。
              </p>
              <div>
                <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: "#AAAAAA" }}>邮箱</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <a href={`mailto:${EMAIL}`} className="text-[15px] font-semibold cursor-pointer transition-colors duration-200 hover:underline whitespace-nowrap" style={{ color: "#7B61FF" }}>
                    {EMAIL}
                  </a>
                  <button onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
                    style={{ background: copied ? "rgba(5,150,105,0.08)" : "#ffffff", border: `1px solid ${copied ? "rgba(5,150,105,0.25)" : "#EAEAEA"}`, color: copied ? "#059669" : "#888888" }}>
                    <i className={`${copied ? "ri-check-line" : "ri-clipboard-line"} text-[12px]`} />
                    {copied ? "已复制" : "复制"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
