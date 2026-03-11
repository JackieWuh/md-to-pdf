import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parse, parseFile } from '../src/parser.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('parse() - core Markdown parsing', () => {
  it('should parse basic paragraph text', () => {
    const result = parse('Hello world');
    expect(result.html).toContain('<p>Hello world</p>');
  });

  it('should parse headings H1-H6 with correct tags', () => {
    const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
    const result = parse(md);
    expect(result.html).toContain('<h1');
    expect(result.html).toContain('<h2');
    expect(result.html).toContain('<h3');
    expect(result.html).toContain('<h4');
    expect(result.html).toContain('<h5');
    expect(result.html).toContain('<h6');
  });

  it('should enable table support', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const result = parse(md);
    expect(result.html).toContain('<table>');
    expect(result.html).toContain('<th>');
    expect(result.html).toContain('<td>');
  });

  it('should apply highlight.js syntax highlighting for JSON code blocks', () => {
    const md = '```json\n{"key": "value"}\n```';
    const result = parse(md);
    // highlight.js wraps tokens in <span> with hljs classes
    expect(result.html).toContain('hljs');
    expect(result.html).toContain('<code');
  });

  it('should apply highlight.js syntax highlighting for YAML code blocks', () => {
    const md = '```yaml\nname: test\nversion: 1.0\n```';
    const result = parse(md);
    expect(result.html).toContain('hljs');
  });

  it('should render code blocks without language as plain code', () => {
    const md = '```\nplain text\n```';
    const result = parse(md);
    expect(result.html).toContain('<code>');
    expect(result.html).toContain('plain text');
  });

  it('should collect headings with level, text, and id', () => {
    const md = '# Title\n## Section\n### Subsection';
    const result = parse(md);
    expect(result.headings).toHaveLength(3);
    expect(result.headings[0]).toEqual({ level: 1, text: 'Title', id: 'title' });
    expect(result.headings[1]).toEqual({ level: 2, text: 'Section', id: 'section' });
    expect(result.headings[2]).toEqual({ level: 3, text: 'Subsection', id: 'subsection' });
  });

  it('should extract document title from first H1', () => {
    const md = '## Intro\n# Main Title\n# Another H1';
    const result = parse(md);
    expect(result.title).toBe('Main Title');
  });

  it('should return null title when no H1 exists', () => {
    const md = '## Only H2\n### And H3';
    const result = parse(md);
    expect(result.title).toBeNull();
  });

  it('should set id attributes on heading tags', () => {
    const md = '# Hello World';
    const result = parse(md);
    expect(result.html).toContain('id="hello-world"');
  });

  it('should handle empty markdown input', () => {
    const result = parse('');
    expect(result.html).toBe('');
    expect(result.title).toBeNull();
    expect(result.headings).toHaveLength(0);
  });

  it('should parse links and images', () => {
    const md = '[link](http://example.com)\n\n![alt](image.png)';
    const result = parse(md);
    expect(result.html).toContain('<a');
    expect(result.html).toContain('href="http://example.com"');
    expect(result.html).toContain('<img');
    expect(result.html).toContain('src="image.png"');
  });

  it('should parse ordered and unordered lists', () => {
    const md = '- item1\n- item2\n\n1. first\n2. second';
    const result = parse(md);
    expect(result.html).toContain('<ul>');
    expect(result.html).toContain('<ol>');
    expect(result.html).toContain('<li>');
  });

  it('should preserve Chinese and English mixed content', () => {
    const md = '# 中文标题\n\nHello 你好 World 世界';
    const result = parse(md);
    expect(result.html).toContain('中文标题');
    expect(result.html).toContain('Hello 你好 World 世界');
    expect(result.headings[0].text).toBe('中文标题');
  });

  it('should produce idempotent results', () => {
    const md = '# Title\n\nSome **bold** text\n\n```json\n{"a":1}\n```';
    const result1 = parse(md);
    const result2 = parse(md);
    expect(result1.html).toBe(result2.html);
    expect(result1.title).toBe(result2.title);
    expect(result1.headings).toEqual(result2.headings);
  });
});


