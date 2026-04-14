const steps = [
  {
    id: "input",
    icon: "ri-edit-box-line",
    step: "01",
    label: "输入你的问题",
    sub: "市场 · 内容 · 商品",
    desc: "告诉工作台你想搞清楚的方向：一个市场机会、一类内容选题，或者一个商品优化需求。无需结构化输入，自然语言即可。",
    examples: ["分析跨境耳机市场需求", "生成 TikTok 爆款选题", "优化这条产品标题"],
    iconBg: "linear-gradient(135deg, #7B61FF, #5B8CFF)",
    accentColor: "#7B61FF",
  },
  {
    id: "analyze",
    icon: "ri-cpu-line",
    step: "02",
    label: "系统整合多来源信号",
    sub: "AI 分析层",
    desc: "系统自动拉取 Reddit、X、Amazon、SEO 工具等多平台数据，通过 AI 聚合分析，识别关键趋势、痛点与机会。",
    examples: ["Reddit 情绪分析", "X 趋势追踪", "Amazon 评论挖掘", "SEO 搜索词分析"],
    iconBg: "linear-gradient(135deg, #0ea5e9, #0284c7)",
    accentColor: "#0ea5e9",
  },
  {
    id: "output",
    icon: "ri-rocket-2-line",
    step: "03",
    label: "输出可执行结果",
    sub: "内容 · 商品 · 下一步",
    desc: "生成可直接使用的输出：内容方向、商品优化建议、下一步行动清单，自动归档进工作台历史，随时调取。",
    examples: ["内容脚本 & 钩子", "商品标题重写", "执行清单沉淀", "报告自动归档"],
    iconBg: "linear-gradient(135deg, #059669, #0d9488)",
    accentColor: "#059669",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 lg:py-36 relative overflow-hidden" style={{ background: "#F7F8FA" }}>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <span
            className="inline-block text-[11.5px] uppercase tracking-[0.18em] font-bold mb-4 px-3.5 py-1 rounded-full"
            style={{ color: "#7B61FF", background: "rgba(123,97,255,0.07)", border: "1px solid rgba(123,97,255,0.15)" }}
          >
            工作流程
          </span>
          <h2
            className="font-extrabold tracking-[-0.03em] leading-[1.1] mb-5"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px, 4vw, 48px)", color: "#111111" }}
          >
            三步完成从{" "}
            <span style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              问题到输出
            </span>
          </h2>
          <p className="text-[16px] max-w-[480px] mx-auto leading-relaxed" style={{ color: "#888888" }}>
            输入你的市场、内容或商品问题，系统自动整合分析，3 分钟内给出可执行结果。
          </p>
        </div>

        {/* Desktop */}
        <div className="hidden lg:block relative">
          <div
            className="absolute top-[52px] left-[16%] right-[16%] h-[1px] pointer-events-none"
            style={{ background: "linear-gradient(90deg, rgba(123,97,255,0.1), rgba(123,97,255,0.4) 30%, rgba(14,165,233,0.4) 60%, rgba(5,150,105,0.3) 85%, rgba(5,150,105,0.05))" }}
          />
          <div className="grid grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={step.id} className="relative flex flex-col items-center text-center group cursor-default">
                <div className="relative mb-6 z-10">
                  <div
                    className="relative w-[60px] h-[60px] flex items-center justify-center rounded-full"
                    style={{ background: step.iconBg }}
                  >
                    <i className={`${step.icon} text-white text-[22px]`} />
                  </div>
                  <div
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: step.accentColor }}
                  >
                    {idx + 1}
                  </div>
                </div>
                <div
                  className="w-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                  style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#AAAAAA" }}>Step {step.step}</p>
                  <h3 className="text-[16px] font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif", color: "#111111" }}>{step.label}</h3>
                  <p className="text-[11.5px] font-medium mb-3" style={{ color: "#AAAAAA" }}>{step.sub}</p>
                  <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#888888" }}>{step.desc}</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {step.examples.map((ex) => (
                      <span
                        key={ex}
                        className="text-[10.5px] px-2.5 py-1 rounded-full font-medium"
                        style={{ background: `${step.accentColor}08`, color: step.accentColor, border: `1px solid ${step.accentColor}20` }}
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden flex flex-col gap-4">
          {steps.map((step, idx) => (
            <div key={step.id}>
              <div
                className="flex items-start gap-4 rounded-2xl p-5"
                style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl shrink-0" style={{ background: step.iconBg }}>
                  <i className={`${step.icon} text-white text-[18px]`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#AAAAAA" }}>Step {step.step}</p>
                  <h3 className="text-[15px] font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif", color: "#111111" }}>{step.label}</h3>
                  <p className="text-[12.5px]" style={{ color: "#888888" }}>{step.desc}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex justify-center my-2">
                  <i className="ri-arrow-down-s-line text-[22px]" style={{ color: "rgba(123,97,255,0.4)" }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
            style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[13px]" style={{ color: "#888888" }}>
              从问题输入到可执行输出：平均{" "}
              <strong className="font-bold" style={{ color: "#111111" }}>&lt; 3 分钟</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
