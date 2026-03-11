# 实现计划：Markdown 转 PDF

## 概述

基于 markdown-it + puppeteer 技术路线，将 Markdown API 文档转换为排版美观的 PDF 文件。按模块逐步实现：项目初始化 → Parser → StyleEngine → Renderer → CLI → 集成联调。

## 任务

- [x] 1. 初始化项目结构与核心接口
  - [x] 1.1 初始化 Node.js 项目并安装依赖
    - 初始化 `package.json`，安装 `markdown-it`、`highlight.js`、`puppeteer`、`commander`、`vitest`、`fast-check` 等依赖
    - 创建 `tsconfig.json` 配置 TypeScript 编译选项
    - 创建 `src/` 目录结构：`src/parser.ts`、`src/style-engine.ts`、`src/renderer.ts`、`src/cli.ts`、`src/types.ts`
    - _需求: 1.1, 1.2, 2.1, 3.1_

  - [x] 1.2 定义核心类型与接口
    - 在 `src/types.ts` 中定义 `Heading`、`ParseResult`、`ParserOptions`、`StyleOptions`、`RenderOptions`、`CLIArgs` 接口
    - 确保类型定义与设计文档一致
    - _需求: 1.1, 1.2, 2.1, 3.1_

- [x] 2. 实现 Parser 模块
  - [x] 2.1 实现 Markdown 解析核心功能
    - 在 `src/parser.ts` 中实现 `parse()` 函数
    - 配置 `markdown-it` 启用表格支持
    - 集成 `highlight.js` 作为代码高亮回调，支持 JSON、YAML 等语言
    - 解析过程中收集标题信息（level、text、id）填充 `headings` 数组
    - 从第一个 H1 提取文档标题
    - _需求: 1.1, 1.2, 4.2, 5.1_

  - [x] 2.2 实现 HTTP 方法标记处理
    - 在 Parser 中添加自定义规则或后处理逻辑，识别 HTTP 方法关键字（GET、POST、PUT、DELETE、PATCH）
    - 为 HTTP 方法包裹带有方法特定 CSS class 的 `<span>` 标签（如 `http-get`、`http-post` 等）
    - _需求: 4.1_

  - [x] 2.3 实现文件读取与错误处理
    - 实现文件读取函数，支持 UTF-8 编码验证
    - 文件不存在时抛出包含路径的错误：`File not found: {path}`
    - 非 UTF-8 编码时抛出错误：`Invalid UTF-8 encoding: {path}`
    - _需求: 1.3, 1.4_

  - [ ]* 2.4 编写 Parser 属性测试
    - **属性 1: Markdown 元素解析完整性** — 生成包含各种元素的 Markdown，验证 HTML 包含对应标签
    - **验证需求: 1.1, 1.2**
    - **属性 2: 解析幂等性** — 生成随机 Markdown，验证两次解析结果相同
    - **验证需求: 1.5, 1.6**
    - **属性 7: HTTP 方法颜色标记** — 生成包含 HTTP 方法的 Markdown，验证 HTML class
    - **验证需求: 4.1**
    - **属性 8: 代码块语法高亮** — 生成带语言标记的代码块，验证高亮标记
    - **验证需求: 4.2**
    - **属性 9: 标题提取完整性** — 生成包含随机数量标题的 Markdown，验证提取结果
    - **验证需求: 5.1**
    - **属性 11: 中英文内容保留** — 生成中英文混合文本，验证内容保留
    - **验证需求: 6.2**

  - [ ]* 2.5 编写 Parser 单元测试
    - 测试文件不存在时的错误处理（需求 1.3）
    - 测试非 UTF-8 编码文件的错误处理（需求 1.4）
    - 测试代码块 HTML 输出包含 highlight.js 标记
    - 测试 HTTP 方法标记的 CSS class 正确性

