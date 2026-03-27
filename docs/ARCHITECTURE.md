Vibe Marketing 1.0 技术架构草案

1. 文档目标

这份文档用于定义 Vibe Marketing 1.0 的系统技术架构，作为后续开发、重构、接口设计、页面收口、Agent 扩展的统一依据。

当前版本是 v1.0 草案，目标不是一次定稿，而是先把主干逻辑、模块边界、数据流、技术分层、扩展原则定清楚，后续再逐轮细化。

⸻

2. 产品定位与系统边界

2.1 产品定位

Vibe Marketing 不是单一工具，而是一个面向海外营销与电商分析的 双链路智能工作台。

用户只有一个统一输入入口，系统根据输入内容自动判断任务类型，并分发到对应业务链路。

2.2 当前 1.0 的两条核心链路

链路 A：Marketing Report（营销报告）
输入：关键词 / 品牌词 / 产品词 / 行业主题

输出：
	•	SEO 洞察
	•	Reddit 讨论洞察
	•	X 热点与舆情
	•	Topic / Sentiment / Summary
	•	Gap Analysis
	•	Content Ideas
	•	Evidence 展示

链路 B：Product Analysis（商品分析）
输入：商品链接

支持平台（1.0 目标）：
	•	Amazon
	•	Shopee
	•	Lazada
	•	TikTok Shop

输出：
	•	商品基础信息解析
	•	商品优劣分析
	•	标题优化
	•	主图优化
	•	电商结果页展示

⸻

3. 1.0 架构总原则

原则 1：统一输入，后端路由

前端只提供统一输入框，不让用户先选 SEO / Reddit / 商品分析等工具。

所有路由判断必须由后端完成。

原则 2：数据层与分析层彻底分离

抓取、解析、标准化属于数据层。
总结、情绪、话题、优化建议属于分析层。

不能把 provider 请求、数据清洗、AI 分析、页面展示逻辑揉在一起。

原则 3：Provider 可替换

外部数据源和模型能力都视为 provider。

例如：
	•	Amazon 商品解析当前可走 Scrap.do
	•	Shopee / Lazada / TikTok 当前计划走 Bright Data
	•	图片优化主路由 Nano Banana，备选阿里千问
	•	营销分析模型可替换 xAI / OpenAI / Gemini

业务层不能和单一 provider 强耦合。

原则 4：统一输出结构

同一类业务结果必须输出统一 schema。

例如：
	•	所有营销分析结果必须可归一成 FullAnalysisResponse
	•	所有商品解析结果必须归一成 ParsedProduct
	•	所有证据项必须归一成 EvidenceItem

原则 5：CEO 只做编排，不做脏活

CEO Agent 负责：
	•	输入分类
	•	任务分发
	•	结果聚合

CEO Agent 不应该直接承担具体平台抓取、字段清洗、图片生成等细节实现。

⸻

4. 系统总架构

[Frontend Workspace]
        ↓
[API Gateway / FastAPI Router]
        ↓
[CEO Orchestrator]
   ├── Input Classifier
   ├── Marketing Orchestrator
   └── Ecommerce Orchestrator

Marketing Orchestrator
   ├── SEO Agent
   ├── Reddit Agent
   ├── X Agent
   ├── Analysis Layer
   └── Result Aggregator

Ecommerce Orchestrator
   ├── Platform Detector
   ├── Product Parser Router
   │    ├── Amazon Parser -> Scrap.do
   │    ├── Shopee Parser -> Bright Data
   │    ├── Lazada Parser -> Bright Data
   │    └── TikTok Parser -> Bright Data
   ├── Product Analysis Layer
   ├── Title Optimizer
   └── Image Optimizer

Shared Layer
   ├── Providers
   ├── Schemas
   ├── Auth
   ├── History / Persistence
   ├── Logging
   └── Config


⸻

5. 前端架构

5.1 前端目标

前端只做 4 件事：
	1.	接收用户输入
	2.	展示任务执行状态
	3.	根据返回类型渲染不同结果页
	4.	承担历史记录与用户登录态

5.2 前端建议页面结构

必留页面
	•	Home
	•	Workspace
	•	Marketing Report Result
	•	Ecommerce Result
	•	Login
	•	Register
	•	About
	•	Cases（如果仍保留对外展示）

