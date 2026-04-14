import { Navbar } from '../components/Navbar';
import { Container } from '../components/layout/Container';
import { Section } from '../components/layout/Section';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, ShoppingCart, Rocket, FileText } from 'lucide-react';

export function Product() {
  const { t } = useLanguage();
  const headingFont = { fontFamily: "'Syne', sans-serif" } as const;

  const capabilityRows = [
    {
      num: '01',
      title: '营销分析',
      desc: '从分散信号中判断需求、趋势与竞争，而不是停留在讨论层。',
      accentColor: '#fb923c',
      accentBg: 'rgba(251,146,60,0.08)',
      border: 'rgba(251,146,60,0.18)',
    },
    {
      num: '02',
      title: '内容制作',
      desc: '直接基于洞察生成选题与表达，而不是从零开始反复试错。',
      accentColor: '#7B61FF',
      accentBg: 'rgba(123,97,255,0.08)',
      border: 'rgba(123,97,255,0.18)',
    },
    {
      num: '03',
      title: '商品分析',
      desc: '把商品页与评论转成优化建议，而不是凭经验调整。',
      accentColor: '#0ea5e9',
      accentBg: 'rgba(14,165,233,0.08)',
      border: 'rgba(14,165,233,0.18)',
    },
    {
      num: '04',
      title: '工作流沉淀',
      desc: '所有分析、结论与动作留在同一系统里，而不是散落在工具与文档中。',
      accentColor: '#8b5cf6',
      accentBg: 'rgba(139,92,246,0.08)',
      border: 'rgba(139,92,246,0.18)',
    },
  ];

  const useCases = [
    { category: '电商出海', icon: ShoppingCart, title: '出海品牌与运营', points: [t('product.feature1.f1'), t('product.feature1.f2')], metric: '增长动作协同推进', color: '#fb923c' },
    { category: '产品增长', icon: Rocket, title: '卖家与商品团队', points: [t('product.feature2.f1'), t('product.feature2.f2')], metric: '转化目标持续优化', color: '#7B61FF' },
    { category: '内容营销', icon: FileText, title: '内容团队与创作者', points: [t('product.feature3.f1'), t('product.feature3.f2')], metric: '选题与表达持续产出', color: '#0ea5e9' },
  ];

  const marketingMock = (
    <div className="space-y-2.5">
      <div className="mb-4 text-[10.5px] font-bold uppercase tracking-widest" style={{ color: '#fb923c' }}>
        信号整合 · 需求判断输出
      </div>
      {[
        { label: '用户对退款流程的不满持续上升', source: '社交平台', strength: 92 },
        { label: '"无线充电"需求在 Q4 搜索量增长 38%', source: '搜索趋势', strength: 85 },
        { label: '竞品在高端市场存在明显供给空白', source: '竞品分析', strength: 78 },
        { label: '移动端购物车放弃率高于桌面端 41%', source: '电商数据', strength: 71 },
      ].map((row, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl p-3.5" style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.15)' }}>
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[12.5px] leading-snug text-[#444444]">{row.label}</p>
            <span className="rounded-full bg-[#F7F8FA] px-2 py-0.5 text-[10px] text-[#888888]">{row.source}</span>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-[13px] font-bold" style={{ color: '#fb923c' }}>{row.strength}%</span>
            <div className="h-1.5 w-16 rounded-full bg-[#EAEAEA]">
              <div className="h-full rounded-full" style={{ width: `${row.strength}%`, background: '#fb923c' }} />
            </div>
          </div>
        </div>
      ))}
      <div className="mt-1 flex items-center gap-2 rounded-xl bg-[#F7F8FA] px-3 py-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="text-[11.5px] text-[#888888]">已识别 4 个可判断信号，2 个竞争空白</span>
      </div>
    </div>
  );

  const contentMock = (
    <div className="space-y-3">
      <div className="mb-4 text-[10.5px] font-bold uppercase tracking-widest" style={{ color: '#7B61FF' }}>
        内容方向 · 基于洞察生成
      </div>
      {[
        { type: '痛点驱动', title: '用户在等什么？这 3 个真实痛点是你内容的入口', tags: ['高转化', 'UGC 友好'] },
        { type: '趋势借势', title: 'Q4 最值得押注的内容形式：短视频 vs 图文对比', tags: ['时效性强', '适合矩阵'] },
        { type: '竞品切入', title: '他们在说什么你没说？从竞品评论中找到内容空白', tags: ['差异化', '可复用'] },
      ].map((item, i) => (
        <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(123,97,255,0.05)', border: '1px solid rgba(123,97,255,0.15)' }}>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#7B61FF', opacity: 0.7 }}>
              {item.type}
            </span>
          </div>
          <p className="mb-3 text-[12.5px] leading-snug text-[#444444]">{item.title}</p>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'rgba(123,97,255,0.08)', color: '#7B61FF', border: '1px solid rgba(123,97,255,0.18)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const productMock = (
    <div className="space-y-3">
      <div className="mb-4 text-[10.5px] font-bold uppercase tracking-widest" style={{ color: '#0ea5e9' }}>
        商品分析 · 可执行优化建议
      </div>
      <div className="overflow-hidden rounded-xl border border-[#EAEAEA]">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(239,68,68,0.1)', background: 'rgba(239,68,68,0.04)' }}>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: '#ef4444', opacity: 0.7 }}>
            当前标题
          </p>
          <p className="text-[12.5px] text-[#AAAAAA] line-through">Wireless Earbuds Bluetooth 5.0 Headphones TWS</p>
        </div>
        <div className="px-4 py-3" style={{ background: 'rgba(5,150,105,0.04)' }}>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#059669]">优化建议</p>
          <p className="text-[12.5px] font-medium text-[#111111]">无线耳机 2024升级版 — 48H续航 主动降噪 USB-C快充</p>
          <span className="mt-1.5 inline-block text-[11px] font-bold text-[#059669]">CTR 8.7% ↑ +278%</span>
        </div>
      </div>
      {[
        { label: '主图背景影响首屏点击', status: '建议更换', ok: false },
        { label: '卖点顺序不符合决策路径', status: '已重新排序', ok: true },
        { label: '差评关键词未在描述中回应', status: '发现 3 项', ok: false },
      ].map((row) => (
        <div key={row.label} className="flex items-center justify-between rounded-xl border border-[#EAEAEA] bg-[#F7F8FA] px-3.5 py-2.5">
          <span className="text-[12px] text-[#444444]">{row.label}</span>
          <span className="text-[11px] font-semibold" style={{ color: row.ok ? '#059669' : '#f59e0b' }}>
            {row.status}
          </span>
        </div>
      ))}
    </div>
  );

  const workflowMock = (
    <div className="space-y-2.5">
      <div className="mb-4 text-[10.5px] font-bold uppercase tracking-widest" style={{ color: '#8b5cf6' }}>
        历史记录 · 持续迭代
      </div>
      {[
        { title: 'Q4 无线耳机市场分析', meta: '2小时前 · 营销分析', badge: '已完成', badgeColor: '#059669' },
        { title: 'TikTok 出海选题库 · 32条方向', meta: '昨天 · 内容制作', badge: '进行中', badgeColor: '#f59e0b' },
        { title: '蓝牙音箱系列商品优化', meta: '3天前 · 商品分析', badge: '已完成', badgeColor: '#059669' },
        { title: '竞品空白机会报告 v2', meta: '上周 · 营销分析', badge: '待处理', badgeColor: '#888888' },
      ].map((item, i) => (
        <div key={i} className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition-all duration-150" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}>
          <div className="h-8 w-8 shrink-0 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)' }} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-[#444444]">{item.title}</p>
            <p className="text-[11px] text-[#888888]">{item.meta}</p>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: `${item.badgeColor}12`, color: item.badgeColor, border: `1px solid ${item.badgeColor}30` }}>
            {item.badge}
          </span>
        </div>
      ))}
    </div>
  );

  const splitSections = [
    {
      tag: '营销分析',
      tagColor: '#fb923c',
      tagBg: 'rgba(251,146,60,0.08)',
      accentColor: '#fb923c',
      title: '你看到的是热闹，\n还是机会？',
      desc: '大多数团队能看到讨论，却无法判断哪些信号值得投入。GlobalPulseAI 整合多平台数据，直接输出需求、趋势与竞争空白，帮你做出判断，而不是收集信息。',
      mock: marketingMock,
    },
    {
      tag: '内容制作',
      tagColor: '#7B61FF',
      tagBg: 'rgba(123,97,255,0.08)',
      accentColor: '#7B61FF',
      title: '不是缺内容，\n而是不知道该做什么内容',
      desc: '从真实需求出发，生成可执行的选题与表达，让内容生产不再依赖灵感，而是有依据地推进。',
      mock: contentMock,
    },
    {
      tag: '商品分析',
      tagColor: '#0ea5e9',
      tagBg: 'rgba(14,165,233,0.08)',
      accentColor: '#0ea5e9',
      title: '商品问题，往往不在\n你以为的地方',
      desc: '从标题、主图到评论结构，拆解影响转化的关键因素，给出可以直接执行的优化建议，而不是模糊方向。',
      mock: productMock,
    },
    {
      tag: '工作流沉淀',
      tagColor: '#8b5cf6',
      tagBg: 'rgba(139,92,246,0.08)',
      accentColor: '#8b5cf6',
      title: '增长不是一次分析，\n而是持续迭代',
      desc: '历史分析、内容方向与优化动作全部沉淀在同一个工作台里，支持团队持续优化，而不是每次重新开始。',
      mock: workflowMock,
    },
  ];

  const outputCards = [
    { title: '市场洞察输出', detail: t('product.feature1.desc'), status: '实时同步', color: '#fb923c' },
    { title: '内容方向输出', detail: t('product.feature2.desc'), status: 'AI 生成', color: '#7B61FF' },
    { title: '商品建议输出', detail: t('product.feature3.desc'), status: '可执行建议', color: '#0ea5e9' },
    { title: '执行动作输出', detail: t('product.feature4.desc'), status: '自动归档', color: '#8b5cf6' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="h-1 bg-gradient-to-r from-violet-600 to-blue-500" />
        <section className="border-b border-[#EAEAEA] bg-white">
          <Container className="max-w-[820px] px-6 lg:px-10 pt-36 pb-20 text-center">
            <span className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5" style={{ background: 'rgba(123,97,255,0.07)', border: '1px solid rgba(123,97,255,0.2)' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[12px] font-medium tracking-wide text-[#7B61FF]">产品介绍 · GlobalPulseAI</span>
            </span>
            <h1
              className="mx-auto mb-6 max-w-[700px] text-[clamp(34px,4.8vw,58px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#111111]"
              style={headingFont}
            >
              <span className="block">大多数团队卡在分析之后</span>
              <span className="mx-auto mt-1 block max-w-[560px] bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
                GlobalPulseAI 让增长继续发生
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-[580px] text-[clamp(15px,1.15vw,17px)] leading-[1.85] text-[#888888]">
              把市场判断、内容生产、商品优化与执行承接放进同一套工作流，不再停在"看懂"，而是直接推进下一步增长。
            </p>
            <div className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => (window.location.href = '/workspace')}
                className="inline-flex items-center gap-2 whitespace-nowrap text-[15px] font-semibold text-white transition-all duration-200 hover:opacity-90"
                style={{ padding: '13px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #7B61FF, #5B8CFF)' }}
              >
                {t('product.cta.button')}
                <ArrowRight className="h-[14px] w-[14px]" />
              </button>
              <button
                onClick={() => (window.location.href = '/pricing')}
                className="inline-flex items-center gap-2 whitespace-nowrap text-[15px] font-medium text-[#444444] transition-all duration-200 hover:text-[#111111]"
                style={{ padding: '13px 28px', borderRadius: '10px', border: '1px solid #EAEAEA', background: '#ffffff' }}
              >
                查看定价
                <ArrowRight className="h-[13px] w-[13px]" />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {[
                { label: '营销分析', color: '#fb923c', bg: 'rgba(251,146,60,0.08)' },
                { label: '内容制作', color: '#7B61FF', bg: 'rgba(123,97,255,0.08)' },
                { label: '商品分析', color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
                { label: '工作流沉淀', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
              ].map((pill) => (
                <span key={pill.label} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-[14px] py-[6px] text-[12px] font-medium" style={{ background: pill.bg, border: `1px solid ${pill.color}22`, color: pill.color }}>
                  {pill.label}
                </span>
              ))}
            </div>
          </Container>
        </section>

        <Section className="border-b border-[#EAEAEA] bg-[#F7F8FA] py-28 lg:py-36">
          <Container className="max-w-[1100px] px-6 lg:px-10 py-24 lg:py-32">
            <div className="flex flex-col lg:flex-row lg:gap-24">
              <div className="mb-12 shrink-0 lg:mb-0 lg:w-64">
                <span className="mb-4 inline-block rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#7B61FF', background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.18)' }}>
                  产品能力
                </span>
                <h2 className="mb-5 text-[clamp(20px,2.2vw,28px)] font-bold leading-[1.2] tracking-[-0.02em] text-[#111111]" style={headingFont}>
                  不是更多工具，
                  <br />
                  而是一条跑通的
                  <br />
                  增长链路
                </h2>
                <p className="text-[13.5px] leading-[1.8] text-[#888888]">
                  大多数团队把市场分析、内容制作和商品优化拆开做，结果是信息割裂、决策滞后、执行断层。
                </p>
                <p className="mt-3 text-[13.5px] leading-[1.8] text-[#888888]">
                  GlobalPulseAI 把这四个关键环节，收敛到同一个工作台里。
                </p>
              </div>

              <div className="flex-1">
                {capabilityRows.map((cap) => (
                  <div key={cap.num} className="group flex items-start gap-8 py-7 transition-all duration-200" style={{ borderTop: '1px solid #EAEAEA' }}>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg pt-0.5 font-mono text-[12px] font-bold"
                      style={{ background: cap.accentBg, color: cap.accentColor, border: `1px solid ${cap.border}`, minWidth: '32px' }}
                    >
                      {cap.num}
                    </span>
                    <div className="flex-1">
                      <h3 className="mb-2.5 text-[16px] font-semibold text-[#111111]">{cap.title}</h3>
                      <p className="text-[14.5px] leading-[1.75] text-[#888888]">
                        {cap.desc.split('而不是').map((part, i) =>
                          i === 0 ? <span key={i}>{part}</span> : <span key={i}><span style={{ color: '#CCCCCC' }}>而不是{part}</span></span>,
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #EAEAEA' }} />
              </div>
            </div>
          </Container>
        </Section>

        <div>
          {splitSections.map((section, index) => {
            const isEven = index % 2 === 0;
            return (
              <section
                key={section.tag}
                className="relative w-full overflow-hidden"
                style={{ borderBottom: '1px solid #EAEAEA', background: isEven ? '#ffffff' : '#F7F8FA' }}
              >
                <Container className="max-w-[1100px] px-6 lg:px-10 py-24 lg:py-32">
                  <div className={`flex flex-col items-start gap-16 lg:gap-20 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                    <div className="w-full shrink-0 lg:w-[40%]">
                      <span
                        className="mb-5 inline-block rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: section.tagColor, background: section.tagBg, border: `1px solid ${section.tagColor}28` }}
                      >
                        {section.tag}
                      </span>
                      <h2 className="mb-5 whitespace-pre-line text-[clamp(22px,2.4vw,32px)] font-bold leading-[1.2] tracking-[-0.02em] text-[#111111]" style={headingFont}>
                        {section.title}
                      </h2>
                      <p className="max-w-[380px] text-[15px] leading-[1.85] text-[#888888]">
                        {section.desc.split('而不是').map((part, i) =>
                          i === 0 ? <span key={i}>{part}</span> : <span key={i}><span style={{ color: '#CCCCCC' }}>而不是{part}</span></span>,
                        )}
                      </p>
                    </div>

                    <div className="w-full lg:flex-1">
                      <div className="relative overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white">
                        <div className="relative flex items-center gap-2 border-b border-[#F0F0F0] bg-[#FAFAFA] px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.5)' }} />
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(234,179,8,0.5)' }} />
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(34,197,94,0.5)' }} />
                          </div>
                          <span className="ml-2 text-[11px] font-medium" style={{ color: section.tagColor }}>
                            {section.tag}
                          </span>
                          <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: section.tagColor, background: `${section.accentColor}12`, border: `1px solid ${section.accentColor}25` }}>
                            ● Live
                          </span>
                        </div>
                        <div className="relative p-5 lg:p-6">{section.mock}</div>
                      </div>
                    </div>
                  </div>
                </Container>
              </section>
            );
          })}
        </div>

        <section className="relative w-full overflow-hidden" style={{ background: '#ffffff', borderBottom: '1px solid #EAEAEA' }}>
          <Container className="max-w-[1100px] px-6 lg:px-10 py-24 lg:py-32">
            <div className="flex flex-col lg:flex-row lg:gap-24">
              <div className="mb-10 shrink-0 lg:mb-0 lg:w-64">
                <span className="mb-4 inline-block rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#7B61FF', background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.18)' }}>
                  工作流程
                </span>
                <h2 className="text-[clamp(20px,2.2vw,28px)] font-bold leading-[1.2] tracking-[-0.02em] text-[#111111]" style={headingFont}>
                  不是一次分析，
                  <br />
                  而是一套可复用
                  <br />
                  的方法
                </h2>
              </div>
              <div className="flex flex-1 flex-col gap-0">
                {[
                  { num: '1', title: '输入你的市场、内容或商品问题', desc: '可以是方向、链接或已有素材，而不是固定格式的关键词。', accentColor: '#fb923c', accentBg: 'rgba(251,146,60,0.08)' },
                  { num: '2', title: '系统整合多来源信号并完成结构化分析', desc: '自动对齐不同来源数据，输出可判断的结论，而不是信息堆叠。', accentColor: '#7B61FF', accentBg: 'rgba(123,97,255,0.08)' },
                  { num: '3', title: '直接得到可执行的内容、商品与下一步动作', desc: '不是分析报告，而是可以立即使用的方向与优化建议。', accentColor: '#059669', accentBg: 'rgba(5,150,105,0.08)' },
                ].map((step) => (
                  <div key={step.num} className="flex items-start gap-6 py-8" style={{ borderTop: '1px solid #EAEAEA' }}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold" style={{ background: step.accentBg, color: step.accentColor, border: `1px solid ${step.accentColor}25`, fontFamily: "'Syne', sans-serif" }}>
                      {step.num}
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="mb-2 text-[16px] font-semibold text-[#111111]">{step.title}</h3>
                      <p className="text-[14.5px] leading-[1.75] text-[#888888]">
                        {step.desc.split('而不是').map((part, i) =>
                          i === 0 ? <span key={i}>{part}</span> : <span key={i}><span style={{ color: '#CCCCCC' }}>而不是{part}</span></span>,
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #EAEAEA' }} />
              </div>
            </div>
          </Container>
        </section>

        <section className="relative w-full overflow-hidden" style={{ background: '#F7F8FA', borderBottom: '1px solid #EAEAEA' }}>
          <Container className="max-w-[1100px] px-6 lg:px-10 py-24 lg:py-32">
            <div className="flex flex-col items-start gap-16 lg:flex-row lg:gap-20">
              <div className="w-full shrink-0 lg:w-[40%]">
                <span className="mb-5 inline-block rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#7B61FF', background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.18)' }}>
                  分析结果
                </span>
                <h2 className="mb-5 text-[clamp(22px,2.4vw,32px)] font-bold leading-[1.2] tracking-[-0.02em] text-[#111111]" style={headingFont}>
                  你拿到的不是报告，
                  <br />
                  而是可以直接用的结果
                </h2>
                <p className="max-w-[340px] text-[15px] leading-[1.8] text-[#888888]">不是决策参考，而是决策本身和下一步动作。</p>
                <div className="mt-8 flex flex-col gap-5">
                  {outputCards.map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                      <div>
                        <p className="mb-0.5 text-[14px] font-semibold text-[#111111]">{item.title.replace('输出', '')}</p>
                        <p className="text-[13px] leading-[1.65] text-[#888888]">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full lg:flex-1">
                <div className="overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white">
                  <div className="flex items-center gap-2 border-b border-[#F0F0F0] bg-[#FAFAFA] px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.5)' }} />
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(234,179,8,0.5)' }} />
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(34,197,94,0.5)' }} />
                    </div>
                    <span className="ml-2 text-[11px] font-medium text-[#7B61FF]">分析输出</span>
                    <span className="ml-auto rounded-full border border-[rgba(5,150,105,0.2)] bg-[rgba(5,150,105,0.08)] px-2 py-0.5 text-[10px] font-bold text-[#059669]">● 已完成</span>
                  </div>
                  <div className="space-y-2.5 p-5 lg:p-6">
                    <div className="mb-4 text-[10.5px] font-bold uppercase tracking-widest text-[#AAAAAA]">本次分析输出 · 可直接使用</div>
                    {outputCards.map((item, i) => (
                      <div key={item.title} className="flex items-start gap-4 rounded-xl px-4 py-3.5" style={{ background: `${item.color}12`, border: `1px solid ${item.color}20` }}>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold" style={{ background: `${item.color}20`, color: item.color, fontFamily: "'Syne', sans-serif" }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="mb-0.5 text-[13px] font-semibold text-[#111111]">{item.title.replace('输出', '')}</p>
                          <p className="text-[12px] leading-[1.6] text-[#888888]">{item.detail}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10.5px] text-[#059669]">已生成</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="relative w-full overflow-hidden" style={{ background: '#ffffff', borderBottom: '1px solid #EAEAEA' }}>
          <Container className="max-w-[1100px] px-6 lg:px-10 py-24 lg:py-32">
            <div className="mb-14 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <span className="mb-4 inline-block rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#7B61FF', background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.18)' }}>
                  应用场景
                </span>
                <h2 className="text-[clamp(22px,2.4vw,32px)] font-bold leading-[1.2] tracking-[-0.02em] text-[#111111]" style={headingFont}>
                  适用于需要增长结果的团队
                </h2>
              </div>
              <button className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-[14px] font-medium text-[#888888] transition-all duration-200 hover:text-[#111111]">
                查看全部案例
                <ArrowRight className="h-[13px] w-[13px]" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {useCases.map((item) => (
                <div key={item.title} className="group relative flex cursor-pointer flex-col gap-4 rounded-2xl border border-[#EAEAEA] bg-white p-6 transition-all duration-300 hover:-translate-y-1">
                  <div className="relative">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${item.color}12`, border: `1px solid ${item.color}22` }}>
                        <item.icon className="h-[17px] w-[17px]" style={{ color: item.color }} />
                      </div>
                      <span className="text-[10.5px] font-bold uppercase tracking-widest" style={{ color: item.color }}>{item.category}</span>
                    </div>
                    <h3 className="mb-2 text-[17px] font-semibold leading-snug text-[#111111]">{item.title}</h3>
                    <p className="text-[13.5px] leading-[1.75] text-[#888888]">{item.points[0]}，{item.points[1]}</p>
                    <div className="mt-4 flex items-center gap-2 pt-4" style={{ borderTop: `1px solid ${item.color}15` }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[12.5px] font-semibold text-[#059669]">{item.metric}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

      </main>
    </div>
  );
}
