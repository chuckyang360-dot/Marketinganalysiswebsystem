import { useState } from "react";

const FAQS = [
  {
    q: "Free 和 Pro 的区别是什么？",
    a: "Free 用于验证方向——你可以了解基础趋势、试用核心功能，但次数有限。Pro 用于增长——多平台信号整合、可执行内容输出、持续分析迭代，一套完整的增长能力。",
  },
  {
    q: "是否支持团队协作？",
    a: "Pro 支持最多 3 人协作，Team 支持无限制席位，并提供统一数据共享与权限管理。如果团队规模较大或有定制需求，可以联系我们了解 Team 方案。",
  },
  {
    q: "是否可以随时取消订阅？",
    a: "支持随时取消。取消后在当前计费周期结束前仍可正常使用，到期后自动切回 Free 计划，历史分析数据不会丢失。",
  },
  {
    q: "按年付费和按月付费功能一样吗？",
    a: "功能完全一致，按年付费相当于打了八折，节省约 20% 费用。适合已经明确需求、希望长期使用的团队。",
  },
  {
    q: "分析次数用完后怎么办？",
    a: "当月次数用尽后分析功能暂停，但历史记录和已生成结论完整保留。你可以选择升级到 Pro，或等到下个月自动重置。",
  },
  {
    q: "是否支持发票和企业采购？",
    a: "所有付费订单均可申请电子发票。Team 方案额外支持对公转账、定制合同与 SLA 保障，请通过联系销售了解详情。",
  },
];

export default function PricingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#060914", borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 55% 60% at 80% 50%, rgba(79,70,229,0.07) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 mx-auto px-6 lg:px-10 py-24 lg:py-32" style={{ maxWidth: "780px" }}>
        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-[11px] font-bold uppercase tracking-widest mb-4 px-3.5 py-1.5 rounded-full"
            style={{ color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.15)" }}
          >
            常见问题
          </span>
          <h2
            className="font-bold leading-[1.2] tracking-[-0.02em] text-white"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(24px, 2.8vw, 38px)" }}
          >
            选择前你可能想知道的
          </h2>
        </div>

        {/* FAQ items */}
        <div className="flex flex-col gap-2.5">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                style={{
                  background: isOpen ? "rgba(124,92,255,0.07)" : "rgba(255,255,255,0.025)",
                  border: isOpen ? "1px solid rgba(124,92,255,0.22)" : "1px solid rgba(255,255,255,0.07)",
                }}
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <div className="flex items-center justify-between px-6 py-4 gap-4">
                  <p
                    className="text-[14.5px] font-medium"
                    style={{ color: isOpen ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.65)" }}
                  >
                    {faq.q}
                  </p>
                  <div
                    className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-all duration-200"
                    style={{
                      background: isOpen ? "rgba(124,92,255,0.18)" : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <i
                      className="ri-add-line text-[15px] transition-transform duration-200"
                      style={{
                        color: isOpen ? "#a78bfa" : "rgba(255,255,255,0.35)",
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        display: "inline-block",
                      }}
                    />
                  </div>
                </div>
                {isOpen && (
                  <div className="px-6 pb-5">
                    <p className="text-[13.5px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
