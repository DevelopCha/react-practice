export const FLOW_STEP_DELAY_MS = 750;

export function sleep(ms = FLOW_STEP_DELAY_MS) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}
