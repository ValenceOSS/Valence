import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { aScratchDatabase } from './aScratchDatabase';

describe('aScratchDatabase', () => {
  it('applies every migration the service carries', async () => {
    const db = await aScratchDatabase();
    const tables = await db.execute(
      sql`select table_name from information_schema.tables where table_schema = 'valence_requests' order by table_name`,
    );

    expect(
      z.object({ rows: z.array(z.object({ table_name: z.string() })) }).parse(tables).rows,
    ).toEqual([
      { table_name: '__migrations' },
      { table_name: 'download' },
      { table_name: 'download_client' },
      { table_name: 'download_event' },
      { table_name: 'indexer' },
      { table_name: 'indexer_definition' },
      { table_name: 'setting' },
    ]);
  });
});
