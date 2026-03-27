# Vibe Marketing 架构说明

## 1. 项目目标

Vibe Marketing 是一个多智能体（Multi-Agent）营销分析与内容生产系统。  
系统通过多个职责明确的智能体协同完成：

- 数据采集与监控
- 趋势与情绪分析
- SEO 与竞品洞察
- 营销内容生成
- 综合报告输出与决策支持

## 2. 核心智能体

系统由以下六类智能体组成：

1. `ceo-manager`：全局协调与策略决策，负责跨智能体任务编排与冲突处理。
2. `seo-analyzer`：执行 SEO 诊断、关键词研究、竞品策略分析。
3. `reddit-monitor`：监控 Reddit 社区话题、趋势和用户情绪。
4. `x-social-monitor`：跟踪 X（Twitter）品牌提及、舆情变化与风险信号。
5. `marketing-content-generator`：基于洞察产出营销文案与社媒内容。
6. `marketing-report-synthesizer`：汇总多源分析结果，生成结构化报告和建议。

## 3. 系统分层

建议按职责分为四层：

- **协调层（Orchestration）**  
  由 `ceo-manager` 主导，负责任务拆解、分发、执行状态跟踪和结果汇总。

- **分析层（Analysis）**  
  包含 `seo-analyzer`、`reddit-monitor`、`x-social-monitor`，负责不同渠道的数据分析。

- **生成层（Generation）**  
  由 `marketing-content-generator` 基于分析结论生成内容资产（文案、帖子、活动素材草案）。

- **综合层（Synthesis & Reporting）**  
  `marketing-report-synthesizer` 将多智能体输出统一为可执行的营销报告与行动建议。

## 4. 数据流

典型数据流如下：

1. 协调层下发任务（例如某品牌季度增长分析）。
2. 分析层从各渠道采集与处理数据，输出结构化洞察。
3. 生成层根据洞察产出面向不同渠道/人群的内容。
4. 综合层将分析与内容结果整合成统一报告。
5. 协调层根据报告触发下一轮任务或策略调整。

## 5. 目录职责（当前仓库）

```text
Vibe Marketing/
├── .claude/
│   ├── agents/          # 智能体定义（提示词、角色、配置）
│   └── agent-memory/    # 智能体持久化记忆
├── agents/              # 各智能体实现代码
├── configs/
│   ├── agent_configs/   # 智能体运行配置
│   └── api_keys.json    # API 密钥配置
├── data/
│   ├── raw_data/        # 原始数据
│   ├── processed_data/  # 清洗/分析后数据
│   └── reports/         # 输出报告
├── tools/               # 工具脚本
├── logs/                # 日志
├── templates/           # 报告/文案模板
└── frontend/            # 前端展示与交互界面
```

## 6. 外部集成

当前集成的 MCP 服务：

- `linkup`（SSE）
- `exa`（SSE）

用于增强外部检索、分析和信息聚合能力。

## 7. 设计原则

- **单一职责**：每个智能体聚焦一个核心领域。
- **可组合性**：分析结果可被生成与报告模块复用。
- **可追溯性**：原始数据、处理中间结果和报告分层存储。
- **可扩展性**：可增减智能体而不破坏主流程。
- **持续学习**：利用智能体记忆沉淀长期知识与策略经验。

## 8. 后续建议

- 为各智能体统一输入/输出 Schema（JSON）以降低集成成本。
- 引入任务状态机与重试机制，提升编排稳定性。
- 在 `data/reports/` 中规范版本命名（日期 + 场景 + 版本号）。
- 为关键流程补充自动化测试与监控告警。

