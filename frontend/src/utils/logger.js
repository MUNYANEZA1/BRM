// Simple development logger to avoid cluttering production console
export function devLog(...args) {
  if (import.meta.env.MODE === 'development') {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}
