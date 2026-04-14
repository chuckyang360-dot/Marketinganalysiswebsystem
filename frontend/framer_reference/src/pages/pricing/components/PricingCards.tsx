import { useNavigate } from "react-router-dom";

interface Feature { text: string; included: boolean; }
interface Plan {
  id: string; name: string; badge: string | null;
  priceMonthly: number | null; priceYearly: number | null;
  tagline: string; emphasis: string | null; features: Feature[];
  cta: string; ctaStyle: "primary" | "outline" | "ghost";
  accentColor: string; borderColor: string; bgColor: string; highlighted: boolean;
}
interface PricingCardsProps { isYearly: boolean; }

const PLANS: Plan[] = [
  {
    id: "free", name: "Free", badge: null, priceMonthly: 0, priceYearly: 0,
    tagline: "适合验证需求，而不是增长", emphasis: null,
    features: [
      { text: "基础市场趋势与讨论", included: true },
      { text: "初步内容方向建议", included: true },
      { text: "商品分析基础版", included: true },
      { text: "使用次数限制（每月 5 次）", included: true },
      { text: "多平台信号整合", included: false },
      { text: "分析结果沉淀与复用", included: false },
    ],
    cta: "开始免费使用", ctaStyle: "ghost",
    accentColor: "#888888", borderColor: "#EAEAEA", bgColor: "#ffffff", highlighted: false,
  },
  {
    id: "pro", name: "Pro", badge: "推荐", priceMonthly: 19, priceYearly: 15,
    tagline: "从看到趋势到落地增长，形成持续迭代",
    emphasis: "每周多次分析 + 持续优化执行",
    features: [
      { text: "多平台信号整合（Reddit / X / SEO）", included: true },
      { text: "输出可执行内容方向", included: true },
      { text: "商品页优化（标题 / 主图 / 卖点）", included: true },
      { text: "内容生产辅助（选题 / 结构）", included: true },
      { text: "分析结果沉淀与复用", included: true },
      { text: "团队协作（最多 3 人）", included: true },
    ],
    cta: "立即开始增长", ctaStyle: "primary",
    accentColor: "#7B61FF", borderColor: "rgba(123,97,255,0.35)", bgColor: "#ffffff", highlighted: true,
  },
  {
    id: "team", name: "Team", badge: null, priceMonthly: null, priceYearly: null,
    tagline: "适合有协作需求的团队", emphasis: null,
    features: [
      { text: "多人协作（无限席位）", included: true },
      { text: "数据共享与统一管理", included: true },
      { text: "历史分析永久沉淀", included: true },
      { text: "定制分析能力", included: true },
      { text: "API 接入", included: true },
      { text: "专属客户成功顾问", included: true },
    ],
    cta: "联系销售", ctaStyle: "outline",
    accentColor: "#0ea5e9", borderColor: "rgba(14,165,233,0.3)", bgColor: "#ffffff", highlighted: false,
  },
];

