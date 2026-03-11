# md-to-pdf

Markdown API 文档转 PDF 的命令行工具，同时提供 Web 转换界面。

## 功能

- Markdown → HTML → PDF 全流程转换
- 代码块语法高亮（highlight.js）
- HTTP 方法关键词（GET/POST/PUT/DELETE/PATCH）自动着色
- 自动生成封面页、目录书签、页码
- 中文排版优化
- Web UI：上传 Markdown 文件，在线预览并下载 PDF

## 安装

```bash
npm install
npm run build
```

需要本地安装 Chrome 或 Chromium（PDF 渲染依赖 puppeteer-core）。

## 使用

### CLI

```bash
# 基本用法，输出同名 .pdf 文件
npx md-to-pdf input.md

# 指定输出路径
npx md-to-pdf input.md -o output.pdf
```

### Web UI

```bash
npm run web
# 默认监听 http://localhost:3000
```

打开浏览器上传 `.md` 文件即可预览和下载 PDF。

## 项目结构

```
src/
├── index.ts          # CLI 入口
├── cli.ts            # 命令行参数解析与执行流程
├── parser.ts         # Markdown 解析（markdown-it + highlight.js）
├── style-engine.ts   # CSS 样式与 HTML 页面组装
├── renderer.ts       # PDF 渲染（puppeteer-core）
├── server.ts         # Web 服务器
├── web-page.ts       # Web UI 页面
└── types.ts          # 类型定义
```

## 测试

```bash
npm test
```

## 技术栈

- TypeScript + ESM
- [markdown-it](https://github.com/markdown-it/markdown-it) — Markdown 解析
- [highlight.js](https://highlightjs.org/) — 代码高亮
- [puppeteer-core](https://pptr.dev/) — PDF 渲染
- [commander](https://github.com/tj/commander.js) — CLI 框架
- [vitest](https://vitest.dev/) + [fast-check](https://fast-check.dev/) — 测试

## License

MIT
