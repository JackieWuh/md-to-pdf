// StyleEngine module - CSS styling and HTML page assembly
// Will be implemented in task 4.1

import type { Heading, StyleOptions } from './types.js';

export function getDefaultCSS(): string {
  return `
/* ============================================
   1. Base Typography
   ============================================ */
body {
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC",
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #24292e;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* ============================================
   2. Headings — H1-H6 decreasing font sizes
   ============================================ */
h1, h2, h3, h4, h5, h6 {
  margin-top: 1.5em;
  margin-bottom: 0.6em;
  font-weight: 600;
  line-height: 1.3;
}

h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
h3 { font-size: 1.25em; }
h4 { font-size: 1em; }
h5 { font-size: 0.875em; }
h6 { font-size: 0.85em; color: #6a737d; }

/* ============================================
   3. Code Blocks — monospace + background
   ============================================ */
code {
  font-family: "SFMono-Regular", "Fira Code", "Fira Mono", "Roboto Mono", "Consolas",
    "Liberation Mono", "Courier New", monospace;
  font-size: 0.9em;
  background-color: rgba(27, 31, 35, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  line-height: 1.5;
  font-size: 13px;
}

pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
  line-height: inherit;
}

/* ============================================
   3a. highlight.js GitHub theme (inline)
   ============================================ */
.hljs {
  color: #24292e;
  background: #f6f8fa;
}

.hljs-comment,
.hljs-quote {
  color: #6a737d;
  font-style: italic;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-subst {
  color: #d73a49;
  font-weight: bold;
}

.hljs-literal,
.hljs-number,
.hljs-variable,
.hljs-template-variable,
.hljs-tag .hljs-attr {
  color: #005cc5;
}

.hljs-string,
.hljs-doctag {
  color: #032f62;
}

.hljs-title,
.hljs-section,
.hljs-selector-id {
  color: #6f42c1;
  font-weight: bold;
}

.hljs-type,
.hljs-class .hljs-title {
  color: #6f42c1;
}

.hljs-tag,
.hljs-name,
.hljs-attribute {
  color: #22863a;
}

.hljs-regexp,
.hljs-link {
  color: #032f62;
}

.hljs-symbol,
.hljs-bullet {
  color: #e36209;
}

.hljs-built_in,
.hljs-builtin-name {
  color: #005cc5;
}

.hljs-meta {
  color: #735c0f;
  font-weight: bold;
}

.hljs-deletion {
  color: #b31d28;
  background-color: #ffeef0;
}

.hljs-addition {
  color: #22863a;
  background-color: #f0fff4;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: bold;
}

/* ============================================
   4. Tables — borders + header background
   ============================================ */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 0.95em;
}

th, td {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
  text-align: left;
}

th {
  background-color: #f6f8fa;
  font-weight: 600;
}

tr:nth-child(even) {
  background-color: #fafbfc;
}

/* ============================================
   5. Lists — ordered and unordered
   ============================================ */
ul, ol {
  padding-left: 2em;
  margin: 0.5em 0;
}

li {
  margin: 0.25em 0;
}

ul {
  list-style-type: disc;
}

ul ul {
  list-style-type: circle;
}

ul ul ul {
  list-style-type: square;
}

ol {
  list-style-type: decimal;
}

/* ============================================
   6. HTTP Method Color Labels
   ============================================ */
.http-method {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.85em;
  font-weight: 700;
  font-family: "SFMono-Regular", "Fira Code", "Consolas", monospace;
  color: #fff;
  vertical-align: baseline;
}

.http-get {
  background-color: #28a745;
}

.http-post {
  background-color: #0366d6;
}

.http-put {
  background-color: #e36209;
}

.http-delete {
  background-color: #d73a49;
}

.http-patch {
  background-color: #6f42c1;
}

/* ============================================
   7. API Endpoint URL — monospace
   ============================================ */
.api-endpoint,
code.api-url {
  font-family: "SFMono-Regular", "Fira Code", "Consolas", "Courier New", monospace;
  font-size: 0.9em;
  color: #005cc5;
}

/* ============================================
   8. Chinese Typography
   ============================================ */
:lang(zh),
html[lang="zh"] body {
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC",
    "Source Han Sans SC", "WenQuanYi Micro Hei", sans-serif;
  line-height: 1.8;
}

/* Punctuation trimming / spacing for CJK */
body {
  text-spacing-trim: space-all;
  line-break: strict;
  word-break: break-all;
  overflow-wrap: break-word;
}

/* Prevent CJK punctuation at line start */
@supports (hanging-punctuation: first last) {
  body {
    hanging-punctuation: first last allow-end;
  }
}

/* ============================================
   9. Misc Elements
   ============================================ */
blockquote {
  margin: 0.5em 0;
  padding: 0.5em 1em;
  border-left: 4px solid #dfe2e5;
  color: #6a737d;
  background-color: #fafbfc;
}

hr {
  border: none;
  border-top: 1px solid #eaecef;
  margin: 1.5em 0;
}

a {
  color: #0366d6;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

img {
  max-width: 100%;
  height: auto;
}

p {
  margin: 0.5em 0;
}

/* ============================================
   10. Print / Page Controls
   ============================================ */
@media print {
  body {
    font-size: 12pt;
  }

  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  table {
    page-break-inside: avoid;
  }

  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }

  img {
    page-break-inside: avoid;
  }
}

@page {
  size: A4;
  margin: 20mm 15mm 25mm 15mm;
}
`;
}


export function buildFullHTML(bodyHtml: string, headings: Heading[], options?: StyleOptions): string {
  const css = getDefaultCSS();
  const opts = options ?? {};

  // Build cover page HTML if title is provided
  let coverHtml = '';
  if (opts.title) {
    const dateStr = opts.date ?? new Date().toISOString().slice(0, 10);
    coverHtml = `<div class="cover-page" style="page-break-after: always; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 90vh; text-align: center;">
  <h1 style="font-size: 2.5em; border-bottom: none; margin-bottom: 0.5em;">${escapeHtml(opts.title)}</h1>
  <p style="font-size: 1.1em; color: #6a737d;">${escapeHtml(dateStr)}</p>
</div>`;
  }

  // Insert page-break-before: always on the 2nd and subsequent H1 tags
  const processedBody = insertH1PageBreaks(bodyHtml);

  return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<style>
${css}
</style>
</head>
<body>
${coverHtml}${processedBody}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function insertH1PageBreaks(html: string): string {
  let h1Count = 0;
  return html.replace(/<h1(\s|>)/gi, (match, after) => {
    h1Count++;
    if (h1Count >= 2) {
      return `<h1 style="page-break-before: always;"${after === '>' ? '>' : after}`;
    }
    return match;
  });
}


