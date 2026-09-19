import { readFromServer } from '@ValenceClient/query/readFromServer';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import {
  IndexerCatalogueSchema,
  IndexerDefinitionDetailSchema,
} from '@ValenceContracts/schemas/IndexerDefinition';
import type {
  IndexerCatalogue,
  IndexerDefinitionDetail,
} from '@ValenceContracts/schemas/IndexerDefinition';

const DEFINITIONS = '/api/admin/requests/definitions';

/**
 * Reads the catalogue of sites Valence has definitions for.
 *
 * @returns Every definition, and how the catalogue last fared.
 */
const fetchCatalogue = (): Promise<IndexerCatalogue> =>
  readFromServer(DEFINITIONS, IndexerCatalogueSchema);

/**
 * Brings the catalogue up to date with the repository it comes from.
 *
 * @returns The catalogue afterwards.
 * @throws RequestFailed where the server or the service refused.
 */
const refreshCatalogue = async (): Promise<IndexerCatalogue> => {
  const path = `${DEFINITIONS}/refresh`;
  const response = await fetch(path, { method: 'POST', credentials: 'same-origin' });

  if (!response.ok) {
    throw new RequestFailed(path, response.status);
  }

  return IndexerCatalogueSchema.parse(await response.json());
};

/**
 * Reads one definition, with the settings it asks for.
 *
 * @param id - Which.
 * @returns The definition.
 */
const fetchDefinition = (id: string): Promise<IndexerDefinitionDetail> =>
  readFromServer(`${DEFINITIONS}/${encodeURIComponent(id)}`, IndexerDefinitionDetailSchema);

export { fetchCatalogue, fetchDefinition, refreshCatalogue };
