import { eq } from 'drizzle-orm';
import { importLink, importSource } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { ImportedAccount } from '@ValenceServer/arrImport/ImportedAccount';

/**
 * Every account an import from Jellyfin, Emby or Plex made or matched, with the source it came from
 * and who it was there.
 *
 * @param db - The database.
 * @returns The accounts, by who they were in each source.
 */
const readImportedAccounts = async (db: AnyValenceDatabase): Promise<ImportedAccount[]> =>
  db
    .select({
      sourceKind: importSource.kind,
      sourceKey: importLink.sourceKey,
      accountId: importLink.valenceId,
    })
    .from(importLink)
    .innerJoin(importSource, eq(importLink.sourceId, importSource.id))
    .where(eq(importLink.kind, 'account'));

export { readImportedAccounts };
