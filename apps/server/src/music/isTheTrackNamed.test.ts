import { afterAll, describe, expect, it } from 'vitest';
import { createDatabase } from '#dialect/createDatabase';
import { mediaItem } from '#dialect/Schema';
import { isTheTrackNamed } from './isTheTrackNamed';

const { db, pool } = createDatabase('postgres://nobody@localhost:1/none');

afterAll(async () => {
  await pool.end();
});

describe('isTheTrackNamed', () => {
  it('matches the title and an artist whatever their case, taking neither as a pattern', () => {
    const asked = db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(isTheTrackNamed('100%_Pure', 'The Signal Box'))
      .toSQL();

    expect(asked.sql).toContain('lower("media_item"."title") like lower($1)');
    expect(asked.sql).toContain('lower("music_artist"."name") like lower($2)');
    expect(asked.params).toEqual(['100\\%\\_Pure', 'The Signal Box']);
  });
});
