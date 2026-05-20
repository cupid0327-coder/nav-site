# My Nav · 个人导航站

基于 Next.js 14 + SQLite + Drizzle ORM 的轻量个人导航站，自带后台管理。

## 功能

- 简洁前台：分类网格 + 聚合搜索栏（多搜索引擎切换） + 深/浅色主题
- 访客推荐：未登录也能提交「推荐网址」（按 IP 限流），后台审核通过后入库
- 链接隐藏：可将链接标为「隐藏」，访客看不到，管理员登录后仍可在首页预览（带角标）
- 后台管理：链接 / 分类 / 搜索引擎 / 站点设置 的增删改查，推荐审核（通过 / 拒绝 / 删除），链接列表行内一键切换显示/隐藏
- Favicon 自动抓取（HTML 解析 → /favicon.ico → Google S2 三级回退）+ 手动上传覆盖
- 单管理员认证（Auth.js Credentials Provider + bcrypt），登录页左上角内置「返回首页」入口

## 技术栈

- **Next.js 14 App Router** + TypeScript
- **Tailwind CSS** + shadcn/ui 风格组件
- **SQLite** (better-sqlite3) + **Drizzle ORM**
- **Auth.js (NextAuth v5)** 单管理员鉴权
- 部署：PM2 + Nginx（VPS）

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 准备环境变量
cp .env.example .env
# 编辑 .env：至少设置 AUTH_SECRET（可用 `openssl rand -base64 32` 生成）

# 3. 初始化数据库
npm run db:push       # 创建 SQLite 表
npm run db:seed       # 创建管理员 + 默认搜索引擎 + 示例数据

# 4. 启动开发服务器
npm run dev
```

访问：

- 前台：http://localhost:3000
- 后台登录：http://localhost:3000/admin/login
  - 默认账户：`admin / admin123`（在 `.env` 中修改）

## 部署到 VPS

```bash
# 在服务器上：
git clone <repo> && cd n_site
npm ci
cp .env.example .env  # 修改 AUTH_SECRET、SEED 凭据
npm run db:push
npm run db:seed
npm run build         # 产出 .next/standalone

# 拷贝 standalone 依赖
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# 用 PM2 启动
pm2 start ecosystem.config.cjs
pm2 save

# Nginx 反代见 deploy/nginx.conf.example
```

> ⚠️ 推荐网址功能依赖按 IP 内存限流，要求 PM2 单进程运行（`ecosystem.config.cjs` 默认 `instances: 1, exec_mode: 'fork'`，请不要改成 cluster 模式）。Nginx 必须转发 `X-Real-IP` / `X-Forwarded-For`（模板已配置）。

### 升级现有部署

拉新版本后，跑一次 `db:migrate` 让新迁移生效（如新增「推荐网址」表、`links.hidden` 列等）：

```bash
git pull
npm ci
npm run db:migrate    # 应用 src/db/migrations 下的新迁移
npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
pm2 restart n_site
```

> 若该实例最早是用 `npm run db:push` 初始化的（`__drizzle_migrations` 表为空），首次执行 `db:migrate` 会报 `table already exists`。需要先把 0000 迁移标记为已应用——参考 `CLAUDE.md` 的 Data layer 段。后续迁移正常追加，不再有此问题。

数据库文件位于 `data/app.db`，备份时直接拷贝该文件即可。

## 目录结构

```
src/
├── app/
│   ├── page.tsx                    # 前台首页
│   ├── admin/
│   │   ├── login/page.tsx          # 登录页（无侧边栏）
│   │   └── (authed)/               # 鉴权路由组
│   │       ├── layout.tsx
│   │       ├── links/page.tsx
│   │       ├── submissions/page.tsx  # 推荐审核
│   │       ├── categories/page.tsx
│   │       ├── search/page.tsx
│   │       └── settings/page.tsx
│   └── api/                        # CRUD + upload + favicon + submissions API
├── components/                     # UI 组件（含 public/recommend-dialog）
├── db/                             # Drizzle schema + 实例
├── lib/                            # auth / favicon / validation / rate-limit
└── middleware.ts
```
