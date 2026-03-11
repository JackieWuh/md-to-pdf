// Core type definitions for md-to-pdf

export interface Heading {
  level: number;
  text: string;
  id: string;
}

export interface ParseResult {
  html: string;
  title: string | null;
  headings: Heading[];
}

export interface ParserOptions {
  highlightTheme?: string;
}

export interface StyleOptions {
  title?: string;
  date?: string;
  pageNumbers?: boolean;
}

export interface RenderOptions {
  outputPath: string;
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

export interface CLIArgs {
  input: string;
  output?: string;
}

// Web Converter UI types

export interface ConvertResponse {
  html: string;
  css: string;
  title: string | null;
}

export interface ConvertErrorResponse {
  error: string;
  code: string;
}
