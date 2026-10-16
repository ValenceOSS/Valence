import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { newestTitles } from './newestTitles';

const STARTING_THE_DATABASE_MS = 60_000;

describe('newestTitles', () => {
  it(
    'answers with films and episodes, newest first, and nothing from a music library',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(library).values([
        { id: 'films', name: 'Films', kind: 'movies', path: '/films' },
        { id: 'music', name: 'Music', kind: 'music', path: '/music' },
      ]);
      await db.insert(mediaItem).values([
        {
          ...aMediaItemRow('old', 'films'),
          path: '/films/old.mkv',
          addedAt: new Date('2026-01-01'),
        },
        {
          ...aMediaItemRow('new', 'films'),
          path: '/films/new.mkv',
          addedAt: new Date('2026-06-01'),
        },
        { ...aMediaItemRow('song', 'music'), path: '/music/song.flac' },
      ]);

      await expect(newestTitles(db, 10)).resolves.toEqual(['new', 'old']);
      await expect(newestTitles(db, 1)).resolves.toEqual(['new']);
    },
    STARTING_THE_DATABASE_MS,
  );
});
