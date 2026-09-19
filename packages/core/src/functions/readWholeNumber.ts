/**
 * Reads a whole number typed into a form, within the range allowed.
 *
 * @param text - What was typed.
 * @param low - The least allowed.
 * @param high - The most allowed.
 * @returns The number, or null where it is not one in range.
 */
const readWholeNumber = (text: string, low: number, high: number): number | null => {
  const value = Number(text.trim());

  return text.trim() !== '' && Number.isInteger(value) && value >= low && value <= high
    ? value
    : null;
};

export { readWholeNumber };
