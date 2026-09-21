type PageHeading = { id: string; text: string; level: 2 | 3 };

/**
 * Reads the headings out of a rendered page, for its on-this-page list.
 *
 * @param root - The element holding the page.
 * @returns The second and third level headings that have an anchor, in reading order.
 */
const readHeadings = (root: HTMLElement): readonly PageHeading[] =>
  Array.from(root.querySelectorAll('h2[id], h3[id]')).flatMap((heading) =>
    heading.id === ''
      ? []
      : [
          {
            id: heading.id,
            text: heading.textContent.replace(/#$/u, '').trim(),
            level: heading.tagName === 'H2' ? 2 : 3,
          },
        ],
  );

export type { PageHeading };

export { readHeadings };
