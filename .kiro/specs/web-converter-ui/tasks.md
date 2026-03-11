# Implementation Plan: Web Converter UI

## Overview

为现有 md-to-pdf CLI 工具新增 Web 服务层。使用 Node.js 内置 `node:http` 模块构建轻量级 HTTP 服务，前端页面以内嵌 HTML 字符串方式返回，复用现有 Parser、StyleEngine、Renderer 模块实现 Markdown → HTML 预览 → PDF 下载的完整流程。

## Tasks

- [x] 1. 新增类型定义与 Web Page 模块
  - [x] 1.1 在 `src/types.ts` 中新增 Web 相关类型定义
    - 添加 `ConvertResponse` 接口（含 `html`、`css`、`title` 字段）
    - 添加 `ConvertErrorResponse` 接口（含 `error`、`code` 字段）
    - _Requirements: 4.4, 6.1, 6.2, 6.3_

  - [x] 1.2 创建 `src/web-page.ts` 模块，实现 `getWebPageHTML()` 函数
    - 返回完整 HTML 页面字符串，包含文件上传区域（`<input type="file" accept=".md,.markdown">`）
    - 包含"转换"按钮，用于触发上传和转换操作
    - 包含 Preview Panel 区域用于展示转换后的 HTML 预览
    - 包含"下载 PDF"按钮（转换成功后显示）
    - 包含错误提示区域，以醒目样式展示错误信息
    - 使用 CSS media query 实现响应式布局，适配移动端和桌面端
    - 内嵌 `<script>` 实现前端交互逻辑：使用 `fetch()` 调用 `/api/convert` 和 `/api/pdf` 接口
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.3, 5.4, 6.3_

  - [ ]* 1.3 编写 `tests/web-page.test.ts` 单元测试
    - 验证返回的 HTML 包含文件上传区域（需求 2.2）
    - 验证返回的 HTML 包含转换按钮（需求 2.3）
    - 验证返回的 HTML 包含预览面板（需求 2.4）
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 2. 实现 Web Server 核心模块
  - [x] 2.1 创建 `src/server.ts`，实现 `startServer()` 和 `stopServer()` 函数
    - 使用 `node:http.createServer()` 创建 HTTP 服务
    - 实现路由分发：`GET /` → 返回 Web 页面，`POST /api/convert` → 转换接口，`POST /api/pdf` → PDF 生成接口
    - 默认监听 3000 端口，支持通过 `ServerOptions.port` 参数指定端口
    - 启动成功后在控制台输出服务地址（含端口号）
    - 监听 `server.on('error')` 事件，检测 `EADDRINUSE` 错误码，输出端口冲突错误信息并以非零状态码退出
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1_

  - [x] 2.2 在 `src/server.ts` 中实现 Upload Handler（`parseUpload` 和 `validateUpload` 函数）
    - 手动解析 `multipart/form-data` boundary，提取文件内容和文件名
    - 校验文件扩展名必须为 `.md` 或 `.markdown`（否则返回 400 + `INVALID_EXTENSION`）
    - 校验文件大小不超过 10MB（否则返回 413 + `FILE_TOO_LARGE`）
    - 校验文件内容为有效 UTF-8 编码（否则返回 400 + `INVALID_ENCODING`）
    - 校验请求中包含文件（否则返回 400 + `NO_FILE`）
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.3 编写属性测试：无效文件扩展名被拒绝
    - **Property 1: 无效文件扩展名被拒绝**
    - **Validates: Requirements 3.2**
    - 在 `tests/server.property.test.ts` 中使用 fast-check 生成非 `.md`/`.markdown` 扩展名的文件名，验证 `validateUpload()` 抛出错误

  - [ ]* 2.4 编写属性测试：超大文件被拒绝
    - **Property 2: 超大文件被拒绝**
    - **Validates: Requirements 3.3**
    - 在 `tests/server.property.test.ts` 中使用 fast-check 生成大于 10MB 的 Buffer，验证 `validateUpload()` 抛出错误

  - [ ]* 2.5 编写属性测试：无效 UTF-8 编码被拒绝
    - **Property 3: 无效 UTF-8 编码被拒绝**
    - **Validates: Requirements 3.4**
    - 在 `tests/server.property.test.ts` 中使用 fast-check 生成包含无效 UTF-8 字节序列的 Buffer，验证 `validateUpload()` 抛出错误

