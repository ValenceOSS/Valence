/**
 * Takes the first duplicated items up to a limit without splitting a group, taking the first group
 * whole even where it alone is over the limit.
 *
 * @param duplicated - Each duplicated item's id, with the group it belongs to.
 * @param limit - How many items to take at most.
 * @returns The ids taken, whole groups at a time.
 */
const firstWholeGroups = (duplicated: ReadonlyMap<string, string>, limit: number): string[] => {
  const groups = new Map<string, string[]>();

  for (const [id, group] of duplicated) {
    groups.set(group, [...(groups.get(group) ?? []), id]);
  }

  const taken: string[] = [];

  for (const ids of groups.values()) {
    if (taken.length > 0 && taken.length + ids.length > limit) {
      break;
    }

    taken.push(...ids);
  }

  return taken;
};

export { firstWholeGroups };
