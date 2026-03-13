import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  zh: {
    // Navigation
    'nav.home': '首页',
    'nav.product': '产品',
    'nav.cases': '案例',
    'nav.about': '关于',
    'nav.workspace': '工作台',
    'nav.login': '登录',
    'nav.logout': '退出',

    // Home
    'home.hero.title': '将市场对话转化为',
    'home.hero.highlight': '营销策略',
    'home.hero.subtitle': 'GlobalPulse AI 分析社交媒体讨论和 SEO 内容，发现市场机会并生成内容创意',
    'home.analyzing': '正在分析市场数据...',
    'home.analyzing.en': 'Analyzing market data...',
    'home.analysisFailed': '分析失败，请稍后重试',
    'home.analysisFailed.en': 'Analysis failed, please try again later',

    'home.feature1.title': '需求分析',
    'home.feature1.desc': '分析 Reddit 社区讨论，了解用户真实需求和痛点',
    'home.feature2.title': '竞争分析',
    'home.feature2.desc': '扫描 SEO 内容供给，识别市场竞争空白',
    'home.feature3.title': '内容生成',
    'home.feature3.desc': '基于差距分析，生成高价值内容创意',

    // Product
    'product.title': '产品功能',
    'product.subtitle': '全方位的市场分析解决方案，助您把握营销机遇',
    'product.feature1.title': '需求分析',
    'product.feature1.desc': '深入分析 Reddit 社区讨论，挖掘用户真实需求和市场痛点，精准把握目标用户心声',
    'product.feature1.f1': '话题提取',
    'product.feature1.f2': '情绪分析',
    'product.feature1.f3': '趋势识别',
    'product.feature2.title': '竞争分析',
    'product.feature2.desc': '全面扫描 SEO 内容供给，分析竞争对手策略，识别市场空白和机会点',
    'product.feature2.f1': '关键词分析',
    'product.feature2.f2': '内容统计',
    'product.feature2.f3': '差距识别',
    'product.feature3.title': '智能推荐',
    'product.feature3.desc': '基于需求和供给的对比分析，自动生成高价值内容创意，提升营销效率',
    'product.feature3.f1': '创意生成',
    'product.feature3.f2': '格式多样化',
    'product.feature3.f3': '理由说明',
    'product.feature4.title': '数据洞察',
    'product.feature4.desc': '整合多维数据源，提供机会得分、市场趋势等关键指标，辅助决策',
    'product.feature4.f1': '可视化报表',
    'product.feature4.f2': '数据导出',
    'product.feature4.f3': '历史追踪',
    'product.cta.title': '开始使用',
    'product.cta.desc': '立即体验 GlobalPulse AI 的强大分析能力，发现您的下一个市场机会',
    'product.cta.button': '免费试用',

    // Cases
    'cases.title': '成功案例',
    'cases.subtitle': '看看其他企业如何使用 GlobalPulse AI 取得成果',
    'cases.tag1': 'SaaS',
    'cases.case1.title': 'AI 工具推广',
    'cases.case1.client': '某 AI 编程助手公司',
    'cases.case1.desc': '通过分析 Reddit 讨论热点，发现用户对 AI 编程工具的真实需求，生成针对性内容策略。',
    'cases.tag2': '电商',
    'cases.case2.title': 'Shopify SEO 优化',
    'cases.case2.client': '某跨境电商平台',
    'cases.case2.desc': '分析 SEO 供给与 Reddit 需求的差距，找到低竞争高价值的关键词，优化内容策略。',
    'cases.tag3': '营销',
    'cases.case3.title': '内容营销转型',
    'cases.case3.client': '某营销自动化服务商',
    'cases.case3.desc': '利用智能内容创意生成，快速产出高质量营销内容，显著提升市场响应速度。',
    'cases.tag4': '教育',
    'cases.case4.title': '在线课程推广',
    'cases.case4.client': '某在线教育平台',
    'cases.case4.desc': '分析学习者在 Reddit 的讨论内容，发现课程推广的痛点和机会，精准定位目标用户。',
    'cases.tag5': '科技',
    'cases.case5.title': '开发者工具推广',
    'cases.case5.client': '某开发者工具厂商',
    'cases.case5.desc': '通过分析开发者社区的讨论趋势，创建符合需求的内容，提升品牌在目标受众中的认知度。',
    'cases.tag6': '咨询',
    'cases.case6.title': 'B2B 营销优化',
    'cases.case6.client': '某 B2B 软件服务商',
    'cases.case6.desc': '分析 B2B 决策者的关注点，生成专业内容，提升线索质量和转化效率。',
    'cases.cta.title': '成为下一个成功案例',
    'cases.cta.desc': '立即开始使用 GlobalPulse AI，发现属于您的市场机会',
    'cases.cta.button': '开始免费试用',
    'cases.r1.label': '内容机会',
    'cases.r2.label': '流量增长',
    'cases.r3.label': '转化率提升',
    'cases.r4.label': '关键词机会',
    'cases.r5.label': '搜索排名',
    'cases.r6.label': 'ROI 提升',
    'cases.r7.label': '创意生成',
    'cases.r8.label': '创作效率',
    'cases.r9.label': '用户互动',
    'cases.r10.label': '市场洞察',
    'cases.r11.label': '报名转化',
    'cases.r12.label': '内容产出',
    'cases.r13.label': '社群影响力',
    'cases.r14.label': '自然流量',
    'cases.r15.label': '品牌认知',
    'cases.r16.label': '线索质量',
    'cases.r17.label': '销售周期',
    'cases.r18.label': '市场覆盖',

    // About
    'about.title': '关于我们',
    'about.subtitle': '用 AI 技术赋能市场营销，帮助企业在数据中发现机遇',
    'about.mission.title': '我们的使命',
    'about.mission.desc': 'GlobalPulse AI 致力于通过先进的 AI 技术，帮助企业和营销人员实时洞察市场动态，深度分析用户需求，发现内容机会，从而做出更明智的营销决策。我们相信，数据驱动的营销策略是未来成功的关键。',
    'about.values.title': '我们的价值观',
    'about.values.precise.title': '精准',
    'about.values.precise.desc': '基于真实数据和 AI 分析，提供精准的市场洞察和内容建议，拒绝盲目猜测',
    'about.values.efficient.title': '高效',
    'about.values.efficient.desc': '自动化分析流程，大幅提升营销效率，让团队专注于创意和策略',
    'about.values.reliable.title': '可靠',
    'about.values.reliable.desc': '数据来源权威，分析算法严谨，结果可验证，值得您信赖',
    'about.why.title': '为什么选择我们',
    'about.why.1.title': 'AI 驱动的分析',
    'about.why.1.desc': '利用最先进的自然语言处理和机器学习技术，深度挖掘社交媒体和 SEO 数据',
    'about.why.2.title': '多维数据整合',
    'about.why.2.desc': '同时分析 Reddit、SEO 等多个数据源，提供全方位的市场视角',
    'about.why.3.title': '实时市场洞察',
    'about.why.3.desc': '捕捉最新趋势和热点，帮助您快速响应市场变化',
    'about.why.4.title': '可操作的建议',
    'about.why.4.desc': '不只是数据报告，更提供可直接执行的内容创意和策略建议',
    'about.contact.title': '联系我们',
    'about.contact.email': '邮箱联系',
    'about.contact.email.value': 'chuckyang360@gmail.com',
    'about.contact.follow': '关注我们',
    'about.contact.follow.value': '@GlobalPulseAI',
    'about.contact.address': '公司地址',
    'about.contact.address.value': '杭州市越响信息科技有限公司',
    'about.contact.person': '联系人',
    'about.contact.person.value': '杨克',
    'about.cta.title': '准备好开始了吗？',
    'about.cta.desc': '加入 GlobalPulse AI，让数据驱动您的营销决策',
    'about.cta.button': '免费开始使用',

    // Common
    'common.start': '开始使用',
    'common.tryFree': '免费试用',
    'common.tryFreeNow': '开始免费试用',
    'common.learnMore': '了解更多',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.product': 'Product',
    'nav.cases': 'Cases',
    'nav.about': 'About',
    'nav.workspace': 'Workspace',
    'nav.login': 'Login',
    'nav.logout': 'Logout',

    // Home
    'home.hero.title': 'Turn Market Conversation into',
    'home.hero.highlight': 'Marketing Strategy',
    'home.hero.subtitle': 'GlobalPulse AI analyzes social media discussions and SEO content to discover market opportunities and generate content ideas',
    'home.analyzing': '正在分析市场数据...',
    'home.analyzing.en': 'Analyzing market data...',
    'home.analysisFailed': '分析失败，请稍后重试',
    'home.analysisFailed.en': 'Analysis failed, please try again later',

    'home.feature1.title': 'Demand Analysis',
    'home.feature1.desc': 'Analyze Reddit community discussions to understand real user needs and pain points',
    'home.feature2.title': 'Competition Analysis',
    'home.feature2.desc': 'Scan SEO content supply to identify market competition gaps',
    'home.feature3.title': 'Content Generation',
    'home.feature3.desc': 'Generate high-value content ideas based on gap analysis',

    // Product
    'product.title': 'Product Features',
    'product.subtitle': 'Comprehensive market analysis solutions to help you seize marketing opportunities',
    'product.feature1.title': 'Demand Analysis',
    'product.feature1.desc': 'Deep dive into Reddit community discussions to mine real user needs and market pain points, precisely understanding target audience',
    'product.feature1.f1': 'Topic Extraction',
    'product.feature1.f2': 'Sentiment Analysis',
    'product.feature1.f3': 'Trend Identification',
    'product.feature2.title': 'Competition Analysis',
    'product.feature2.desc': 'Comprehensive scan of SEO content supply, analyze competitor strategies, identify market gaps and opportunities',
    'product.feature2.f1': 'Keyword Analysis',
    'product.feature2.f2': 'Content Statistics',
    'product.feature2.f3': 'Gap Identification',
    'product.feature3.title': 'Smart Recommendation',
    'product.feature3.desc': 'Based on demand-supply comparison analysis, automatically generate high-value content ideas to improve marketing efficiency',
    'product.feature3.f1': 'Idea Generation',
    'product.feature3.f2': 'Format Diversity',
    'product.feature3.f3': 'Reason Explanation',
    'product.feature4.title': 'Data Insights',
    'product.feature4.desc': 'Integrate multiple data sources to provide key metrics like opportunity scores and market trends to support decisions',
    'product.feature4.f1': 'Visual Reports',
    'product.feature4.f2': 'Data Export',
    'product.feature4.f3': 'History Tracking',
    'product.cta.title': 'Get Started',
    'product.cta.desc': 'Experience the powerful analysis capabilities of GlobalPulse AI now and discover your next market opportunity',
    'product.cta.button': 'Try Free',

    // Cases
    'cases.title': 'Success Stories',
    'cases.subtitle': 'See how other businesses use GlobalPulse AI to achieve results',
    'cases.tag1': 'SaaS',
    'cases.case1.title': 'AI Tool Promotion',
    'cases.case1.client': 'AI Coding Assistant Company',
    'cases.case1.desc': 'By analyzing Reddit discussion hotspots, discovered real user needs for AI coding tools, generated targeted content strategies.',
    'cases.tag2': 'E-commerce',
    'cases.case2.title': 'Shopify SEO Optimization',
    'cases.case2.client': 'Cross-border E-commerce Platform',
    'cases.case2.desc': 'Analyzed the gap between SEO supply and Reddit demand, found low-competition high-value keywords, optimized content strategy.',
    'cases.tag3': 'Marketing',
    'cases.case3.title': 'Content Marketing Transformation',
    'cases.case3.client': 'Marketing Automation Service Provider',
    'cases.case3.desc': 'Leveraged intelligent content idea generation to quickly produce high-quality marketing content, significantly improved market response speed.',
    'cases.tag4': 'Education',
    'cases.case4.title': 'Online Course Promotion',
    'cases.case4.client': 'Online Education Platform',
    'cases.case4.desc': 'Analyzed learner discussions on Reddit, discovered pain points and opportunities for course promotion, precisely targeted users.',
    'cases.tag5': 'Tech',
    'cases.case5.title': 'Developer Tool Promotion',
    'cases.case5.client': 'Developer Tool Vendor',
    'cases.case5.desc': 'By analyzing discussion trends in developer communities, created content that meets needs, enhanced brand awareness among target audience.',
    'cases.tag6': 'Consulting',
    'cases.case6.title': 'B2B Marketing Optimization',
    'cases.case6.client': 'B2B Software Service Provider',
    'cases.case6.desc': 'Analyzed B2B decision makers\' concerns, generated professional content, improved lead quality and conversion efficiency.',
    'cases.cta.title': 'Be the Next Success Story',
    'cases.cta.desc': 'Start using GlobalPulse AI now and discover market opportunities for you',
    'cases.cta.button': 'Start Free Trial',
    'cases.r1.label': 'Content Opportunities',
    'cases.r2.label': 'Traffic Growth',
    'cases.r3.label': 'Conversion Increase',
    'cases.r4.label': 'Keyword Opportunities',
    'cases.r5.label': 'Search Ranking',
    'cases.r6.label': 'ROI Increase',
    'cases.r7.label': 'Idea Generation',
    'cases.r8.label': 'Creation Efficiency',
    'cases.r9.label': 'User Engagement',
    'cases.r10.label': 'Market Insights',
    'cases.r11.label': 'Enrollment Conversion',
    'cases.r12.label': 'Content Output',
    'cases.r13.label': 'Community Influence',
    'cases.r14.label': 'Organic Traffic',
    'cases.r15.label': 'Brand Awareness',
    'cases.r16.label': 'Lead Quality',
    'cases.r17.label': 'Sales Cycle',
    'cases.r18.label': 'Market Coverage',

    // About
    'about.title': 'About Us',
    'about.subtitle': 'Empowering marketing with AI technology to help businesses discover opportunities in data',
    'about.mission.title': 'Our Mission',
    'about.mission.desc': 'GlobalPulse AI is committed to helping enterprises and marketers gain real-time market insights, deeply analyze user needs, discover content opportunities, and make smarter marketing decisions through advanced AI technology. We believe data-driven marketing strategies are key to future success.',
    'about.values.title': 'Our Values',
    'about.values.precise.title': 'Precision',
    'about.values.precise.desc': 'Based on real data and AI analysis, provide precise market insights and content recommendations, no blind guessing',
    'about.values.efficient.title': 'Efficiency',
    'about.values.efficient.desc': 'Automated analysis processes, greatly improve marketing efficiency, let teams focus on creativity and strategy',
    'about.values.reliable.title': 'Reliability',
    'about.values.reliable.desc': 'Authoritative data sources, rigorous analysis algorithms, verifiable results, worth your trust',
    'about.why.title': 'Why Choose Us',
    'about.why.1.title': 'AI-Powered Analysis',
    'about.why.1.desc': 'Leverage cutting-edge natural language processing and machine learning to deeply mine social media and SEO data',
    'about.why.2.title': 'Multi-Dimensional Data Integration',
    'about.why.2.desc': 'Analyze multiple data sources like Reddit, SEO simultaneously, providing comprehensive market perspectives',
    'about.why.3.title': 'Real-Time Market Insights',
    'about.why.3.desc': 'Capture latest trends and hotspots, help you quickly respond to market changes',
    'about.why.4.title': 'Actionable Recommendations',
    'about.why.4.desc': 'Not just data reports, but directly executable content ideas and strategy recommendations',
    'about.contact.title': 'Contact Us',
    'about.contact.email': 'Email Contact',
    'about.contact.email.value': 'chuckyang360@gmail.com',
    'about.contact.follow': 'Follow Us',
    'about.contact.follow.value': '@GlobalPulseAI',
    'about.contact.address': 'Company Address',
    'about.contact.address.value': 'Hangzhou Yuexiang Information Technology Co., Ltd.',
    'about.contact.person': 'Contact Person',
    'about.contact.person.value': 'Yang Ke',
    'about.cta.title': 'Ready to Start?',
    'about.cta.desc': 'Join GlobalPulse AI and let data drive your marketing decisions',
    'about.cta.button': 'Start for Free',

    // Common
    'common.start': 'Get Started',
    'common.tryFree': 'Try Free',
    'common.tryFreeNow': 'Start Free Trial',
    'common.learnMore': 'Learn More',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('gp_language') as Language;
    return saved && (saved === 'zh' || saved === 'en') ? saved : 'zh';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gp_language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
