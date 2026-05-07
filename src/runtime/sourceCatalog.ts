import type { SourceTarget } from './sourceLink';

type SourcePreview = {
  path: string;
  line?: number;
  startLine: number;
  endLine: number;
  snippet: string;
};

const rawSources = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function normalizeSourceKey(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

export function getSourcePreview(target: SourceTarget | null, contextLines = 6): SourcePreview | null {
  if (!target) {
    return null;
  }

  const source = rawSources[normalizeSourceKey(target.path)];
  if (!source) {
    return null;
  }

  const allLines = source.split('\n');
  const lineNumber = target.line ? Number(target.line) : undefined;
  const focusIndex = lineNumber ? Math.max(lineNumber - 1, 0) : 0;
  const startIndex = Math.max(focusIndex - contextLines, 0);
  const endIndex = lineNumber ? Math.min(focusIndex + contextLines, allLines.length - 1) : Math.min(contextLines * 2, allLines.length - 1);
  const snippet = allLines
    .slice(startIndex, endIndex + 1)
    .map((line, index) => `${String(startIndex + index + 1).padStart(4, ' ')} | ${line}`)
    .join('\n');

  return {
    path: target.path,
    line: lineNumber,
    startLine: startIndex + 1,
    endLine: endIndex + 1,
    snippet,
  };
}
