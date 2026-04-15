export type ContentType = "video" | "image" | "article";

export interface BreakdownData {
  hook: { type: string; original: string; explanation: string };
  structure: Array<{ time: string; label: string; desc: string; color: string }>;
  emotion: { primary: string; tags: string[]; intensity: number; description: string };
  visual: { composition: string; scene: string; styleTag: string[]; description: string };
  performance: { likes: string; comments: string; shares: string; likeRate: string; signals: Array<{ label: string; insight: string }> };
}

export interface AssetsData {
  videoScript: { hook: string; scenes: Array<{ id: number; duration: string; shot: string; script: string }>; cta: string };
  titles: string[];
  seoOutline: { title: string; h2List: string[] };
  prompts: { imagePrompt: string; videoPrompt: string };
  clips: Array<{ id: number; timeRange: string; title: string; desc: string; engagement: string }>;
  imagePosts: Array<{ page: number; title: string; copy: string }>;
}

// ─── 图文类型 breakdown & assets ───────────────────────────
export const MOCK_IMAGE_BREAKDOWN: BreakdownData = {
  hook: {
    type: "视觉冲击 + 数字",
    original: "9张图告诉你，为什么你选的耳机全错了",
    explanation: "「9张图」设定期望（轻量可读），「全错了」触发纠正本能——图文用户更倾向消费结构化内容，强数字标题完播率高 55%。",
  },
  structure: [
    { time: "封面", label: "标题钩子", desc: "数字 + 强对比引发点击", color: "#FF2442" },
    { time: "P2-P3", label: "痛点放大", desc: "展示常见错误认知，激发共鸣", color: "#fb923c" },
    { time: "P4-P7", label: "干货内容", desc: "逐步拆解选购维度，建立信任", color: "#10b981" },
    { time: "P8", label: "结论推荐", desc: "给出明确结论 + 收藏引导", color: "#3b82f6" },
    { time: "P9", label: "CTA", desc: "关注 / 点赞 / 私信", color: "#ef4444" },
  ],
  emotion: {
    primary: "信任感 + 收藏欲",
    tags: ["知识获取感", "收藏囤货", "避坑心理", "认知升级"],
    intensity: 74,
    description: "图文用户更理性，主要情绪是「学到了」和「以后用得上」，收藏率远高于点赞，内容价值感要强。",
  },
  visual: {
    composition: "统一模板 + 高对比配色",
    scene: "纯色背景 / 产品平铺",
    styleTag: ["极简排版", "大字标题", "一致配色", "信息图表"],
    description: "小红书图文需要强统一视觉风格，封面配色决定点击率，正文要做到「截图可读」——每页独立成立。",
  },
  performance: {
    likes: "18.2K",
    comments: "934",
    shares: "5,621",
    likeRate: "2.31%",
    signals: [
      { label: "超高收藏率", insight: "内容实用性强 — 用户明确计划「以后用」" },
      { label: "低评论高收藏", insight: "干货属性 — 用户无需讨论，直接收藏" },
      { label: "持续长尾流量", insight: "搜索流量入口 — 关键词排名稳定带来持续曝光" },
    ],
  },
};

export interface ImageAssetsData extends AssetsData {
  generatedImages: Array<{
    id: number;
    url: string;
    label: string;
    prompt: string;
  }>;
  generatedCaption: string;
}

