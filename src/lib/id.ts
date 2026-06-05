let counter = 0;

/** Stable-ish unique id with a type prefix. */
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}
