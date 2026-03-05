# Vibe Marketing 后端架构文档

## 概述

Vibe Marketing 后端采用 **FastAPI** 框架构建，提供RESTful API服务，支持Google OAuth认证和X AI集成。

## 技术栈

### 核心框架
- **FastAPI**: 现代化的Python Web框架，支持异步操作
- **Uvicorn**: ASGI服务器，用于运行FastAPI应用
- **Pydantic**: 数据验证和设置管理

### 数据库
- **SQLAlchemy**: Python SQL工具包和ORM
- **Alembic**: 数据库迁移工具
- **SQLite** (开发环境) / **PostgreSQL** (生产环境)

### 认证与授权
- **Google OAuth 2.0**: 第三方身份验证
- **JWT**: JSON Web Token用于会话管理
- **python-jose**: JWT编码/解码

### API客户端
- **httpx**: 异步HTTP客户端
- **requests**: 同步HTTP客户端（测试用）

### 缓存与任务队列
- **Redis**: 缓存和会话存储
- **Celery**: 异步任务处理（预留）

## 项目结构

```
backend/
├── app/                          # 应用主目录
│   ├── __init__.py
│   ├── main.py                   # FastAPI应用入口
│   ├── config.py                 # 应用配置
│   ├── database.py               # 数据库连接
│   ├── models.py                 # SQLAlchemy ORM模型
│   ├── schemas.py                # Pydantic验证模型
│   ├── auth/                     # 认证模块
│   │   ├── __init__.py
│   │   ├── routes.py             # 认证API路由
│   │   ├── google_oauth.py       # Google OAuth逻辑
│   │   └── jwt_handler.py        # JWT令牌处理
│   ├── api/                      # API模块
│   │   ├── __init__.py
│   │   └── x_agent/              # X Agent API
│   │       ├── __init__.py
│   │       └── routes.py         # X Agent路由
│   ├── services/                 # 业务逻辑层
│   │   ├── __init__.py
│   │   └── xai_service.py        # X AI服务
│   └── middleware/               # 中间件
│       ├── __init__.py
│       └── auth.py               # 认证中间件
├── tests/                        # 测试目录
│   ├── __init__.py
│   └── test_api.py               # API测试
├── examples/                     # 示例代码
│   ├── __init__.py
│   └── usage_example.py          # 使用示例
├── logs/                         # 日志目录
├── requirements.txt              # Python依赖
├── .env.example                  # 环境变量模板
├── .env                          # 环境变量（不提交到git）
├── docker-compose.yml            # Docker Compose配置
├── Dockerfile                    # Docker镜像配置
├── run.py                        # 应用启动脚本
├── start.sh                      # 快速启动脚本
├── README.md                     # 项目说明
├── QUICKSTART.md                 # 快速启动指南
└── FRONTEND_INTEGRATION.md       # 前端集成指南
```

## 核心模块说明

### 1. 应用入口 (main.py)

- 初始化FastAPI应用
- 配置CORS中间件
- 注册API路由
- 静态文件服务（前端集成）

### 2. 配置管理 (config.py)

使用 `pydantic-settings` 管理环境变量，支持从 `.env` 文件加载配置。

**配置项：**
- 服务器配置：端口、调试模式、API版本前缀
- 数据库配置：数据库连接URL
- JWT配置：密钥、算法、过期时间
- Google OAuth配置：客户端ID、密钥、回调URL
- X AI配置：API密钥、API URL
- Redis配置：主机、端口、数据库
- 前端配置：前端URL（CORS）

### 3. 数据库层

**database.py:**
- 数据库连接和会话管理
- 依赖注入函数 `get_db()`
- 数据库初始化函数 `init_db()`

**models.py:**
- `User`: 用户表（存储Google认证信息）
- `XAnalysis`: X分析记录表（存储用户分析历史）

### 4. 认证模块

**jwt_handler.py:**
- `create_access_token()`: 创建JWT令牌
- `verify_token()`: 验证JWT令牌
- `get_current_user()`: 获取当前认证用户
- `get_current_active_user()`: 获取当前活跃用户

**google_oauth.py:**
- `verify_google_token()`: 验证Google ID令牌
- `authenticate_or_create_user()`: 认证或创建用户
- `login_with_google()`: Google登录流程

**routes.py:**
- `POST /auth/google/login`: 使用Google令牌登录
- `GET /auth/google/auth-url`: 获取Google授权URL

### 5. X Agent模块

**xai_service.py:**
- `analyze_keyword()`: 分析X平台关键词
- `get_trending_topics()`: 获取热门话题

**routes.py:**
- `POST /x-agent/analyze`: 提交关键词分析
- `GET /x-agent/history`: 获取分析历史
- `GET /x-agent/trending`: 获取热门话题