应下线的旧页面
	•	SEOAnalysis
	•	RedditAnalysis
	•	TwitterAnalysis
	•	ContentGeneration
	•	DataSummary
	•	任何“单 Agent 独立入口页”

原因：这些页面属于旧的工具箱逻辑，和当前“统一输入 + CEO 路由”的产品形态冲突。

5.3 前端推荐组件分层

Layout 层
	•	AppShell
	•	WorkspaceSidebar
	•	TopNavbar

Feature 层
	•	UnifiedInput
	•	WorkspaceWelcome
	•	MarketingResultView
	•	EcommerceResultView
	•	HistoryPanel

Result Section 层
	•	ExecutiveSummary
	•	SEOSection
	•	RedditSection
	•	XSection
	•	GapSection
	•	ContentIdeasSection
	•	ProductInfoSection
	•	ProductAnalysisSection
	•	TitleOptimizationSection
	•	ImageOptimizationSection

Shared UI 层
	•	EvidenceCard
	•	LoadingState
	•	ErrorState
	•	EmptyState
	•	FilterBar

5.4 前端状态管理建议
	1.	Auth 状态单独管理
	2.	当前分析任务状态单独管理
	3.	历史记录单独管理
	4.	结果渲染根据 response.type 或 schema 自动切换

不要在多个页面里重复维护一套分析状态。

⸻

6. 后端架构

6.1 后端目标

后端负责：
	•	输入分类
	•	编排 Agent
	•	管理 Provider
	•	标准化输出
	•	鉴权
	•	持久化历史

6.2 推荐模块结构

backend/app/
  api/
    auth/
    analysis/
    ecom/
    history/
  core/
    config.py
    logging.py
    security.py
  schemas/
    auth.py
    marketing.py
    ecommerce.py
    common.py
  orchestrators/
    ceo_orchestrator.py
    marketing_orchestrator.py
    ecommerce_orchestrator.py
  classifiers/
    input_classifier.py
    platform_detector.py
  agents/
    seo_agent.py
    reddit_agent.py
    x_agent.py
  parsers/
    amazon_parser.py
    shopee_parser.py
    lazada_parser.py
    tiktok_parser.py
    parser_router.py
  analysis/
    topics.py
    sentiment.py
    summary.py
    gap_analysis.py
    product_analysis.py
  optimizers/
    title_optimizer.py
    image_optimizer.py
  providers/
    exa_provider.py
    x_provider.py
    scrapdo_provider.py
    brightdata_provider.py
    gemini_provider.py
    qwen_provider.py
    nanobanana_provider.py
  repositories/
    user_repository.py
    history_repository.py
  services/
    auth_service.py

6.3 为什么要这样拆

api/
只处理 HTTP 入参、鉴权、响应。

orchestrators/
处理业务编排。

agents/
处理平台级抓取与初步结构化。

parsers/
专门处理商品链接解析。

providers/
只负责对接第三方 API。

analysis/
只做分析，不接第三方。

optimizers/
专门负责标题优化、图片优化。

这样做的核心收益：
	•	替换 provider 不影响业务主线
	•	调整分析 prompt 不影响抓数层
	•	新增平台不影响页面层

⸻

7. CEO Orchestrator 设计

7.1 CEO 职责

CEO 是统一入口的调度中心。

输入：用户 query
输出：统一结构化 response

7.2 CEO 处理流程

User Query
   ↓
Input Classifier
   ├── Ecommerce Link -> Ecommerce Orchestrator
   └── Keyword / Topic -> Marketing Orchestrator

7.3 CEO 不应承担的职责
	•	不直接请求 Scrap.do / Bright Data
	•	不直接写平台字段映射
	•	不直接调用图片生成 API
	•	不直接写 prompt 细节

CEO 只做：
	•	classify
	•	dispatch
	•	aggregate
	•	normalize final response

⸻

8. Marketing Report 链路架构

8.1 处理流程

Keyword Query
   ↓
Marketing Orchestrator
   ├── SEO Agent
   ├── Reddit Agent
   ├── X Agent
   ↓
Raw Mentions / Search Results
   ↓
Normalize to Evidence
   ↓
Analysis Layer
   ├── Topics
   ├── Sentiment
   ├── Summary
   ├── Gap Analysis
   └── Content Ideas
   ↓
FullAnalysisResponse

