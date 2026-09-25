/**
 * Only the words from a strings file, by key, which is all an app needs to carry: the usage and
 * the context are for a translator and only add weight to every bundle.
 *
 * @param strings - The strings file.
 * @returns Each key's words, in the same order.
 */
const valuesOf = (
  strings: Readonly<Record<string, { readonly value: string }>>,
): Record<string, string> =>
  Object.fromEntries(Object.entries(strings).map(([key, entry]) => [key, entry.value]));

export { valuesOf };
