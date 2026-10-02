import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { importLink, importSource } from '#dialect/Schema';
import { readImportedAccounts } from './readImportedAccounts';

const STARTING_POSTGRES_MS = 60_000;

describe('readImportedAccounts', () => {
  it(
    'reads the accounts an import made, and nothing else it linked',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(importSource).values({
        id: 'jellyfin-1',
        kind: 'jellyfin',
        name: 'Jellyfin',
        url: 'http://jellyfin:8096',
        token: 'token',
      });
      await db.insert(importLink).values([
        {
          id: 'link-1',
          sourceId: 'jellyfin-1',
          kind: 'account',
          sourceKey: '6f1a2b3c4d5e6f708192a3b4c5d6e7f8',
          valenceId: 'robin',
        },
        {
          id: 'link-2',
          sourceId: 'jellyfin-1',
          kind: 'media',
          sourceKey: 'abc',
          valenceId: 'dune',
        },
      ]);

      expect(await readImportedAccounts(db)).toEqual([
        {
          sourceKind: 'jellyfin',
          sourceKey: '6f1a2b3c4d5e6f708192a3b4c5d6e7f8',
          accountId: 'robin',
        },
      ]);
    },
    STARTING_POSTGRES_MS,
  );
});