export const MOCK_IMAGE_ASSETS: ImageAssetsData = {
  videoScript: { hook: "", scenes: [], cta: "" },
  titles: [
    "9张图告诉你，为什么你选的耳机全错了",
    "买耳机必看！避开这5个坑省下1000元",
    "小红书最全耳机选购指南｜收藏备用",
    "平价耳机 vs 旗舰对比，差距只有这里",
  ],
  seoOutline: {
    title: "图文版 | 降噪耳机选购避坑指南（2024最新）",
    h2List: [
      "封面：9张图避坑耳机选购",
      "P2：99%的人都踩过这3个坑",
      "P3：降噪效果怎么看？一个指标搞定",
      "P4：三个价位段最推荐的型号",
    ],
  },
  prompts: {
    imagePrompt: "Minimalist product flat lay for social media, single wireless headphone centered on pastel pink background, soft shadows, clean typography overlay space, editorial style, 4K",
    videoPrompt: "",
  },
  clips: [],
  imagePosts: [
    { page: 1, title: "封面", copy: "9张图告诉你，为什么你选的耳机全错了 👇 收藏备用" },
    { page: 2, title: "痛点", copy: "坑①：价格越贵越好？错！\n坑②：大牌一定强？错！\n坑③：降噪=主动降噪？也错！" },
    { page: 3, title: "核心指标", copy: "看这一个数字就够：降噪指数 dB\n35dB+ = 旗舰级\n25-35dB = 日常够用\n<25dB = 摆设" },
    { page: 4, title: "推荐清单 + 结论", copy: "200元档：SOUNDPEATS Air4 Pro（降噪30dB）\n500元档：索尼WF-C700N（降噪33dB）\n旗舰档：WH-1000XM5（降噪40dB）\n\n200块耳机降噪已够用！点赞收藏备用 👏" },
  ],
  generatedImages: [
    {
      id: 1,
      url: "https://readdy.ai/api/search-image?query=minimalist%20social%20media%20post%20design%20wireless%20headphones%20flat%20lay%20pastel%20pink%20background%20clean%20typography%20bold%20title%20text%20overlay%20modern%20aesthetic%20editorial&width=800&height=800&seq=gen-img-01&orientation=squarish",
      label: "封面图",
      prompt: "Minimalist flat lay, wireless headphone on pastel pink background, bold Chinese title overlay, editorial style",
    },
    {
      id: 2,
      url: "https://readdy.ai/api/search-image?query=social%20media%20infographic%20design%20three%20common%20mistakes%20headphone%20shopping%20clean%20white%20background%20red%20accent%20icons%20modern%20minimal%20layout%20xiaohongshu%20style&width=800&height=800&seq=gen-img-02&orientation=squarish",
      label: "痛点页",
      prompt: "Clean infographic style, three mistake icons, red accent color, white background, bold typography",
    },
    {
      id: 3,
      url: "https://readdy.ai/api/search-image?query=data%20visualization%20chart%20noise%20cancellation%20decibel%20comparison%20headphone%20brands%20minimal%20design%20light%20background%20green%20accent%20bar%20chart%20clean&width=800&height=800&seq=gen-img-03&orientation=squarish",
      label: "数据对比图",
      prompt: "Data chart visualization, dB comparison bars, clean minimal style, green accent, white background",
    },
    {
      id: 4,
      url: "https://readdy.ai/api/search-image?query=product%20recommendation%20list%20three%20headphones%20ranked%20with%20price%20tags%20clean%20minimal%20poster%20design%20soft%20gradient%20background%20modern%20social%20media%20style&width=800&height=800&seq=gen-img-04&orientation=squarish",
      label: "推荐清单页",
      prompt: "Three product recommendation layout, price tags, ranking numbers, clean poster style, soft gradient",
    },
  ],
  generatedCaption: "🎧 花了3周帮你踩坑，买耳机前一定要看这4张图！\n\n很多人选耳机就两个字：大牌。结果花了大价钱买了一堆「降噪摆设」🙃\n\n这次我把选购逻辑拆成4张图：\n✅ 封面：最常见的3个选购误区\n✅ 第2张：降噪强度怎么看，一个数字搞定\n✅ 第3张：各价位段实测数据对比\n✅ 第4张：我的最终推荐清单（附购买链接）\n\n结论是：200块的耳机降噪真的够用！贵的只贵在「品牌溢价」。\n\n👉 记得收藏备用，有问题评论区问我~\n\n#耳机推荐 #降噪耳机 #避坑指南 #数码好物 #小红书购物",
};