8.2 Agent 职责划分

SEO Agent

负责搜索引擎相关主题、竞品、页面内容抓取与初步整理。

Reddit Agent

负责 Reddit 讨论、痛点、真实用户语言、热贴信号提取。

X Agent

负责 X 热点、舆情、观点分布、风险信号。

Analysis Layer

只吃标准化后的 evidence，不直接接触各平台 provider。

8.3 营销链路关键输出结构

建议统一为：
	•	query
	•	summary
	•	seo_analysis
	•	reddit_analysis
	•	x_analysis
	•	gap_analysis
	•	content_ideas
	•	evidence
	•	metadata

⸻

9. Product Analysis 链路架构（1.0 正式定义）

9.1 商品分析结果页三层结构

商品分析结果页必须拆分为三层：

1）商品数据层（Data Layer）
这是客观数据展示层，不负责推理。包含但不限于：
	•	platform
	•	url
	•	title
	•	brand
	•	price
	•	rating
	•	review_count
	•	商品主图集合（平台当前展示图，已清洗后的 clean_images）
	•	当前主图
	•	评论文本列表（clean_reviews）
	•	如可获取：description / bullet_points / seller

约束：
	•	图片来源是平台当前展示图，不是系统生成图
	•	商品数据层展示图片必须来自 clean_images
	•	商品数据层图片支持高清查看与下载保存
	•	评论只展示文本评论，不展示评论图片和评论视频
	•	1.0 默认抓取最多 10 条评论，每页展示 5 条

2）商品分析层（Analysis Layer）
这是认知层，由 CEO / Grok 承担分析任务。分析维度包括但不限于：
	•	主图分析
	•	标题分析
	•	评论分析
	•	定价分析
	•	详情页分析
	•	listing 综合诊断
	•	优化优先级建议

约束：
	•	评论原文展示属于数据层
	•	评论洞察结论属于分析层
	•	竞品分析 / 多商品分析属于未来预留，1.0 不落地

3）内容生成层（Generation Layer）
这是基于分析结果的生成层。

1.0 范围：
	•	标题优化
	•	图片优化

未来扩展：
	•	详情图优化
	•	广告图生成
	•	详情页文案
	•	广告文案
	•	更多内容生成模块

9.2 商品分析 1.0 交互逻辑

1）统一入口
	•	用户在 frontend/workspace 输入 query
	•	CEO 在后端判断输入类型
	•	如果是电商商品链接，进入商品分析链路
	•	前端根据 result_type 渲染 Ecommerce Result 页面

说明：
	•	CEO 负责任务分类与编排，不负责页面判断
	•	页面渲染由前端按 result_type 决定

2）标题优化交互（1.0）
	•	在内容生成层展示当前标题
	•	提供“优化标题”按钮
	•	点击后生成 3 条新标题
	•	新标题支持复制
	•	1.0 不允许编辑
	•	1.0 不允许二次生成

3）图片优化交互（1.0）
	•	图片优化位于结果页底部，属于内容生成层
	•	用户先完成商品分析阅读，再主动触发图片优化
	•	用户从当前商品 clean_images 中勾选要优化的图片
	•	默认 prompt 可来自主图分析结论，也允许用户手动编辑
	•	点击“立即优化”后异步生成
	•	默认生成 4 张新图，用于与原图对比参考

说明：
	•	商品数据层展示图片与内容生成层勾选图片均来自 clean_images
	•	两者数据源一致，但业务目的不同（展示/保存 vs 生成/对比）

9.3 商品解析链路的五步分层（Parser / Provider / Cleaner / Normalize）

商品分析链路必须固定为五步：
	1.	Platform Detect
	2.	Provider Fetch
	3.	Platform Clean
	4.	Normalize
	5.	Analyze / Generate

9.3.1 Platform Detect
通过 URL 域名、路径和短链特征识别平台，返回：
	•	amazon
	•	shopee
	•	lazada
	•	tiktok
	•	unsupported

9.3.2 Provider Fetch
仅负责调用外部接口抓取原始商品数据。

当前 provider 策略：
	•	Amazon：Scrape.do（已有专门解析方案）
	•	Shopee / Lazada / TikTok：Bright Data（当前计划接入，后续可替换）

边界：
	•	provider 只负责抓取原始数据
	•	provider 不负责业务分析
	•	provider 不负责页面逻辑

