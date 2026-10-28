/**
 * Adds an item to its group, starting the group where it is the first. The group's list is added to
 * in place: copying the whole list to add one item costs nothing on a short list and a minute of a
 * scan on a folder of fifty thousand films, since every item added copies all those before it.
 *
 * @param groups - The groups so far, by key.
 * @param key - The group the item belongs to.
 * @param item - What to add.
 */
const addToGroup = <Key, Item>(groups: Map<Key, Item[]>, key: Key, item: Item): void => {
  const group = groups.get(key);

  if (group === undefined) {
    groups.set(key, [item]);
  } else {
    group.push(item);
  }
};

export { addToGroup };
