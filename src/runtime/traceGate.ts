let suppressDepth = 0;

export function isRuntimeInstrumentationEnabled() {
  return suppressDepth === 0;
}

export async function runWithRuntimeInstrumentationSuppressed<T>(work: () => Promise<T>): Promise<T> {
  suppressDepth += 1;

  try {
    return await work();
  } finally {
    suppressDepth = Math.max(0, suppressDepth - 1);
  }
}
