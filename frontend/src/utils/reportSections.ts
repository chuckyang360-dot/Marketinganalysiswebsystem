import type { ReportSection } from '../types/report';

export function getWorkspaceReportSections(lang: 'zh' | 'en'): ReportSection[] {
  const labels = {
    zh: {
      executive: '执行摘要',
      market: '市场分析',
      keyFindings: '关键发现',
      strategy: '策略建议',
      methods: '执行方法',
      contentPlan: '内容规划',
      evidence: '证据',
    },
    en: {
      executive: 'Executive Summary',
      market: 'Market Analysis',
      keyFindings: 'Key Findings',
      strategy: 'Strategy',
      methods: 'Methods',
      contentPlan: 'Content Plan',
      evidence: 'Evidence',
    },
  }[lang];

  // 顶层 <section id="..."> 的顺序与数量必须与 WorkspaceResultView 保持 100% 一致
  return [
    { id: 'executive-summary', label: labels.executive, order: 1 },
    { id: 'market-analysis', label: labels.market, order: 2 },
    { id: 'key-findings', label: labels.keyFindings, order: 3 },
    { id: 'strategy', label: labels.strategy, order: 4 },
    { id: 'methods', label: labels.methods, order: 5 },
    { id: 'content-plan', label: labels.contentPlan, order: 6 },
    { id: 'evidence', label: labels.evidence, order: 7 },
  ];
}

