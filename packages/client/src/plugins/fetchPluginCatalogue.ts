import { readFromServer } from '@ValenceClient/query/readFromServer';
import { CatalogueListingSchema } from '@ValenceContracts/schemas/Plugin';
import type { CatalogueListing } from '@ValenceContracts/schemas/Plugin';

/**
 * The official plugins, as the server read and checked them from the signed catalogue.
 *
 * @returns The listing, which says itself when the catalogue could not be reached.
 */
const fetchPluginCatalogue = (): Promise<CatalogueListing> =>
  readFromServer('/api/plugins/catalogue', CatalogueListingSchema);

export { fetchPluginCatalogue };
