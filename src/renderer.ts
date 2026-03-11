// Renderer module - HTML to PDF rendering via puppeteer-core

import puppeteer from 'puppeteer-core';
import type { Heading, RenderOptions } from './types.js';

const TIMEOUT_MS = 30_000;

/**
 * Detect Chrome / Chromium executable path based on platform.
 */
function findChromePath(): string {
  const platform = process.platform;

  if (platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }

  if (platform === 'win32') {
    const prefixes = [
      process.env['PROGRAMFILES'] ?? 'C:\\Program Files',
      process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)',
      `${process.env['LOCALAPPDATA'] ?? ''}\\Google\\Chrome\\Application`,
    ];
    for (const prefix of prefixes) {
      const candidate = `${prefix}\\Google\\Chrome\\Application\\chrome.exe`;
      // Return first common path — puppeteer will throw if not found
      return candidate;
    }
  }

  // Linux common paths
  const linuxPaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  return linuxPaths[0];
}

/**
 * Build the footer template HTML for page numbers.
 * puppeteer requires the template to use specific CSS classes:
 * - pageNumber, totalPages, date, title, url
 */
function buildFooterTemplate(): string {
  return `<div style="width: 100%; font-size: 9px; color: #999; text-align: center; padding: 5px 0;">
  <span class="pageNumber"></span> / <span class="totalPages"></span>
</div>`;
}

/**
 * Render a full HTML page to PDF using puppeteer-core.
 *
 * @param html - Complete HTML page string (with embedded CSS)
 * @param headings - Extracted headings for PDF bookmarks/outline
 * @param options - Output path, page format, and margin configuration
 */
export async function renderPDF(
  html: string,
  _headings: Heading[],
  options: RenderOptions,
): Promise<void> {
  // _headings kept in signature for API contract; outline is generated
  // by puppeteer's `outline: true` from <h1>-<h6> tags in the HTML.
  const executablePath = findChromePath();
  const format = options.format ?? 'A4';
  const margin = {
    top: options.margin?.top ?? '20mm',
    bottom: options.margin?.bottom ?? '25mm',
    left: options.margin?.left ?? '15mm',
    right: options.margin?.right ?? '15mm',
  };

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set content with a generous timeout for complex documents
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: TIMEOUT_MS,
    });

    // Generate PDF with page numbers and bookmarks
    await page.pdf({
      path: options.outputPath,
      format,
      margin,
      printBackground: true,
      displayHeaderFooter: true,
      // Empty header to avoid default header text
      headerTemplate: '<span></span>',
      footerTemplate: buildFooterTemplate(),
      timeout: TIMEOUT_MS,
      // tagged PDF enables bookmarks from heading tags
      tagged: true,
      // Generate document outline (bookmarks) from heading elements
      outline: true,
    });
  } finally {
    await browser.close();
  }
}
