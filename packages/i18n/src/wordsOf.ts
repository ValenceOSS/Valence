import type { StringEntry } from './StringsFileSchema';

/**
 * Each handler's words from a strings file, which is all an app carries: the context is for a
 * translator and only adds weight to every bundle.
 *
 * @param entries - The strings file.
 */
const wordsOf = (entries: readonly StringEntry[]): Record<string, string> =>
  Object.fromEntries(entries.map((entry) => [entry.handler, entry.text]));

export { wordsOf };
