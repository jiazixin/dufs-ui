# AGENTS.md — dufs-ui 开发与代码规范

本文件汇总本仓库必须遵守的工程约束，源自同目录的 [Web代码规范.md](Web代码规范.md) 与 [Vue代码规范.md](Vue代码规范.md)，并结合 `dufs --assets` 的构建部署约定。

## 1. 项目定位与构建契约

- 本项目是 `sigoden/dufs` 的现代化 Vue 3 + TypeScript 自定义前端（中转站风格，细线无底图标，曜石黑强调色）。
- 生产构建产物（`dist/`）直接作为 `dufs --assets ./dist` 使用：
  - `index.html` 中保留 `<template id="index-data">__INDEX_DATA__</template>`。
  - 生产构建 `base` 为 `__ASSETS_PREFIX__`，不从外部 CDN 加载任何脚本、样式或字体（满足 `default-src 'self'` CSP）。
  - 生产构建不发布 sourcemap；显式声明 `build.target`（`['es2022', 'chrome110', 'safari16', 'firefox115']`）。

## 2. 工具链与固定脚本

- 包管理器固定为 **npm**，提交 `package-lock.json`；`package.json` 声明 `engines.node`。
- 固定脚本（不得另起同义名称）：
  - `npm run dev`：本地开发服务器（无 `__INDEX_DATA__` 时自动进入本地演示模式）
  - `npm run build`：Vite 生产构建（不隐式执行检查）
  - `npm run typecheck`：`vue-tsc --noEmit`
  - `npm run lint`：`eslint . --max-warnings 0 && stylelint "src/**/*.{css,vue}" --max-warnings 0`
  - `npm run format` / `npm run format:check`：Prettier 格式化与校验
  - `npm run test`：`vitest run`
- 提交前必须依次通过：`format:check` → `lint` → `typecheck` → `test` → `build`。

## 3. TypeScript 规则

- 严格开启：`strict`、`noUncheckedIndexedAccess`、`noUnusedLocals`、`noUnusedParameters`、`noImplicitOverride`、`noFallthroughCasesInSwitch`、`verbatimModuleSyntax`、`erasableSyntaxOnly`。
- 禁止 `any`、禁止非空断言 `!`、禁止 `enum`（使用字面量联合类型 + `as const`）。
- 对象类型统一使用 `type`；`interface` 仅用于 `.d.ts` 模块扩充与全局声明。
- 类型导入必须使用 `import type`；所有导入只使用**相对路径**，不配置路径别名。
- 不写嵌套三元表达式；两分支以上改用提前返回、`switch` 或查找表。
- `catch` 错误按 `unknown` 处理，用 `instanceof` 收窄，禁止 `(e as Error)`。

## 4. Vue 3.5+ 规则

- 只使用 `<script setup lang="ts">`，禁止 Options API、`defineComponent` 及同 SFC 第二个 `<script>`。
- SFC 块顺序固定为：`<script setup lang="ts">` → `<template>` → `<style scoped>`。
- 模板中组件标签使用 PascalCase；禁止 `v-html`；`v-for` 必须带稳定 `:key`，不与 `v-if` 同元素混用。
- Props 使用类型声明 + Vue 3.5 解构默认值（不用 `withDefaults`）；Emits 使用元组语法；双向绑定用 `defineModel`。
- 派生状态用 `computed`，副作用用 `watch`；异步 `watch` 必须在第一个 `await` 前通过 `onWatcherCleanup` 取消旧请求。
- 不引入 Pinia、不引入 UI 组件库、单页应用不引入 `vue-router`；图标统一使用 `@lucide/vue`。
- 应用级单例状态放在 `src/app/`，业务域状态放在 `src/features/<domain>/use-*.ts`。

## 5. 命名与数据契约

- 组件文件 PascalCase（如 `FileListTable.vue`）；非组件 `.ts` 文件 kebab-case；Composable 为 `use-<name>.ts` 并导出 `use<Name>`。
- 布尔变量以 `is` / `has` / `can` / `should` 开头。
- 服务端接口字段在客户端保留原名（如 `path_type`、`allow_upload`、`uri_prefix`）。

## 6. 请求、错误与格式化

- 所有 HTTP 请求统一经 `src/app/api.ts` 发出，失败统一抛出 `ApiError`；业务组件与 composable 禁止直接裸调 `fetch`。
- 用户可见错误文案只通过 `src/app/errors.ts` 的 `errorText(error, messages?)` 生成。
- 加载中、空目录、加载失败三种状态必须区分；加载失败使用 `role="alert"` 展示错误与重试按钮。
- 写操作结果通过 `src/app/toast.ts` 全局提示（`role="status"`）反馈。
- 日期、时间、文件大小只通过 `src/lib/format/` 输出；文件大小按 1024 进制显示 `B` / `KiB` / `MiB` / `GiB` / `TiB`，空值统一显示 `—`。

## 7. 样式与无障碍

- 颜色、间距、圆角、阴影、字号、动效变量仅在 `src/styles/` 中定义；组件内禁止写颜色字面量（hex、rgb/rgba、hsl、具名颜色等），全部引用 CSS 变量。
- 声明 `color-scheme`，通过 `[data-theme='dark']` 覆盖同一组变量；必须处理 `prefers-reduced-motion`。
- 登记的响应式断点仅使用：`900px`、`640px`。
- 图标按钮必须提供 `aria-label` 或可访问文本；弹窗优先使用原生 `<dialog>`，支持 `Esc` 关闭与焦点恢复；保留 `:focus-visible`。

## 8. 测试要求

- 使用 Vitest + `@testing-library/vue` + `@testing-library/user-event`，不开启 `globals`，显式从 `vitest` 导入。
- 单元测试至少覆盖：`api.ts`、`errors.ts`、`src/lib/format/`、离线 QR 编码器及关键交互组件。
