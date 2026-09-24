import type { ActionMenuGroup } from './ActionMenu.types';

/**
 * Moves every destructive item out of where it was written and into a group of its own at the
 * bottom, so that whatever deletes or removes is always set apart from the rest and last, however
 * the caller happened to order it. A group left with nothing in it is dropped.
 *
 * @param groups - The groups as the caller wrote them.
 * @returns The groups with the destructive items gathered into one, last.
 */
const separateDestructive = (groups: readonly ActionMenuGroup[]): ActionMenuGroup[] => {
  const destructive = groups.flatMap((group) =>
    group.items.filter((item) => item.isDestructive === true),
  );

  const kept = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.isDestructive !== true),
    }))
    .filter((group) => group.items.length > 0 || group.control !== undefined);

  return destructive.length === 0 ? kept : [...kept, { items: destructive }];
};

export { separateDestructive };
