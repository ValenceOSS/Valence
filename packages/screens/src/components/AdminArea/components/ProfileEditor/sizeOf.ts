/**
 * Reads a size typed into the form, where one was.
 *
 * @param text - What was typed.
 * @returns The size, null for none, or undefined where it is not a size.
 */
const sizeOf = (text: string): number | null | undefined => {
  if (text.trim() === '') {
    return null;
  }

  const size = Number(text.trim());

  return Number.isFinite(size) && size >= 0 ? size : undefined;
};

export { sizeOf };
