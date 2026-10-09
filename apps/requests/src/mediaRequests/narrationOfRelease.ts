import type { Narration } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Which narration of a book a release's name says it is, by a narrator's surname appearing in it as
 * a word of its own; nothing where it names none, or names more than one narration's.
 *
 * @param title - The release's name.
 * @param narrations - The book's narrations.
 * @returns The narration's ASIN, or null.
 */
const narrationOfRelease = (title: string, narrations: readonly Narration[]): string | null => {
  const words = new Set(
    title
      .toLowerCase()
      .split(/[^\p{L}\p{N}']+/u)
      .filter((word) => word !== ''),
  );
  const named = narrations.filter((narration) =>
    narration.narrators.some((narrator) => {
      const surname = narrator.trim().split(/\s+/).at(-1)?.toLowerCase() ?? '';

      return surname.length > 1 && words.has(surname);
    }),
  );

  return named.length === 1 ? (named[0]?.asin ?? null) : null;
};

export { narrationOfRelease };
