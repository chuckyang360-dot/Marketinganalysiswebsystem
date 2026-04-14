const OLD_TOOLS = [
  { icon: "ri-layout-grid-line", text: "数据分散在不同平台，需要手动汇总" },
  { icon: "ri-brain-line", text: "需要人工判断信号价值，容易走偏" },
  { icon: "ri-file-text-line", text: "输出分析报告，不知道下一步怎么做" },
  { icon: "ri-time-line", text: "每次分析都从零开始，耗时耗力" },
  { icon: "ri-tools-line", text: "工具越多，协作越难，信息越碎片化" },
];

const NEW_TOOLS = [
  { icon: "ri-node-tree", text: "自动整合多平台信号，实时输出结构化结论" },
  { icon: "ri-flashlight-line", text: "直接输出可执行决策，而不是原始数据" },
  { icon: "ri-rocket-line", text: "每次分析都生成下一步行动路径" },
  { icon: "ri-loop-right-line", text: "分析结果自动沉淀，支持持续迭代优化" },
  { icon: "ri-team-line", text: "统一工作台，团队协作无缝衔接" },
];

export default function PricingComparison() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#060914", borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Side glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: 0,
          transform: "translateY(-50%)",
          width: "400px",
          height: "600px",
          background: "radial-gradient(ellipse at 0% 50%, rgba(79,70,229,0.1) 0%, transparent 65%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          right: 0,
          transform: "translateY(-50%)",
          width: "400px",
          height: "600px",
          background: "radial-gradient(ellipse at 100% 50%, rgba(78,201,176,0.08) 0%, transparent 65%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10 mx-auto px-6 lg:px-10 py-24 lg:py-32" style={{ maxWidth: "1000px" }}>
        {/* Header */}
        <div className="text-center mb-16">
          <span
            className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3.5 py-1.5 rounded-full"
            style={{ color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.15)" }}
          >
            价值对比
          </span>
          <h2
            className="font-bold leading-[1.15] tracking-[-0.025em] text-white"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 3vw, 40px)" }}
          >
            你真正得到的是什么？
          </h2>
          <p
            className="mt-4 mx-auto text-[15px] leading-[1.75]"
            style={{ color: "rgba(255,255,255,0.4)", maxWidth: "460px" }}
          >
            大多数工具停在"提供信息"这一步。GlobalPulseAI 的目标是把分析变成增长动作。
          </p>
        </div>

        {/* Two column comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left — old */}
          <div
            className="rounded-2xl p-7"
            style={{
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-7">
              <div
                className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <i className="ri-tools-line text-[14px]" style={{ color: "rgba(255,255,255,0.3)" }} />
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
                  普通工具
                </p>
                <p className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                  给你信息，但不给方向
                </p>
              </div>
            </div>
            <ul className="flex flex-col gap-4">
              {OLD_TOOLS.map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 mt-0.5"
                    style={{ background: "rgba(239,68,68,0.07)" }}
                  >
                    <i className={`${item.icon} text-[12px]`} style={{ color: "rgba(239,68,68,0.45)" }} />
                  </div>
                  <p
                    className="text-[13.5px] leading-[1.65]"
                    style={{ color: "rgba(255,255,255,0.38)" }}
                  >
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — GlobalPulseAI */}
          <div
            className="rounded-2xl p-7 relative overflow-hidden"
            style={{
              background: "rgba(124,92,255,0.05)",
              border: "1px solid rgba(124,92,255,0.2)",
            }}
          >
            {/* Top glow */}
            <div
              className="absolute top-0 left-0 right-0 h-28 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 50% 0%, rgba(124,92,255,0.18) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-7">
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
                  style={{
                    background: "linear-gradient(135deg, rgba(124,92,255,0.3), rgba(79,70,229,0.3))",
                    border: "1px solid rgba(124,92,255,0.25)",
                  }}
                >
                  <i className="ri-global-line text-[14px]" style={{ color: "#a78bfa" }} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>
                    GlobalPulseAI
                  </p>
                  <p className="text-[11.5px]" style={{ color: "rgba(167,139,250,0.55)" }}>
                    分析只是开始，增长才是目标
                  </p>
                </div>
              </div>
              <ul className="flex flex-col gap-4">
                {NEW_TOOLS.map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 mt-0.5"
                      style={{ background: "rgba(52,211,153,0.1)" }}
                    >
                      <i className={`${item.icon} text-[12px]`} style={{ color: "#34d399" }} />
                    </div>
                    <p
                      className="text-[13.5px] leading-[1.65]"
                      style={{ color: "rgba(255,255,255,0.72)" }}
                    >
                      {item.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div
          className="mt-8 px-6 py-4 rounded-xl text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[13.5px]" style={{ color: "rgba(255,255,255,0.38)" }}>
            <span className="font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>核心差异：</span>
            {" "}我们不是帮你看懂市场，而是帮你在市场中持续推进增长。
          </p>
        </div>
      </div>
    </section>
  );
}
