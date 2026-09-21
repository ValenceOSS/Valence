import { DOC_SECTIONS } from '@ValenceDocs/content/DOC_SECTIONS';
import type { DocPage, NavItem, NavSection } from '@ValenceDocs/content/DocPage.types';

type ExtraLink = NavItem & { section: string };

/**
 * Groups the pages into the sections the sidebar shows, with any links that are not pages slotted in.
 *
 * The API reference is the reason for the extra links: it is served by the reference viewer rather
 * than written as a page, and still belongs in the sidebar beside the pages around it.
 *
 * @param pages - Every page.
 * @param extras - Links to add to a section, each with the order it takes among that section's pages.
 * @returns The sections that have anything in them, in the order the site lists them.
 */
const buildNavigation = (
  pages: readonly DocPage[],
  extras: readonly ExtraLink[] = [],
): readonly NavSection[] =>
  DOC_SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    items: [
      ...pages
        .filter((page) => page.section === section.id)
        .map(({ path, title, order }) => ({ path, title, order })),
      ...extras
        .filter((extra) => extra.section === section.id)
        .map(({ path, title, order }) => ({ path, title, order })),
    ].toSorted((a, b) => a.order - b.order),
  })).filter((section) => section.items.length > 0);

export type { ExtraLink };

export { buildNavigation };
