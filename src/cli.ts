// CLI module - Command line interface

import path from 'node:path';
import { Command } from 'commander';
import type { CLIArgs } from './types.js';
import { parseFile } from './parser.js';
import { buildFullHTML } from './style-engine.js';
import { renderPDF } from './renderer.js';

export function parseArgs(argv: string[]): CLIArgs {
  const program = new Command();

  program
    .name('md-to-pdf')
    .description('Convert Markdown API docs to PDF')
    .argument('<input>', 'Input Markdown file path')
    .option('-o, --output <path>', 'Output PDF file path')
    .exitOverride();

  try {
    program.parse(argv);
  } catch {
    program.outputHelp();
    process.exit(1);
  }

  const args = program.args;
  const opts = program.opts<{ output?: string }>();

  if (!args[0]) {
    program.outputHelp();
    process.exit(1);
  }

  const input = args[0];
  const output = opts.output ?? deriveOutputPath(input);

  return { input, output };
}

function deriveOutputPath(inputPath: string): string {
  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}.pdf`);
}

export async function run(args: CLIArgs): Promise<void> {
  try {
    // 1. Parse the Markdown file
    const result = await parseFile(args.input);

    // 2. Build full HTML with styles and cover page
    const today = new Date().toISOString().slice(0, 10);
    const fullHtml = buildFullHTML(result.html, result.headings, {
      title: result.title ?? undefined,
      date: today,
    });

    // 3. Determine output path (parseArgs already derives default)
    const outputPath = args.output!;

    // 4. Render PDF
    await renderPDF(fullHtml, result.headings, { outputPath });

    // 5. Success — print output path
    console.log(outputPath);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // Classify error and choose exit code
    if (isFileError(message)) {
      process.stderr.write(`Error: ${message}\n`);
      process.exit(2);
    } else {
      // Rendering / unexpected errors
      process.stderr.write(`Error: ${message}\n`);
      process.exit(3);
    }
  }
}

/**
 * Determine if an error message indicates a file-related error (exit code 2).
 */
function isFileError(message: string): boolean {
  const fileErrorPatterns = [
    'File not found:',
    'Invalid UTF-8 encoding:',
    'Permission denied:',
    'Output directory not found:',
    'ENOENT',
    'EACCES',
  ];
  return fileErrorPatterns.some((pattern) => message.includes(pattern));
}