export default function PricingCards({ isYearly }: PricingCardsProps) {
  const navigate = useNavigate();
  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#F7F8FA" }}>
      <div className="relative z-10 mx-auto px-6 lg:px-10 pb-20" style={{ maxWidth: "1100px" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pt-8">
          {PLANS.map((plan) => {
            const displayPrice = isYearly ? plan.priceYearly : plan.priceMonthly;
            const monthlyPrice = plan.priceMonthly;
            const yearlySaving = isYearly && monthlyPrice !== null && monthlyPrice > 0 && plan.priceYearly !== null
              ? (monthlyPrice - plan.priceYearly) * 12 : 0;

            return (
              <div
                key={plan.id}
                className="relative flex flex-col rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: plan.bgColor,
                  border: `1px solid ${plan.highlighted ? plan.borderColor : plan.borderColor}`,
                  transform: plan.highlighted ? "translateY(-6px)" : undefined,
                }}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-0 right-0 flex justify-center z-10">
                    <span
                      className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                      style={{ background: "linear-gradient(135deg, #7B61FF, #5B8CFF)", color: "#fff" }}
                    >
                      <i className="ri-star-fill text-[8px]" />{plan.badge}
                    </span>
                  </div>
                )}

                <div className="relative p-6 flex-1 flex flex-col">
                  <div className={`mb-4 ${plan.badge ? "mt-4" : "mt-1"}`}>
                    <span className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: plan.accentColor }}>
                      {plan.name}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    {displayPrice === 0 ? (
                      <div className="flex items-end gap-2">
                        <span className="font-extrabold leading-none" style={{ fontFamily: "'Syne', sans-serif", fontSize: "40px", color: "#111111" }}>$0</span>
                        <span className="text-[13px] mb-1" style={{ color: "#888888" }}>永久免费</span>
                      </div>
                    ) : displayPrice === null ? (
                      <div className="flex items-end gap-2">
                        <span className="font-extrabold leading-none" style={{ fontFamily: "'Syne', sans-serif", fontSize: "30px", color: "#111111" }}>定制报价</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-end gap-2.5">
                          <span className="font-extrabold leading-none transition-all duration-300" style={{ fontFamily: "'Syne', sans-serif", fontSize: "42px", color: "#111111" }}>
                            ${displayPrice}
                          </span>
                          <div className="flex flex-col mb-1.5 gap-1">
                            <span className="text-[12px]" style={{ color: "#888888" }}>/ 月</span>
                            {isYearly && monthlyPrice !== null && monthlyPrice > 0 && (
                              <span className="text-[11px] line-through leading-none" style={{ color: "#CCCCCC" }}>${monthlyPrice}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 min-h-[20px]">
                          {isYearly ? (
                            <>
                              <span className="text-[11.5px]" style={{ color: "#888888" }}>按年计费 ${(displayPrice * 12).toFixed(0)}/年</span>
                              {yearlySaving > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                  style={{ background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)", color: "#059669" }}>
                                  <i className="ri-arrow-down-line text-[9px]" />省 ${yearlySaving}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[11.5px]" style={{ color: "#AAAAAA" }}>按月计费</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[13px] font-medium mb-4 leading-snug" style={{ color: "#888888" }}>{plan.tagline}</p>

                  {plan.emphasis && (
                    <div className="mb-4 px-3 py-1.5 rounded-lg" style={{ background: "rgba(123,97,255,0.06)", border: "1px solid rgba(123,97,255,0.15)" }}>
                      <p className="text-[12px] font-bold text-center" style={{ color: "#7B61FF" }}>{plan.emphasis}</p>
                    </div>
                  )}

                  <button
                    onClick={() => plan.id !== "team" ? navigate("/workspace") : undefined}
                    className="w-full py-2.5 rounded-xl text-[13.5px] font-semibold cursor-pointer transition-all duration-200 mb-5 whitespace-nowrap"
                    style={
                      plan.ctaStyle === "primary"
                        ? { background: "linear-gradient(135deg, #7B61FF, #5B8CFF)", color: "#fff" }
                        : plan.ctaStyle === "outline"
                        ? { background: "transparent", color: "#444444", border: "1px solid #EAEAEA" }
                        : { background: "#F7F8FA", color: "#888888", border: "1px solid #EAEAEA" }
                    }
                    onMouseEnter={(e) => {
                      if (plan.ctaStyle === "primary") { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }
                      else { (e.currentTarget as HTMLElement).style.background = "#F7F8FA"; (e.currentTarget as HTMLElement).style.color = "#111111"; }
                    }}
                    onMouseLeave={(e) => {
                      if (plan.ctaStyle === "primary") { (e.currentTarget as HTMLElement).style.opacity = "1"; }
                      else {
                        (e.currentTarget as HTMLElement).style.background = plan.ctaStyle === "outline" ? "transparent" : "#F7F8FA";
                        (e.currentTarget as HTMLElement).style.color = plan.ctaStyle === "outline" ? "#444444" : "#888888";
                      }
                    }}
                  >
                    {plan.cta}
                  </button>

                  <div className="mb-4" style={{ borderTop: "1px solid #EAEAEA" }} />

                  <ul className="flex flex-col gap-2.5">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2">
                        <div className="w-3.5 h-3.5 flex items-center justify-center rounded-full shrink-0 mt-0.5"
                          style={{ background: f.included ? "rgba(5,150,105,0.1)" : "#F7F8FA" }}>
                          <i className={f.included ? "ri-check-line text-[9px]" : "ri-close-line text-[9px]"}
                            style={{ color: f.included ? "#059669" : "#CCCCCC" }} />
                        </div>
                        <span className="text-[12.5px] leading-snug" style={{ color: f.included ? "#444444" : "#AAAAAA" }}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center mt-8 text-[12px]" style={{ color: "#AAAAAA" }}>
          无需信用卡 &nbsp;·&nbsp; 7 天免费试用 &nbsp;·&nbsp; 随时取消
        </p>
      </div>
    </section>
  );
}
