<h1 align="center">dufs-ui · 现代极简文件中转站</h1>

<p align="center">
  为 <a href="https://github.com/sigoden/dufs">sigoden/dufs</a> 打造的 Vue 3 + TypeScript 自定义前端：<br>
  中转站风格、细线无底图标、曜石黑主题，支持拖拽上传、实时进度续传、弹窗预览与离线二维码分享。
</p>

<p align="center">
  <a href="https://github.com/jiazixin/dufs-ui/actions/workflows/ci.yml"><img src="https://github.com/jiazixin/dufs-ui/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://github.com/jiazixin/dufs-ui/releases/latest"><img src="https://img.shields.io/github/v/release/jiazixin/dufs-ui?sort=semver" alt="Release"></a>
  <img src="https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white" alt="Vue 3.5">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/dufs---assets-18181b" alt="dufs --assets">
</p>

<p align="center">
  <b>简体中文</b> · <a href="README.en.md">English</a>
</p>

---

dufs-ui 是完全静态的前端资源包，构建产物（`index.html`、`index.css`、`index.js`）直接通过 `dufs --assets` 挂载使用。不依赖任何外部 CDN、字体或第三方二维码接口，内网与离线环境同样秒开，适合作为个人或小团队的轻量临时文件中转站。

> [!IMPORTANT]
>
> - 启用 `dufs -A`（或 `--allow-delete`）时，**删除文件或目录是永久删除**，不会进入回收站，请确认目录权限范围。
> - `dufs` 上传采用标准单请求流式 `PUT` / `PATCH`，若前置了 Cloudflare 免费代理（单请求上限 100 MiB），大文件上传可能触发 `413`；建议直连、内网使用或调大自建反向代理的上传限制与超时。

## 功能特性

- **极速中转站布局**：顶部可折叠拖拽投放区 + 当前目录迷你扫码卡片；支持浅色 / 深色双主题切换与列表 / 网格视图切换。
- **拖拽 & 剪贴板上传**：支持拖入多文件与整个文件夹（自动保留目录结构），支持 `Ctrl+V` 直接粘贴剪贴板截图或文件上传。
- **实时上传进度队列**：右下角悬浮进度卡片，实时展示传输百分比、已传大小、平滑网速（`KiB/s`、`MiB/s`）与预计剩余时间；支持单个取消与断线续传重试（`HEAD` + `PATCH`）。
- **全能弹窗预览**：基于原生 `<dialog>` 的 Quick Look 预览——图片支持缩放、旋转与键盘 `←` / `→` 切换，视频与音频原生流式播放，PDF 内嵌查看，代码与文本支持一键复制及有写权限时的在线编辑保存。
- **纯本地离线二维码**：内置标准 ISO/IEC 18004 二维码编码器，零外部请求即可为任意文件或当前目录生成二维码，支持保存 PNG、复制直链，登录认证模式下支持生成 `tokengen` 免密临时下载链接。
- **紧凑列表与多维排序**：名称、修改时间、大小均带升降序排序按钮并同步 URL Query；完整兼容 `dufs` 权限控制、目录打包下载（`?zip`）、搜索（`/` 或 `Ctrl+K`）、登录认证与 `?edit` / `?view` 独立页面。

## 运行要求

| 项目       | 要求                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| 服务端     | [sigoden/dufs](https://github.com/sigoden/dufs)（支持 `--assets` 参数） |
| 浏览器     | Chrome / Edge 110+、Safari 16+、Firefox 115+                            |
| 从源码构建 | Node.js ≥ 22.0、npm                                                     |

## 快速开始

### 1. 下载 Release 产物直接使用（推荐）

前往 [Releases](https://github.com/jiazixin/dufs-ui/releases/latest) 下载最新的 `dufs-ui-<tag>.zip` 或 `dufs-ui-<tag>.tar.gz`，解压后挂载给 `dufs`：

```bash
# 使用 .zip
unzip dufs-ui-v1.0.0.zip -d dufs-ui
dufs /你的共享目录 -A --assets ./dufs-ui

# 或使用 .tar.gz
mkdir -p dufs-ui && tar -xzf dufs-ui-v1.0.0.tar.gz -C dufs-ui
dufs /你的共享目录 -A --assets ./dufs-ui
```

### 2. Docker Compose 部署示例

```yaml
services:
  dufs:
    image: sigoden/dufs:latest
    ports:
      - '5000:5000'
    volumes:
      - ./shared:/data
      - ./dufs-ui:/assets:ro
    command: /data -A --assets /assets
    restart: unless-stopped
```

### 3. 从源码构建

```bash
git clone https://github.com/jiazixin/dufs-ui.git
cd dufs-ui
npm ci
npm run build
dufs /你的共享目录 -A --assets ./dist
```

## 开发与校验

在没有 `dufs` 后端时，直接运行 `npm run dev` 会自动进入内置演示模式（包含示例文件、模拟上传队列与离线二维码），方便本地调试 UI。

| 命令                                      | 说明                                                           |
| ----------------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                             | 启动 Vite 开发服务器（自动演示模式）                           |
| `npm run format` / `npm run format:check` | Prettier 格式化与校验                                          |
| `npm run lint`                            | ESLint（`strictTypeChecked` + Vue 3.5）与 Stylelint 零警告检查 |
| `npm run typecheck`                       | `vue-tsc --noEmit` 类型检查                                    |
| `npm run test`                            | Vitest + Testing Library 单元测试                              |
| `npm run build`                           | 构建生产产物至 `dist/`（不隐式执行检查）                       |

### 发布新版本

推送 `v*` 格式的 Tag 会自动触发 [Release 工作流](.github/workflows/release.yml)，依次通过全部检查后打包 `zip`、`tar.gz` 与 `SHA256SUMS.txt` 并发布 GitHub Release：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 项目结构

```text
.github/workflows/       GitHub Actions CI 与 Tag 自动发布流程
src/
  app/                   应用级单例与基础设施（api、errors、toast、dialog、theme）
  components/            通用布局组件（AppHeader、AppDialog、AppToast）
  features/files/        文件浏览、上传队列、弹窗预览、二维码分享业务域
  lib/                   纯工具库（1024 进制字节/时间格式化、离线 QR 编码器、URL）
  styles/                全部 CSS 设计变量（tokens.css）与基础样式（base.css）
  test/                  Vitest 测试初始化配置
AGENTS.md                面向协作者与 AI 的仓库工程约束汇总
Web代码规范.md            Web TypeScript 通用代码规范
Vue代码规范.md            Vue 3.5+ 专项代码规范
```

## 参与贡献

欢迎提交 Issue 和 Pull Request。提交前请：

1. 阅读 [AGENTS.md](AGENTS.md)、[Web代码规范.md](Web代码规范.md) 与 [Vue代码规范.md](Vue代码规范.md)；
2. 依次运行 `npm run format:check`、`npm run lint`、`npm run typecheck`、`npm run test` 与 `npm run build` 并确保全部通过。
