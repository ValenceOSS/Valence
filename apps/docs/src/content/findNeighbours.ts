import type { NavItem, NavSection } from '@ValenceDocs/content/DocPage.types';

type Neighbours = { previous: NavItem | null; next: NavItem | null };

/**
 * Finds the pages either side of one, reading the sidebar top to bottom.
 *
 * @param sections - The sidebar's sections.
 * @param path - The page to look around.
 * @returns The page before and the page after, either of which is null at the ends or for an unknown page.
 */
const findNeighbours = (sections: readonly NavSection[], path: string): Neighbours => {
  const flat = sections.flatMap((section) => section.items);
  const at = flat.findIndex((item) => item.path === path);

  if (at === -1) {
    return { previous: null, next: null };
  }

  return { previous: flat[at - 1] ?? null, next: flat[at + 1] ?? null };
};

export type { Neighbours };

export { findNeighbours };