- [x] 3. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. 实现转换 API 与 PDF 生成接口
  - [x] 4.1 在 `src/server.ts` 中实现 `POST /api/convert` 路由处理函数
    - 调用 `parseUpload()` 解析上传文件
    - 调用 `validateUpload()` 校验文件
    - 调用 `Parser.parse()` 将 Markdown 解析为 HTML
    - 调用 `StyleEngine.buildFullHTML()` 生成完整 HTML
    - 调用 `StyleEngine.getDefaultCSS()` 获取 CSS
    - 返回 JSON 格式的 `ConvertResponse`（含 html、css、title）
    - 解析阶段错误返回 422 + `PARSE_ERROR`
    - _Requirements: 4.1, 4.2, 4.3, 5.2, 6.1_

  - [x] 4.2 在 `src/server.ts` 中实现 `POST /api/pdf` 路由处理函数
    - 接收 JSON 请求体（含 html 和 filename 字段）
    - 调用 `Renderer.renderPDF()` 生成临时 PDF 文件
    - 以 `application/pdf` 内容类型返回 PDF 文件
    - 设置 `Content-Disposition` 为附件下载，文件名为原始文件名替换扩展名为 `.pdf`
    - 响应完成后清理临时 PDF 文件（使用 `try/finally`）
    - 渲染阶段错误返回 500 + `RENDER_ERROR`
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 6.2_

  - [ ]* 4.3 编写属性测试：PDF 文件名推导
    - **Property 4: PDF 文件名推导**
    - **Validates: Requirements 4.4, 4.5**
    - 在 `tests/server.property.test.ts` 中使用 fast-check 生成有效 `.md`/`.markdown` 文件名，验证 PDF 文件名推导逻辑正确

  - [ ]* 4.4 编写属性测试：预览 CSS 与 PDF CSS 一致
    - **Property 5: 预览 CSS 与 PDF CSS 一致**
    - **Validates: Requirements 5.2**
    - 在 `tests/server.property.test.ts` 中验证 `/api/convert` 返回的 CSS 与 `getDefaultCSS()` 输出一致

  - [ ]* 4.5 编写属性测试：临时文件清理
    - **Property 6: 临时文件清理**
    - **Validates: Requirements 4.6**
    - 在 `tests/server.property.test.ts` 中验证 PDF 生成完成后临时文件已被删除

- [x] 5. 实现超时控制与并发限制
  - [x] 5.1 在 `src/server.ts` 中实现转换请求超时控制
    - 使用 `setTimeout` + `AbortController` 为转换请求设置 60 秒超时
    - 超时后终止转换并返回 504 + `TIMEOUT`
    - _Requirements: 6.4_

  - [x] 5.2 在 `src/server.ts` 中实现并发请求限制
    - 通过活跃请求计数器实现并发限制
    - 超限时返回 503 + `SERVICE_UNAVAILABLE`
    - 确保服务可同时处理多个独立的转换请求
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 5.3 编写属性测试：端口参数生效
    - **Property 7: 端口参数生效**
    - **Validates: Requirements 1.5**
    - 在 `tests/server.property.test.ts` 中使用 fast-check 生成有效端口号（1024-65535），验证服务在该端口启动

- [x] 6. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. 集成与入口连接
  - [x] 7.1 在 `src/server.ts` 中添加 CLI 入口逻辑
    - 当模块作为主入口运行时，解析命令行参数（`--port`）并调用 `startServer()`
    - 支持 `node dist/server.js --port 8080` 方式启动
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 7.2 更新 `package.json`，添加 `web` 启动脚本
    - 添加 `"web": "node dist/server.js"` 脚本
    - _Requirements: 1.1_

  - [ ]* 7.3 编写 `tests/server.test.ts` 集成单元测试
    - 验证 GET / 返回 HTML 页面（需求 2.1）
    - 验证默认端口为 3000（需求 1.4）
    - 验证启动时控制台输出服务地址（需求 1.2）
    - 验证端口被占用时的错误处理（需求 1.3）
    - 验证请求中未包含文件返回 400（需求 3.5）
    - 验证解析阶段错误返回 422（需求 6.1）
    - 验证渲染阶段错误返回 500（需求 6.2）
    - 验证转换超时返回 504（需求 6.4）
    - 验证并发请求超限返回 503（需求 7.3）
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 3.5, 6.1, 6.2, 6.4, 7.3_

- [x] 8. Final checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- 标记 `*` 的任务为可选任务，可跳过以加速 MVP 开发
- 每个任务引用了具体的需求编号，确保可追溯性
- Checkpoint 任务确保增量验证
- 属性测试验证通用正确性属性，单元测试验证具体示例和边界情况
- 复用现有 Parser、StyleEngine、Renderer 模块，不修改这些模块
