import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  zh: {
    // Navigation
    'nav.home': '首页',
    'nav.product': '产品',
    'nav.cases': '案例',
    'nav.contact': '联系我们',
    'nav.about': '关于我们',
    'nav.login': '登录',
    'nav.register': '注册',
    'nav.seo': 'SEO分析',
    'nav.reddit': 'Reddit热点',
    'nav.twitter': 'X舆情分析',
    'nav.content': '内容生成',
    'nav.summary': '数据总结',
    'nav.history': '历史记录',
    
    // Hero Section
    'hero.title': 'Growth Intelligence for Global Markets',
    'hero.subtitle': '基于多智能体的营销分析和内容生成系统',
    'hero.description': '利用AI驱动的多专业分析引擎，自动化处理市场营销中的各种任务，助力您的品牌在全球市场中快速成长',
    'hero.cta.demo': '预约演示',
    'hero.cta.start': '立即开始',
    
    // Product Section
    'product.title': '强大的AI营销能力',
    'product.subtitle': '5大核心引擎，全方位覆盖营销分析需求',
    'product.seo.title': 'SEO分析引擎',
    'product.seo.description': '深度分析关键词趋势、竞争对手策略，提供页面优化建议和排名预测',
    'product.reddit.title': 'Reddit热点挖掘',
    'product.reddit.description': '实时监控热门话题和社区讨论，精准捕捉用户情感和潜在机会',
    'product.twitter.title': 'X舆情监控',
    'product.twitter.description': '全天候监控品牌提及和舆论趋势，及时预警潜在危机',
    'product.content.title': '智能内容生成',
    'product.content.description': '基于数据洞察自动生成营销文案、社交媒体内容和博客草稿',
    'product.summary.title': '数据整合总结',
    'product.summary.description': '整合所有分析结果，生成综合报告和可执行的策略建议',
    
    // Cases Section
    'cases.title': '成功案例',
    'cases.subtitle': '看看我们如何帮助企业实现营销目标',
    'cases.tech.title': '科技公司SEO优化',
    'cases.tech.description': '3个月内自然流量增长300%，关键词排名提升至首页前5位',
    'cases.tech.metrics': '流量增长 300% | 转化率提升 180%',
    'cases.ecommerce.title': '电商品牌社交媒体营销',
    'cases.ecommerce.description': '通过Reddit和X平台热点挖掘，成功引爆多个爆款产品',
    'cases.ecommerce.metrics': 'ROI提升 250% | 粉丝增长 150K+',
    'cases.saas.title': 'SaaS企业内容营销',
    'cases.saas.description': '自动化内容生成，每月产出50+高质量营销内容',
    'cases.saas.metrics': '内容产出 50+/月 | 获客成本降低 40%',
    
    // Contact Section
    'contact.title': '预约咨询',
    'contact.subtitle': '让我们一起探讨如何提升您的营销效果',
    'contact.name': '姓名',
    'contact.email': '邮箱',
    'contact.company': '公司名称',
    'contact.message': '您的需求',
    'contact.submit': '提交咨询',
    'contact.success': '提交成功！我们将在24小时内与您联系',
    
    // Footer
    'footer.product': '产品',
    'footer.company': '公司',
    'footer.support': '支持',
    'footer.about': '关于我们',
    'footer.blog': '博客',
    'footer.careers': '招聘',
    'footer.help': '帮助中心',
    'footer.docs': '文档',
    'footer.api': 'API',
    'footer.rights': '© 2026 GlobalPulseAI. 保留所有权利。',
    
    // About Page
    'about.tag': '关于我们',
    'about.hero.title': '连接全球市场的智能营销引擎',
    'about.hero.subtitle': 'GlobalPulseAI 是杭州越响信息科技有限公司旗下的核心产品，致力于用AI技术重塑全球营销格局',
    
    'about.company.tag': '公司简介',
    'about.company.title': '杭州越响信息科技有限公司',
    'about.company.name': 'GlobalPulseAI',
    'about.company.name.full': '杭州越响信息科技有限公司',
    'about.company.intro1': '杭州越响信息科技有限公司成立于2024年，专注于AI驱动的营销智能解决方案。我们的核心产品GlobalPulseAI是一个基于多智能体架构的营销分析和内容生成平台，旨在帮助企业在全球市场中获得竞争优势。',
    'about.company.intro2': '通过整合先进的AI技术和深度行业洞察，我们为客户提供SEO优化、社交媒体监控、舆情分析、智能内容生成等全方位营销服务。我们的使命是让每一个企业都能用上最先进的营销智能工具，在全球化的竞争中脱颖而出。',
    'about.company.intro3': '我们相信，AI不应该是大企业的专属，而应该让每个有梦想的创业者和营销人都能轻松使用。GlobalPulseAI正在让这一愿景成为现实。',
    
    'about.product.tag': '核心能力',
    'about.product.title': '五大AI引擎，驱动营销增长',
    'about.product.subtitle': '基于多智能体架构，每个引擎专注于特定领域，协同工作创造最大价值',
    'about.product.feature1.title': 'SEO分析引擎',
    'about.product.feature1.description': '深度挖掘关键词机会，分析竞争对手策略，提供数据驱动的优化建议，帮助您在搜索结果中脱颖而出。',
    'about.product.feature2.title': 'Reddit & X监控',
    'about.product.feature2.description': '实时捕捉社交媒体热点和用户声音，识别潜在机会，及时响应品牌危机，让您始终掌握市场脉搏。',
    'about.product.feature3.title': '智能内容生成',
    'about.product.feature3.description': '基于数据洞察自动创作高质量营销内容，从社交帖子到博客文章，大幅提升内容生产效率。',
    
    'about.team.tag': '我们的团队',
    'about.team.title': '由技术专家和营销达人组成',
    'about.team.description': '我们的团队汇集了来自顶尖科技公司的AI工程师、资深营销专家和行业顾问。我们相信技术与经验的结合，能够创造真正有价值的产品。',
    'about.team.stat1.number': '10+',
    'about.team.stat1.label': '核心团队成员',
    'about.team.stat2.number': '50+',
    'about.team.stat2.label': '服务企业客户',
    'about.team.stat3.number': '15+',
    'about.team.stat3.label': '行业经验年限',
    
    'about.business.tag': '商务合作',
    'about.business.title': '期待与您合作',
    'about.business.subtitle': '无论是产品试用、商务合作还是技术交流，我们都欢迎您的联系',
    'about.business.contact.title': '商务联系人',
    'about.business.contact.name': 'Chuck Yang - 商务拓展总监',
    'about.business.contact.button': '发送邮件',
    'about.business.partner.title': '合作机会',
    'about.business.partner.item1': '渠道合作伙伴',
    'about.business.partner.item2': '技术集成合作',
    'about.business.partner.item3': '行业解决方案定制',
    'about.business.service.title': '服务咨询',
    'about.business.service.item1': '企业级定制服务',
    'about.business.service.item2': '产品演示与试用',
    'about.business.service.item3': '营销策略咨询',
    
    // SEO Analysis
    'seo.title': 'SEO分析',
    'seo.description': '分析关键词趋势、竞争对手SEO策略，获取页面优化建议',
    'seo.input.keywords': '关键词列表',
    'seo.input.keywords.placeholder': '输入关键词，用逗号分隔',
    'seo.input.url': '网站URL',
    'seo.input.url.placeholder': 'https://example.com',
    'seo.input.competitors': '竞争对手',
    'seo.input.competitors.placeholder': '输入竞争对手URL，用逗号分隔',
    'seo.button.analyze': '开始分析',
    'seo.result.title': 'SEO分析报告',
    'seo.result.keywords': '关键词分析',
    'seo.result.ranking': '排名预测',
    'seo.result.suggestions': '优化建议',
    
    // Reddit Analysis
    'reddit.title': 'Reddit热点挖掘',
    'reddit.description': '监控Reddit热门话题、社区讨论和用户情感',
    'reddit.input.subreddits': '子版块列表',
    'reddit.input.subreddits.placeholder': '输入子版块名称，用逗号分隔',
    'reddit.input.keywords': '关键词',
    'reddit.input.keywords.placeholder': '输入关键词，用逗号分隔',
    'reddit.input.timeRange': '时间范围',
    'reddit.button.analyze': '开始挖掘',
    'reddit.result.title': 'Reddit热点分析报告',
    'reddit.result.trending': '热门话题',
    'reddit.result.sentiment': '情感分析',
    'reddit.result.opportunities': '潜在机会',
    
    // Twitter Analysis
    'twitter.title': 'X舆情分析',
    'twitter.description': '监控X平台品牌提及、舆论趋势和危机预警',
    'twitter.input.brand': '品牌关键词',
    'twitter.input.brand.placeholder': '输入品牌关键词',
    'twitter.input.competitors': '竞品账号',
    'twitter.input.competitors.placeholder': '输入竞品账号，用逗号分隔',
    'twitter.input.hashtags': '话题标签',
    'twitter.input.hashtags.placeholder': '输入话题标签，用逗号分隔',
    'twitter.button.analyze': '开始监控',
    'twitter.result.title': 'X舆情分析报告',
    'twitter.result.mentions': '品牌提及',
    'twitter.result.sentiment': '舆论趋势',
    'twitter.result.influencers': '影响者识别',
    'twitter.result.alerts': '危机预警',
    
    // Content Generation
    'content.title': '内容生成',
    'content.description': '基于数据分析生成营销内容、文案和社交媒体帖子',
    'content.input.data': '数据分析结果',
    'content.input.data.placeholder': '粘贴分析结果或输入关键数据',
    'content.input.tone': '品牌调性',
    'content.input.tone.placeholder': '描述您的品牌调性（如：专业、活泼、温暖）',
    'content.input.audience': '目标受众',
    'content.input.audience.placeholder': '描述目标受众特征',
    'content.input.type': '内容类型',
    'content.type.social': '社交媒体帖子',
    'content.type.blog': '博客文章',
    'content.type.ad': '广告文案',
    'content.type.email': '邮件营销',
    'content.button.generate': '生成内容',
    'content.result.title': '生成的内容',
    
    // Data Summary
    'summary.title': '数据总结',
    'summary.description': '整合各分析引擎的输出，生成综合营销报告',
    'summary.input.title': '输入各分析结果',
    'summary.input.seo': 'SEO分析结果',
    'summary.input.reddit': 'Reddit分析结果',
    'summary.input.twitter': 'X舆情分析结果',
    'summary.button.generate': '生成综合报告',
    'summary.result.title': '综合营销报告',
    'summary.result.insights': '关键洞察',
    'summary.result.strategies': '策略建议',
    'summary.result.actions': '行动项',
    
    // History
    'history.title': '历史记录',
    'history.description': '查看您的所有分析记录',
    'history.empty': '暂无历史记录',
    'history.type': '类型',
    'history.time': '时间',
    'history.actions': '操作',
    'history.view': '查看',
    'history.delete': '删除',
    
    // Common
    'common.loading': '加载中...',
    'common.error': '出错了',
    'common.success': '成功',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.save': '保存',
    'common.export': '导出',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.product': 'Product',
    'nav.cases': 'Cases',
    'nav.contact': 'Contact',
    'nav.about': 'About',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.seo': 'SEO Analysis',
    'nav.reddit': 'Reddit Insights',
    'nav.twitter': 'X Monitoring',
    'nav.content': 'Content Gen',
    'nav.summary': 'Data Summary',
    'nav.history': 'History',
    
    // Hero Section
    'hero.title': 'Growth Intelligence for Global Markets',
    'hero.subtitle': 'Multi-Agent Marketing Analysis & Content Generation Platform',
    'hero.description': 'Leverage AI-powered multi-agent analysis engines to automate marketing tasks and accelerate your brand growth in global markets',
    'hero.cta.demo': 'Book Demo',
    'hero.cta.start': 'Get Started',
    
    // Product Section
    'product.title': 'Powerful AI Marketing Capabilities',
    'product.subtitle': '5 Core Engines for Comprehensive Marketing Analysis',
    'product.seo.title': 'SEO Analysis Engine',
    'product.seo.description': 'Deep analysis of keyword trends, competitor strategies, with page optimization suggestions and ranking predictions',
    'product.reddit.title': 'Reddit Trend Mining',
    'product.reddit.description': 'Real-time monitoring of trending topics and community discussions, capturing user sentiment and opportunities',
    'product.twitter.title': 'X Sentiment Monitoring',
    'product.twitter.description': '24/7 monitoring of brand mentions and trends, with timely crisis alerts',
    'product.content.title': 'Smart Content Generation',
    'product.content.description': 'Auto-generate marketing copy, social media content, and blog drafts based on data insights',
    'product.summary.title': 'Data Integration',
    'product.summary.description': 'Integrate all analysis results into comprehensive reports with actionable strategic recommendations',
    
    // Cases Section
    'cases.title': 'Success Stories',
    'cases.subtitle': 'See how we help businesses achieve marketing goals',
    'cases.tech.title': 'Tech Company SEO Optimization',
    'cases.tech.description': '300% organic traffic growth in 3 months, keywords ranked top 5 on first page',
    'cases.tech.metrics': '300% Traffic Growth | 180% Conversion Increase',
    'cases.ecommerce.title': 'E-commerce Social Media Marketing',
    'cases.ecommerce.description': 'Successfully launched multiple hit products through Reddit and X trend mining',
    'cases.ecommerce.metrics': '250% ROI Increase | 150K+ Followers',
    'cases.saas.title': 'SaaS Content Marketing',
    'cases.saas.description': 'Automated content generation producing 50+ high-quality marketing pieces monthly',
    'cases.saas.metrics': '50+ Content/Month | 40% CAC Reduction',
    
    // Contact Section
    'contact.title': 'Book a Consultation',
    'contact.subtitle': "Let's discuss how to enhance your marketing performance",
    'contact.name': 'Name',
    'contact.email': 'Email',
    'contact.company': 'Company',
    'contact.message': 'Your Requirements',
    'contact.submit': 'Submit',
    'contact.success': 'Success! We will contact you within 24 hours',
    
    // Footer
    'footer.product': 'Product',
    'footer.company': 'Company',
    'footer.support': 'Support',
    'footer.about': 'About',
    'footer.blog': 'Blog',
    'footer.careers': 'Careers',
    'footer.help': 'Help Center',
    'footer.docs': 'Docs',
    'footer.api': 'API',
    'footer.rights': '© 2026 GlobalPulseAI. All rights reserved.',
    
    // About Page
    'about.tag': 'About Us',
    'about.hero.title': 'Smart Marketing Engine Connecting Global Markets',
    'about.hero.subtitle': 'GlobalPulseAI is the core product of Hangzhou YueXiang Information Technology Co., Ltd., dedicated to reshaping the global marketing landscape with AI technology',
    
    'about.company.tag': 'Company Profile',
    'about.company.title': 'Hangzhou YueXiang Information Technology Co., Ltd.',
    'about.company.name': 'GlobalPulseAI',
    'about.company.name.full': 'Hangzhou YueXiang Information Technology Co., Ltd.',
    'about.company.intro1': 'Hangzhou YueXiang Information Technology Co., Ltd. was founded in 2024, focusing on AI-driven marketing intelligence solutions. Our core product, GlobalPulseAI, is a multi-agent architecture-based marketing analysis and content generation platform, aiming to help businesses gain a competitive edge in global markets.',
    'about.company.intro2': 'By integrating advanced AI technologies and deep industry insights, we provide our clients with comprehensive marketing services including SEO optimization, social media monitoring, sentiment analysis, and smart content generation. Our mission is to equip every business with the most advanced marketing intelligence tools, enabling them to stand out in the global competition.',
    'about.company.intro3': 'We believe that AI should not be exclusive to large enterprises but should be accessible to every entrepreneur and marketer with a dream. GlobalPulseAI is making this vision a reality.',
    
    'about.product.tag': 'Core Capabilities',
    'about.product.title': 'Five AI Engines Driving Marketing Growth',
    'about.product.subtitle': 'Based on a multi-agent architecture, each engine focuses on a specific domain, working together to create maximum value',
    'about.product.feature1.title': 'SEO Analysis Engine',
    'about.product.feature1.description': 'Deeply挖掘 keyword opportunities, analyze competitor strategies, provide data-driven optimization suggestions, helping you stand out in search results.',
    'about.product.feature2.title': 'Reddit & X Monitoring',
    'about.product.feature2.description': 'Real-time capture of social media hotspots and user voices, identify potential opportunities, promptly respond to brand crises, keeping you always in touch with market pulses.',
    'about.product.feature3.title': 'Smart Content Generation',
    'about.product.feature3.description': 'Automatically create high-quality marketing content based on data insights, from social posts to blog articles, significantly improving content production efficiency.',
    
    'about.team.tag': 'Our Team',
    'about.team.title': 'Composed of Technology Experts and Marketing Gurus',
    'about.team.description': 'Our team gathers AI engineers from top technology companies, seasoned marketing experts, and industry consultants. We believe that the combination of technology and experience can create truly valuable products.',
    'about.team.stat1.number': '10+',
    'about.team.stat1.label': 'Core Team Members',
    'about.team.stat2.number': '50+',
    'about.team.stat2.label': 'Enterprise Clients Served',
    'about.team.stat3.number': '15+',
    'about.team.stat3.label': 'Years of Industry Experience',
    
    'about.business.tag': 'Business Cooperation',
    'about.business.title': 'Looking Forward to Your Cooperation',
    'about.business.subtitle': 'Whether it\'s product trials, business partnerships, or technical exchanges, we welcome your contact',
    'about.business.contact.title': 'Business Contact',
    'about.business.contact.name': 'Chuck Yang - Director of Business Development',
    'about.business.contact.button': 'Send Email',
    'about.business.partner.title': 'Cooperation Opportunities',
    'about.business.partner.item1': 'Channel Partners',
    'about.business.partner.item2': 'Technology Integration Partnerships',
    'about.business.partner.item3': 'Customized Industry Solutions',
    'about.business.service.title': 'Service Consultation',
    'about.business.service.item1': 'Enterprise Customized Services',
    'about.business.service.item2': 'Product Demonstrations and Trials',
    'about.business.service.item3': 'Marketing Strategy Consultation',
    
    // SEO Analysis
    'seo.title': 'SEO Analysis',
    'seo.description': 'Analyze keyword trends, competitor SEO strategies, get page optimization suggestions',
    'seo.input.keywords': 'Keywords',
    'seo.input.keywords.placeholder': 'Enter keywords, comma separated',
    'seo.input.url': 'Website URL',
    'seo.input.url.placeholder': 'https://example.com',
    'seo.input.competitors': 'Competitors',
    'seo.input.competitors.placeholder': 'Enter competitor URLs, comma separated',
    'seo.button.analyze': 'Start Analysis',
    'seo.result.title': 'SEO Analysis Report',
    'seo.result.keywords': 'Keyword Analysis',
    'seo.result.ranking': 'Ranking Prediction',
    'seo.result.suggestions': 'Optimization Suggestions',
    
    // Reddit Analysis
    'reddit.title': 'Reddit Trend Mining',
    'reddit.description': 'Monitor Reddit trending topics, community discussions and user sentiment',
    'reddit.input.subreddits': 'Subreddits',
    'reddit.input.subreddits.placeholder': 'Enter subreddit names, comma separated',
    'reddit.input.keywords': 'Keywords',
    'reddit.input.keywords.placeholder': 'Enter keywords, comma separated',
    'reddit.input.timeRange': 'Time Range',
    'reddit.button.analyze': 'Start Mining',
    'reddit.result.title': 'Reddit Trend Analysis Report',
    'reddit.result.trending': 'Trending Topics',
    'reddit.result.sentiment': 'Sentiment Analysis',
    'reddit.result.opportunities': 'Opportunities',
    
    // Twitter Analysis
    'twitter.title': 'X Sentiment Analysis',
    'twitter.description': 'Monitor brand mentions, sentiment trends and crisis alerts on X platform',
    'twitter.input.brand': 'Brand Keywords',
    'twitter.input.brand.placeholder': 'Enter brand keywords',
    'twitter.input.competitors': 'Competitor Accounts',
    'twitter.input.competitors.placeholder': 'Enter competitor accounts, comma separated',
    'twitter.input.hashtags': 'Hashtags',
    'twitter.input.hashtags.placeholder': 'Enter hashtags, comma separated',
    'twitter.button.analyze': 'Start Monitoring',
    'twitter.result.title': 'X Sentiment Analysis Report',
    'twitter.result.mentions': 'Brand Mentions',
    'twitter.result.sentiment': 'Sentiment Trends',
    'twitter.result.influencers': 'Influencer Identification',
    'twitter.result.alerts': 'Crisis Alerts',
    
    // Content Generation
    'content.title': 'Content Generation',
    'content.description': 'Generate marketing content, copy and social media posts based on data analysis',
    'content.input.data': 'Analysis Data',
    'content.input.data.placeholder': 'Paste analysis results or enter key data',
    'content.input.tone': 'Brand Tone',
    'content.input.tone.placeholder': 'Describe your brand tone (e.g., professional, playful, warm)',
    'content.input.audience': 'Target Audience',
    'content.input.audience.placeholder': 'Describe target audience characteristics',
    'content.input.type': 'Content Type',
    'content.type.social': 'Social Media Post',
    'content.type.blog': 'Blog Article',
    'content.type.ad': 'Ad Copy',
    'content.type.email': 'Email Marketing',
    'content.button.generate': 'Generate Content',
    'content.result.title': 'Generated Content',
    
    // Data Summary
    'summary.title': 'Data Summary',
    'summary.description': 'Integrate outputs from all analysis engines into comprehensive marketing report',
    'summary.input.title': 'Input Analysis Results',
    'summary.input.seo': 'SEO Analysis Results',
    'summary.input.reddit': 'Reddit Analysis Results',
    'summary.input.twitter': 'X Sentiment Analysis Results',
    'summary.button.generate': 'Generate Report',
    'summary.result.title': 'Comprehensive Marketing Report',
    'summary.result.insights': 'Key Insights',
    'summary.result.strategies': 'Strategic Recommendations',
    'summary.result.actions': 'Action Items',
    
    // History
    'history.title': 'History',
    'history.description': 'View all your analysis records',
    'history.empty': 'No history records',
    'history.type': 'Type',
    'history.time': 'Time',
    'history.actions': 'Actions',
    'history.view': 'View',
    'history.delete': 'Delete',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error occurred',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.export': 'Export',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'zh' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
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