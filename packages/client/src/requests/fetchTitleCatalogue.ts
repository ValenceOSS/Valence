import { readFromServer } from '@ValenceClient/query/readFromServer';
import { CatalogueListingSchema, TitleFilesSchema } from '@ValenceContracts/schemas/AdminCatalogue';
import type { CatalogueEntry, TitleFiles } from '@ValenceContracts/schemas/AdminCatalogue';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Reads the admin Catalogue: every title the libraries hold and every title asked for, with where
 * each stands.
 *
 * @returns The titles.
 */
const fetchTitleCatalogue = async (): Promise<CatalogueEntry[]> =>
  (await readFromServer('/api/admin/requests/catalogue', CatalogueListingSchema)).entries;

/**
 * Reads the files the libraries hold of one title, and the folder it is kept in.
 *
 * @param kind - What it is.
 * @param catalogueId - The id it is known by.
 * @returns Its files.
 */
const fetchTitleFiles = (kind: MediaRequestKind, catalogueId: string): Promise<TitleFiles> =>
  readFromServer(
    `/api/admin/requests/catalogue/files?${new URLSearchParams({ kind, catalogueId }).toString()}`,
    TitleFilesSchema,
  );

export { fetchTitleCatalogue, fetchTitleFiles };
