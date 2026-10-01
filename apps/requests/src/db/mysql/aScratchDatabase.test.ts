import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { aScratchDatabase } from './aScratchDatabase';

describe('aScratchDatabase', () => {
  it('applies every migration the service carries', async () => {
    const db = await aScratchDatabase();
    const [rows] = await db.execute(
      sql`select table_name as name from information_schema.tables where table_schema = database()`,
    );

    expect(
      z
        .array(z.object({ name: z.string() }))
        .parse(rows)
        .toSorted((one, other) => (one.name < other.name ? -1 : 1)),
    ).toEqual([
      { name: '__requests_migrations' },
      { name: 'requests_blocklisted_release' },
      { name: 'requests_download' },
      { name: 'requests_download_client' },
      { name: 'requests_download_event' },
      { name: 'requests_give_up_rules' },
      { name: 'requests_indexer' },
      { name: 'requests_indexer_definition' },
      { name: 'requests_media_request' },
      { name: 'requests_quality_profile' },
      { name: 'requests_request_item' },
      { name: 'requests_request_log' },
      { name: 'requests_setting' },
    ]);
  });
});
