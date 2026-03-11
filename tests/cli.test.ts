import { describe, it, expect, vi } from 'vitest';
import { parseArgs } from '../src/cli.js';

describe('parseArgs', () => {
  it('should parse input file path as required argument', () => {
    const result = parseArgs(['node', 'md-to-pdf', 'docs/api.md']);
    expect(result.input).toBe('docs/api.md');
  });

  it('should parse output option with -o flag', () => {
    const result = parseArgs(['node', 'md-to-pdf', 'docs/api.md', '-o', 'out/api.pdf']);
    expect(result.input).toBe('docs/api.md');
    expect(result.output).toBe('out/api.pdf');
  });

  it('should parse output option with --output flag', () => {
    const result = parseArgs(['node', 'md-to-pdf', 'docs/api.md', '--output', 'out/api.pdf']);
    expect(result.input).toBe('docs/api.md');
    expect(result.output).toBe('out/api.pdf');
  });

  it('should derive default output path from input when output not specified', () => {
    const result = parseArgs(['node', 'md-to-pdf', 'docs/api.md']);
    expect(result.output).toBe('docs/api.pdf');
  });

  it('should derive default output path for file without extension', () => {
    const result = parseArgs(['node', 'md-to-pdf', 'README']);
    expect(result.output).toBe('README.pdf');
  });

  it('should derive default output path for file in current directory', () => {
    const result = parseArgs(['node', 'md-to-pdf', 'file.md']);
    expect(result.output).toBe('file.pdf');
  });

  it('should handle absolute paths', () => {
    const result = parseArgs(['node', 'md-to-pdf', '/home/user/docs/api.md']);
    expect(result.input).toBe('/home/user/docs/api.md');
    expect(result.output).toBe('/home/user/docs/api.pdf');
  });

  it('should exit with code 1 when input argument is missing', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => parseArgs(['node', 'md-to-pdf'])).toThrow('process.exit called');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
