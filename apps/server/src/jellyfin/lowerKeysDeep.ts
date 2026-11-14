import type { Json } from '@ValenceServer/jellyfin/JsonSchema';

/**
 * The same JSON with every name in it in lower case, at every depth, since Jellyfin reads a body's
 * names whatever their case and its apps write them in more than one.
 *
 * @param value - The body.
 * @returns The body with its names in lower case.
 */
const lowerKeysDeep = (value: Json): Json => {
  if (Array.isArray(value)) {
    return value.map(lowerKeysDeep);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([name, inner]) => [name.toLowerCase(), lowerKeysDeep(inner)]),
  );
};

export { lowerKeysDeep };
