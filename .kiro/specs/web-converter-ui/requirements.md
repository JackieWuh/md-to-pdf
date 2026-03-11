# 需求文档

## 简介

为现有的 md-to-pdf CLI 工具新增一个 Web 界面，让用户可以通过浏览器上传 Markdown 文件，在线预览转换结果，并下载生成的 PDF 文件。Web 服务复用现有的 Parser、StyleEngine 和 Renderer 模块，提供与 CLI 等价的转换能力。

## 术语表

- **Web_Server**: 基于 Node.js 的 HTTP 服务端，负责接收请求、调用转换流水线并返回结果
- **Upload_Handler**: Web_Server 中处理文件上传请求的模块
- **Converter_Pipeline**: 由 Parser、StyleEngine、Renderer 组成的 Markdown → HTML → PDF 转换流水线
- **Web_Page**: 浏览器端的 HTML 页面，提供文件上传、预览和下载交互
- **Preview_Panel**: Web_Page 中用于展示 Markdown 转换后 HTML 内容的区域
- **PDF_File**: Renderer 模块生成的 PDF 输出文件

## 需求

### 需求 1：Web 服务启动

**用户故事：** 作为开发者，我想通过命令启动一个本地 Web 服务，以便通过浏览器访问 Markdown 转 PDF 功能。

#### 验收标准

1. WHEN 用户执行启动命令时，THE Web_Server SHALL 在指定端口上启动 HTTP 服务并监听请求
2. WHEN Web_Server 启动成功时，THE Web_Server SHALL 在控制台输出服务地址（含端口号）
3. WHEN 指定端口已被占用时，THE Web_Server SHALL 输出明确的端口冲突错误信息并以非零状态码退出
4. THE Web_Server SHALL 默认监听 3000 端口
5. WHERE 用户通过命令行参数指定端口号，THE Web_Server SHALL 使用用户指定的端口启动服务

### 需求 2：Web 页面展示

**用户故事：** 作为用户，我想在浏览器中看到一个简洁的操作页面，以便上传 Markdown 文件并获取 PDF。

#### 验收标准

1. WHEN 用户通过浏览器访问根路径时，THE Web_Server SHALL 返回 Web_Page
2. THE Web_Page SHALL 包含一个文件上传区域，支持选择 `.md` 文件
3. THE Web_Page SHALL 包含一个"转换"按钮，用于触发上传和转换操作
4. THE Web_Page SHALL 包含 Preview_Panel 用于展示转换后的 HTML 预览
5. THE Web_Page SHALL 在移动端和桌面端均可正常使用（响应式布局）

### 需求 3：文件上传与校验

**用户故事：** 作为用户，我想上传 Markdown 文件并得到即时的格式校验反馈，以便确保文件可以被正确转换。

#### 验收标准

1. WHEN 用户通过 Web_Page 上传文件时，THE Upload_Handler SHALL 接收该文件并进行校验
2. WHEN 上传的文件扩展名不是 `.md` 或 `.markdown` 时，THE Upload_Handler SHALL 返回 400 状态码及描述性错误信息
3. WHEN 上传的文件大小超过 10MB 时，THE Upload_Handler SHALL 返回 413 状态码及描述性错误信息
4. WHEN 上传的文件内容不是有效的 UTF-8 编码时，THE Upload_Handler SHALL 返回 400 状态码及描述性错误信息
5. IF 上传请求中未包含文件，THEN THE Upload_Handler SHALL 返回 400 状态码及描述性错误信息

### 需求 4：Markdown 转换为 PDF

**用户故事：** 作为用户，我想将上传的 Markdown 文件转换为排版精美的 PDF，以便下载使用。

#### 验收标准

1. WHEN 文件校验通过后，THE Converter_Pipeline SHALL 调用 Parser 模块将 Markdown 内容解析为 HTML
2. WHEN 解析完成后，THE Converter_Pipeline SHALL 调用 StyleEngine 模块生成包含完整样式的 HTML 页面
3. WHEN 完整 HTML 生成后，THE Converter_Pipeline SHALL 调用 Renderer 模块将 HTML 渲染为 PDF_File
4. WHEN PDF_File 生成成功后，THE Web_Server SHALL 将 PDF_File 以 `application/pdf` 内容类型返回给客户端
5. THE Web_Server SHALL 在响应头中设置 `Content-Disposition` 为附件下载，文件名与原始上传文件名一致（扩展名替换为 `.pdf`）
6. WHEN PDF_File 返回完成后，THE Web_Server SHALL 清理服务端生成的临时 PDF_File

### 需求 5：HTML 预览

**用户故事：** 作为用户，我想在下载 PDF 之前先预览转换效果，以便确认内容和样式是否符合预期。

#### 验收标准

1. WHEN 用户点击"转换"按钮后，THE Web_Page SHALL 先在 Preview_Panel 中展示转换后的 HTML 内容
2. THE Preview_Panel SHALL 应用与 PDF 输出一致的 CSS 样式
3. WHEN 预览内容展示后，THE Web_Page SHALL 显示一个"下载 PDF"按钮
4. WHEN 用户点击"下载 PDF"按钮时，THE Web_Page SHALL 触发 PDF 文件的下载

### 需求 6：转换错误处理

**用户故事：** 作为用户，我想在转换失败时看到清晰的错误提示，以便了解问题所在。

#### 验收标准

1. IF Converter_Pipeline 在解析阶段发生错误，THEN THE Web_Server SHALL 返回 422 状态码及描述性错误信息
2. IF Converter_Pipeline 在 PDF 渲染阶段发生错误，THEN THE Web_Server SHALL 返回 500 状态码及描述性错误信息
3. WHEN Web_Page 收到错误响应时，THE Web_Page SHALL 在页面上以醒目样式展示错误信息
4. IF 转换过程超过 60 秒未完成，THEN THE Web_Server SHALL 终止转换并返回 504 状态码及超时错误信息

### 需求 7：并发请求处理

**用户故事：** 作为用户，我希望服务能同时处理多个转换请求，不会因为其他用户的请求而阻塞。

#### 验收标准

1. THE Web_Server SHALL 支持同时处理多个独立的转换请求
2. WHILE 一个转换请求正在处理中，THE Web_Server SHALL 继续接受和处理新的请求
3. IF 服务端资源不足以处理新请求，THEN THE Web_Server SHALL 返回 503 状态码及描述性错误信息
