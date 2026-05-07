const sourcePathPattern = /(src\/[\w./-]+\.(?:tsx|ts))(?:\:(\d+))?/;

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

function buildAbsolutePath(path: string) {
  return `${__WORKSPACE_ROOT__}/${path}`.replace(/\/{2,}/g, '/');
}

export function buildVscodeUrl(target: SourceTarget) {
  const absolutePath = buildAbsolutePath(target.path);
  const encodedPath = absolutePath
    .split('/')
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
    .join('/');

  return target.line
    ? `vscode://file/${encodedPath}:${target.line}`
    : `vscode://file/${encodedPath}`;
}

export function openSourceInVscode(target: SourceTarget) {
  window.location.href = buildVscodeUrl(target);
}
