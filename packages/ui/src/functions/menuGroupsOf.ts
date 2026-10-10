import type { MenuOption, OneOfMenuGroup } from '@ValenceUI/OptionMenu.types';

/**
 * Splits one choice's options into the groups a menu heads with their names, in the order each group
 * first appears, so options that say which group they fall under are drawn beneath that heading and
 * the rest beneath the choice's own name. Every group shares the one selection.
 *
 * @param name - What the choice is called, heading the options that name no group.
 * @param options - The options, each perhaps naming its group.
 * @param selectedId - The option chosen.
 * @param onSelect - Told which option is chosen.
 * @returns The groups, for an option menu.
 */
const menuGroupsOf = (
  name: string,
  options: readonly MenuOption[],
  selectedId: string,
  onSelect: (id: string) => void,
): OneOfMenuGroup[] =>
  [...new Set(options.map((option) => option.group ?? name))].map((heading) => ({
    name: heading,
    options: options.filter((option) => (option.group ?? name) === heading),
    selectedId,
    onSelect,
  }));

export { menuGroupsOf };
