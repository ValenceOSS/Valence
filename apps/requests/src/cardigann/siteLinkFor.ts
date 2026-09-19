import type { CardigannDefinition } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';

/**
 * The address to reach a site at: the one the indexer was given, unless the definition lists it as
 * an old address that no longer works, in which case its first address — and always ending in a
 * slash, since every path is written relative to it.
 *
 * @param definition - The definition.
 * @param chosen - The address the indexer was given.
 * @returns The address.
 */
const siteLinkFor = (definition: CardigannDefinition, chosen: string): string => {
  const link =
    chosen === '' || definition.legacylinks.includes(chosen)
      ? (definition.links[0] ?? chosen)
      : chosen;

  return link.endsWith('/') ? link : `${link}/`;
};

export { siteLinkFor };
