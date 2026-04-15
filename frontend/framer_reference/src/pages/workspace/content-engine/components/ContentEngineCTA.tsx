export default function ContentEngineCTA() {
  return (
    <section className="w-full px-6 lg:px-10 py-10">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        <div
          className="rounded-2xl p-8 flex flex-col lg:flex-row items-center justify-between gap-6"
          style={{ background: "linear-gradient(135deg, #7B61FF 0%, #5B8CFF 100%)" }}
        >
          <div>
            <h3 className="text-[20px] font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              开始执行你的内容策略
            </h3>
            <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.75)" }}>
              内容已生成完毕，现在是行动的时候了——批量生产，快速占领市场
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap"
              style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.22)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; }}
            >
              <i className="ri-save-line text-[13px]" />
              保存到历史记录
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap"
              style={{ background: "#ffffff", color: "#7B61FF" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.92"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <i className="ri-stack-line text-[13px]" />
              批量生成内容
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
