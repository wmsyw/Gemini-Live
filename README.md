# Gemini Live Voice PWA

基于 Google Gemini-2.5-Flash-Live API 的实时语音对话 Web 应用程序。

## 功能特点

- 🎙️ **实时语音对话**: 低延迟的双向语音交互
- 🌊 **可视化波形**: 实时音频频谱可视化
- 📝 **即时转录**: 实时显示 AI 回复文本
- 💾 **历史记录**: 自动保存对话记录，支持回放
- 📱 **PWA 支持**: 可安装到手机主屏幕，支持离线缓存
- 🎨 **Material Design 3**: 现代化 UI，支持深色模式
- 🌍 **多语言支持**: 中英文界面切换

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器（自动启动代理）

```bash
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产版本

```bash
npm run preview
```

## 本地开发（建议使用代理）

为避免在浏览器中暴露 API Key，建议本地通过 WebSocket 代理转发到 Gemini Live API。

1. 设置环境变量并启动代理：

```bash
export GEMINI_API_KEY="你的密钥"
npm run proxy
```

2. 启动前端开发服务器：

```bash
npm run dev
```

说明：本地环境将自动启动代理并连接 `ws://localhost:27777/live`，无需额外命令。代理的加密密钥会在首次启动时自动生成并保存在 `server/.secrets/proxy.secret`（权限 600），用于对本地持久化的 API Key 加密存储。

## 配置说明

首次使用请在设置页面配置您的 Gemini API Key：

1. 获取 API Key: https://aistudio.google.com/app/apikey
2. 打开应用，点击底部导航栏的“设置”
3. 输入 API Key 并保存（变更后会自动重建连接）
4. 可在“音频设置”中选择声音风格（Aoede/Puck/Charon/Fenrir/Kore）

历史记录：支持单条删除、多选删除、全部删除（均带确认提示）。

## 技术栈

- **Frontend**: React, TypeScript, Vite
- **UI**: Material-UI (MUI)
- **State**: Zustand
- **Storage**: IndexedDB (idb)
- **Audio**: Web Audio API
- **API**: Gemini Live API (WebSocket)
- **PWA**: vite-plugin-pwa

## 注意事项

- 请确保使用 HTTPS 环境或 localhost，否则浏览器可能阻止麦克风访问。
- 需要科学上网环境以连接 Google Gemini API。

## 部署流程（生产环境）

目标：前端静态站 + 后端 WS 代理，后端持有密钥，通过 `wss` 转发到 Gemini Live API。

1. 构建前端静态资源：

```bash
npm run build
```

2. 启动 WS 代理（服务端）：

```bash
export GEMINI_API_KEY="你的密钥"
PORT_INTERNAL=27777 PORT_PUBLIC=5173 node server/proxy.js
```

3. 使用反向代理（示例 Nginx）为 WS 代理提供 `wss`：

```nginx
server {
    listen 443 ssl;
    server_name your.domain;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location /live {
        proxy_pass http://127.0.0.1:5173/live;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://127.0.0.1:5173/;
    }
}
```

4. 前端连接说明：

- 本地开发自动使用 `ws://localhost:27777/live`
- 生产环境前端通过 `http://<host>:5173/` 访问，前端的 `/live` WebSocket 将在容器内转发到内部代理 `127.0.0.1:27777`，无需对外暴露 27777。
- 如需显式指定前端连接地址，可在代码中为 `GeminiLiveClient` 传入同域 `/live`。

## Docker 部署

### 本地打包镜像

```bash
docker build -t gemini-live-voice-pwa:latest .
```

### 运行容器（单容器同时提供静态站与 WS 代理）

```bash
docker run -d \
  --name gemini-live \
  -p 5173:5173 \
  -e GEMINI_API_KEY="你的密钥" \
  -e PROXY_SECRET="可选，用于安全持久化 API Key" \
  -e PORT_PUBLIC=5173 \
  -e PORT_INTERNAL=27777 \
  ghcr.io/wmsyw/gemini-live-voice-pwa:latest
```

- 访问前端：`http://localhost:5173/`
- 前端将通过同域 `ws://localhost:5173/live` 与后端交互，容器内会转发到 `127.0.0.1:27777/live`
- 若不设置 `GEMINI_API_KEY`，可在应用“设置”页保存 API Key，后端将接收并立即生效；设置 `PROXY_SECRET` 时会加密持久化到容器内 `server/.secrets/gemini.key.enc`

### 使用 GitHub Actions 自动构建并发布镜像

仓库已包含工作流文件：`.github/workflows/docker-build.yml`

- 触发条件：推送到 `main` 分支或创建 `v*` 标签
- 发布目标：GitHub Container Registry（`ghcr.io`）
  - 架构：多平台镜像（`linux/amd64`、`linux/arm64`）

使用步骤：

1. 确认仓库可使用默认的 `GITHUB_TOKEN` 推送到 GHCR（默认已启用）
2. 推送到 `main` 或创建版本标签：
   ```bash
   git tag v0.1.0 && git push --tags
   ```
3. 镜像将以如下命名发布：
   - `ghcr.io/<你的组织或用户名>/gemini-live-voice-pwa:latest`
   - `ghcr.io/<你的组织或用户名>/gemini-live-voice-pwa:<commit-sha>`

拉取并运行：

```bash
docker pull ghcr.io/wmsyw/gemini-live-voice-pwa:latest
docker run -d \
  --name gemini-live \
  -p 5173:5173 \
  -e GEMINI_API_KEY="你的密钥" \
  -e PROXY_SECRET="可选的持久化密钥" \
  -e PORT_PUBLIC=5173 \
  -e PORT_INTERNAL=27777 \
  ghcr.io/wmsyw/gemini-live-voice-pwa:latest
```

生产环境建议：

- 在反向代理（Nginx/Caddy）中为外部提供 `https://` 与 `wss://`，反代到容器 `http://127.0.0.1:5173` 的路径 `/live`

### 使用 Docker Compose（推荐）

已提供 `docker-compose.yml`，默认使用 GHCR 镜像，公开 5173，内部 27777，并启用数据持久化：

```bash
docker compose up -d
```

持久化目录：Compose 将主机当前目录下的 `./secrets` 绑定到容器 `/app/server/.secrets`，用于保存自动生成的 `proxy.secret` 与加密后的 `gemini.key.enc`，确保容器重建后仍可恢复。仅映射 `5173:5173`，`27777` 不对公网暴露。

如需在启动时注入 API Key：编辑 `docker-compose.yml` 设置 `GEMINI_API_KEY`；也可以留空，在应用“设置”页保存后端将自动持久化。
- 将 `PROXY_SECRET` 作为机密注入到部署环境，启用后端的加密持久化

## 常见问题与排查

- 点击麦克风后一直“连接中”：
  - 检查代理是否已启动并输出“WS proxy listening…”
  - 浏览器是否在 `https://` 环境下使用了非加密 `ws://`（Mixed Content 被阻止），请改用 `wss://` 反代
  - 是否已正确设置 `GEMINI_API_KEY`

- 没有音频频谱：
  - 确认已允许麦克风权限
  - 确认浏览器处于安全上下文（`https://` 或 `http://localhost`）

- 历史记录播放无反应：
  - 新版已保存模型音频并支持回放；旧会话未保存音频时将回退为 TTS 朗读文本

## 安全建议

- 不要在浏览器端直接携带 API Key；通过服务端代理持有密钥
- 生产环境使用 `wss://`，避免混合内容与中间人风险
- 对外仅暴露必要的 WS 路由（如 `/live`），限制跨域与访问来源
