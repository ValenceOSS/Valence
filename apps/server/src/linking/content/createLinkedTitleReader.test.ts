import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createLinkedTitleReader } from './createLinkedTitleReader';

const STARTING_THE_DATABASE_MS = 60_000;

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const REMOTE = '00000000-0000-4000-8000-0000000000a1';

describe('createLinkedTitleReader', () => {
  it(
    'reads which linked server a title is from and what it calls it, and remembers it',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(library).values({ id: 'films', name: 'Films', kind: 'movies', path: '/f' });
      await db
        .insert(mediaItem)
        .values([
          { ...aMediaItemRow('theirs', 'films'), path: `linked://${FILMS}/api/media/${REMOTE}` },
          aMediaItemRow('mine', 'films'),
        ]);

      const read = createLinkedTitleReader(db);

      expect(await read('theirs')).toEqual({ serverId: FILMS, remoteId: REMOTE });
      expect(await read('mine')).toBeNull();
      expect(await read('nothing')).toBeNull();

      await db.update(mediaItem).set({ path: '/f/moved.mkv' }).where(eq(mediaItem.id, 'theirs'));

      expect(await read('theirs')).toEqual({ serverId: FILMS, remoteId: REMOTE });
    },
    STARTING_THE_DATABASE_MS,
  );
});
