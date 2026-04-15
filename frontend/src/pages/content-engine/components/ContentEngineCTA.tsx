export default function ContentEngineCTA() {
  return (
    <section className="w-full px-6 py-10 lg:px-10">
      <div className="mx-auto" style={{ maxWidth: "1100px" }}>
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-[linear-gradient(135deg,#7B61FF_0%,#5B8CFF_100%)] p-8 lg:flex-row">
          <div>
            <h3 className="mb-2 text-[20px] font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>开始执行你的内容策略</h3>
            <p className="text-[14px] text-[rgba(255,255,255,0.75)]">内容已生成完毕，现在是行动的时候了。</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.15)] px-4 py-2.5 text-[13px] font-semibold text-white">
              <i className="ri-save-line mr-1.5 text-[13px]" />
              保存到历史记录
            </button>
            <button className="rounded-xl bg-white px-5 py-2.5 text-[13px] font-semibold text-[#7B61FF]">
              <i className="ri-stack-line mr-1.5 text-[13px]" />
              批量生成内容
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
