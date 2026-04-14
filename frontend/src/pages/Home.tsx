import { useEffect, useState, type ComponentType, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Compass,
  Lightbulb,
  MessagesSquare,
  PenSquare,
  Sparkle,
  ShoppingBag,
  Users,
  Workflow,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Container } from '../components/layout/Container';
import { Section } from '../components/layout/Section';
import { useLanguage } from '../contexts/LanguageContext';

type Capability = {
  title: string;
  subtitle: string;
  desc: string;
  points: string[];
  result: string;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
};

type TeamUseCase = {
  title: string;
  desc: string;
  outcomes: string[];
};

type HeroTabKey = 'market' | 'content' | 'product' | 'workflow';

const primaryBtnClass =
  'inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-7 text-sm font-semibold text-white transition-opacity hover:opacity-90';
const secondaryBtnClass =
  'inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-7 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-400 hover:bg-gray-50';
const homeHeadingStyle = { fontFamily: "'Syne', sans-serif" } as const;

type OutputPanel = {
  title: string;
  metric: string;
  badge: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  rows: { label: string; detail: string; value: string }[];
  footer: string;
};

export default function Home() {
  const { language, t } = useLanguage();
  const isZh = language === 'zh';
  const [activeHeroTab, setActiveHeroTab] = useState<HeroTabKey>('market');
  const [cursorBlink, setCursorBlink] = useState(true);
  const [panelVisible, setPanelVisible] = useState(true);

  useEffect(() => {
    const cursorTimer = setInterval(() => setCursorBlink((v) => !v), 530);
    return () => clearInterval(cursorTimer);
  }, []);

  useEffect(() => {
    const tabKeys: HeroTabKey[] = ['market', 'content', 'product', 'workflow'];
    let idx = 0;
    const tabTimer = setInterval(() => {
      idx = (idx + 1) % tabKeys.length;
      setActiveHeroTab(tabKeys[idx]);
    }, 4000);
    return () => clearInterval(tabTimer);
  }, []);

  useEffect(() => {
    setPanelVisible(false);
    const timer = setTimeout(() => setPanelVisible(true), 120);
    return () => clearTimeout(timer);
  }, [activeHeroTab]);

  console.log('[HOME_RENDER_START]');
  console.log('[HOME_SECTION] hero');
  console.log('[HOME_SECTION] capabilities');
  console.log('[HOME_SECTION] workflow');
  console.log('[HOME_SECTION] outputs');
  console.log('[HOME_SECTION] audience');
  console.log('[HOME_SECTION] cta');

  const capabilities: Capability[] = [
    {
      title: isZh ? '营销分析' : 'Marketing Intelligence',
      subtitle: isZh ? '把分散信号整合成判断' : 'Unify scattered signals into judgment',
      desc: isZh
        ? `${t('home.capabilities.l1')} 从趋势变化到用户反馈，系统会自动聚合并排序关键变量，让你知道该先打哪一仗。`
        : `${t('home.capabilities.l1')} From trend shifts to user feedback, the system clusters and prioritizes key variables so teams know what to execute first.`,
      points: isZh
        ? ['实时需求趋势追踪', '痛点聚类与优先级', '竞品空白识别', '跨平台情报统一视图']
        : ['Real-time demand tracking', 'Pain-point clustering', 'Competitive gap detection', 'Unified cross-channel intelligence'],
      result: isZh ? '每日处理 10,000+ 条市场信号' : '10,000+ market signals processed daily',
      iconColor: '#fb923c',
      iconBg: 'rgba(251,146,60,0.1)',
      borderColor: 'rgba(251,146,60,0.2)',
      icon: BarChart3,
    },
    {
      title: isZh ? '内容制作' : 'Content Production',
      subtitle: isZh ? '把洞察转成内容动作' : 'Turn insights into content moves',
      desc: isZh
        ? `${t('home.capabilities.l2')} 每条方向都绑定来源信号与场景意图，减少拍脑袋选题，让内容生产更稳定。`
        : `${t('home.capabilities.l2')} Each direction is grounded in source signals and intent context, replacing guesswork with repeatable content production.`,
      points: isZh
        ? ['选题与钩子生成', '多平台表达适配', '可执行脚本输出', '内容方向自动编排']
        : ['Angles and hooks', 'Cross-platform adaptation', 'Executable scripts', 'Automated direction planning'],
      result: isZh ? '内容产出效率提升 10 倍' : '10x faster content production',
      iconColor: '#7B61FF',
      iconBg: 'rgba(123,97,255,0.1)',
      borderColor: 'rgba(123,97,255,0.2)',
      icon: PenSquare,
    },
    {
      title: isZh ? '商品分析' : 'Product Analysis',
      subtitle: isZh ? '把页面问题变成优化建议' : 'Convert listing friction into optimization',
      desc: isZh
        ? `${t('home.capabilities.l3')} 从标题、评论到卖点表达形成完整优化闭环，直接服务于点击率和转化率提升。`
        : `${t('home.capabilities.l3')} Build a full optimization loop across title, reviews, and value messaging to drive higher click-through and conversion.`,
      points: isZh
        ? ['标题与卖点重写', '评论反馈提炼', '转化因素拆解', 'A/B 变体建议']
        : ['Title and selling-point rewrite', 'Review signal extraction', 'Conversion-factor breakdown', 'A/B variant suggestions'],
      result: isZh ? '平均 CTR 提升幅度 67%' : 'Average CTR uplift of 67%',
      iconColor: '#0ea5e9',
      iconBg: 'rgba(14,165,233,0.1)',
      borderColor: 'rgba(14,165,233,0.2)',
      icon: ShoppingBag,
    },
    {
      title: isZh ? '工作流沉淀' : 'Workflow Continuity',
      subtitle: isZh ? '把结论留在同一工作台' : 'Keep outcomes in one workspace',
      desc: isZh
        ? `${t('home.capabilities.l4')} 每次分析自动归档并关联后续动作，团队切换成员时也能完整延续上下文。`
        : `${t('home.capabilities.l4')} Every analysis is archived with linked next actions, so execution context survives handoffs across the team.`,
      points: isZh
        ? ['分析报告自动留存', '下一步动作承接', '团队上下文共享', '历史结论可回溯']
        : ['Automatic report retention', 'Next-step handoff', 'Shared team context', 'Traceable history'],
      result: isZh ? '告别重复执行相同分析' : 'No more repeated analysis loops',
      iconColor: '#8b5cf6',
      iconBg: 'rgba(139,92,246,0.1)',
      borderColor: 'rgba(139,92,246,0.2)',
      icon: Workflow,
    },
  ];

  const flowSteps = [
    {
      step: '01',
      title: t('home.step1'),
      desc: isZh
        ? '用自然语言输入市场、内容或商品问题，先把问题范围说清楚。'
        : 'Start with a natural-language question on market, content, or product.',
      sub: isZh ? '市场 · 内容 · 商品' : 'Market · Content · Product',
      examples: isZh ? ['分析跨境耳机市场需求', '生成 TikTok 爆款选题'] : ['Analyze earbud demand', 'Generate TikTok hooks'],
      icon: Compass,
      iconBg: 'from-violet-600 to-blue-500',
      accentColor: '#7B61FF',
    },
    {
      step: '02',
      title: t('home.step2'),
      desc: isZh
        ? '系统联动多来源信号完成分析，给出结构化洞察而非零散结论。'
        : 'The system synthesizes multi-source signals into structured insights.',
      sub: isZh ? 'AI 分析层' : 'AI analysis layer',
      examples: isZh ? ['Reddit 情绪分析', 'Amazon 评论挖掘'] : ['Reddit sentiment', 'Amazon review mining'],
      icon: MessagesSquare,
      iconBg: 'from-cyan-500 to-sky-600',
      accentColor: '#0ea5e9',
    },
    {
      step: '03',
      title: t('home.step3'),
      desc: isZh
        ? '输出可执行内容、商品建议与下一步动作，并沉淀到工作流。'
        : 'Outputs become actionable content, product moves, and tracked next steps.',
      sub: isZh ? '内容 · 商品 · 下一步' : 'Content · Product · Next actions',
      examples: isZh ? ['内容脚本与钩子', '执行清单沉淀'] : ['Scripts and hooks', 'Action queue handoff'],
      icon: BookOpenCheck,
      iconBg: 'from-emerald-500 to-teal-600',
      accentColor: '#059669',
    },
  ];

  const outputPanels: OutputPanel[] = [
    {
      title: isZh ? '市场洞察' : 'Market Insight',
      metric: isZh ? '高优先级信号 3 条' : '3 high-priority signals',
      badge: isZh ? '实时数据' : 'Live data',
      icon: BarChart3,
      accentColor: '#fb923c',
      badgeBg: 'rgba(251,146,60,0.08)',
      badgeBorder: 'rgba(251,146,60,0.2)',
      rows: [
        {
          label: isZh ? '退款延迟导致复购下滑' : 'Refund delay hurts repeat purchases',
          detail: 'Reddit',
          value: '+340%',
        },
        {
          label: isZh ? '物流时效不明导致弃单' : 'Unclear shipping windows increase drop-off',
          detail: 'Reviews',
          value: '+218%',
        },
      ],
      footer: isZh ? '2 分钟前更新' : 'Updated 2 minutes ago',
    },
    {
      title: isZh ? '内容方向' : 'Content Direction',
      metric: isZh ? '本周可发选题 6 条' : '6 publish-ready topics',
      badge: isZh ? 'AI 生成' : 'AI generated',
      icon: Sparkle,
      accentColor: '#7B61FF',
      badgeBg: 'rgba(123,97,255,0.08)',
      badgeBorder: 'rgba(123,97,255,0.2)',
      rows: [
        {
          label: isZh ? '围绕“时效焦虑”做对比型短视频' : 'Run delivery-anxiety comparison shorts',
          detail: isZh ? '方向 #1' : 'Direction #1',
          value: isZh ? '18K-32K 播放' : '18K-32K views',
        },
        {
          label: isZh ? '评论驱动标题拆解内容' : 'Review-driven title teardown',
          detail: isZh ? '方向 #2' : 'Direction #2',
          value: isZh ? '24K-44K 播放' : '24K-44K views',
        },
      ],
      footer: isZh ? '可直接复制并二次生成' : 'Copy-ready with regeneration',
    },
    {
      title: isZh ? '商品建议' : 'Product Suggestions',
      metric: isZh ? '标题优化潜力 +22%' : '+22% title uplift potential',
      badge: isZh ? '优化建议' : 'Optimization',
      icon: ShoppingBag,
      accentColor: '#0ea5e9',
      badgeBg: 'rgba(14,165,233,0.08)',
      badgeBorder: 'rgba(14,165,233,0.2)',
      rows: [
        {
          label: isZh ? '主标题加入“48H续航 + 快充”' : 'Add “48h battery + fast charge” in title',
          detail: isZh ? '标题重写' : 'Title rewrite',
          value: '+22%',
        },
        {
          label: isZh ? '主图突出“降噪 + 续航”' : 'Hero image highlights ANC + battery',
          detail: isZh ? '主图优化' : 'Image optimization',
          value: '+12%',
        },
      ],
      footer: isZh ? '转化因素拆解完成' : 'Conversion factors resolved',
    },
    {
      title: isZh ? '动作建议' : 'Action Handoff',
      metric: isZh ? '下一步动作 4 项' : '4 next actions queued',
      badge: isZh ? '自动归档' : 'Auto archived',
      icon: Workflow,
      accentColor: '#8b5cf6',
      badgeBg: 'rgba(139,92,246,0.08)',
      badgeBorder: 'rgba(139,92,246,0.2)',
      rows: [
        {
          label: isZh ? '内容脚本与标题优化进入执行队列' : 'Scripts and title optimization queued',
          detail: isZh ? '优先级 P1' : 'Priority P1',
          value: isZh ? '就绪' : 'Ready',
        },
        {
          label: isZh ? '分析报告已同步到工作台历史' : 'Report synced to workspace history',
          detail: isZh ? '归档状态' : 'Archive status',
          value: isZh ? '已存档' : 'Archived',
        },
      ],
      footer: isZh ? '可随时回溯并继续推进' : 'Traceable and resumable anytime',
    },
  ];

  const teamUseCases: (TeamUseCase & {
    icon: ComponentType<{ className?: string; style?: CSSProperties }>;
    accentColor: string;
    metric: string;
    tag: string;
  })[] = [
    {
      title: isZh ? '出海品牌与运营团队' : 'Global brand and ops teams',
      desc: isZh
        ? '把市场变化、内容方向与商品迭代放到同一节奏中，减少跨职能沟通损耗。'
        : 'Align market shifts, content direction, and listing iteration in one cadence.',
      outcomes: isZh ? ['跨平台情报统一视图', '每周增长动作清单'] : ['Unified cross-channel signal view', 'Weekly growth action list'],
      icon: Users,
      accentColor: '#7B61FF',
      metric: isZh ? '协作效率提升 2.4 倍' : '2.4x collaboration efficiency',
      tag: isZh ? '品牌增长' : 'Brand growth',
    },
    {
      title: isZh ? '卖家与商品团队' : 'Sellers and product teams',
      desc: isZh
        ? '围绕转化目标持续优化标题、卖点和页面表达，把分析变成可验证改动。'
        : 'Iterate titles, selling points, and page expression toward conversion targets.',
      outcomes: isZh ? ['商品问题优先级排序', '可复用商品优化范式'] : ['Prioritized listing issues', 'Reusable listing optimization patterns'],
      icon: ShoppingBag,
      accentColor: '#0ea5e9',
      metric: isZh ? '平均 CTR 提升 67%' : 'Average CTR +67%',
      tag: isZh ? '商品优化' : 'Listing optimization',
    },
    {
      title: isZh ? '内容团队与创作者' : 'Content teams and creators',
      desc: isZh
        ? '基于真实需求与反馈生产内容，不再靠猜测选题，提高内容命中与复用效率。'
        : 'Produce content from real demand and feedback, not isolated intuition.',
      outcomes: isZh ? ['持续内容选题管线', '数据支撑的表达角度'] : ['Sustained topic pipeline', 'Data-backed messaging angles'],
      icon: Lightbulb,
      accentColor: '#059669',
      metric: isZh ? '内容产出效率提升 10 倍' : '10x content throughput',
      tag: isZh ? '内容增长' : 'Content growth',
    },
  ];

  const stats = [
    { value: '2,000+', label: isZh ? '团队正在使用' : 'active teams' },
    { value: '50M+', label: isZh ? '信号已分析' : 'signals analyzed' },
    { value: '94%', label: isZh ? '洞察准确率' : 'insight accuracy' },
    { value: '< 3m', label: isZh ? '平均输出时间' : 'avg output time' },
  ];

  const heroTabs: { key: HeroTabKey; labelZh: string; labelEn: string; color: string; bgColor: string; borderColor: string }[] = [
    {
      key: 'market',
      labelZh: '营销分析',
      labelEn: 'Market',
      color: '#fb923c',
      bgColor: 'rgba(251,146,60,0.1)',
      borderColor: 'rgba(251,146,60,0.2)',
    },
    {
      key: 'content',
      labelZh: '内容制作',
      labelEn: 'Content',
      color: '#7B61FF',
      bgColor: 'rgba(123,97,255,0.1)',
      borderColor: 'rgba(123,97,255,0.2)',
    },
    {
      key: 'product',
      labelZh: '商品分析',
      labelEn: 'Product',
      color: '#0ea5e9',
      bgColor: 'rgba(14,165,233,0.1)',
      borderColor: 'rgba(14,165,233,0.2)',
    },
    {
      key: 'workflow',
      labelZh: '工作流',
      labelEn: 'Workflow',
      color: '#8b5cf6',
      bgColor: 'rgba(139,92,246,0.1)',
      borderColor: 'rgba(139,92,246,0.2)',
    },
  ];

  const heroPanelContent: Record<HeroTabKey, { title: string; rows: { text: string; sub: string; value: string; tone?: 'warn' }[] }> = {
    market: {
      title: isZh ? '市场需求洞察' : 'Market Demand Signals',
      rows: [
        { text: isZh ? '跨境退款延迟是首要痛点' : 'Refund delay is the top complaint', sub: 'Reddit', value: '+97%' },
        { text: isZh ? '物流时效不明导致弃单率高' : 'Unclear delivery window drives drop-off', sub: 'Reviews', value: '+91%' },
        { text: isZh ? '移动端结账转化偏低' : 'Mobile checkout conversion is down', sub: 'Analytics', value: '-23%', tone: 'warn' },
      ],
    },
    content: {
      title: isZh ? '内容方向生成' : 'Content Direction Generation',
      rows: [
        { text: isZh ? '“物流焦虑”对比型短视频可优先发布' : 'Ship-anxiety comparison short is priority', sub: 'Hook #1', value: '18K-32K' },
        { text: isZh ? '评论驱动标题拆解更利于转化' : 'Review-driven title teardown converts better', sub: 'Hook #2', value: '24K-44K' },
        { text: isZh ? '可直接生成脚本与首屏文案' : 'Ready-to-use scripts and opening copy', sub: 'Generator', value: 'Ready' },
      ],
    },
    product: {
      title: isZh ? '商品优化建议' : 'Listing Optimization',
      rows: [
        { text: isZh ? '标题加入“48H续航+快充”关键词' : 'Add “48h battery + fast charge” in title', sub: 'Title', value: '+22%' },
        { text: isZh ? '主图强调“降噪+续航”双卖点' : 'Hero image should highlight ANC + battery', sub: 'Image', value: '+12%' },
        { text: isZh ? '补充尺码/时效 FAQ 降低退款' : 'Add shipping/size FAQ to reduce refunds', sub: 'FAQ', value: '-18%' },
      ],
    },
    workflow: {
      title: isZh ? '工作流沉淀' : 'Workflow Archive',
      rows: [
        { text: isZh ? '耳机市场分析报告已归档' : 'Earbud market report archived', sub: isZh ? '2小时前' : '2h ago', value: isZh ? '已完成' : 'Done' },
        { text: isZh ? 'Q4内容选题库已同步工作台' : 'Q4 topic library synced to workspace', sub: isZh ? '昨天' : 'Yesterday', value: isZh ? '进行中' : 'Active' },
        { text: isZh ? '下一步动作清单已排优先级' : 'Next-action queue prioritized', sub: isZh ? '自动更新' : 'Auto sync', value: 'Queued' },
      ],
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1 pt-20">
        <section className="relative overflow-hidden border-b border-gray-100 bg-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 to-blue-500" aria-hidden />
          <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-100/50 blur-3xl" aria-hidden />
          <Container className="relative max-w-[1200px] py-28 lg:py-36">
            <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-8">
              <div className="w-full lg:w-[45%] shrink-0">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
                  style={{ background: 'rgba(123,97,255,0.07)', border: '1px solid rgba(123,97,255,0.2)' }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11.5px] font-medium tracking-wide text-violet-600">
                    {isZh ? '出海团队 · AI 营销增长工作台' : 'Global teams · AI marketing growth workspace'}
                  </span>
                </div>

                <h1
                  className="mt-7 mb-5 font-extrabold leading-[1.08] tracking-[-0.025em] text-[#111111]"
                  style={{ ...homeHeadingStyle, fontSize: 'clamp(40px, 4.4vw, 62px)', fontWeight: 800 }}
                >
                  {isZh ? (
                    <>
                      面向出海团队的
                      <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent"> AI 营销</span>
                      <br />
                      与商品增长工作台
                    </>
                  ) : (
                    <>
                      AI marketing workspace
                      <br />
                      for global teams and product growth
                    </>
                  )}
                </h1>

                <p className="mb-8 max-w-[490px] text-[clamp(14px,1.05vw,16px)] leading-[1.65] text-[#888888]">
                  {isZh
                    ? '把市场洞察、内容制作、商品分析与执行承接放进同一套工作流，帮助团队更快发现机会、产出内容并优化商品。'
                    : 'Bring market insight, content production, product analysis, and execution into one workflow to ship faster.'}
                </p>

                <div className="mb-4 flex flex-wrap items-center gap-3 sm:gap-4">
                  <Link to="/workspace" className={primaryBtnClass}>
                    {t('home.hero.primary')}
                  </Link>
                  <Link to="/pricing" className={secondaryBtnClass}>
                    {t('home.hero.secondary')}
                  </Link>
                </div>

                <p className="mb-4 text-xs tracking-wide text-[#AAAAAA]">
                  {isZh
                    ? '无需配置 · 秒级响应 · 专为出海团队打造'
                    : 'No setup · second-level response · built for global teams'}
                </p>

                <div
                  className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                  style={{ background: 'rgba(5,150,105,0.07)', border: '1px solid rgba(5,150,105,0.2)' }}
                >
                  <span className="text-[12px] font-semibold text-emerald-600">
                    {isZh ? '全球 2,000+ 团队正在使用' : 'Trusted by 2,000+ teams worldwide'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {heroTabs.map((tab) => {
                    const active = activeHeroTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveHeroTab(tab.key)}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-[14px] py-[6px] text-[12px] font-medium transition-all duration-200"
                        style={{
                          background: active ? tab.bgColor : '#F7F8FA',
                          borderColor: active ? tab.borderColor : '#EAEAEA',
                          color: active ? tab.color : '#888888',
                        }}
                      >
                        {isZh ? tab.labelZh : tab.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full lg:w-[55%]">
                <div className="relative overflow-hidden rounded-[16px] border border-[#EAEAEA] bg-white">
                  <div className="flex items-center justify-between border-b border-[#EAEAEA] bg-[#F7F8FA] px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-[12px] font-semibold tracking-wide text-[#444444]">GlobalPulseAI {isZh ? '工作台' : 'Workspace'}</span>
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: 'rgba(5,150,105,0.08)', color: '#059669', borderColor: 'rgba(5,150,105,0.2)' }}
                      >
                        ● {isZh ? '实时分析' : 'Live'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-300/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
                    </div>
                  </div>

                  <div className="border-b border-[#F0F0F0] bg-[#FAFAFA] px-5 py-2.5">
                    <div className="flex items-center gap-2 font-mono text-[12px] text-[#AAAAAA]">
                      <span className="text-violet-600">›</span>
                      <span>{isZh ? '正在分析：跨境无线耳机 · 出海市场 · 2024 Q4' : 'Analyzing: Wireless earbuds · Global market · 2024 Q4'}</span>
                      <span
                        className="ml-0.5 inline-block h-[12px] w-[2px] rounded-sm bg-violet-600 transition-opacity duration-100"
                        style={{ opacity: cursorBlink ? 0.9 : 0 }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 border-b border-[#F0F0F0] px-4 pb-2 pt-3">
                    {heroTabs.map((tab) => {
                      const active = activeHeroTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveHeroTab(tab.key)}
                          className="whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11.5px] font-medium transition-all duration-200"
                          style={{
                            background: active ? tab.bgColor : 'transparent',
                            color: active ? tab.color : '#AAAAAA',
                            borderColor: active ? tab.borderColor : 'transparent',
                          }}
                        >
                          {isZh ? tab.labelZh : tab.labelEn}
                        </button>
                      );
                    })}
                  </div>

                  <div className="min-h-[340px] px-5 pb-5 pt-4">
                    <div className={`space-y-3 transition-all duration-300 ${panelVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
                      <div className="mb-3 flex items-center gap-2">
                        <div
                          className="h-3 w-[3px] rounded-full"
                          style={{ background: heroTabs.find((tab) => tab.key === activeHeroTab)?.color ?? '#7B61FF' }}
                        />
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: heroTabs.find((tab) => tab.key === activeHeroTab)?.color ?? '#7B61FF' }}
                        >
                          {heroPanelContent[activeHeroTab].title}
                        </span>
                      </div>
                      {heroPanelContent[activeHeroTab].rows.map((item) => (
                        <div
                          key={item.text}
                          className="flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors duration-200"
                          style={{
                            background: item.tone === 'warn' ? 'rgba(239,68,68,0.04)' : '#F7F8FA',
                            borderColor: item.tone === 'warn' ? 'rgba(239,68,68,0.15)' : '#EAEAEA',
                          }}
                        >
                          <span className={`mt-0.5 text-[11px] ${item.tone === 'warn' ? 'text-red-500' : 'text-orange-400'}`}>
                            {item.tone === 'warn' ? '⚠' : '▲'}
                          </span>
                          <span className={`flex-1 text-[12px] leading-snug ${item.tone === 'warn' ? 'text-red-500' : 'text-[#444444]'}`}>{item.text}</span>
                          <div className="flex shrink-0 flex-col items-end gap-0.5">
                            <span className={`text-[10.5px] font-bold ${item.tone === 'warn' ? 'text-red-500' : 'text-emerald-600'}`}>{item.value}</span>
                            <span className="text-[9.5px] text-[#AAAAAA]">{item.sub}</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5 px-1 text-[11px] text-[#AAAAAA]">
                        <span className="animate-spin text-[11px]" style={{ color: '#7B61FF' }}>
                          ●
                        </span>
                        <span className="font-mono">{isZh ? '正在分析 12,482 条帖子... (2.3s)' : 'Analyzing 12,482 posts... (2.3s)'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#F0F0F0] bg-[#FAFAFA] px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-medium text-[#AAAAAA]">Powered by</span>
                      <span className="text-[10.5px] font-bold text-violet-600">GlobalPulseAI v2</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10.5px] text-emerald-600">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <Section className="border-b border-gray-100 bg-[#F7F8FA] py-28 lg:py-36">
          <Container className="max-w-[1280px]">
            <div className="mb-16 text-center">
              <span
                className="mb-4 inline-block rounded-full px-3.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.18em]"
                style={{ color: '#7B61FF', background: 'rgba(123,97,255,0.07)', border: '1px solid rgba(123,97,255,0.18)' }}
              >
                {isZh ? '产品能力' : 'Capabilities'}
              </span>
              <h2
                className="mb-4 text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-[#111111] lg:text-5xl"
                style={homeHeadingStyle}
              >
                {isZh ? (
                  <>
                    一套工作台，覆盖
                    <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent"> 四类核心能力</span>
                  </>
                ) : (
                  <>
                    One workspace, covering
                    <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent"> four core capabilities</span>
                  </>
                )}
              </h2>
              <p className="mx-auto max-w-[480px] text-[16px] leading-relaxed text-[#888888]">{t('home.capabilities.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map((cap, idx) => {
                const Icon = cap.icon;
                const num = `0${idx + 1}`;
                return (
                  <article
                    key={cap.title}
                    className="group relative cursor-default overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5"
                    style={{ background: '#ffffff', border: '1px solid #EAEAEA' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = cap.borderColor;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 30px ${cap.borderColor}`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#EAEAEA';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: cap.iconBg }}>
                        <Icon className="h-5 w-5" style={{ color: cap.iconColor }} />
                      </div>
                      <span className="tabular-nums text-[13px] font-bold text-[#DDDDDD]">{num}</span>
                    </div>

                    <h3 className="mb-0.5 text-[16px] font-bold text-[#111111]" style={homeHeadingStyle}>
                      {cap.title}
                    </h3>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: cap.iconColor }}>
                      {cap.subtitle}
                    </p>

                    <p className="mb-5 text-[13.5px] leading-relaxed text-[#888888]">{cap.desc}</p>

                    <ul className="mb-6 space-y-2.5">
                      {cap.points.map((point) => (
                        <li key={point} className="flex items-center gap-2.5 text-[12px] text-[#444444]">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                            <Check className="h-2.5 w-2.5 text-emerald-500" />
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center gap-2 border-t border-[#EAEAEA] pt-5">
                      <ArrowUpRight className="h-3.5 w-3.5" style={{ color: cap.iconColor }} />
                      <span className="text-[12px] font-semibold text-[#444444]">{cap.result}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </Container>
        </Section>

        <Section className="border-b border-gray-100 bg-white py-28 lg:py-36">
          <Container className="max-w-[1280px]">
            <div className="mb-16 text-center">
              <span
                className="mb-4 inline-block rounded-full px-3.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.18em]"
                style={{ color: '#7B61FF', background: 'rgba(123,97,255,0.07)', border: '1px solid rgba(123,97,255,0.15)' }}
              >
                {isZh ? '工作流程' : 'Workflow'}
              </span>
              <h2 className="mb-5 text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-[#111111] lg:text-5xl" style={homeHeadingStyle}>
                {isZh ? (
                  <>
                    三步完成从
                    <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent"> 问题到输出</span>
                  </>
                ) : (
                  <>
                    From question to output
                    <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent"> in 3 steps</span>
                  </>
                )}
              </h2>
              <p className="mx-auto max-w-[480px] text-[16px] leading-relaxed text-[#888888]">
                {isZh ? '输入你的市场、内容或商品问题，系统自动整合分析，3 分钟内给出可执行结果。' : 'Input market, content, or product questions and get executable outputs in minutes.'}
              </p>
            </div>
            <div className="relative">
              <div
                className="pointer-events-none absolute left-[16%] right-[16%] top-[52px] hidden h-[1px] lg:block"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(123,97,255,0.1), rgba(123,97,255,0.4) 30%, rgba(14,165,233,0.4) 60%, rgba(5,150,105,0.3) 85%, rgba(5,150,105,0.05))',
                }}
              />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
                {flowSteps.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.step} className="group relative flex flex-col items-center text-center">
                      <div className="relative z-10 mb-6">
                        <div className={`relative flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-r ${item.iconBg}`}>
                          <Icon className="h-[22px] w-[22px] text-white" />
                        </div>
                        <div
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                          style={{ background: item.accentColor }}
                        >
                          {idx + 1}
                        </div>
                      </div>

                      <div
                        className="w-full rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1"
                        style={{ borderColor: '#EAEAEA' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = `${item.accentColor}30`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#EAEAEA';
                        }}
                      >
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#AAAAAA]">Step {item.step}</p>
                        <h3 className="mb-1 text-[16px] font-bold text-[#111111]" style={homeHeadingStyle}>
                          {item.title}
                        </h3>
                        <p className="mb-3 text-[11.5px] font-medium text-[#AAAAAA]">{item.sub}</p>
                        <p className="mb-4 text-[13px] leading-relaxed text-[#888888]">{item.desc}</p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {item.examples.map((example) => (
                            <span
                              key={example}
                              className="rounded-full border px-2.5 py-1 text-[10.5px] font-medium"
                              style={{ color: item.accentColor, background: `${item.accentColor}08`, borderColor: `${item.accentColor}20` }}
                            >
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="mt-14 text-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#EAEAEA] bg-white px-6 py-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[13px] text-[#888888]">
                  {isZh ? (
                    <>
                      从问题输入到可执行输出：平均 <strong className="font-bold text-[#111111]">&lt; 3 分钟</strong>
                    </>
                  ) : (
                    <>
                      From input to output: average <strong className="font-bold text-[#111111]">&lt; 3 min</strong>
                    </>
                  )}
                </span>
              </div>
            </div>
          </Container>
        </Section>

        <Section className="border-b border-gray-100 bg-gray-50 py-28 lg:py-36">
          <Container className="max-w-[1280px]">
            <div className="mb-16">
              <span
                className="mb-4 inline-block rounded-full px-3.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.18em]"
                style={{ color: '#7B61FF', background: 'rgba(123,97,255,0.07)', border: '1px solid rgba(123,97,255,0.18)' }}
              >
                {isZh ? '输出结果' : 'Outputs'}
              </span>
              <h2 className="mb-4 text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-[#111111] lg:text-5xl" style={homeHeadingStyle}>
                {isZh ? (
                  <>
                    你最终会得到
                    <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent"> 这些可执行结果</span>
                  </>
                ) : (
                  <>
                    You ultimately get
                    <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent"> executable outputs</span>
                  </>
                )}
              </h2>
              <p className="max-w-[480px] text-[16px] leading-relaxed text-[#888888]">
                {isZh ? '不是报告，不是建议，是直接可用的内容、商品方向和执行动作。' : 'Not just reports, but directly usable content, listing direction, and actions.'}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {outputPanels.map((panel) => {
                const Icon = panel.icon;
                return (
                  <article key={panel.title} className="overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white">
                    <div className="flex items-center justify-between border-b border-[#F0F0F0] bg-[#FAFAFA] px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-[14px] w-[14px]" style={{ color: panel.accentColor }} />
                        <span className="text-[13px] font-semibold text-[#444444]">{panel.title}</span>
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
                        style={{ color: panel.accentColor, background: panel.badgeBg, borderColor: panel.badgeBorder }}
                      >
                        {panel.badge}
                      </span>
                    </div>
                    <div className="space-y-2.5 p-4">
                      {panel.rows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-[#EAEAEA] bg-[#F7F8FA] px-3.5 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-medium leading-snug text-[#444444]">{row.label}</p>
                            <span className="text-[11px] text-[#AAAAAA]">{row.detail}</span>
                          </div>
                          <span className="shrink-0 text-[12px] font-bold" style={{ color: panel.accentColor }}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-[#F0F0F0] bg-[#FAFAFA] px-5 py-3 text-[11px]">
                      <span className="text-[#AAAAAA]">{panel.footer}</span>
                      <span className="font-semibold" style={{ color: panel.accentColor }}>
                        {panel.metric}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </Container>
        </Section>

        <Section className="border-b border-gray-100 bg-white py-28 lg:py-36">
          <Container className="max-w-[1280px]">
            <div className="mb-16 text-center">
              <span
                className="mb-4 inline-block rounded-full px-3.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.18em]"
                style={{ color: '#7B61FF', background: 'rgba(123,97,255,0.07)', border: '1px solid rgba(123,97,255,0.15)' }}
              >
                {isZh ? '适用团队' : 'Who uses it'}
              </span>
              <h2 className="mb-5 text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-[#111111] lg:text-5xl" style={homeHeadingStyle}>
                {isZh ? (
                  <>
                    谁在使用
                    <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent"> GlobalPulseAI</span>
                  </>
                ) : (
                  <>
                    Teams using
                    <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent"> GlobalPulseAI</span>
                  </>
                )}
              </h2>
              <p className="mx-auto max-w-[480px] text-[16px] leading-relaxed text-[#888888]">
                {isZh ? '无论你做产品销售还是内容创作，都能在同一工作台内对齐增长动作。' : 'From product selling to content creation, growth actions stay aligned in one workspace.'}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {teamUseCases.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="group cursor-default overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white p-7 transition-all duration-300 hover:-translate-y-1"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${item.accentColor}30`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#EAEAEA';
                    }}
                  >
                    <div className="mb-5 flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl border"
                        style={{ background: `${item.accentColor}12`, borderColor: `${item.accentColor}25` }}
                      >
                        <Icon className="h-[17px] w-[17px]" style={{ color: item.accentColor }} />
                      </div>
                      <div>
                        <h3 className="text-[17px] font-bold leading-tight text-[#111111]" style={homeHeadingStyle}>
                          {item.title}
                        </h3>
                        <p className="text-[12px] font-medium text-[#888888]">{item.tag}</p>
                      </div>
                    </div>
                    <p className="mb-5 text-[13.5px] leading-relaxed text-[#888888]">{item.desc}</p>
                    <ul className="mb-6 space-y-2.5">
                      {item.outcomes.map((outcome) => (
                        <li key={outcome} className="flex items-center gap-2.5 text-[13px] text-[#444444]">
                          <CheckCircle2 className="h-[13px] w-[13px] shrink-0 text-emerald-500" />
                          {outcome}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-2 border-t border-[#EAEAEA] pt-5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: `${item.accentColor}12` }}>
                        <ArrowUpRight className="h-[11px] w-[11px]" style={{ color: item.accentColor }} />
                      </div>
                      <span className="text-[13px] font-bold" style={{ color: item.accentColor }}>
                        {item.metric}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </Container>
        </Section>

        <section className="relative overflow-hidden border-b border-[#EAEAEA] bg-[#F7F8FA] py-14">
          <Container className="max-w-[1280px]">
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-0">
              {stats.map((stat, idx) => (
                <div key={stat.label} className={`text-center ${idx < stats.length - 1 ? 'lg:border-r lg:border-[#EAEAEA]' : ''}`}>
                  <p
                    className="mb-1 text-[34px] font-extrabold tracking-[-0.03em] lg:text-[42px]"
                    style={{ ...homeHeadingStyle, background: 'linear-gradient(135deg, #7B61FF, #5B8CFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[13px] text-[#888888]">{stat.label}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <Section className="border-b border-[#EAEAEA] bg-white py-24 lg:py-32">
          <Container className="max-w-[1280px]">
            <div className="mx-auto max-w-4xl text-center">
              <span
                className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                style={{ background: 'rgba(123,97,255,0.07)', border: '1px solid rgba(123,97,255,0.18)' }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[12.5px] font-medium text-violet-600">
                  {isZh ? '全球 2,000+ 出海团队正在使用 GlobalPulseAI 增长' : '2,000+ global teams are scaling with GlobalPulseAI'}
                </span>
              </span>

              <h2 className="mb-6 text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] text-[#111111] lg:text-[56px]" style={homeHeadingStyle}>
                {isZh ? (
                  <>
                    现在就开始把信号
                    <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent"> 转化为增长</span>
                  </>
                ) : (
                  <>
                    Start turning signals
                    <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent"> into growth</span>
                  </>
                )}
              </h2>

              <p className="mx-auto mb-3 max-w-[460px] text-[17px] font-semibold leading-relaxed text-[#111111]">
                {isZh ? '你的竞争对手已经在这样做了。' : 'Your competitors are already doing this.'}
              </p>
              <p className="mx-auto mb-12 max-w-[420px] text-[15px] leading-relaxed text-[#888888]">
                {isZh ? '每一天没有真实市场情报，就是他们拉开差距的一天。' : 'Every day without real market signals is a day they widen the gap.'}
              </p>

              <div className="mb-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/workspace"
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-8 py-4 text-[15px] font-semibold text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7B61FF, #5B8CFF)' }}
                >
                  {t('home.hero.primary')}
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-[#EAEAEA] bg-white px-8 py-4 text-[15px] font-medium text-[#444444] transition-all duration-200 hover:text-[#111111]"
                >
                  {t('home.hero.secondary')}
                  <ArrowRight className="h-[14px] w-[14px]" />
                </Link>
              </div>

              <p className="text-[12px] tracking-wide text-[#AAAAAA]">{isZh ? '无需信用卡 · 7 天免费试用 · 随时取消' : 'No card required · 7-day trial · Cancel anytime'}</p>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
