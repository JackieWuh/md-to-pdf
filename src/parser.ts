// Parser module - Markdown to HTML parsing with highlight.js code highlighting
// Implements task 2.1: Core Markdown parsing functionality

import fs from 'node:fs/promises';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import type { ParseResult, ParserOptions, Heading } from './types.js';

/**
 * Post-process HTML to wrap standalone HTTP method keywords with styled spans.
 * Skips content inside <code>, <pre>, and other HTML tags.
 *
 * Example: "GET /api/users" → '<span class="http-method http-get">GET</span> /api/users'
 *
 * Requirements: 4.1
 */
function markHttpMethods(html: string): string {
  // Split HTML into segments: tags, code blocks (preserved), and text (processed)
  // This regex matches: <code>...</code> blocks, <pre>...</pre> blocks, or any HTML tag
  const segmentPattern = /<code[\s>][\s\S]*?<\/code>|<pre[\s>][\s\S]*?<\/pre>|<[^>]+>/gi;

  let result = '';
  let lastIndex = 0;

  for (const match of html.matchAll(segmentPattern)) {
    // Process text between tags
    const textBefore = html.slice(lastIndex, match.index);
    result += replaceHttpMethodsInText(textBefore);
    // Preserve the tag/code block as-is
    result += match[0];
    lastIndex = match.index! + match[0].length;
  }

  // Process any remaining text after the last tag
  result += replaceHttpMethodsInText(html.slice(lastIndex));

  return result;
}

/**
 * Replace HTTP method keywords in a plain text segment with styled spans.
 * Only matches standalone words (word boundaries).
 */
function replaceHttpMethodsInText(text: string): string {
  if (!text) return text;
  const methodPattern = /\b(GET|POST|PUT|DELETE|PATCH)\b/g;
  return text.replace(methodPattern, (_match, method: string) => {
    const cssClass = `http-${method.toLowerCase()}`;
    return `<span class="http-method ${cssClass}">${method}</span>`;
  });
}


/**
 * Generate a URL-friendly slug from heading text.
 * Converts to lowercase, replaces spaces/special chars with hyphens.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse Markdown text into HTML with syntax highlighting and heading extraction.
 *
 * - Configures markdown-it with table support enabled
 * - Integrates highlight.js for fenced code block syntax highlighting
 * - Collects heading info (level, text, id) into headings array
 * - Extracts document title from the first H1
 *
 * Requirements: 1.1, 1.2, 4.2, 5.1
 */
export function parse(markdown: string, options?: ParserOptions): ParseResult {
  const headings: Heading[] = [];

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    highlight(str: string, lang: string): string {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch {
          // fall through to default escaping
        }
      }
      return ''; // use external default escaping
    },
  });

  // Override heading_open renderer to inject id attributes and collect headings
  const defaultHeadingOpen =
    md.renderer.rules.heading_open ||
    function (tokens, idx, options, _env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const level = parseInt(token.tag.slice(1), 10);

    // Extract text from inline children
    const inlineToken = tokens[idx + 1];
    let text = '';
    if (inlineToken && inlineToken.children) {
      text = inlineToken.children
        .filter((t) => t.type === 'text' || t.type === 'code_inline')
        .map((t) => t.content)
        .join('');
    }

    const id = slugify(text);

    // Set id attribute on the heading tag
    token.attrSet('id', id);

    headings.push({ level, text, id });

    return defaultHeadingOpen(tokens, idx, options, env, self);
  };

  const rawHtml = md.render(markdown);

  // Post-process: wrap standalone HTTP method keywords with styled spans
  const html = markHttpMethods(rawHtml);

  // Extract title from the first H1 heading
  const firstH1 = headings.find((h) => h.level === 1);
  const title = firstH1 ? firstH1.text : null;

  return { html, title, headings };
}

/**
 * Check if a Buffer contains valid UTF-8 encoded text.
 * Decodes with fatal: true to detect invalid byte sequences.
 */
function isValidUtf8(buffer: Buffer): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a Markdown file from disk, validate it, and parse it.
 *
 * - Throws `File not found: {path}` if the file does not exist
 * - Throws `Invalid UTF-8 encoding: {path}` if the file is not valid UTF-8
 * - Calls parse() with the file content on success
 *
 * Requirements: 1.3, 1.4
 */
export async function parseFile(filePath: string, options?: ParserOptions): Promise<ParseResult> {
  // Check file existence
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read raw bytes
  const buffer = await fs.readFile(filePath);

  // Validate UTF-8 encoding
  if (!isValidUtf8(buffer)) {
    throw new Error(`Invalid UTF-8 encoding: ${filePath}`);
  }

  const content = buffer.toString('utf-8');
  return parse(content, options);
}

