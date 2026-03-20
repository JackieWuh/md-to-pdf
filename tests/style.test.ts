import { describe, it, expect } from 'vitest';
import { buildFullHTML, getDefaultCSS } from '../src/style-engine.js';
import type { Heading } from '../src/types.js';

describe('buildFullHTML() - HTML page assembly (Task 4.2)', () => {
  const sampleHeadings: Heading[] = [
    { level: 1, text: 'Title', id: 'title' },
    { level: 2, text: 'Section', id: 'section' },
  ];

  it('should produce a complete HTML document structure', () => {
    const html = buildFullHTML('<p>Hello</p>', [], {});
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="zh">');
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain('<style>');
    expect(html).toContain('</style>');
    expect(html).toContain('<body>');
    expect(html).toContain('</body>');
    expect(html).toContain('</html>');
  });

  it('should include the default CSS in the style tag', () => {
    const css = getDefaultCSS();
    const html = buildFullHTML('<p>test</p>', [], {});
    expect(html).toContain(css);
  });

  it('should include the body HTML content', () => {
    const body = '<h1 id="intro">Intro</h1><p>Content here</p>';
    const html = buildFullHTML(body, sampleHeadings, {});
    expect(html).toContain('Content here');
  });

  // Requirement 5.2: Cover page with title and date
  it('should generate a cover page when title is provided', () => {
    const html = buildFullHTML('<p>body</p>', [], {
      title: 'API Documentation',
      date: '2024-01-15',
    });
    expect(html).toContain('cover-page');
    expect(html).toContain('API Documentation');
    expect(html).toContain('2024-01-15');
    expect(html).toContain('page-break-after: always');
  });

  it('should not generate a cover page when title is not provided', () => {
    const html = buildFullHTML('<p>body</p>', [], {});
    expect(html).not.toContain('cover-page');
  });

  it('should use current date when date is not provided but title is', () => {
    const html = buildFullHTML('<p>body</p>', [], { title: 'Test Doc' });
    // Should contain a date in YYYY-MM-DD format
    expect(html).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(html).toContain('cover-page');
  });

  it('should escape HTML special characters in title', () => {
    const html = buildFullHTML('<p>body</p>', [], {
      title: '<script>alert("xss")</script>',
      date: '2024-01-01',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  // Requirement 5.3: Page breaks on 2nd+ H1 tags
  it('should NOT insert page-break on the first H1', () => {
    const body = '<h1 id="first">First</h1><p>content</p>';
    const html = buildFullHTML(body, [], {});
    expect(html).toContain('<h1 id="first">First</h1>');
    // The first h1 should not have page-break-before
    const firstH1Match = html.match(/<h1[^>]*>First<\/h1>/);
    expect(firstH1Match).toBeTruthy();
    expect(firstH1Match![0]).not.toContain('page-break-before');
  });

  it('should insert page-break-before on the 2nd and subsequent H1 tags', () => {
    const body = '<h1 id="a">First</h1><p>text</p><h1 id="b">Second</h1><p>more</p><h1 id="c">Third</h1>';
    const html = buildFullHTML(body, [], {});

    // First H1 should NOT have page-break
    const h1Matches = html.match(/<h1[^>]*>/g)!;
    expect(h1Matches).toHaveLength(3);
    expect(h1Matches[0]).not.toContain('page-break-before');

    // 2nd and 3rd H1 should have page-break-before
    expect(h1Matches[1]).toContain('page-break-before: always');
    expect(h1Matches[2]).toContain('page-break-before: always');
  });

  it('should handle body with no H1 tags gracefully', () => {
    const body = '<h2>Only H2</h2><p>content</p>';
    const html = buildFullHTML(body, [], {});
    expect(html).toContain('<h2>Only H2</h2>');
    expect(html).not.toContain('page-break-before');
  });

  it('should handle body with a single H1 (no page break needed)', () => {
    const body = '<h1 id="only">Only One</h1>';
    const html = buildFullHTML(body, [], {});
    const h1Match = html.match(/<h1[^>]*>/);
    expect(h1Match).toBeTruthy();
    expect(h1Match![0]).not.toContain('page-break-before');
  });

  it('should work without options parameter', () => {
    const html = buildFullHTML('<p>test</p>', []);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<p>test</p>');
  });
});

describe('分页优化 - Pagination Optimization', () => {
  const css = getDefaultCSS();

  it('should contain @media print block with all expected pagination selectors', () => {
    const printBlock = css.match(/@media print\s*\{[\s\S]*?\n\}/);
    expect(printBlock).toBeTruthy();
    const block = printBlock![0];
    // All expected selectors should be present
    expect(block).toContain('pre');
    expect(block).toContain('ul, ol');
    expect(block).toContain('li');
    expect(block).toContain('blockquote');
    expect(block).toContain('p {');
    expect(block).toMatch(/h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6/);
    expect(block).toContain('table');
    expect(block).toContain('tr');
    expect(block).toContain('thead');
    expect(block).toContain('img');
  });

  it('pre rule should contain break-inside: auto and white-space: pre-wrap', () => {
    // Extract the @media print block
    const printBlock = css.match(/@media print\s*\{[\s\S]*?\n\}/)![0];
    // Find the pre rule within the print block
    const preRule = printBlock.match(/\bpre\s*\{[^}]*\}/);
    expect(preRule).toBeTruthy();
    expect(preRule![0]).toContain('break-inside: auto');
    expect(preRule![0]).toContain('white-space: pre-wrap');
  });

  it('li rule should contain break-inside: avoid, orphans: 2, widows: 2', () => {
    const printBlock = css.match(/@media print\s*\{[\s\S]*?\n\}/)![0];
    const liRule = printBlock.match(/\bli\s*\{[^}]*\}/);
    expect(liRule).toBeTruthy();
    expect(liRule![0]).toContain('break-inside: avoid');
    expect(liRule![0]).toContain('orphans: 2');
    expect(liRule![0]).toContain('widows: 2');
  });

  it('ul, ol rule should contain break-inside: auto', () => {
    const printBlock = css.match(/@media print\s*\{[\s\S]*?\n\}/)![0];
    const ulOlRule = printBlock.match(/ul,\s*ol\s*\{[^}]*\}/);
    expect(ulOlRule).toBeTruthy();
    expect(ulOlRule![0]).toContain('break-inside: auto');
  });

  it('blockquote rule should contain break-inside: avoid', () => {
    const printBlock = css.match(/@media print\s*\{[\s\S]*?\n\}/)![0];
    const bqRule = printBlock.match(/blockquote\s*\{[^}]*\}/);
    expect(bqRule).toBeTruthy();
    expect(bqRule![0]).toContain('break-inside: avoid');
  });

  it('p rule should contain orphans: 3 and widows: 3', () => {
    const printBlock = css.match(/@media print\s*\{[\s\S]*?\n\}/)![0];
    const pRule = printBlock.match(/\bp\s*\{[^}]*\}/);
    expect(pRule).toBeTruthy();
    expect(pRule![0]).toContain('orphans: 3');
    expect(pRule![0]).toContain('widows: 3');
  });

  it('h1-h6 rule should contain break-after: avoid and break-inside: avoid', () => {
    const printBlock = css.match(/@media print\s*\{[\s\S]*?\n\}/)![0];
    const headingRule = printBlock.match(/h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{[^}]*\}/);
    expect(headingRule).toBeTruthy();
    expect(headingRule![0]).toContain('break-after: avoid');
    expect(headingRule![0]).toContain('break-inside: avoid');
  });

  it('table rule should contain break-inside: auto', () => {
    const printBlock = css.match(/@media print\s*\{[\s\S]*?\n\}/)![0];
    const tableRule = printBlock.match(/\btable\s*\{[^}]*\}/);
    expect(tableRule).toBeTruthy();
    expect(tableRule![0]).toContain('break-inside: auto');
  });

  it('tr rule should contain break-inside: avoid', () => {
    const printBlock = css.match(/@media print\s*\{[\s\S]*?\n\}/)![0];
    const trRule = printBlock.match(/\btr\s*\{[^}]*\}/);
    expect(trRule).toBeTruthy();
    expect(trRule![0]).toContain('break-inside: avoid');
  });

  it('thead rule should contain display: table-header-group', () => {
    const printBlock = css.match(/@media print\s*\{[\s\S]*?\n\}/)![0];
    const theadRule = printBlock.match(/thead\s*\{[^}]*\}/);
    expect(theadRule).toBeTruthy();
    expect(theadRule![0]).toContain('display: table-header-group');
  });

  it('img rule should contain break-inside: avoid and max-height: 80vh', () => {
    const printBlock = css.match(/@media print\s*\{[\s\S]*?\n\}/)![0];
    const imgRule = printBlock.match(/\bimg\s*\{[^}]*\}/);
    expect(imgRule).toBeTruthy();
    expect(imgRule![0]).toContain('break-inside: avoid');
    expect(imgRule![0]).toContain('max-height: 80vh');
  });

  it('@page rule should contain size: A4 and margin: 20mm 15mm 25mm 15mm', () => {
    const pageRule = css.match(/@page\s*\{[^}]*\}/);
    expect(pageRule).toBeTruthy();
    expect(pageRule![0]).toContain('size: A4');
    expect(pageRule![0]).toContain('margin: 20mm 15mm 25mm 15mm');
  });
});
