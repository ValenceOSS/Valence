/**
 * A text matcher for the element that reads exactly these words, where a rolling number and the
 * words around it sit in separate elements inside it.
 *
 * @param words - What the element reads.
 * @returns A matcher for Testing Library's text queries.
 */
const readsWhole =
  (words: string) =>
  (_: string, element: Element | null): boolean =>
    element?.textContent === words &&
    [...element.children].every((child) => child.textContent !== words);

export { readsWhole };
