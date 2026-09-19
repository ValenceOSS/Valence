/**
 * Makes a name possessive, the way English writes it.
 *
 * A name already ending in `s` takes the apostrophe alone — Marques' rather than Marques's — which
 * is the convention most style guides settle on for a name somebody has to read aloud. Everything
 * else takes an apostrophe and an s.
 *
 * @param name - Whose it is.
 * @returns The possessive form, or nothing where there is no name to make one from.
 */
const possessiveOf = (name: string): string => {
  const trimmed = name.trim();

  if (trimmed === '') {
    return '';
  }

  return trimmed.toLowerCase().endsWith('s') ? `${trimmed}’` : `${trimmed}’s`;
};

export { possessiveOf };
