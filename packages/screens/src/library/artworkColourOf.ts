const COLOURS = 6;

/**
 * Which of the colours Valence draws its own artwork in belongs to something, the same one every
 * time it is drawn, so a mix or a title without a picture stays recognisable.
 *
 * @param key - What it is, such as a mix's id or a title's name.
 * @returns The colour, as CSS can read it.
 */
const artworkColourOf = (key: string): string => {
  const at = [...key].reduce((sum, letter) => (sum * 31 + letter.charCodeAt(0)) % 9973, 7);

  return `var(--mix-colour-${((at % COLOURS) + 1).toString()})`;
};

export { artworkColourOf };
