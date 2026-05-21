# My Nav · 个人导航站

基于 Next.js 14 + SQLite + Drizzle ORM 的轻量个人导航站，自带后台管理。

## 功能

- 简洁前台：分类网格 + 聚合搜索栏（多搜索引擎切换） + 深/浅色主题
- 访客推荐：未登录也能提交「推荐网址」（按 IP 限流），后台审核通过后入库
- 链接隐藏：可将链接标为「隐藏」，访客看不到，管理员登录后仍可在首页预览（带角标）
- 后台管理：链接 / 分类 / 搜索引擎 / 站点设置 的增删改查，推荐审核（通过 / 拒绝 / 删除），链接列表行内一键切换显示/隐藏
- 分类图标：内置 emoji 下拉选择器，所见即所得
- Favicon 自动抓取（HTML 解析 → /favicon.ico → Google S2 三级回退）+ 手动上传覆盖 + 一键清除（清除后首页回落到标题首字符占位）
- 单管理员认证（Auth.js Credentials Provider + bcrypt），登录页左上角内置「返回首页」入口
- 站点标题/副标题在「站点设置」页统一维护，前台标题、`<title>`、后台侧边栏标题三处同步

## 技术栈

- **Next.js 14 App Router** + TypeScript
- **Tailwind CSS** + shadcn/ui 风格组件（Radix UI）
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
  - 默认账户：`admin / admin123`（在 `.env` 中通过 `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` 修改）

## 部署到 VPS

首次部署：

```bash
# 在服务器上：
git clone <repo> && cd nav-site
npm ci
cp .env.example .env  # 修改 AUTH_SECRET、SEED 凭据；DATABASE_URL 建议写绝对路径
npm run db:push
npm run db:seed
npm run build         # 产出 .next/standalone

# 拷贝 standalone 运行时依赖
mkdir -p public/uploads/icons          # 首次部署需手动建（gitignore 中）
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# .next/standalone 是独立运行目录，需要单独配 .env（Next 不会读上层 .env）
cp .env .next/standalone/.env
# 确认 .next/standalone/.env 至少包含：
#   DATABASE_URL=/abs/path/data/app.db      ← 必须绝对路径
#   AUTH_SECRET=...
#   AUTH_TRUST_HOST=true
#   AUTH_URL=https://your.domain            ← 与浏览器实际访问 URL 一致

# 用 PM2 启动
pm2 start ecosystem.config.cjs
pm2 save

# Nginx 反代见 deploy/nginx.conf.example
```

> ⚠️ 推荐网址功能依赖按 IP 内存限流，要求 PM2 单进程运行（`ecosystem.config.cjs` 默认 `instances: 1, exec_mode: 'fork'`，请不要改成 cluster 模式）。Nginx 必须转发 `X-Real-IP` / `X-Forwarded-For`（模板已配置）。

### 升级现有部署

仓库内提供一键升级脚本，会自动备份/还原 `.next/standalone/.env`、保留运行时上传的 favicon：

```bash
cd nav-site
bash deploy/update.sh
```

脚本流程：`git pull` → `npm ci` → 备份 `.next/standalone/.env` → `npm run build` → 同步 `public/`（排除 `uploads/`）和 `.next/static/` → 还原 `.env` → `pm2 restart n_site`。可通过 `PM2_APP=xxx bash deploy/update.sh` 覆盖 PM2 应用名。

如有新的数据库迁移，在脚本前后手动跑：

```bash
DATABASE_URL=/abs/path/data/app.db npm run db:migrate
```

> 若该实例最早是用 `npm run db:push` 初始化的（`__drizzle_migrations` 表为空），首次执行 `db:migrate` 会报 `table already exists`。需要先把 0000 迁移标记为已应用——参考 `CLAUDE.md` 的 Data layer 段。后续迁移正常追加，不再有此问题。

数据库文件位于 `data/app.db`，备份时直接拷贝该文件即可。

## 目录结构

```
src/
├── app/
│   ├── page.tsx                    # 前台首页（server component, 直读 Drizzle）
│   ├── layout.tsx                  # 全局 metadata（title 来自 settings）
│   ├── uploads/icons/[file]/       # 运行时 favicon 直读路由（绕过 standalone 静态缓存）
│   ├── admin/
│   │   ├── login/page.tsx          # 登录页（无侧边栏）
│   │   └── (authed)/               # 鉴权路由组
│   │       ├── layout.tsx          # 侧边栏（标题读 settings.siteTitle）
│   │       ├── links/page.tsx
│   │       ├── submissions/page.tsx  # 推荐审核
│   │       ├── categories/page.tsx
│   │       ├── search/page.tsx
│   │       └── settings/page.tsx
│   └── api/                        # CRUD + upload + favicon + submissions + settings API
├── components/
│   ├── public/                     # recommend-dialog / search-bar
│   ├── theme-*.tsx
│   └── ui/                         # shadcn 风格基础组件
├── db/                             # Drizzle schema + 实例 + migrations
├── lib/                            # auth / favicon / validation / rate-limit / api-client / utils
└── middleware.ts                   # 仅匹配 /admin/:path*
deploy/
├── nginx.conf.example
└── update.sh                       # 一键升级脚本
scripts/
├── migrate.ts
└── seed.ts
```
