import type { CaseData } from "@/pages/case/components/CaseStudy";

export const CASES: CaseData[] = [
  {
    index: 1,
    tags: ["电商出海", "Shopify"],
    title: "从流量停滞到增长突破",
    subtitle: "流量稳定但转化低，商品页点击率与停留时间异常，核心卖点表达偏离用户真实需求。",
    steps: [
      {
        label: "问题",
        icon: "ri-alert-line",
        color: "rgba(239,68,68,0.85)",
        content: "流量稳定但转化低，商品页点击率与停留时间持续异常，团队找不到真正的卡点在哪里。",
      },
      {
        label: "判断",
        icon: "ri-search-eye-line",
        color: "#fb923c",
        content: [
          "通过 Reddit + SEO + 评论分析发现：用户关注点集中在「续航与降噪」",
          "当前标题与卖点表达偏离用户真实需求，主图强调外观而非核心功能",
        ],
      },
      {
        label: "动作",
        icon: "ri-tools-line",
        color: "#a78bfa",
        content: [
          "重写标题与核心卖点，聚焦「续航 + 降噪」组合表达",
          "调整主图表达，突出核心功能使用场景",
          "优化评论关键词呈现顺序",
        ],
      },
      {
        label: "结果",
        icon: "ri-line-chart-line",
        color: "#4EC9B0",
        content: ["CTR 提升 3.2x", "转化率显著提升，ROI 超出预期", "自然流量进入持续增长阶段"],
      },
    ],
    mockCard: {
      before: [
        { label: "商品页 CTR", value: "1.4%" },
        { label: "平均停留时长", value: "28s" },
        { label: "加购转化率", value: "2.1%" },
      ],
      after: [
        { label: "商品页 CTR", value: "4.5%" },
        { label: "平均停留时长", value: "74s" },
        { label: "加购转化率", value: "6.8%" },
      ],
    },
  },
  {
    index: 2,
    tags: ["SaaS", "增长"],
    title: "从没有增长方向，到稳定内容产出",
    subtitle: "内容发布随意，缺乏稳定增长路径，每次选题都要从零开始，效率极低。",
    reversed: true,
    steps: [
      {
        label: "问题",
        icon: "ri-alert-line",
        color: "rgba(239,68,68,0.85)",
        content: "内容发布随意，没有稳定增长路径，团队每周花大量时间讨论选题，产出效率极低。",
      },
      {
        label: "判断",
        icon: "ri-search-eye-line",
        color: "#fb923c",
        content: [
          "用户需求集中在「AI工具实战场景」，而非泛科普内容",
          "竞品分析显示「工具 + 使用场景」组合内容互动率高出均值 4x",
        ],
      },
      {
        label: "动作",
        icon: "ri-tools-line",
        color: "#a78bfa",
        content: [
          "输出可执行选题方向（工具 + 场景组合模式）",
          "建立内容结构模板，降低每次创作启动成本",
          "持续优化表达角度，基于互动数据迭代",
        ],
      },
      {
        label: "结果",
        icon: "ri-line-chart-line",
        color: "#4EC9B0",
        content: ["内容产出效率提升 5x，周均发布量从 1 篇到 5 篇", "账号增长进入稳定阶段，自然涨粉持续发生"],
      },
    ],
    mockCard: {
      before: [
        { label: "周均内容产出", value: "1 篇" },
        { label: "选题会议时长", value: "3h / 周" },
        { label: "内容互动率", value: "0.8%" },
      ],
      after: [
        { label: "周均内容产出", value: "5 篇" },
        { label: "选题会议时长", value: "0.5h / 周" },
        { label: "内容互动率", value: "4.2%" },
      ],
    },
  },
  {
    index: 3,
    tags: ["B2B", "内容营销"],
    title: "从无效内容，到精准获客",
    subtitle: "内容很多，但几乎无转化。团队写的是行业趋势，目标用户真正需要的是解决方案。",
    steps: [
      {
        label: "问题",
        icon: "ri-alert-line",
        color: "rgba(239,68,68,0.85)",
        content: "内容输出量大，但询盘与转化几乎为零，花了大量资源在内容上，ROI 无法说服管理层继续投入。",
      },
      {
        label: "判断",
        icon: "ri-search-eye-line",
        color: "#fb923c",
        content: [
          "目标用户关注「解决方案」，而非行业趋势报告",
          "现有内容标题与结构以「洞察」为主，缺乏可操作性与场景代入感",
        ],
      },
      {
        label: "动作",
        icon: "ri-tools-line",
        color: "#a78bfa",
        content: [
          "重构内容方向：从趋势分析 → 解决方案导向",
          "调整标题与表达方式，增加场景化描述",
          "优化分发渠道组合，集中资源在高转化渠道",
        ],
      },
      {
        label: "结果",
        icon: "ri-line-chart-line",
        color: "#4EC9B0",
        content: ["用户互动率显著提升，评论与转发量增加", "询盘转化率提升，内容投入开始产生可见 ROI"],
      },
    ],
    mockCard: {
      before: [
        { label: "月均询盘量", value: "2 条" },
        { label: "内容互动率", value: "0.3%" },
        { label: "平均阅读完成率", value: "18%" },
      ],
      after: [
        { label: "月均询盘量", value: "17 条" },
        { label: "内容互动率", value: "3.9%" },
        { label: "平均阅读完成率", value: "61%" },
      ],
    },
  },
];
