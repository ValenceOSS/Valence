/**
 * Splits words at the figure written in them, so that an animated figure can be drawn in its place
 * with the words either side of it as its prefix and suffix.
 *
 * @param words - The words, with the figure in them.
 * @param figure - The figure, exactly as it is written in the words.
 * @returns What comes before the figure and what comes after it.
 */
const aroundTheFigure = (words: string, figure: string): { prefix: string; suffix: string } => {
  const at = words.indexOf(figure);

  return at === -1
    ? { prefix: '', suffix: '' }
    : { prefix: words.slice(0, at), suffix: words.slice(at + figure.length) };
};

export { aroundTheFigure };