// ─── 文章类型 breakdown & assets ───────────────────────────
export const MOCK_ARTICLE_BREAKDOWN: BreakdownData = {
  hook: {
    type: "问题式标题 + SEO",
    original: "2024年降噪耳机哪款值得买？测评10款后的真实结论",
    explanation: "问题式标题直接锁定搜索意图，「真实结论」强调独家性——长文在Google/知乎靠搜索流量，标题要包含核心关键词。",
  },
  structure: [
    { time: "导语", label: "痛点共鸣", desc: "1-2段，快速建立读者信任", color: "#7B61FF" },
    { time: "正文①", label: "背景知识", desc: "降噪技术科普，建立专业感", color: "#3b82f6" },
    { time: "正文②", label: "测评维度", desc: "说明评测标准与方法论", color: "#fb923c" },
    { time: "正文③", label: "逐款分析", desc: "每款300-500字详细评测", color: "#10b981" },
    { time: "结论", label: "推荐汇总", desc: "按场景/预算给出明确建议", color: "#ef4444" },
  ],
  emotion: {
    primary: "信任感 + 权威感",
    tags: ["深度阅读", "专业认可", "决策辅助", "知识消费"],
    intensity: 58,
    description: "长文读者情绪较为理性，核心驱动是「找到确定性答案」。内容要足够全面，让读者看完后感到「不用再查了」。",
  },
  visual: {
    composition: "H1/H2标题层级 + 图文穿插",
    scene: "文章配图 / 对比表格",
    styleTag: ["清晰排版", "数据表格", "高清产品图", "结构化列表"],
    description: "长文的视觉重点是「可扫读性」——加粗关键词、表格对比、小标题导航，读者跳读时也能获取核心信息。",
  },
  performance: {
    likes: "3.2K",
    comments: "421",
    shares: "2,890",
    likeRate: "0.89%",
    signals: [
      { label: "高分享量", insight: "实用价值极强 — 用户分享给有需求的朋友" },
      { label: "长留存时间", insight: "内容深度足够 — 用户愿意花时间完读" },
      { label: "高搜索排名", insight: "SEO价值高 — 长尾关键词持续带来自然流量" },
    ],
  },
};

export interface ArticleAssetsData extends AssetsData {
  generatedArticle: string;
  originalArticle: string;
}

