# Firedre Admin Backend

Node.js + Hono admin backend for Firedre. Serves the admin panel UI and provides REST API endpoints.

## Quick Start

\\ash
cp .env.example .env
# Edit .env with your own secrets
npm install
node src/server.js
\\n
访问 http://localhost:3001/admin 进入后台管理面板。

默认账号: admin / admin123

## API Endpoints

- POST /admin/login — 登录获取 token
- POST /admin/init-admin — 初始化管理员（幂等）
- GET /admin/posts / POST /admin/posts / PUT /admin/posts/:id / DELETE /admin/posts/:id
- GET /admin/friends / POST /admin/friends / PUT /admin/friends/:id / DELETE /admin/friends/:id
- GET /admin/dynamic / POST /admin/dynamic / DELETE /admin/dynamic/:id
- GET /admin/notice / POST /admin/notice
- GET /admin/settings / PUT /admin/settings
- GET /admin/site-links / POST /admin/site-links / DELETE /admin/site-links/:id
- GET /admin/gallery / POST /admin/gallery / DELETE /admin/gallery/:id
- GET /admin/session — 验证当前会话