9.3.3 Platform Clean
负责平台级清洗，不同平台可有不同规则。必须明确：
	•	图片清洗是商品解析的一部分，不是前端逻辑
	•	评论清洗是商品解析的一部分，不是 Grok 的临时处理

清洗范围：
	•	Image Cleaning：过滤 logo、icon、分页图、装饰图、小图、重复图等脏图片
	•	Review Cleaning：仅保留文本评论，去空、去重、去极短，最多保留 10 条

1.0 清洗原则：
	•	clean_images 只做去噪
	•	不做结构重排
	•	不做替换平台图片集合
	•	尽可能保持与平台当前展示图一致

9.3.4 Normalize
清洗后统一归一为 ParsedProduct，上层业务永远只依赖 ParsedProduct，不允许直接依赖 Scrap.do / Bright Data 原始字段结构。平台切换 provider 时，上层不应受影响。

ParsedProduct 建议至少包含：
	•	platform
	•	url
	•	product_id
	•	title
	•	brand
	•	price
	•	currency
	•	rating
	•	review_count
	•	main_image
	•	clean_images[]
	•	raw_images[]
	•	image_selection_reason
	•	description
	•	bullet_points[]
	•	clean_reviews[]
	•	raw_reviews[]
	•	seller
	•	raw_data

9.3.5 Analyze / Generate
基于标准化后的 ParsedProduct 进入后续处理：
	•	Product Analysis（Grok）
	•	Title Optimization（Grok）
	•	Image Optimization（图片 provider；Grok 可参与 prompt 生成，但不是图片 provider）

9.4 商品链路角色边界

1）CEO / Grok
负责：
	•	任务分类
	•	商品分析
	•	标题分析与标题生成
	•	主图分析
	•	文本层优化建议
	•	参与图片优化 prompt 生成

不负责：
	•	平台商品抓取
	•	provider 请求
	•	图片实际生成
	•	脏数据清洗

2）Parser / Platform Parser
负责：
	•	解析平台商品链接
	•	调用对应 provider adapter
	•	处理平台级字段映射
	•	调用 image cleaner / review cleaner
	•	输出标准化商品数据

说明：
	•	商品分析链路使用 Parser，而不是 Agent
	•	营销报告链路中的 SEO / Reddit / X 更适合 Agent 形态

3）Provider Adapter
负责：
	•	对接外部接口
	•	请求、响应、重试、超时、错误归一化
	•	返回原始数据或中间结构

说明：
	•	provider 可替换
	•	同一平台未来可能切换 provider
	•	平台解析逻辑不能直接耦合 provider 原始响应

9.5 平台隔离与 provider 可替换原则

1）平台隔离
	•	Amazon / Shopee / Lazada / TikTok 解析逻辑必须隔离
	•	Amazon 的图片清洗规则不影响 Shopee
	•	Shopee 的字段映射不影响 Lazada
	•	每个平台应具备独立 parser / cleaner / normalizer

2）provider 可替换
	•	Amazon 当前可使用 Scrape.do，未来可替换
	•	Shopee / Lazada / TikTok 当前计划使用 Bright Data，未来可替换
	•	替换某一平台 provider 不影响其他平台
	•	替换某一平台 provider 不影响上层 Product Analysis / Title Optimization / Image Optimization

推荐结构：
	•	Platform Parser
	•	Provider Adapter
	•	Platform Cleaner
	•	Normalize Layer

稳定性来源：
	•	平台隔离 + provider 适配 + 标准化输出
	•	不是把分支硬编码在大量 if/else 中

10. 商品分析 1.0 阶段边界

10.1 已做 / 要做（1.0）
	•	单商品链接分析
	•	Amazon 已跑通
	•	Shopee / Lazada / TikTok 待接 Bright Data
	•	商品数据层
	•	商品分析层
	•	标题优化
	•	图片优化

10.2 明确不做 / 先预留（1.0）
	•	多商品分析
	•	竞品比对
	•	标题二次编辑
	•	标题二次生成
	•	评论图片/视频展示
	•	自动重排商品图片集合

10.3 图片优化 provider 策略（保留）
	•	Primary: Nano Banana
	•	Fallback: Qwen

未来要求：
	•	失败原因结构化
	•	provider 切换日志清晰
	•	返回 provider 信息给前端