### 6. 中间件

**auth.py:**
- 认证中间件，保护需要认证的路由
- 验证JWT令牌并加载用户信息
- 公开路由白名单

## API端点总览

### 认证 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/v1/auth/google/login` | Google登录 | 否 |
| GET | `/api/v1/auth/google/auth-url` | 获取OAuth URL | 否 |

### X Agent API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/v1/x-agent/analyze` | 分析关键词 | 是 |
| GET | `/api/v1/x-agent/history` | 分析历史 | 是 |
| GET | `/api/v1/x-agent/trending` | 热门话题 | 是 |

### 系统 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/` | 根端点 | 否 |
| GET | `/health` | 健康检查 | 否 |
| GET | `/docs` | Swagger文档 | 否 |
| GET | `/redoc` | ReDoc文档 | 否 |

## 数据流程

### Google登录流程

```
1. 前端请求OAuth URL
   → GET /auth/google/auth-url

2. 用户在Google授权页面登录

3. Google重定向到前端（带id_token）

4. 前端发送id_token到后端
   → POST /auth/google/login

5. 后端验证id_token

6. 创建或获取用户

7. 生成JWT令牌

8. 返回令牌和用户信息
```

### 关键词分析流程

```
1. 前端发送分析请求（带JWT令牌）
   → POST /x-agent/analyze

2. 后端验证JWT令牌

3. 获取当前用户

4. 创建分析记录（状态：pending）

5. 调用X AI服务

6. 更新分析记录（状态：completed）

7. 返回分析结果
```

## 部署架构

### 开发环境

```
┌─────────────┐
│   前端      │  React (localhost:3000)
│  (React)    │
└──────┬──────┘
       │ HTTP/REST API
┌──────▼──────┐
│   后端      │  FastAPI (localhost:8000)
│  (FastAPI)  │
└──────┬──────┘
       │
┌──────▼──────┐
│  SQLite     │  本地数据库
└─────────────┘
```

### 生产环境

```
                    ┌─────────────┐
                    │   负载均衡   │
                    │   (Nginx)   │
                    └──────┬──────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼────────┐              ┌────────▼────────┐
│   前端容器        │              │   后端容器       │
│  (React + Nginx)  │              │   (FastAPI)     │
└──────────────────┘              └───────┬─────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
            ┌───────▼──────┐     ┌────────▼────────┐   ┌─────────▼───────┐
            │ PostgreSQL   │     │     Redis       │   │     X AI API    │
            │  (Database)  │     │    (Cache)      │   │  (External)     │
            └──────────────┘     └─────────────────┘   └─────────────────┘
```

## 安全考虑

1. **JWT安全**:
   - 使用强密钥
   - 设置合理的过期时间
   - 生产环境使用HTTPS

2. **数据库安全**:
   - 使用参数化查询防止SQL注入
   - 不存储明文密码（使用OAuth）
   - 敏感数据加密

3. **API安全**:
   - 认证中间件保护路由
   - 输入验证（Pydantic schemas）
   - CORS配置限制来源

4. **环境变量**:
   - 不在代码中硬编码密钥
   - 使用 `.env` 文件管理
   - 生产环境使用密钥管理服务

## 扩展性

### 水平扩展

- FastAPI支持多进程部署（Uvicorn workers）
- 使用Docker Compose进行容器编排
- 使用Kubernetes进行大规模部署

### 功能扩展

预留的扩展模块：
- `api/other_agents/`: 其他Agent API（SEO、Reddit、内容生成）
- `services/`: 其他业务服务
- `middleware/`: 其他中间件（日志、限流、监控）

### 性能优化

- Redis缓存热点数据
- Celery异步处理耗时任务
- 数据库索引优化
- CDN静态资源加速

## 监控与日志

### 日志位置

- 应用日志: `backend/logs/`
- 使用标准日志库记录错误和访问信息

### 健康检查

- `/health` 端点用于健康检查
- 可用于负载均衡器监控

### API文档

- 自动生成的OpenAPI文档
- `/docs` (Swagger UI)
- `/redoc` (ReDoc)

## 测试

### 单元测试
- pytest框架
- 测试覆盖核心功能

### 集成测试
- API测试脚本 `tests/test_api.py`
- 使用示例 `examples/usage_example.py`

## 未来规划

1. **完善其他Agent**:
   - SEO Agent
   - Reddit Monitor Agent
   - Marketing Content Generator Agent

2. **增强功能**:
   - 用户权限管理
   - 团队协作功能
   - 报告导出

3. **性能优化**:
   - 缓存策略优化
   - 数据库查询优化
   - 异步任务处理

4. **监控告警**:
   - Prometheus监控
   - Grafana可视化
   - 错误追踪（Sentry）