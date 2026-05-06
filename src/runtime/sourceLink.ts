const sourcePathPattern = /(src\/[\w./-]+\.(?:ts|tsx))(?:\:(\d+))?/;

export type SourceTarget = {
  path: string;
  line?: string;
};

export function parseSourceTarget(codeLocation?: string): SourceTarget | null {
  if (!codeLocation) {
    return null;
  }

  const normalizedLocation = codeLocation.replace(/\\/g, '/');
  const match = normalizedLocation.match(sourcePathPattern);

  if (!match) {
    return null;
  }

  return {
    path: match[1],
    line: match[2],
  };
}

export function openSourceInVscode(codeLocation?: string) {
  const sourceTarget = parseSourceTarget(codeLocation);

  if (!sourceTarget) {
    return;
  }

  const target = `${__WORKSPACE_ROOT__}/${sourceTarget.path}${sourceTarget.line ? `:${sourceTarget.line}` : ''}`;
  window.open(encodeURI(`vscode://file/${target}`), '_blank', 'noopener,noreferrer');
}

