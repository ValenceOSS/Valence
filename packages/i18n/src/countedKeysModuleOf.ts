const OTHER = '.other';

/**
 * The source of the module that lists every counted string: each handler said once of one thing
 * and once of several, named without its ending, before it is formatted.
 *
 * Written out rather than worked out from the handlers by the type checker, because picking the
 * counted ones out of every handler there is was a question over thousands of keys at once, which
 * one checker answered and another gave up on.
 *
 * @param words - Each handler's English words.
 */
const countedKeysModuleOf = (words: Readonly<Record<string, string>>): string => {
  const counted = Object.keys(words)
    .filter((handler) => handler.endsWith(OTHER))
    .map((handler) => handler.slice(0, -OTHER.length))
    .filter((base) => `${base}.one` in words)
    .sort();

  return `const COUNTED_KEYS = ${JSON.stringify(counted)} as const;\n\nexport { COUNTED_KEYS };\n`;
};

export { countedKeysModuleOf };