export const MOCK_ARTICLE_ASSETS: ArticleAssetsData = {
  videoScript: { hook: "", scenes: [], cta: "" },
  titles: [
    "2024年降噪耳机哪款值得买？测评10款后的真实结论",
    "降噪耳机选购完全指南：从入门到旗舰一篇讲清",
    "平价耳机能打过AirPods吗？我花30天测试后的答案",
    "耳机降噪技术深度解析：为什么贵的不一定好",
    "2024最值得买的降噪耳机推荐（按预算分类）",
    "降噪耳机横评报告：测试标准、数据与真实使用体验",
  ],
  seoOutline: {
    title: "2024年降噪耳机哪款值得买？测评10款后的真实结论",
    h2List: [
      "一、为什么大多数人选错了降噪耳机",
      "二、降噪技术原理：主动 vs 被动，你真正需要哪种",
      "三、我们的测评标准与评分维度",
      "四、200-400元档：平价耳机真正的天花板",
      "五、400-800元档：性价比最高的价格区间",
      "六、800元以上：旗舰真的值这个价吗",
      "七、2024最终推荐清单（按使用场景）",
      "八、常见问题解答（FAQ）",
    ],
  },
  prompts: {
    imagePrompt: "Professional product review article hero image, multiple wireless headphones arranged on minimalist desk setup, natural window lighting, editorial photography style, clean white background",
    videoPrompt: "",
  },
  clips: [],
  imagePosts: [],
  originalArticle: `在过去这几年，降噪耳机市场经历了一场"价格革命"——曾经要花两三千才能买到的主动降噪技术，如今两三百块就能体验到。但问题是：便宜的降噪耳机真的好用吗？

我花了整整30天，测试了市面上10款不同价位的降噪耳机，从199元的入门款到1899元的旗舰级，想找出那个"性价比甜点"。

## 什么是真正的降噪效果？

很多人买耳机时只看品牌，或者被"主动降噪"这四个字吸引，但从来不知道该怎么量化。其实有一个核心指标：降噪深度（dB）。

这个数字代表耳机能把外界噪音压低多少分贝：

- **35dB以上**：旗舰级，飞机发动机声能基本消除
- **25-35dB**：日常通勤完全够用，咖啡厅键盘声基本听不到
- **15-25dB**：属于"听个响"，降噪感受一般
- **15dB以下**：几乎感受不到降噪，买它干嘛

## 10款耳机测评结果

经过标准化测试环境下的数据采集，结合实际使用场景（地铁、咖啡厅、办公室），给出以下排名：

**199-399元段（平价之王）**

第1名：SOUNDPEATS Air4 Pro — 降噪33dB，续航9h，重量46g
为什么推荐：同价位里降噪最深，延迟低于15ms，游戏和视频都合适。

**400-800元段（最值钱的选择）**

第1名：索尼WF-C700N — 降噪33dB，续航7.5h，重量47g
这款是我整体最推荐的，品牌调音 + 可信赖的降噪深度，放在900元以下无敌。

## 最终结论

如果你的预算在300元以内，买SOUNDPEATS Air4 Pro，完全够用。
如果你预算在500-700元，索尼WF-C700N是我目前见过同价位的最优解。
旗舰值不值得买？只有当你对生态有明确需求时才有意义。`,
  generatedArticle: `# 2024年降噪耳机完全购买指南：10款实测，帮你省下不必要的冤枉钱

> **导读**：这篇文章会告诉你一件事——买耳机，不需要花那么多钱。我测试了10款，从199元到1899元，用数据说话。

---

## 一、99%的人选耳机都走错了第一步

绝大多数人选耳机的逻辑是：**品牌 → 价格 → 外观**。

这个顺序本身就是问题所在。

选降噪耳机的正确逻辑应该是：**使用场景 → 降噪指数需求 → 预算匹配**。

先问自己：你主要在哪里用？地铁通勤？开放办公室？长途飞机？不同场景对降噪深度的需求差距极大，"够用"的标准完全不同。

---

## 二、一个数字教你看懂所有耳机参数

**降噪深度（单位：dB）**，这是唯一你需要关注的核心指标。

| 降噪深度 | 实际感受 | 适用场景 |
|---------|---------|---------|
| 35dB+ | 飞机发动机声基本消除 | 飞机、高铁 |
| 28-35dB | 咖啡厅背景音几乎听不到 | 通勤、办公室 |
| 20-28dB | 能感受到降噪效果 | 安静环境提升 |
| 20dB以下 | 降噪存在感弱 | 不建议为降噪买单 |

记住这张表，你在卖场和电商页面就不会被"主动降噪"四个字唬住了。

---

## 三、各价位段最值得买的选择

### 💰 200-400元：平价之王

**SOUNDPEATS Air4 Pro（约299元）**
- 降噪深度：**33dB**（远超同价位平均水平）
- 续航：9小时连续使用
- 延迟：&lt;15ms（游戏视频无感知）
- **结论**：同价位里我测过最强的降噪，没有之一。

### 💰💰 400-800元：性价比甜点区

**索尼 WF-C700N（约599元）**
- 降噪深度：**33dB**
- 续航：7.5小时
- 调音风格：Sony LDAC 高解析，人声清晰
- **结论**：这个价位的终极答案，品牌信任度 + 降噪实力缺一不可。

### 💰💰💰 800元以上：值不值得买？

AirPods Pro 2（降噪45dB）和 Sony WH-1000XM5（降噪42dB）确实是旗舰，但：

> 旗舰耳机的溢价，**70%来自生态和品牌**，只有30%是真实的降噪提升。

如果你不在乎生态，599元的索尼已经能给你旗舰级的降噪体验。

---

## 四、最终推荐清单（按场景）

- **日常通勤 + 预算有限**：SOUNDPEATS Air4 Pro（299元）
- **长时间办公 + 重视音质**：索尼 WF-C700N（599元）
- **商务出差 + 需要全天佩戴**：Sony WH-1000XM5（头戴式，续航30h）
- **苹果全家桶用户**：AirPods Pro 2（生态无缝切换优势明显）

---

如果这篇文章帮你节省了选购时间，点个赞是对我最大的鼓励。下期我会测评运动场景耳机，感兴趣可以先关注。`,
};