- [x] 3. 检查点 — 确保 Parser 模块测试通过
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 4. 实现 StyleEngine 模块
  - [x] 4.1 实现默认 CSS 样式表
    - 在 `src/style-engine.ts` 中实现 `getDefaultCSS()` 函数
    - 实现基础排版样式：字体族、字号、行高
    - 实现标题样式：H1-H6 递减字号
    - 实现代码块样式：等宽字体 + 背景色
    - 实现表格样式：边框 + 表头背景色
    - 实现有序/无序列表样式
    - 实现 HTTP 方法颜色标签样式（GET=绿色, POST=蓝色, PUT=橙色, DELETE=红色, PATCH=紫色）
    - 实现 API 端点 URL 等宽字体样式
    - 实现中文排版样式：中文字体族、行高、标点挤压（`punctuation-trim` / `text-spacing`）
    - _需求: 2.2, 2.3, 2.4, 2.5, 4.1, 4.3, 6.1, 6.2, 6.3_

  - [x] 4.2 实现 HTML 页面组装
    - 实现 `buildFullHTML()` 函数，将 HTML 片段、CSS 样式组装为完整 HTML 页面
    - 生成封面页 HTML，包含文档标题和生成日期
    - 在第 2 个及之后的 H1 前插入分页符（`page-break-before: always`）
    - _需求: 5.2, 5.3_

  - [ ]* 4.3 编写 StyleEngine 属性测试
    - **属性 4: 标题字号递减** — 验证 CSS 中 H1-H6 字号严格递减
    - **验证需求: 2.2**
    - **属性 10: H1 分页控制** — 生成包含多个 H1 的 Markdown，验证分页 CSS
    - **验证需求: 5.3**

  - [ ]* 4.4 编写 StyleEngine 单元测试
    - 测试代码块使用等宽字体和背景色的 CSS（需求 2.3）
    - 测试表格带边框和表头样式的 CSS（需求 2.4）
    - 测试 API 端点 URL 等宽字体样式（需求 4.3）
    - 测试封面页包含标题和日期（需求 5.2）
    - 测试 CSS 中文字体族配置（需求 6.1）
    - 测试 CSS 中文标点处理规则（需求 6.3）

- [x] 5. 检查点 — 确保 StyleEngine 模块测试通过
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 6. 实现 Renderer 模块
  - [x] 6.1 实现 PDF 渲染功能
    - 在 `src/renderer.ts` 中实现 `renderPDF()` 函数
    - 启动 puppeteer 无头浏览器，设置页面内容为完整 HTML
    - 配置 `page.pdf()` 参数：A4 尺寸、边距、`printBackground: true`
    - 配置 `displayHeaderFooter: true`，通过 `footerTemplate` 实现页码显示
    - 利用标题标签生成 PDF 书签目录
    - 使用 `try/finally` 确保浏览器实例正确关闭
    - 设置 30 秒超时
    - _需求: 2.1, 2.6, 5.1_

  - [ ]* 6.2 编写 Renderer 属性测试
    - **属性 3: PDF 输出有效性** — 生成随机 Markdown，验证输出文件以 `%PDF-` 开头
    - **验证需求: 2.1**

  - [ ]* 6.3 编写 Renderer 单元测试
    - 测试 PDF 页码配置正确性（需求 2.6）
    - 测试浏览器实例在错误时正确关闭

- [x] 7. 检查点 — 确保 Renderer 模块测试通过
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 8. 实现 CLI 模块
  - [x] 8.1 实现命令行参数解析
    - 在 `src/cli.ts` 中使用 `commander` 实现 `parseArgs()` 函数
    - 输入文件路径为必需参数
    - 输出文件路径为可选参数（`-o` / `--output`）
    - 未指定输出路径时，默认为输入文件同目录下同名 `.pdf` 文件
    - 参数缺失时显示使用说明并以退出码 1 退出
    - _需求: 3.1, 3.2, 3.3, 3.5_

  - [x] 8.2 实现转换流程编排
    - 实现 `run()` 函数，串联 Parser → StyleEngine → Renderer 完整流水线
    - 转换成功后在控制台输出生成的 PDF 文件路径
    - CLI 层捕获所有错误，输出用户友好的错误消息到 stderr
    - 使用不同退出码：1 = 参数错误，2 = 文件错误，3 = 渲染错误
    - _需求: 3.4, 错误处理_

  - [x] 8.3 配置 CLI 入口
    - 创建 `src/index.ts` 作为程序入口，调用 CLI 模块
    - 在 `package.json` 中配置 `bin` 字段，设置可执行命令名称
    - _需求: 3.1_

  - [ ]* 8.4 编写 CLI 属性测试
    - **属性 5: CLI 参数解析正确性** — 生成随机文件路径组合，验证解析结果
    - **验证需求: 3.1, 3.2**
    - **属性 6: 默认输出路径推导** — 生成随机 .md 文件路径，验证默认输出路径
    - **验证需求: 3.3**

  - [ ]* 8.5 编写 CLI 单元测试
    - 测试参数缺失时的使用说明输出（需求 3.5）
    - 测试转换成功后控制台输出验证（需求 3.4）
    - 测试各种退出码场景

- [x] 9. 集成联调与最终检查点
  - [x] 9.1 端到端集成验证
    - 编写集成测试：准备示例 Markdown 文件，执行完整转换流水线，验证 PDF 文件生成
    - 验证包含中文内容、代码块、表格、HTTP 方法标记的综合 Markdown 文档转换
    - _需求: 1.1, 1.2, 2.1, 4.1, 4.2, 6.1, 6.2_

  - [x] 9.2 最终检查点
    - 确保所有测试通过，如有问题请向用户确认。

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加速 MVP 开发
- 每个任务引用了具体的需求编号以确保可追溯性
- 检查点任务确保增量验证
- 属性测试验证通用正确性属性，单元测试验证具体示例和边界情况
