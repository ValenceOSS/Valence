const QUOTED = /(["'`])([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+)\1/gu;

/**
 * Finds every string key a piece of source names in quotes, and every key beneath one it names, as
 * a counted string's `.one` and `.other` are beneath the key that names them.
 *
 * @param code - The source.
 * @param keys - Every key there is.
 * @returns The keys it needs.
 */
const keysNamedIn = (code: string, keys: readonly string[]): Set<string> => {
  const named = new Set([...code.matchAll(QUOTED)].map((match) => match[2] ?? ''));

  return new Set(
    keys.filter(
      (key) =>
        named.has(key) ||
        key
          .split('.')
          .slice(0, -1)
          .some((_, at, parts) => named.has(parts.slice(0, at + 1).join('.'))),
    ),
  );
};

export { keysNamedIn };
