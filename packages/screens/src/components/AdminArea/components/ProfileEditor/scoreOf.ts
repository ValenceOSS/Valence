/**
 * Reads a score typed into the form, where one was: a whole number, below nought or above it.
 *
 * @param text - What was typed.
 * @returns The score, null for none, or undefined where it is not a whole number.
 */
const scoreOf = (text: string): number | null | undefined => {
  if (text.trim() === '') {
    return null;
  }

  const score = Number(text.trim());

  return Number.isInteger(score) ? score : undefined;
};

export { scoreOf };
