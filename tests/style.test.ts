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
