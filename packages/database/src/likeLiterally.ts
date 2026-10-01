/**
 * Escapes the characters `LIKE` treats as patterns, so text is matched as written.
 *
 * @param text - What is being looked for.
 * @returns The text, safe inside a `LIKE`.
 */
const likeLiterally = (text: string): string =>
  text.replace(/[\\%_]/g, (character) => `\\${character}`);

export { likeLiterally };
