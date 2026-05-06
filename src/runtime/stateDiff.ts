export type StateDiffEntry = {
  path: string;
  before: unknown;
  after: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatPath(parent: string, key: string) {
  return parent ? `${parent}.${key}` : key;
}

export function createStateDiff(before: unknown, after: unknown, parentPath = ''): StateDiffEntry[] {
  if (Object.is(before, after)) {
    return [];
  }

  if (Array.isArray(before) || Array.isArray(after)) {
    const beforeLength = Array.isArray(before) ? before.length : undefined;
    const afterLength = Array.isArray(after) ? after.length : undefined;

    if (beforeLength !== afterLength) {
      return [{ path: `${parentPath}.length`.replace(/^\./, ''), before: beforeLength, after: afterLength }];
    }

    return [{ path: parentPath || 'value', before, after }];
  }

  if (!isRecord(before) || !isRecord(after)) {
    return [{ path: parentPath || 'value', before, after }];
  }

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diff: StateDiffEntry[] = [];

  keys.forEach((key) => {
    diff.push(...createStateDiff(before[key], after[key], formatPath(parentPath, key)));
  });

  return diff;
}
