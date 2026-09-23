/**
 * What a chapter mark is called: its own title, unless it has none or only numbers it, as a ripped
 * audiobook's "001" does, where it is called by its place instead.
 *
 * @param title - The title the mark carries, where it carries one.
 * @param at - Where the mark comes among the book's marks, counting from nought.
 * @returns The title.
 */
const chapterTitleOf = (title: string | null | undefined, at: number): string => {
  const said = (title ?? '').trim();

  return said === '' || /^\d+$/.test(said) ? `Chapter ${(at + 1).toString()}` : said;
};

export { chapterTitleOf };
