import type { CommandPaletteGroup } from '@ValenceUI/CommandPalette.types';

type ResultToGroup = {
  path: string;
  title: string;
  sectionTitle: string;
  detail: string;
};

/**
 * Gathers results under the section each came from, keeping the order they arrived in.
 *
 * Sections appear in the order their first result does, so a search puts the section holding the
 * best match first, and an empty search lists the sections as the sidebar does.
 *
 * @param results - The results, best first.
 * @returns The results as palette groups.
 */
const groupResults = (results: readonly ResultToGroup[]): readonly CommandPaletteGroup[] =>
  results.reduce<CommandPaletteGroup[]>((groups, result) => {
    const item = { id: result.path, label: result.title, detail: result.detail };
    const existing = groups.find((group) => group.heading === result.sectionTitle);

    return existing === undefined
      ? [...groups, { heading: result.sectionTitle, items: [item] }]
      : groups.map((group) =>
          group === existing ? { ...group, items: [...group.items, item] } : group,
        );
  }, []);

export type { ResultToGroup };

export { groupResults };
