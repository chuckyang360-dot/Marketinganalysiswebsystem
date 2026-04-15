import type { BreakdownData, ContentType } from "../../../mocks/contentEngine";

interface ContentBreakdownProps {
  data: BreakdownData;
  contentType?: ContentType;
}

const TYPE_CFG: Record<ContentType, { label: string; icon: string; color: string; showVisual: boolean }> = {
  video: { label: "视频内容分析", icon: "ri-video-line", color: "#7B61FF", showVisual: true },
  image: { label: "图文内容分析", icon: "ri-image-2-line", color: "#FF2442", showVisual: true },
  article: { label: "文章内容分析", icon: "ri-article-line", color: "#3b82f6", showVisual: false },
};

export default function ContentBreakdown({ data, contentType = "video" }: ContentBreakdownProps) {
  const cfg = TYPE_CFG[contentType];

  return (
    <section className="w-full px-6 lg:px-10 py-10" style={{ background: "#F7F8FA" }}>
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        {/* Section header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #7B61FF, #5B8CFF)" }} />
          <h3 className="text-[16px] font-bold" style={{ color: "#111111" }}>爆款结构拆解</h3>
          {/* Content type badge */}
          <span
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: `${cfg.color}10`, color: cfg.color, border: `1px solid ${cfg.color}25` }}
          >
            <i className={`${cfg.icon} text-[10px]`} />
            {cfg.label}
          </span>
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF", border: "1px solid rgba(123,97,255,0.12)" }}
          >
            AI 深度分析
          </span>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <HookCard data={data.hook} />
          <StructureCard data={data.structure} />
          <EmotionCard data={data.emotion} />
          {cfg.showVisual && <VisualCard data={data.visual} />}
          <PerformanceCard data={data.performance} />
        </div>
      </div>
    </section>
  );
}

/* ─── Sub cards ─────────────────────────────────────────── */

function HookCard({ data }: { data: BreakdownData["hook"] }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: "rgba(123,97,255,0.08)" }}>
            <i className="ri-flashlight-line text-[13px]" style={{ color: "#7B61FF" }} />
          </div>
          <p className="text-[13px] font-bold" style={{ color: "#111111" }}>Hook（开头）</p>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(123,97,255,0.08)", color: "#7B61FF" }}
        >
          {data.type}
        </span>
      </div>
      <div
        className="rounded-xl p-3"
        style={{ background: "rgba(123,97,255,0.04)", border: "1px solid rgba(123,97,255,0.1)" }}
      >
        <p className="text-[13px] font-semibold leading-snug" style={{ color: "#111111" }}>
          &ldquo;{data.original}&rdquo;
        </p>
      </div>
      <p className="text-[12px] leading-relaxed" style={{ color: "#555555" }}>
        {data.explanation}
      </p>
      <div className="flex items-center gap-1.5 mt-auto">
        <i className="ri-magic-line text-[11px]" style={{ color: "#10b981" }} />
        <span className="text-[11px] font-medium" style={{ color: "#10b981" }}>效果强度：极高</span>
      </div>
    </div>
  );
}

function StructureCard({ data }: { data: BreakdownData["structure"] }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ background: "rgba(251,146,60,0.1)" }}>
          <i className="ri-layout-line text-[13px]" style={{ color: "#fb923c" }} />
        </div>
        <p className="text-[13px] font-bold" style={{ color: "#111111" }}>结构拆解</p>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((seg, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div
              className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5"
              style={{ background: `${seg.color}14`, color: seg.color }}
            >
              {seg.time}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[12px] font-semibold" style={{ color: "#111111" }}>{seg.label}</p>
              </div>
              <p className="text-[11px]" style={{ color: "#888888" }}>{seg.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmotionCard({ data }: { data: BreakdownData["emotion"] }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ background: "rgba(239,68,68,0.08)" }}>
          <i className="ri-emotion-line text-[13px]" style={{ color: "#ef4444" }} />
        </div>
        <p className="text-[13px] font-bold" style={{ color: "#111111" }}>情绪分析</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {data.tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.12)" }}
          >
            {tag}
          </span>
        ))}
      </div>
      {/* Intensity bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px]" style={{ color: "#888888" }}>情绪强度</span>
          <span className="text-[12px] font-bold" style={{ color: "#111111" }}>{data.intensity}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: "#F7F8FA" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${data.intensity}%`,
              background: "linear-gradient(90deg, #ef4444, #fb923c)",
            }}
          />
        </div>
      </div>
      <p className="text-[12px] leading-relaxed" style={{ color: "#555555" }}>
        {data.description}
      </p>
    </div>
  );
}

function VisualCard({ data }: { data: BreakdownData["visual"] }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ background: "rgba(59,130,246,0.08)" }}>
          <i className="ri-eye-line text-[13px]" style={{ color: "#3b82f6" }} />
        </div>
        <p className="text-[13px] font-bold" style={{ color: "#111111" }}>视觉模式</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-2.5" style={{ background: "#F7F8FA" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#AAAAAA" }}>构图</p>
          <p className="text-[12px] font-medium" style={{ color: "#111111" }}>{data.composition}</p>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: "#F7F8FA" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "#AAAAAA" }}>场景</p>
          <p className="text-[12px] font-medium" style={{ color: "#111111" }}>{data.scene}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {data.styleTag.map((tag) => (
          <span
            key={tag}
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "rgba(59,130,246,0.06)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.12)" }}
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="text-[12px] leading-relaxed" style={{ color: "#555555" }}>
        {data.description}
      </p>
    </div>
  );
}

function PerformanceCard({ data }: { data: BreakdownData["performance"] }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "#ffffff", border: "1px solid #EAEAEA" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ background: "rgba(16,185,129,0.08)" }}>
          <i className="ri-bar-chart-box-line text-[13px]" style={{ color: "#10b981" }} />
        </div>
        <p className="text-[13px] font-bold" style={{ color: "#111111" }}>表现分析</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "点赞", value: data.likes, icon: "ri-heart-3-line" },
          { label: "评论", value: data.comments, icon: "ri-chat-3-line" },
          { label: "分享", value: data.shares, icon: "ri-share-forward-line" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: "#F7F8FA" }}>
            <i className={`${s.icon} text-[13px]`} style={{ color: "#7B61FF" }} />
            <p className="text-[13px] font-bold mt-1" style={{ color: "#111111" }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: "#888888" }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {data.signals.map((sig) => (
          <div key={sig.label} className="flex items-start gap-2">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
              style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}
            >
              {sig.label}
            </span>
            <p className="text-[11px]" style={{ color: "#555555" }}>{sig.insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