describe('parse() - HTTP method marking (Requirement 4.1)', () => {
  it('should wrap GET with http-method and http-get classes', () => {
    const result = parse('GET /api/users');
    expect(result.html).toContain('<span class="http-method http-get">GET</span>');
  });

  it('should wrap POST with http-method and http-post classes', () => {
    const result = parse('POST /api/users');
    expect(result.html).toContain('<span class="http-method http-post">POST</span>');
  });

  it('should wrap PUT with http-method and http-put classes', () => {
    const result = parse('PUT /api/users/1');
    expect(result.html).toContain('<span class="http-method http-put">PUT</span>');
  });

  it('should wrap DELETE with http-method and http-delete classes', () => {
    const result = parse('DELETE /api/users/1');
    expect(result.html).toContain('<span class="http-method http-delete">DELETE</span>');
  });

  it('should wrap PATCH with http-method and http-patch classes', () => {
    const result = parse('PATCH /api/users/1');
    expect(result.html).toContain('<span class="http-method http-patch">PATCH</span>');
  });

  it('should mark multiple HTTP methods in the same document', () => {
    const md = 'GET /users\n\nPOST /users\n\nDELETE /users/1';
    const result = parse(md);
    expect(result.html).toContain('http-get');
    expect(result.html).toContain('http-post');
    expect(result.html).toContain('http-delete');
  });

  it('should NOT mark HTTP methods inside fenced code blocks', () => {
    const md = '```\nGET /api/users\n```';
    const result = parse(md);
    // Inside <code> block, GET should not be wrapped
    expect(result.html).not.toContain('http-get');
  });

  it('should NOT mark HTTP methods inside inline code', () => {
    const md = 'Use `GET /api/users` to fetch users';
    const result = parse(md);
    // The GET inside <code> should not be wrapped
    // But the surrounding text should not contain a bare GET either
    const codeMatch = result.html.match(/<code>.*?<\/code>/);
    expect(codeMatch).toBeTruthy();
    expect(codeMatch![0]).not.toContain('http-get');
  });

  it('should not match partial words containing HTTP method names', () => {
    const md = 'GETTING started with POSTED data';
    const result = parse(md);
    // GETTING and POSTED should not be matched
    expect(result.html).not.toContain('http-get');
    expect(result.html).not.toContain('http-post');
  });
});


describe('parseFile() - file reading and error handling (Requirements 1.3, 1.4)', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parser-test-'));
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should throw "File not found" for a non-existent path', async () => {
    const fakePath = path.join(tmpDir, 'does-not-exist.md');
    await expect(parseFile(fakePath)).rejects.toThrow(`File not found: ${fakePath}`);
  });

  it('should throw "Invalid UTF-8 encoding" for a non-UTF-8 file', async () => {
    const badFile = path.join(tmpDir, 'bad-encoding.md');
    // Write invalid UTF-8 bytes (0xFE, 0xFF are never valid in UTF-8)
    await fs.writeFile(badFile, Buffer.from([0xFE, 0xFF, 0x80, 0x81]));
    await expect(parseFile(badFile)).rejects.toThrow(`Invalid UTF-8 encoding: ${badFile}`);
  });

  it('should parse a valid UTF-8 Markdown file successfully', async () => {
    const validFile = path.join(tmpDir, 'valid.md');
    await fs.writeFile(validFile, '# Hello\n\nWorld', 'utf-8');
    const result = await parseFile(validFile);
    expect(result.html).toContain('<h1');
    expect(result.html).toContain('Hello');
    expect(result.html).toContain('World');
    expect(result.title).toBe('Hello');
    expect(result.headings).toHaveLength(1);
  });

  it('should handle UTF-8 files with Chinese content', async () => {
    const cnFile = path.join(tmpDir, 'chinese.md');
    await fs.writeFile(cnFile, '# 你好世界\n\n这是中文内容', 'utf-8');
    const result = await parseFile(cnFile);
    expect(result.html).toContain('你好世界');
    expect(result.html).toContain('这是中文内容');
    expect(result.title).toBe('你好世界');
  });

  it('should handle UTF-8 BOM correctly', async () => {
    const bomFile = path.join(tmpDir, 'bom.md');
    // UTF-8 BOM (EF BB BF) followed by valid content
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const content = Buffer.from('# BOM Test', 'utf-8');
    await fs.writeFile(bomFile, Buffer.concat([bom, content]));
    const result = await parseFile(bomFile);
    expect(result.html).toContain('BOM Test');
  });
});
