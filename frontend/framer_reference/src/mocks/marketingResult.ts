export interface MarketingResultData {
  id: string;
  keyword: string;
  industry: string;
  analysisDate: string;
  growth: {
    score: number;
    verdict: "可以做" | "谨慎考虑" | "不建议";
    verdictColor: string;
    verdictBg: string;
    summary: string;
    explanation: string;
    metrics: Array<{ label: string; value: string; trend: "up" | "down" | "flat"; color: string }>;
  };
  channels: Array<{
    id: string;
    name: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    trafficPotential: "高" | "中" | "低";
    competition: "高" | "中" | "低";
    potentialScore: number;
    competitionScore: number;
    description: string;
    recommended: boolean;
  }>;
  demands: Array<{
    id: string;
    query: string;
    source: string;
    sourceColor: string;
    volume: string;
    intent: "购买" | "了解" | "比较" | "问题";
    intentColor: string;
  }>;
  contentStrategies: Array<{
    id: string;
    title: string;
    angle: string;
    description: string;
    platform: string;
    effort: "低" | "中" | "高";
    potential: "低" | "中" | "高";
    icon: string;
  }>;
  executionPlan: Array<{
    step: number;
    action: string;
    detail: string;
    platform: string;
    timeframe: string;
    priority: "立即" | "本周" | "本月";
    priorityColor: string;
  }>;
  assets: {
    videoScripts: Array<{ id: string; title: string; content: string }>;
    titleList: Array<{ id: string; text: string }>;
    seoOutline: { title: string; sections: string[] };
    adCopies: Array<{ id: string; type: string; content: string }>;
  };
}

