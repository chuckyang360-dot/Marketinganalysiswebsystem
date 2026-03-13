export interface ReportCase {
  id: string;
  title: string;
  subtitle: string;
  clientType: string;
  marketStage: string;
  primaryGoal: string;
  executiveSummary: {
    coreIssue: string;
    topOpportunity: string;
    suggestedAction: string;
    summary: string;
  };
  marketOverview: {
    marketTrend: string;
    userDemand: string;
    competitionLevel: string;
    contentDensity: string;
    channelShift: string;
  };
  audience: {
    targetUsers: Array<{
      persona: string;
      painPoints: string[];
      decisionFactors: string[];
    }>;
  };
  channelOpportunities: Array<{
    channel: string;
    priority: 'high' | 'medium' | 'low';
    opportunity: string;
  }>;
  contentStrategy: {
    toFu: string[];
    moFu: string[];
    boFu: string[];
    formats: string[];
    channels: string[];
    rhythm: string;
  };
  executionPlan: {
    day30: string[];
    day60: string[];
    day90: string[];
  };
  expectedOutcome: {
    exposure: string;
    leads: string;
    conversion: string;
    brandAwareness: string;
    contentAssets: string;
  };
  actions: Array<{
    label: string;
    type: string;
  }>;
}

export const reportCases: ReportCase[] = [
  {
    id: 'amazon-seller',
    title: '跨境卖家增长方案',
    subtitle: 'Amazon Seller Growth Strategy',
    clientType: '跨境卖家 / 亚马逊卖家',
    marketStage: '扩张期',
    primaryGoal: '提升产品曝光与转化率',
    executiveSummary: {
      coreIssue: '当前产品在亚马逊平台内曝光不足，站外引流渠道单一，缺乏系统化的内容营销策略。',
      topOpportunity: '通过社交媒体种草与站外内容营销，构建品牌认知，驱动亚马逊站内搜索增长。',
      suggestedAction: '建立社交媒体内容矩阵 + KOC/KOL 合作 + 站外内容引流体系。',
      summary: '基于对亚马逊卖家市场的深度分析，我们发现当前产品在站内竞争激烈的情况下，缺乏有效的站外流量补充和品牌建设。建议通过社交媒体种草、内容营销和 KOC/KOL 合作，构建完整的站外流量闭环，同时优化亚马逊站内 Listing 策略，实现流量与转化的双重增长。'
    },
    marketOverview: {
      marketTrend: '跨境电商竞争加剧，品牌化成为趋势，单纯价格战难以为继。',
      userDemand: '消费者对产品品质、品牌故事和社交评价的关注度显著提升。',
      competitionLevel: '红海市场，头部效应明显，中长尾关键词机会仍存在。',
      contentDensity: '相关内容在 TikTok、Instagram 等平台快速增长，用户种草需求旺盛。',
      channelShift: '从单纯依赖亚马逊站内流量，向社交媒体种草 + 站内承接的复合模式转变。'
    },
    audience: {
      targetUsers: [
        {
          persona: '价格敏感型用户（25-35岁，女性为主）',
          painPoints: ['担心产品质量', '对陌生品牌不信任', '需要充分的产品对比'],
          decisionFactors: ['价格', '产品评价', '产品图片和描述质量']
        },
        {
          persona: '品质追求型用户（30-45岁，男女均衡）',
          painPoints: ['寻找差异化的高品质产品', '关注品牌故事和价值观', '需要专业的使用指导'],
          decisionFactors: ['品牌调性', '产品品质', '使用体验和效果']
        }
      ]
    },
    channelOpportunities: [
      {
        channel: 'TikTok',
        priority: 'high',
        opportunity: '短视频种草，产品展示与使用场景化，快速触达年轻用户群体。'
      },
      {
        channel: 'Instagram',
        priority: 'high',
        opportunity: '视觉化内容营销，生活方式展示，构建品牌调性。'
      },
      {
        channel: 'YouTube',
        priority: 'medium',
        opportunity: '产品测评和使用教程，建立专业可信度。'
      },
      {
        channel: 'Amazon站内优化',
        priority: 'high',
        opportunity: 'Listing 优化、关键词策略、评价管理，提升站内转化。'
      },
      {
        channel: 'KOC/KOL合作',
        priority: 'medium',
        opportunity: '垂直领域博主合作，精准触达目标用户。'
      }
    ],
    contentStrategy: {
      toFu: ['产品开箱视频', '使用场景展示', '痛点解决方案', '品牌故事'],
      moFu: ['产品对比评测', '真实用户使用反馈', '限时优惠信息'],
      boFu: ['折扣码和促销活动', '用户评价展示', '亚马逊购买链接'],
      formats: ['短视频', '图文', '直播', '测评视频'],
      channels: ['TikTok', 'Instagram', 'YouTube', '亚马逊Listing', '社群'],
      rhythm: 'TikTok/Instagram 每日 1-2 条，YouTube 每周 1 条，Listing 持续优化。'
    },
    executionPlan: {
      day30: [
        '完成竞品分析和关键词研究',
        '建立社交媒体账号矩阵（TikTok, Instagram, YouTube）',
        '优化亚马逊 Listing（标题、图片、描述）',
        '启动 KOC/KOL 寻找和接洽'
      ],
      day60: [
        '发布首批种草内容（短视频 + 图文）',
        '与 5-10 位垂直 KOC/KOL 建立合作',
        '启动站内广告投放测试',
        '收集用户反馈并优化内容策略'
      ],
      day90: [
        '扩大内容产出规模和频率',
        '启动付费 KOL 合作计划',
        '优化广告投放 ROI',
        '建立 UGC 用户生成内容激励机制'
      ]
    },
    expectedOutcome: {
      exposure: '月曝光量增长 300%+，社交媒体粉丝增长 5000+',
      leads: '站内搜索流量增长 150%，产品转化率提升 20%',
      conversion: '客单价提升 10%，复购率提升 15%',
      brandAwareness: '社交媒体品牌声量提升，用户主动搜索增长',
      contentAssets: '沉淀 100+ 条优质内容，建立品牌内容资产库'
    },
    actions: [
      { label: '生成短视频脚本', type: 'video' },
      { label: '生成海报', type: 'image' },
      { label: '生成广告文案', type: 'ad' },
      { label: '生成产品描述', type: 'listing' }
    ]
  },
  {
    id: 'shopify-dtc',
    title: '独立站增长方案',
    subtitle: 'Shopify DTC Growth Strategy',
    clientType: '独立站 / Shopify 商家 / DTC 品牌',
    marketStage: '成长期',
    primaryGoal: '提升流量与转化率',
    executiveSummary: {
      coreIssue: '独立站缺乏稳定的流量来源，SEO 和内容营销投入不足，转化路径不够优化。',
      topOpportunity: '通过 SEO 驱动 + 内容营销 + 社交媒体广告组合，建立可持续流量增长引擎。',
      suggestedAction: 'SEO 基础建设 + 内容日更 + 社交广告投放 + 邮件营销。',
      summary: '基于对独立站和 DTC 品牌市场的分析，当前独立站主要依赖付费广告获取流量，缺乏自然流量和品牌建设。建议建立系统的 SEO 策略，持续产出高质量内容，优化转化漏斗，同时通过邮件营销和社交媒体广告组合，实现流量多元化和可持续增长。'
    },
    marketOverview: {
      marketTrend: 'DTC 品牌成为主流，消费者对品牌独立站的接受度持续提升。',
      userDemand: '用户追求个性化、差异化的品牌体验，愿意为品牌价值付费。',
      competitionLevel: '中等竞争，垂直细分市场仍有较大机会。',
      contentDensity: '品牌内容化趋势明显，用户通过内容了解和选择品牌。',
      channelShift: '从单一广告驱动，向 SEO + 内容 + 广告 + 邮件的多元组合转变。'
    },
    audience: {
      targetUsers: [
        {
          persona: '品质追求型用户（28-40岁，女性为主）',
          painPoints: ['寻找独特且有品质的产品', '关注品牌价值观和可持续性', '需要专业的产品建议'],
          decisionFactors: ['品牌调性', '产品品质', '用户体验和售后']
        },
        {
          persona: '价格敏感型用户（22-30岁）',
          painPoints: ['关注性价比', '担心独立站购物风险', '需要用户评价和证明'],
          decisionFactors: ['价格', '产品评价', '促销优惠']
        }
      ]
    },
    channelOpportunities: [
      {
        channel: 'SEO',
        priority: 'high',
        opportunity: '长期稳定的自然流量，品牌搜索增长，高转化率。'
      },
      {
        channel: '内容营销',
        priority: 'high',
        opportunity: '建立品牌权威性，教育用户，驱动自然搜索增长。'
      },
      {
        channel: '社交媒体广告',
        priority: 'high',
        opportunity: '精准触达目标用户，快速获取流量和测试市场。'
      },
      {
        channel: '邮件营销',
        priority: 'medium',
        opportunity: '用户留存和复购的重要渠道，ROI 较高。'
      },
      {
        channel: '社交媒体内容',
        priority: 'medium',
        opportunity: '品牌建设，用户互动，自然流量补充。'
      }
    ],
    contentStrategy: {
      toFu: ['行业洞察文章', '用户痛点分析', '品牌故事', '使用教程'],
      moFu: ['产品对比', '用户案例', '产品深度解析', '优惠活动'],
      boFu: ['限时折扣', '用户评价', '购物指南', '品牌新闻'],
      formats: ['博客文章', '视频内容', '社交媒体图文', '邮件内容'],
      channels: ['独立站博客', '社交媒体', '邮件', 'SEO 搜索结果'],
      rhythm: '博客每周 2-3 篇，社交媒体每日 1-2 条，邮件每周 1-2 封。'
    },
    executionPlan: {
      day30: [
        '完成 SEO 关键词研究和站点技术优化',
        '建立内容日更计划，启动博客运营',
        '启动社交媒体广告测试（Facebook/Instagram Ads）',
        '建立邮件订阅机制和欢迎邮件流程'
      ],
      day60: [
        '持续产出高质量博客内容（每周 2-3 篇）',
        '优化广告投放策略和受众定位',
        '建立邮件自动化流程（购物车放弃、浏览历史）',
        '启动用户评价和 UGC 激励计划'
      ],
      day90: [
        '扩大内容产出规模，建立品牌内容库',
        '优化转化漏斗，提升广告 ROI',
        '启动 Retargeting 和 Lookalike 广告',
        '建立品牌社群和用户忠诚度计划'
      ]
    },
    expectedOutcome: {
      exposure: '自然流量增长 200%+，社交媒体粉丝增长 3000+',
      leads: '网站转化率提升 30%，邮箱订阅率提升 50%',
      conversion: '客单价提升 15%，复购率提升 25%',
      brandAwareness: '品牌搜索量增长 100%，社交媒体互动率提升',
      contentAssets: '沉淀 50+ 篇高质量博客内容，建立品牌内容资产'
    },
    actions: [
      { label: '生成博客文章', type: 'blog' },
      { label: '生成落地页文案', type: 'landing' },
      { label: '生成邮件模板', type: 'email' },
      { label: '生成广告文案', type: 'ad' }
    ]
  },
  {
    id: 'ai-saas',
    title: 'AI SaaS 出海增长方案',
    subtitle: 'AI SaaS Go-To-Market Strategy',
    clientType: 'AI SaaS / 海外增长团队 / 产品出海团队',
    marketStage: '早期',
    primaryGoal: '快速获客与建立市场认知',
    executiveSummary: {
      coreIssue: 'AI SaaS 产品在海市场缺乏品牌认知，获客渠道单一，用户教育成本高。',
      topOpportunity: '通过内容营销 + 社区建设 + KOL/KOC 合作，快速建立产品认知和信任。',
      suggestedAction: '建立产品使用场景内容 + 垂直社区运营 + 开发者关系建设。',
      summary: '基于对 AI SaaS 出海市场的分析，当前产品在海市场的品牌认知度较低，主要依赖产品冷启动获客，缺乏系统化的市场教育和用户信任建设。建议通过产品使用场景化内容营销、垂直社区运营和开发者关系建设，快速建立产品认知，降低用户教育成本，实现可持续增长。'
    },
    marketOverview: {
      marketTrend: 'AI SaaS 市场快速增长，但竞争激烈，差异化成为关键。',
      userDemand: '企业对 AI 工具的需求旺盛，但决策周期较长，需要充分的产品教育。',
      competitionLevel: '高度竞争，需要明确产品定位和差异化优势。',
      contentDensity: 'AI 相关内容爆发式增长，用户教育需求强烈。',
      channelShift: '从产品驱动增长，向产品 + 内容 + 社区的复合模式转变。'
    },
    audience: {
      targetUsers: [
        {
          persona: '技术决策者（CTO/技术负责人）',
          painPoints: ['产品可靠性和安全性', '集成难度和兼容性', '技术支持和响应速度'],
          decisionFactors: ['技术架构', 'API 文档质量', '支持服务水平']
        },
        {
          persona: '业务决策者（产品/市场负责人）',
          painPoints: ['投资回报率', '实施成本和时间', '用户 adoption 和学习成本'],
          decisionFactors: ['业务价值', '案例和证明', '价格和实施成本']
        }
      ]
    },
    channelOpportunities: [
      {
        channel: '内容营销',
        priority: 'high',
        opportunity: '产品使用场景化内容，降低用户教育成本，建立产品认知。'
      },
      {
        channel: '社区运营',
        priority: 'high',
        opportunity: '建立产品社区，促进用户交流和 UGC，构建用户忠诚度。'
      },
      {
        channel: '开发者关系',
        priority: 'high',
        opportunity: '提供优秀的 API 文档和开发者资源，吸引开发者集成。'
      },
      {
        channel: 'KOL/KOC合作',
        priority: 'medium',
        opportunity: '通过意见领袖和用户推荐，建立产品信任和口碑。'
      },
      {
        channel: '搜索广告',
        priority: 'medium',
        opportunity: '精准触达有需求的潜在用户，快速获取高意向线索。'
      }
    ],
    contentStrategy: {
      toFu: ['AI 行业趋势', '产品使用场景', '最佳实践案例', '技术白皮书'],
      moFu: ['产品深度解析', '功能演示视频', '用户成功案例', 'ROI 计算器'],
      boFu: ['产品试用申请', '限时优惠', '客户成功案例', '产品对比'],
      formats: ['博客文章', '视频内容', '白皮书/报告', '技术文档'],
      channels: ['产品博客', '开发者社区', 'LinkedIn', '行业媒体', 'YouTube'],
      rhythm: '博客每周 1-2 篇，视频每 2 周 1 条，社区持续互动。'
    },
    executionPlan: {
      day30: [
        '完成竞品分析和产品定位优化',
        '建立产品博客和开发者社区',
        '启动内容营销计划',
        '优化产品着陆页和试用流程'
      ],
      day60: [
        '持续产出产品使用场景内容',
        '启动 KOL/KOC 合作计划',
        '建立开发者关系计划',
        '启动搜索广告测试'
      ],
      day90: [
        '扩大内容产出规模和渠道覆盖',
        '建立产品社区运营机制',
        '优化广告投放和线索管理',
        '启动用户成功案例收集和推广'
      ]
    },
    expectedOutcome: {
      exposure: '产品知名度提升，搜索流量增长 150%+',
      leads: '试用申请增长 200%，销售线索增长 100%',
      conversion: '试用到付费转化率提升 25%',
      brandAwareness: '行业声量提升，KOL/KOC 推荐增加',
      contentAssets: '沉淀 30+ 篇高质量内容，建立产品内容库'
    },
    actions: [
      { label: '生成产品介绍视频', type: 'video' },
      { label: '生成技术文档', type: 'doc' },
      { label: '生成白皮书', type: 'report' },
      { label: '生成着陆页文案', type: 'landing' }
    ]
  },
  {
    id: 'b2b-lead-gen',
    title: 'B2B 企业获客方案',
    subtitle: 'B2B Lead Generation Strategy',
    clientType: 'B2B 企业 / 企业服务',
    marketStage: '成熟期',
    primaryGoal: '提升获客效率与销售转化',
    executiveSummary: {
      coreIssue: 'B2B 获客渠道单一，线索质量参差不齐，销售转化周期长。',
      topOpportunity: '通过内容营销 + 账户广告 + 邮件营销 + 销售赋能的协同，提升获客效率和转化率。',
      suggestedAction: '建立内容营销引擎 + 账户广告精准投放 + 邮件自动化流程 + 销售工具赋能。',
      summary: '基于对 B2B 企业获客市场的分析，当前获客主要依赖传统渠道和销售人力，线索质量和效率有待提升。建议通过系统的内容营销建立行业权威性，精准的社交媒体广告获取高质量线索，自动化的邮件营销培养线索，同时赋能销售团队使用内容工具，实现获客效率和销售转化的双重提升。'
    },
    marketOverview: {
      marketTrend: 'B2B 数字化营销加速，内容营销和社交广告成为主流。',
      userDemand: 'B2B 采购决策更加理性，需要充分的行业洞察和产品教育。',
      competitionLevel: '高度竞争，需要专业性和差异化内容脱颖而出。',
      contentDensity: 'B2B 相关内容需求旺盛，但高质量专业内容稀缺。',
      channelShift: '从传统销售驱动，向内容 + 广告 + 自动化的数字营销转变。'
    },
    audience: {
      targetUsers: [
        {
          persona: '企业决策者（CEO/总经理）',
          painPoints: ['投资回报率', '实施风险和时间', '战略匹配度'],
          decisionFactors: ['业务价值', 'ROI 证明', '案例和信任']
        },
        {
          persona: '技术负责人（CTO/IT经理）',
          painPoints: ['技术可行性和安全性', '集成和实施成本', '技术支持和服务'],
          decisionFactors: ['技术架构', '安全性', '支持服务']
        }
      ]
    },
    channelOpportunities: [
      {
        channel: '内容营销',
        priority: 'high',
        opportunity: '建立行业权威性和专业形象，吸引高质量线索。'
      },
      {
        channel: 'LinkedIn 广告',
        priority: 'high',
        opportunity: '精准触达 B2B 决策者，获取高意向线索。'
      },
      {
        channel: '邮件营销',
        priority: 'high',
        opportunity: '线索培养和转化，自动化流程提升效率。'
      },
      {
        channel: '网络研讨会',
        priority: 'medium',
        opportunity: '深度产品教育，建立信任，获取高质量线索。'
      },
      {
        channel: '行业活动',
        priority: 'medium',
        opportunity: '品牌曝光和人脉建立，转化周期较长但质量高。'
      }
    ],
    contentStrategy: {
      toFu: ['行业洞察报告', '趋势分析文章', '最佳实践案例', '解决方案白皮书'],
      moFu: ['产品深度解析', '客户成功案例', 'ROI 计算工具', '产品演示视频'],
      boFu: ['限时优惠', '预约咨询', '客户证言', '活动邀请'],
      formats: ['白皮书', '博客文章', '视频内容', '网络研讨会', '邮件内容'],
      channels: ['公司博客', 'LinkedIn', '邮件', '行业媒体', '活动'],
      rhythm: '博客每周 1-2 篇，白皮书每季 1 份，网络研讨会每月 1 场。'
    },
    executionPlan: {
      day30: [
        '完成内容营销策略制定',
        '启动行业洞察内容产出',
        '建立邮件自动化流程',
        '启动 LinkedIn 广告测试'
      ],
      day60: [
        '持续产出高质量行业内容',
        '优化广告投放和受众定位',
        '建立线索评分和培养机制',
        '赋能销售团队使用内容工具'
      ],
      day90: [
        '扩大内容产出规模和影响力',
        '优化线索管理和销售协同',
        '启动网络研讨会和品牌活动',
        '建立行业合作伙伴生态'
      ]
    },
    expectedOutcome: {
      exposure: '行业知名度提升，LinkedIn 粉丝增长 2000+',
      leads: '高质量线索增长 150%，线索转化率提升 30%',
      conversion: '销售周期缩短 20%，客单价提升 10%',
      brandAwareness: '行业权威性建立，品牌提及和引用增长',
      contentAssets: '沉淀 20+ 篇高质量行业内容，建立品牌内容资产'
    },
    actions: [
      { label: '生成白皮书', type: 'report' },
      { label: '生成案例研究', type: 'case' },
      { label: '生成邮件模板', type: 'email' },
      { label: '生成演示文稿', type: 'ppt' }
    ]
  }
];