export const MOCK_CONTENT_ENGINE = {
  analysisId: "CE-20240414-001",
  sourceUrl: "https://www.tiktok.com/@techreviewer/video/7291234567890123456",
  platform: "tiktok",
  author: "@techreviewer_pro",
  authorAvatar: "https://readdy.ai/api/search-image?query=professional%20tech%20reviewer%20profile%20avatar%20portrait%20young%20asian%20male%20with%20headphones%20studio%20lighting%20clean%20background&width=80&height=80&seq=ce-avatar-01&orientation=squarish",
  fans: "128.4K",
  likes: "24.7K",
  comments: "1,892",
  shares: "3,441",
  publishTime: "2024-04-08",
  duration: "0:47",
  title: "我花了30天对比10款降噪耳机，这才是真相……",
  thumbnail: "https://readdy.ai/api/search-image?query=wireless%20noise%20cancelling%20headphones%20product%20review%20flat%20lay%20dark%20background%20with%20dramatic%20lighting%20professional%20photography%20setup&width=800&height=450&seq=ce-thumb-01&orientation=landscape",
  thumbnailGallery: [
    "https://readdy.ai/api/search-image?query=wireless%20headphones%20unboxing%20review%20close%20up%20product%20photography%20minimal%20white%20background&width=160&height=90&seq=ce-gal-01&orientation=landscape",
    "https://readdy.ai/api/search-image?query=person%20wearing%20headphones%20side%20profile%20studio%20lighting%20review%20comparison&width=160&height=90&seq=ce-gal-02&orientation=landscape",
    "https://readdy.ai/api/search-image?query=headphones%20comparison%20side%20by%20side%20table%20top%20view%20tech%20review&width=160&height=90&seq=ce-gal-03&orientation=landscape",
    "https://readdy.ai/api/search-image?query=headphone%20testing%20sound%20quality%20measurement%20tech%20review%20product&width=160&height=90&seq=ce-gal-04&orientation=landscape",
  ],
  breakdown: {
    hook: {
      type: "悬念 + 对比",
      original: "我花了30天对比10款降噪耳机，这才是真相……",
      explanation: "用「时间成本」暗示可信度，「才是真相」暗示市面上都是错的——强烈激发用户的好奇心和打假欲望，完播率提升估计超40%。",
    },
    structure: [
      { time: "0-3s", label: "Hook", desc: "问题引出 + 悬念设置", color: "#7B61FF" },
      { time: "3-12s", label: "痛点", desc: "展示用户常见错误选择", color: "#fb923c" },
      { time: "12-28s", label: "评测核心", desc: "快速对比5款主流产品", color: "#10b981" },
      { time: "28-40s", label: "结论", desc: "给出推荐排名 + 价格段", color: "#3b82f6" },
      { time: "40-47s", desc: "CTA", label: "CTA", color: "#ef4444" },
    ],
    emotion: {
      primary: "求知欲 + 焦虑",
      tags: ["好奇心", "省钱焦虑", "选择困难", "信息不对称感"],
      intensity: 82,
      description: "通过「30天」和「真相」制造权威感，同时用对比让用户担心自己选错，完美激活消费前的焦虑情绪。",
    },
    visual: {
      composition: "快剪 + 产品特写交替",
      scene: "室内工作台 / 白底对比拍摄",
      styleTag: ["快节奏", "干净背景", "数字字幕", "进度条"],
      description: "黑白背景切换强化对比感，3秒一切镜节奏契合TikTok用户注意力，字幕占60%传达信息密度高。",
    },
    performance: {
      likes: "24.7K",
      comments: "1,892",
      shares: "3,441",
      likeRate: "1.92%",
      signals: [
        { label: "高评论量", insight: "高共鸣 — 用户有强烈意见表达欲" },
        { label: "高分享率", insight: "实用价值强 — 用户愿意分享给朋友" },
        { label: "点赞/播放比", insight: "内容质量高 — 完播率估计 > 65%" },
      ],
    },
  },
  generationControls: {
    types: [
      { id: "video", label: "视频脚本", icon: "ri-video-line", selected: true },
      { id: "image", label: "图文方案", icon: "ri-image-line", selected: true },
      { id: "article", label: "长文", icon: "ri-article-line", selected: false },
      { id: "multiplatform", label: "多平台适配", icon: "ri-global-line", selected: true },
    ],
    styles: ["干货", "情绪", "对比"],
    platforms: [
      { id: "tiktok", label: "TikTok", icon: "ri-tiktok-line" },
      { id: "xiaohongshu", label: "小红书", icon: "ri-heart-line" },
      { id: "youtube", label: "YouTube", icon: "ri-youtube-line" },
      { id: "x", label: "X", icon: "ri-twitter-x-line" },
    ],
  },
  generatedAssets: {
    videoScript: {
      hook: "你花2000块买的降噪耳机，可能比我200块的好不了多少——",
      scenes: [
        { id: 1, duration: "0-3s", shot: "手持两款耳机对比特写", script: "「你花2000块买的降噪耳机，可能比我200块的好不了多少——」" },
        { id: 2, duration: "3-10s", shot: "白底桌面展示三款耳机排列", script: "「我实测了10款，价格从199到1899，降噪这件事，贵的真不一定赢」" },
        { id: 3, duration: "10-22s", shot: "快速切换各产品测试画面", script: "「第一名：XXX，299元，降噪指数87，对比AirPods Pro差距不到8%」" },
        { id: 4, duration: "22-35s", shot: "排名表格动画", script: "「平价之王 vs 旗舰机，差距只在这三个地方……」" },
        { id: 5, duration: "35-45s", shot: "作者出镜 + 产品link", script: "「我把完整排名表放评论区了，帮你省一千块，点个赞支持一下」" },
      ],
      cta: "完整排名表在评论区，帮你省1000块 👇",
    },
    titles: [
      "我花30天测了10款耳机，这些品牌你肯定没想到",
      "平价耳机逆袭旗舰？实测降噪数据出来了",
      "买耳机前一定要看这个！省1000块的选购指南",
      "2024最值得买的5款降噪耳机｜实测排名",
      "为什么我不推荐你买AirPods？真实测评来了",
      "同价位最强降噪耳机TOP5，数据说话不吹牛",
    ],
    seoOutline: {
      title: "2024年10款降噪耳机横评：平价真的能打败旗舰吗？",
      h2List: [
        "测评标准：我们如何衡量降噪效果",
        "TOP 5 推荐：按价格段分类",
        "199-399元档：性价比之王是谁",
        "400-800元档：中端市场的真正王者",
        "旗舰级对比：AirPods Pro vs Sony WH-1000XM5",
        "购买建议：不同场景如何选择",
      ],
    },
    prompts: {
      imagePrompt: "Flat lay product photography of 5 wireless headphones arranged neatly on a clean white marble surface, soft diffused studio lighting, subtle shadows, professional product review style, 8K sharp detail",
      videoPrompt: "Dynamic tech review video style, quick cuts between headphone close-ups and comparison charts, dark background with bright product highlights, modern motion graphics, 4K cinematic look",
    },
    clips: [
      { id: 1, timeRange: "0:03-0:15", title: "最强开头Hook片段", desc: "完整的Hook结构，可独立发布引流", engagement: "高" },
      { id: 2, timeRange: "0:12-0:28", title: "核心评测对比切片", desc: "产品对比数据最密集段，适合图文转化", engagement: "极高" },
      { id: 3, timeRange: "0:35-0:47", title: "CTA行动呼吁片段", desc: "最终推荐+转化引导，适合广告素材", engagement: "高" },
    ],
    imagePosts: [
      { page: 1, title: "封面", copy: "我测了10款耳机，只推荐这3款 👇" },
      { page: 2, title: "痛点", copy: "你选耳机是不是总被这些坑中过？→ 价格越贵越好 → 大牌一定行" },
      { page: 3, title: "排名", copy: "实测TOP3排名（按性价比）#1 XXX 299元 #2 YYY 499元 #3 ZZZ 199元" },
      { page: 4, title: "结论", copy: "200块的耳机降噪真的够用！完整评测在主页🔗" },
    ],
  },
};
