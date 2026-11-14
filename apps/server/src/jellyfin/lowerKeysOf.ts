/**
 * The same query with every name in lower case, since Jellyfin reads `ParentId`, `parentId` and
 * `parentid` alike and its apps send all three. A name sent twice keeps its values joined by commas,
 * as Jellyfin reads a list.
 *
 * @param query - Each name and every value it was sent with.
 * @returns Each name in lower case and its value.
 */
const lowerKeysOf = (query: Readonly<Record<string, readonly string[]>>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(query).map(([name, values]) => [name.toLowerCase(), values.join(',')]),
  );

export { lowerKeysOf };