export const MOCK_MARKETING_RESULT: MarketingResultData = {
  id: "mkt-2024-001",
  keyword: "无线降噪耳机",
  industry: "消费电子 · 音频设备",
  analysisDate: "2024-03-15",
  growth: {
    score: 72,
    verdict: "可以做",
    verdictColor: "#16a34a",
    verdictBg: "rgba(22,163,74,0.10)",
    summary: "当前市场有明确需求，内容竞争中等，适合差异化内容切入",
    explanation: "无线降噪耳机赛道搜索量持续增长，TikTok 内容饱和度尚低，Reddit / YouTube 评测需求旺盛。平价区间（$30-80）竞争激烈但高性价比内容仍有机会，品牌差异化表达是关键突破口。",
    metrics: [
      { label: "市场需求", value: "强劲", trend: "up", color: "#16a34a" },
      { label: "内容竞争", value: "中等", trend: "flat", color: "#f59e0b" },
      { label: "增长空间", value: "较大", trend: "up", color: "#16a34a" },
      { label: "入门门槛", value: "适中", trend: "flat", color: "#f59e0b" },
    ],
  },
  channels: [
    {
      id: "c1",
      name: "TikTok",
      icon: "ri-tiktok-fill",
      iconColor: "#111111",
      iconBg: "rgba(0,0,0,0.06)",
      trafficPotential: "高",
      competition: "中",
      potentialScore: 92,
      competitionScore: 55,
      description: "短视频拆箱 / 降噪实测内容传播快，评论区购买意向强",
      recommended: true,
    },
    {
      id: "c2",
      name: "YouTube SEO",
      icon: "ri-youtube-fill",
      iconColor: "#ef4444",
      iconBg: "rgba(239,68,68,0.08)",
      trafficPotential: "高",
      competition: "高",
      potentialScore: 85,
      competitionScore: 78,
      description: "长评测视频长尾流量稳定，但头部频道已占据主要关键词",
      recommended: true,
    },
    {
      id: "c3",
      name: "Google SEO",
      icon: "ri-google-fill",
      iconColor: "#4285f4",
      iconBg: "rgba(66,133,244,0.08)",
      trafficPotential: "高",
      competition: "高",
      potentialScore: 80,
      competitionScore: 82,
      description: "\"最佳降噪耳机推荐\" 类关键词搜索量大，但竞争极激烈",
      recommended: false,
    },
    {
      id: "c4",
      name: "Reddit",
      icon: "ri-reddit-fill",
      iconColor: "#ff4500",
      iconBg: "rgba(255,69,0,0.08)",
      trafficPotential: "中",
      competition: "低",
      potentialScore: 68,
      competitionScore: 28,
      description: "r/headphones 社区活跃，真实评测口碑传播效果显著",
      recommended: true,
    },
    {
      id: "c5",
      name: "Instagram",
      icon: "ri-instagram-line",
      iconColor: "#e1306c",
      iconBg: "rgba(225,48,108,0.08)",
      trafficPotential: "中",
      competition: "中",
      potentialScore: 60,
      competitionScore: 58,
      description: "视觉向内容适合品牌调性展示，转化率偏低",
      recommended: false,
    },
  ],
  demands: [
    { id: "d1", query: "无线耳机降噪哪个好？AirPods vs 平价替代品", source: "Reddit", sourceColor: "#ff4500", volume: "8.2K/月", intent: "比较", intentColor: "#7B61FF" },
    { id: "d2", query: "100元以内降噪耳机推荐 2024", source: "Google", sourceColor: "#4285f4", volume: "12.4K/月", intent: "购买", intentColor: "#16a34a" },
    { id: "d3", query: "降噪耳机上班通勤适合吗，开放式还是封闭式更好", source: "知乎", sourceColor: "#0084ff", volume: "5.6K/月", intent: "了解", intentColor: "#f59e0b" },
    { id: "d4", query: "earbuds noise cancelling test real vs fake", source: "YouTube", sourceColor: "#ef4444", volume: "32K/月", intent: "了解", intentColor: "#f59e0b" },
    { id: "d5", query: "best budget wireless earbuds under $50", source: "Google", sourceColor: "#4285f4", volume: "45K/月", intent: "购买", intentColor: "#16a34a" },
    { id: "d6", query: "降噪耳机长时间佩戴会耳朵痛吗", source: "Reddit", sourceColor: "#ff4500", volume: "3.1K/月", intent: "问题", intentColor: "#888888" },
    { id: "d7", query: "why is my noise cancelling not working properly", source: "Reddit", sourceColor: "#ff4500", volume: "6.8K/月", intent: "问题", intentColor: "#888888" },
    { id: "d8", query: "平价耳机和贵的有什么区别值得买吗", source: "TikTok", sourceColor: "#111111", volume: "18K/月", intent: "比较", intentColor: "#7B61FF" },
  ],
  contentStrategies: [
    {
      id: "cs1",
      title: "降噪对比实测",
      angle: "对比 AirPods 与平价耳机的真实降噪效果",
      description: "用地铁、咖啡馆等真实嘈杂环境录制对比视频，直观展示平价产品的实际降噪能力，突出性价比优势。",
      platform: "TikTok · YouTube",
      effort: "中",
      potential: "高",
      icon: "ri-mic-line",
    },
    {
      id: "cs2",
      title: "通勤生活场景",
      angle: "职场人一天的耳机使用体验",
      description: "以 Vlog 形式记录早晨通勤→开会→午休→健身的完整使用场景，让目标用户产生强烈代入感。",
      platform: "TikTok · Instagram",
      effort: "低",
      potential: "高",
      icon: "ri-train-line",
    },
    {
      id: "cs3",
      title: "拆解技术卖点",
      angle: "用通俗语言解释 ANC 降噪原理",
      description: "\"为什么降噪耳机能消除声音？\" — 用动画或实验演示技术原理，建立专业权威感，在 YouTube 上获取长尾搜索流量。",
      platform: "YouTube · Reddit",
      effort: "高",
      potential: "中",
      icon: "ri-settings-4-line",
    },
    {
      id: "cs4",
      title: "用户问题解答",
      angle: "解决真实痛点：耳机佩戴痛、连接断开、延迟高",
      description: "针对 Reddit / 搜索高频问题制作解答内容，在搜索渠道精准捕获有购买决策需求的用户。",
      platform: "SEO · YouTube",
      effort: "中",
      potential: "中",
      icon: "ri-question-answer-line",
    },
    {
      id: "cs5",
      title: "礼物推荐清单",
      angle: "\"送给程序员 / 学生 / 上班族的最佳耳机\"",
      description: "针对礼物购买场景创作选品内容，在节假日前后发布，可在 Google SEO 和 TikTok 双渠道获得自然流量。",
      platform: "SEO · TikTok",
      effort: "低",
      potential: "中",
      icon: "ri-gift-line",
    },
  ],
  executionPlan: [
    {
      step: 1,
      action: "发布 3 条 TikTok 对比视频",
      detail: "拍摄降噪实测 + 日常使用场景，测试哪类内容完播率最高，找到最佳方向",
      platform: "TikTok",
      timeframe: "第 1-3 天",
      priority: "立即",
      priorityColor: "#ef4444",
    },
    {
      step: 2,
      action: "写 1 篇 SEO 长文",
      detail: "目标关键词：\"best budget noise cancelling earbuds under $50\"，字数 1500+，包含真实测评数据",
      platform: "Blog / SEO",
      timeframe: "第 4-7 天",
      priority: "本周",
      priorityColor: "#f59e0b",
    },
    {
      step: 3,
      action: "在 Reddit r/headphones 发帖",
      detail: "分享真实使用心得，不硬广，在评论区建立社区信任，引流到主页或购买链接",
      platform: "Reddit",
      timeframe: "第 5-7 天",
      priority: "本周",
      priorityColor: "#f59e0b",
    },
    {
      step: 4,
      action: "投放小预算 TikTok 广告",
      detail: "用表现最好的有机视频做 Spark Ads，$20-50 测试 CTR，验证付费放量可行性",
      platform: "TikTok Ads",
      timeframe: "第 8-14 天",
      priority: "本月",
      priorityColor: "#7B61FF",
    },
    {
      step: 5,
      action: "建立内容日历 + 复盘",
      detail: "根据前两周数据，确定主力渠道和内容类型，制定 30 天内容计划",
      platform: "全渠道",
      timeframe: "第 14 天",
      priority: "本月",
      priorityColor: "#7B61FF",
    },
  ],
  assets: {
    videoScripts: [
      {
        id: "vs1",
        title: "TikTok 对比测试脚本（30秒）",
        content: "🎬 开场（0-3s）：地铁站嘈杂背景音\n\"你知道 $30 的耳机能消多少噪音吗？\"\n\n📊 对比（3-20s）：\n[左屏] AirPods Pro — 噪音：几乎听不见\n[右屏] [产品名] $35 — 噪音：减少约 80%\n\"这两个价格差了 5 倍，但降噪差距只有 20%\"\n\n✅ 结尾（20-30s）：\n\"性价比怪物，链接在主页\"\n#降噪耳机 #性价比 #耳机推荐",
      },
      {
        id: "vs2",
        title: "YouTube 开箱评测脚本（开场钩子）",
        content: "\"停！在买 AirPods 之前先看这个视频。\"\n\n\"我在过去 3 个月测试了 12 款 $30-100 的无线耳机，\n今天告诉你哪款最值得买。\"\n\n\"第一名让我震惊了——它只要 $38，\n但降噪效果把 $200 的对手打得很惨...\"\n\n[开始开箱]\n\"首先来看包装...\"",
      },
    ],
    titleList: [
      { id: "tl1", text: "2024 最强平价降噪耳机｜$35 打败 AirPods Pro？" },
      { id: "tl2", text: "无线降噪耳机终极选购指南：100元以内这款封神" },
      { id: "tl3", text: "我测了12款耳机，只有这款让我停下来" },
      { id: "tl4", text: "Best Budget Noise Cancelling Earbuds 2024 (Under $50 That Actually Work)" },
      { id: "tl5", text: "平价耳机真的能降噪吗？用 3 个月后的真实答案" },
      { id: "tl6", text: "程序员通勤必备：这款降噪耳机用了就回不去了" },
    ],
    seoOutline: {
      title: "Best Budget Noise Cancelling Earbuds Under $50 (2024 Tested)",
      sections: [
        "一、为什么不需要花大价钱买降噪耳机（数据支撑）",
        "二、测试方法：如何客观评估降噪效果",
        "三、Top 5 推荐产品详细测评（含对比数据）",
        "四、如何根据使用场景选择：通勤 / 运动 / 居家",
        "五、常见问题解答：连接、续航、音质疑问",
        "六、总结建议 + 购买链接",
      ],
    },
    adCopies: [
      {
        id: "ac1",
        type: "TikTok Spark Ad",
        content: "✈️ 通勤党必看\n$35 的耳机降噪能有多好？\n我在地铁里做了测试...\n结果把我自己都震惊了\n点击查看 👇",
      },
      {
        id: "ac2",
        type: "Google 搜索广告",
        content: "标题：最佳平价降噪耳机 | 真实测评 2024\n描述：专业测评12款产品，30天退换保障。$35起，降噪效果媲美AirPods。立即查看对比报告 →",
      },
      {
        id: "ac3",
        type: "Reddit 社区帖子文案",
        content: "\"刚用了 3 个月，说说我的真实感受\"\n\n之前一直用 AirPods，前两周入了 [产品名]，说实话刚开始有点担心降噪能不能打。\n\n结论：日常通勤完全够用，地铁里人声降噪大概能减到原来的 20-30%，开音乐就完全听不到外面了。\n\n唯一缺点是麦克风通话质量一般，打电话对方说听起来有点空洞感...",
      },
    ],
  },
};
