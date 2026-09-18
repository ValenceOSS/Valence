import { afterAll, describe, expect, it } from 'vitest';
import { createDatabase } from '@ValenceServer/db/Database';
import { mediaItem } from '@ValenceServer/db/Schema';
import { isNotATrack } from './isNotATrack';

const { db, pool } = createDatabase('postgres://nobody@localhost:1/none');

afterAll(async () => {
  await pool.end();
});

describe('isNotATrack', () => {
  it('asks whether the item being read has a track beside it', () => {
    const asked = db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(isNotATrack(db))
      .toSQL().sql;

    expect(asked).toContain('not exists');
    expect(asked).toContain('"music_track"."mediaItemId" = "media_item"."id"');
  });
});
