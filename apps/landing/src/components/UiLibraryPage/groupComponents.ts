import type { UiComponentDoc } from 'virtual:ui-catalogue';
import type { UiExampleGroup } from './examples/UiExample.types';
import type { UiComponentGroup } from './UiLibraryPage.types';

/**
 * Sorts the documented components into the groups their examples are kept in, in the order those
 * groups are listed. A component with no examples yet is left out of the library altogether, since a
 * page of props with nothing to look at is not worth listing; it appears as soon as it has one.
 *
 * @param components - Every documented component.
 * @param groups - The groups of examples, in the order to list them.
 * @param query - What the list is being narrowed to; matches anywhere in a name, ignoring case.
 * @returns The groups that have anything in them, each with its components in alphabetical order.
 */
const groupComponents = (
  components: readonly UiComponentDoc[],
  groups: readonly UiExampleGroup[],
  query = '',
): UiComponentGroup[] => {
  const needle = query.trim().toLowerCase();
  const shown = components.filter((doc) => doc.name.toLowerCase().includes(needle));
  const homeOf = (name: string): string | undefined =>
    groups.find((group) => Object.hasOwn(group.examples, name))?.name;

  return groups
    .map((group) => group.name)
    .map((name) => ({
      name,
      components: shown
        .filter((doc) => homeOf(doc.name) === name)
        .sort((one, other) => one.name.localeCompare(other.name)),
    }))
    .filter((group) => group.components.length > 0);
};

export { groupComponents };
