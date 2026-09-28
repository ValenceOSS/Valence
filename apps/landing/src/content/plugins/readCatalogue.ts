import { CatalogueSchema } from '@ValenceSDK/package/CatalogueSchema';
import type { CatalogueEntry } from '@ValenceSDK/package/CatalogueSchema';
import type { PluginCatalogueJson } from 'virtual:plugin-catalogue';

/**
 * Reads the official plugins out of the catalogue the build fetched, by name, trusting nothing in
 * it until it matches the catalogue's own schema; a catalogue that does not is read as empty rather
 * than half shown.
 *
 * @param raw - The catalogue, exactly as it was published.
 * @returns Every plugin in it, in alphabetical order.
 */
const readCatalogue = (raw: PluginCatalogueJson): CatalogueEntry[] => {
  const read = CatalogueSchema.safeParse(raw);

  return read.success
    ? read.data.plugins.toSorted((left, right) => left.name.localeCompare(right.name))
    : [];
};

export { readCatalogue };
