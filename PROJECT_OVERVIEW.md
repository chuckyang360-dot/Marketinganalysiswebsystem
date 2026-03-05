# Vibe Marketing 项目概览

## 项目简介

Vibe Marketing 是一个基于多 Agent 智能营销分析平台，专注于帮助跨境卖家（Shopify / 亚马逊卖家）实现海外流量增长自动化。

## 项目架构

```
Vibe Marketing/
├── frontend/                 # React 前端（已部署）
├── backend/                 # FastAPI 后端（新建）
├── agents/                  # Agent 定义文件
├── configs/                 # 配置文件
├── data/                    # 数据存储
├── tools/                   # 工具脚本
├── docs/                    # 文档
└── README.md
```

## 核心功能

### 已完成

#### 1. 🌐 前端平台（完成部署）
- 首页：清晰的项目定位展示
- 产品页：核心能力介绍
- 案例页：展示虚拟数据测试结果
- 联系方式：预约咨询入口
- 登录入口：预留系统接口

#### 2. 🔧 后端模块（新建）
- **Google OAuth 认证系统**
  - 使用 Google 账户登录
  - JWT Token 管理
  - 用户信息存储

- **X Agent 功能**
  - 关键词分析（热点、舆情、综合）
  - 实时获取 X 平台动态
  - 分析历史追踪
  - 热门话题监测

### 规划中

#### 3. 🤖 智能 Agent 系统
- **挖掘杨（SEO Agent）**
  - 海外关键词挖掘
  - SEO 分析
  - Reddit 数据挖掘
  - X 平台关键词分析

- **热点杨（Hot Topics Agent）**
  - 实时热点监测
  - 社区话题追踪
  - 趋势预测

- **营销杨（Content Agent）**
  - 自动生成营销内容
  - 多平台内容适配
  - A/B 测试建议

## 技术栈

### 前端
- **React**: 用户界面框架
- **Styled Components**: 样式管理
- **React Router**: 路由管理
- **HTTP Client**: API 调用

### 后端
- **FastAPI**: Web 框架
- **SQLAlchemy**: ORM
- **Pydantic**: 数据验证
- **JWT**: 认证
- **Google OAuth**: 第三方登录
- **X AI API**: 集成服务

### 部署
- **Vercel/Railway**: 前端部署
- **Docker**: 容器化
- **PostgreSQL**: 生产数据库
- **Redis**: 缓存

## Agent 系统架构

### Multi-Agent 协作模式

```
┌─────────────────┐
│   CEO Manager   │  ← 总协调决策
└─────────┬───────┘
          │
    ┌─────▼─────┐ ┌───────▼───────┐ ┌───────▼───────┐
    │ SEO Analyzer │ │ Reddit Monitor │ │ X Social Monitor │
    └─────┬───────┘ └───────┬───────┘ └───────┬───────┘
          │                 │                 │
    ┌─────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
    │ Content Generator │ Data Summarizer │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### Agent 定义文件

1. **ceo-manager.md** - 总执行协调员
2. **seo-analyzer.md** - SEO 分析专家
3. **reddit-monitor.md** - Reddit 监控专家
4. **x-social-monitor.md** - X 平台监控专家
5. **marketing-content-generator.md** - 内容生成专家
6. **marketing-report-synthesizer.md** - 报告合成专家

## 数据流程

```
1. 用户输入关键词
    ↓
2. Agent 协调员分配任务
    ↓
3. 多 Agent 并行收集数据
    ↓
4. 数据汇总和分析
    ↓
5. 生成营销洞察和建议
    ↓
6. 用户获得行动方案
```

## 阶段规划

### 第一阶段（当前）
- ✅ 前端页面完成
- ✅ 后端基础架构
- ✅ Google OAuth 登录
- ✅ X Agent 功能

### 第二阶段（进行中）
- 🔲 完善其他 Agent
- 🔲 数据库优化
- 🔲 前后端集成
- 🔲 功能测试

### 第三阶段（未来）
- 🔲 多平台监控
- 🔲 高级分析功能
- 🔲 用户系统完善
- 🔲 性能优化

## 快速开始

### 1. 环境准备
```bash
# 配置后端
cd backend
cp .env.example .env
# 编辑 .env 文件，填入 API 密钥

# 安装依赖
pip install -r requirements.txt

# 启动后端
./start.sh
```

### 2. 访问应用
- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

### 3. Google OAuth 配置
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建 OAuth 2.0 客户端
3. 添加授权回调 URL
4. 在后端 `.env` 中配置

## 文档导航

### 开发文档
- [前端集成指南](backend/FRONTEND_INTEGRATION.md)
- [后端架构文档](docs/BACKEND_ARCHITECTURE.md)
- [快速启动指南](backend/QUICKSTART.md)

### API 文档
- [Swagger UI](http://localhost:8000/docs)
- [ReDoc](http://localhost:8000/redoc)

### 项目文档
- [后端实现总结](backend/IMPLEMENTATION_SUMMARY.md)
- [项目配置](configs/)

## 特色优势

1. **智能协作**: 多 Agent 协作，全方位分析
2. **实时监控**: 实时追踪平台动态
3. **自动化**: 从数据收集到营销建议全自动
4. **可扩展**: 模块化设计，易于扩展
5. **用户友好**: 简洁直观的界面设计

## 联系方式

如有问题或建议，请联系开发团队。

---

*Vibe Marketing - 让海外营销更智能*