⸻

11. Provider 架构

11.1 Provider 设计原则

每个 provider 只做一件事：
	•	接口请求
	•	重试 / 超时 / 错误处理
	•	返回统一原始结果或中间结构

Provider 不能夹杂业务逻辑。

11.2 当前主要 Provider

营销链路
	•	Exa Provider
	•	X Provider
	•	LLM Provider（xAI / OpenAI / Gemini 可替换）

电商链路
	•	Scrap.do Provider（Amazon）
	•	Bright Data Provider（Shopee / Lazada / TikTok）

图片链路
	•	Nano Banana Provider
	•	Qwen Provider

11.3 Provider 层必须统一的能力
	•	timeout
	•	retry
	•	response logging
	•	error normalization
	•	secret from config only

⸻

12. 数据库与持久化

12.1 1.0 建议持久化内容
	•	user
	•	analysis_history
	•	ecom_analysis_history
	•	auth/session metadata

12.2 历史记录最少字段
	•	id
	•	user_id
	•	query
	•	query_type
	•	platform
	•	result_type
	•	result_json
	•	created_at

12.3 原则
	1.	历史数据以最终结果 JSON 为主，优先保证可回显
	2.	原始 provider 大响应不要无脑入库
	3.	日志与业务结果分开存储

⸻

13. 日志与可观测性

13.1 必须记录的日志节点

CEO 层
	•	输入 query
	•	分类结果
	•	分发路径
	•	总耗时

Provider 层
	•	provider 名称
	•	请求参数摘要
	•	状态码
	•	错误原因
	•	fallback 触发原因

Parser 层
	•	识别平台
	•	解析是否成功
	•	缺失字段

Optimizer 层
	•	使用哪个图片 provider
	•	是否 fallback
	•	是否返回图片

13.2 原则

日志要帮助排查问题，不要只打“成功/失败”。

⸻

14. API 设计建议

14.1 统一入口 API

建议保留一个统一分析入口：
	•	POST /api/analyze

请求：
	•	query

响应：
	•	type: marketing_report 或 ecommerce_product
	•	payload: 对应结果结构

14.2 其他 API
	•	POST /api/auth/register
	•	POST /api/auth/login
	•	GET /api/history
	•	GET /api/history/{id}

如有必要，优化链路可拆：
	•	POST /api/ecom/optimize-title
	•	POST /api/ecom/optimize-image

但 1.0 可先以内聚为主。

⸻

15. 1.0 推荐目录收口原则

前端

只能保留一套主前端。

如果当前仓库存在 src/ 与 frontend/ 双前端并存，必须尽快只保留一套主线，另一套冻结或归档。

页面

不再保留旧的单 Agent 工具页作为主入口。

后端

按 orchestrator / parser / provider / analysis / optimizer 分层，不再把逻辑堆在单一 service 文件里。

⸻

16. 1.0 开发优先级

P0
	1.	统一输入入口
	2.	CEO 路由稳定
	3.	统一两类结果页
	4.	Amazon 商品链路稳定
	5.	主图优化主备链路稳定

P1
	1.	Bright Data 接 Shopee
	2.	Bright Data 接 Lazada
	3.	Bright Data 接 TikTok Shop
	4.	商品解析统一 normalize
	5.	历史记录稳定回显

P2
	1.	更细的失败分类
	2.	更完善的 provider 监控
	3.	更多营销平台接入
	4.	更强的内容生成与批量任务能力

⸻

17. 当前 v1.0 草案的结论

Vibe Marketing 1.0 的技术架构，应当围绕以下一句话来约束后续开发：

一个统一输入入口，两个核心业务链路，后端 CEO 做路由编排，数据层 / 分析层 / 优化层分离，所有平台能力通过可替换 provider 接入。

如果后续新增功能不符合这条原则，就不应该直接并入主线。

⸻

18. 下一轮待讨论问题
	1.	前端最终只保留哪一套主线
	2.	POST /api/analyze 是否作为唯一统一入口
	3.	历史记录是否统一存储为一张表还是两张表
	4.	商品优化接口是否拆分成独立 API
	5.	Bright Data 的三平台解析字段映射如何统一
	6.	图片优化结果是否需要多版本输出
	7.	Marketing Report 的 response schema 是否要再收口一轮