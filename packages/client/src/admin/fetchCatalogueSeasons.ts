import { readFromServer } from '@ValenceClient/query/readFromServer';
import { CatalogueSeasonsSchema } from '@ValenceContracts/schemas/SeasonSource';
import type { CatalogueSeasons } from '@ValenceContracts/schemas/SeasonSource';

/**
 * Reads the seasons a catalogue entry has, to choose the one a season of a show is read from.
 *
 * @param mediaId - Any episode of the season being changed.
 * @param externalId - The catalogue entry.
 * @returns Its seasons.
 */
const fetchCatalogueSeasons = (mediaId: string, externalId: string): Promise<CatalogueSeasons> =>
  readFromServer(
    `/api/media/${mediaId}/season-source/seasons?show=${encodeURIComponent(externalId)}`,
    CatalogueSeasonsSchema,
  );

export { fetchCatalogueSeasons };
