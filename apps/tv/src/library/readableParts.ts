const LONGEST = 360;

/**
 * Splits a long piece of writing into parts short enough to be read a screenful at a time: its own
 * paragraphs, and any paragraph longer than a few lines broken between its sentences, so a remote,
 * which scrolls a television's page only by moving from one thing to the next, can reach every
 * line.
 *
 * @param writing - The writing.
 * @returns Its parts, in order, none of them empty.
 */
const readableParts = (writing: string): string[] =>
  writing
    .split(/\n+/u)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '')
    .flatMap((paragraph) => {
      if (paragraph.length <= LONGEST) {
        return [paragraph];
      }

      const sentences = paragraph.match(/[^.!?]+(?:[.!?]+["'’”)\]]*\s*|$)/gu) ?? [paragraph];
      const parts: string[] = [];

      for (const sentence of sentences) {
        const last = parts.at(-1);

        if (last !== undefined && last.length + sentence.length <= LONGEST) {
          parts[parts.length - 1] = `${last}${sentence}`;
        } else {
          parts.push(sentence);
        }
      }

      return parts.map((part) => part.trim()).filter((part) => part !== '');
    });

export { readableParts };
