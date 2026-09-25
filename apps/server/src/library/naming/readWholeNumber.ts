const WHOLE_NUMBER = /^\s*[+-]?\d+\s*$/;

const LARGEST = 2_147_483_647;

/**
 * Reads a whole number the way .NET's `int.TryParse` does, so a naming rule ported from Jellyfin
 * fails on exactly what Jellyfin's fails on — `02a`, an empty capture, a number too large to hold.
 *
 * @param text - What a rule captured, or nothing where it captured nothing.
 * @returns The number, or null where the text is not one.
 */
const readWholeNumber = (text: string | undefined): number | null => {
  if (text === undefined || !WHOLE_NUMBER.test(text)) {
    return null;
  }

  const number = Number(text.trim());

  return Math.abs(number) > LARGEST ? null : number;
};

export { readWholeNumber };
