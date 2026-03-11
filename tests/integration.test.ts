import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parseFile } from '../src/parser.js';
import { buildFullHTML } from '../src/style-engine.js';
import { renderPDF } from '../src/renderer.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * End-to-end integration test: Markdown → HTML → PDF
 * Validates requirements: 1.1, 1.2, 2.1, 4.1, 4.2, 6.1, 6.2
 */
describe('End-to-end integration: Markdown → PDF', () => {
  let tmpDir: string;
  let mdFilePath: string;
  let pdfOutputPath: string;

  const sampleMarkdown = `# API 接口文档

## 概述

这是一份中英文混排的 API 文档，用于验证完整的 Markdown 转 PDF 流水线。

## 用户管理 User Management

### 获取用户列表

GET /api/v1/users

返回所有用户的列表。

### 创建用户

POST /api/v1/users

请求体示例：

\`\`\`json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "role": "admin"
}
\`\`\`

### 更新用户

PUT /api/v1/users/:id

### 删除用户

DELETE /api/v1/users/:id

### 部分更新

PATCH /api/v1/users/:id

## 配置说明

\`\`\`yaml
server:
  host: 0.0.0.0
  port: 8080
database:
  url: postgres://localhost:5432/mydb
\`\`\`

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| name | string | 是 | 用户名称 |
| email | string | 是 | 邮箱地址 |
| role | string | 否 | 用户角色 |

## 注意事项

- 所有请求需要携带 Authorization 头
- 响应格式统一为 JSON
- 分页参数：\`page\` 和 \`limit\`
`;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'integration-test-'));
    mdFilePath = path.join(tmpDir, 'api-doc.md');
    pdfOutputPath = path.join(tmpDir, 'api-doc.pdf');
    await fs.writeFile(mdFilePath, sampleMarkdown, 'utf-8');
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should convert a comprehensive Markdown document to a valid PDF', async () => {
    // Step 1: Parse the Markdown file
    const parseResult = await parseFile(mdFilePath);

    // Verify parsing produced HTML with expected elements
    expect(parseResult.html).toContain('<h1');
    expect(parseResult.html).toContain('<h2');
    expect(parseResult.html).toContain('<h3');
    expect(parseResult.html).toContain('<table>');
    expect(parseResult.html).toContain('<code');
    expect(parseResult.title).toBe('API 接口文档');

    // Verify Chinese content is preserved (Req 6.2)
    expect(parseResult.html).toContain('中英文混排');
    expect(parseResult.html).toContain('用户管理');

    // Verify HTTP method marking (Req 4.1)
    expect(parseResult.html).toContain('http-get');
    expect(parseResult.html).toContain('http-post');
    expect(parseResult.html).toContain('http-put');
    expect(parseResult.html).toContain('http-delete');
    expect(parseResult.html).toContain('http-patch');

    // Verify syntax highlighting for json/yaml code blocks (Req 4.2)
    expect(parseResult.html).toContain('hljs');

    // Verify headings were extracted
    expect(parseResult.headings.length).toBeGreaterThanOrEqual(6);

    // Step 2: Build full HTML page with styles
    const fullHTML = buildFullHTML(parseResult.html, parseResult.headings, {
      title: parseResult.title ?? undefined,
    });

    expect(fullHTML).toContain('<!DOCTYPE html>');
    expect(fullHTML).toContain('<html lang="zh">');
    expect(fullHTML).toContain('cover-page');
    // Chinese font family in CSS (Req 6.1)
    expect(fullHTML).toContain('PingFang SC');

    // Step 3: Render PDF
    await renderPDF(fullHTML, parseResult.headings, {
      outputPath: pdfOutputPath,
    });

    // Step 4: Verify PDF output
    const pdfBuffer = await fs.readFile(pdfOutputPath);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // PDF files must start with %PDF-
    const header = pdfBuffer.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  }, 30_000);
});
