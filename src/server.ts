/**
 * Web Server module - HTTP server for the Markdown to PDF converter UI.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1
 */

import * as http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { getWebPageHTML } from './web-page.js';
import { parse } from './parser.js';
import { buildFullHTML, getDefaultCSS } from './style-engine.js';
import { renderPDF } from './renderer.js';

export interface ServerOptions {
  port?: number;
}

export interface UploadResult {
  content: string;
  filename: string;
}

export class ValidationError extends Error {
  constructor(message: string, public code: string, public statusCode: number) {
    super(message);
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const REQUEST_TIMEOUT_MS = 60_000; // 60 seconds

export let activeRequests = 0;
export const MAX_CONCURRENT = 5;

export function validateUpload(filename: string, content: Buffer): void {
  // Check file extension
  const ext = filename.toLowerCase().split('.').pop();
  if (ext !== 'md' && ext !== 'markdown') {
    throw new ValidationError(
      'Invalid file type. Only .md and .markdown files are supported.',
      'INVALID_EXTENSION',
      400
    );
  }

  // Check file size
  if (content.length > MAX_FILE_SIZE) {
    throw new ValidationError(
      'File size exceeds the 10MB limit.',
      'FILE_TOO_LARGE',
      413
    );
  }

  // Check valid UTF-8 encoding
  const decoded = new TextDecoder('utf-8', { fatal: true });
  try {
    decoded.decode(content);
  } catch {
    throw new ValidationError(
      'File content is not valid UTF-8 encoding.',
      'INVALID_ENCODING',
      400
    );
  }
}

function parseUpload(req: http.IncomingMessage): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      reject(new ValidationError('No file uploaded.', 'NO_FILE', 400));
      return;
    }

    const boundary = boundaryMatch[1];
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks);
        const boundaryBuffer = Buffer.from(`--${boundary}`);

        // Find parts separated by boundary
        const parts: Buffer[] = [];
        let start = 0;
        while (true) {
          const idx = body.indexOf(boundaryBuffer, start);
          if (idx === -1) break;
          if (start > 0) {
            // Strip leading \r\n and trailing \r\n before boundary
            let partStart = start;
            let partEnd = idx;
            if (body[partStart] === 0x0d && body[partStart + 1] === 0x0a) {
              partStart += 2;
            }
            if (partEnd >= 2 && body[partEnd - 2] === 0x0d && body[partEnd - 1] === 0x0a) {
              partEnd -= 2;
            }
            if (partEnd > partStart) {
              parts.push(body.subarray(partStart, partEnd));
            }
          }
          start = idx + boundaryBuffer.length;
        }

        // Find the file part
        let filename: string | null = null;
        let fileContent: Buffer | null = null;

        for (const part of parts) {
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd === -1) continue;

          const headerStr = part.subarray(0, headerEnd).toString('utf-8');
          const filenameMatch = headerStr.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
            fileContent = part.subarray(headerEnd + 4);
            break;
          }
        }

        if (!filename || !fileContent) {
          reject(new ValidationError('No file uploaded.', 'NO_FILE', 400));
          return;
        }

        validateUpload(filename, fileContent);

        resolve({
          content: fileContent.toString('utf-8'),
          filename,
        });
      } catch (err) {
        reject(err);
      }
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    req.on('data', (chunk) => chunks.push(chunk.toString()));
    req.on('end', () => resolve(chunks.join('')));
    req.on('error', reject);
  });
}

function derivePdfFilename(filename: string): string {
  const base = path.basename(filename, path.extname(filename));
  return `${base}.pdf`;
}

async function handleConvert(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  try {
    const { content, filename } = await parseUpload(req);
    const parseResult = parse(content);
    const fullHTML = buildFullHTML(parseResult.html, parseResult.headings);
    const css = getDefaultCSS();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ html: fullHTML, css, title: parseResult.title }));
  } catch (err) {
    if (err instanceof ValidationError) {
      res.writeHead(err.statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message, code: err.code }));
    } else {
      res.writeHead(422, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Parse error', code: 'PARSE_ERROR' }));
    }
  }
}

async function handlePdf(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const tempPath = path.join(os.tmpdir(), `md-to-pdf-${crypto.randomUUID()}.pdf`);
  try {
    const body = await readBody(req);
    const { html, filename } = JSON.parse(body) as { html: string; filename: string };

    await renderPDF(html, [], { outputPath: tempPath });

    const pdfBuffer = await fs.readFile(tempPath);
    const pdfFilename = derivePdfFilename(filename);

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfFilename}"`,
    });
    res.end(pdfBuffer);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: err instanceof Error ? err.message : 'PDF render failed',
        code: 'RENDER_ERROR',
      }));
    }
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const { method, url } = req;

  if (method === 'GET' && url === '/') {
    const html = getWebPageHTML();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (method === 'POST' && (url === '/api/convert' || url === '/api/pdf')) {
    // Concurrency limit check
    if (activeRequests >= MAX_CONCURRENT) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Service unavailable, too many concurrent requests', code: 'SERVICE_UNAVAILABLE' }));
      return;
    }

    activeRequests++;
    try {
      // Set up timeout with AbortController
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);

      const work = url === '/api/convert'
        ? handleConvert(req, res)
        : handlePdf(req, res);

      const timeoutPromise = new Promise<never>((_, reject) => {
        ac.signal.addEventListener('abort', () => reject(new Error('TIMEOUT')), { once: true });
      });

      try {
        await Promise.race([work, timeoutPromise]);
      } catch (err) {
        if (err instanceof Error && err.message === 'TIMEOUT' && !res.headersSent) {
          res.writeHead(504, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request timeout', code: 'TIMEOUT' }));
        } else if (!res.headersSent) {
          throw err;
        }
      } finally {
        clearTimeout(timer);
      }
    } finally {
      activeRequests--;
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', code: 'NOT_FOUND' }));
}

export function startServer(options?: ServerOptions): Promise<http.Server> {
  const port = options?.port ?? 3000;

  return new Promise((resolve, reject) => {
    const server = http.createServer(handleRequest);

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Error: Port ${port} is already in use.`);
        process.exit(1);
      }
      reject(err);
    });

    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}/`);
      resolve(server);
    });
  });
}

export function stopServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Check if this module is the main entry point
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  // parse --port from process.argv
  let port = 3000;
  const portIdx = process.argv.indexOf('--port');
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    port = parseInt(process.argv[portIdx + 1], 10);
  }
  startServer({ port });
}

