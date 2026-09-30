import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { readRows } from './readRows';
import type { AnyValenceDatabase } from './AnyValenceDatabase';

let db: AnyValenceDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values({ id: 'a', name: 'Read', count: 4 });
}, 30_000);

describe('readRows', () => {
  it('reads the rows of a query written by hand', async () => {
    await expect(
      readRows(
        db,
        sql`select ${PLAYGROUND.name} as name, ${PLAYGROUND.count} as count from ${PLAYGROUND}`,
        z.object({ name: z.string(), count: z.number() }),
      ),
    ).resolves.toEqual([{ name: 'Read', count: 4 }]);
  });

  it('refuses rows that are not what the schema says', async () => {
    await expect(
      readRows(
        db,
        sql`select ${PLAYGROUND.name} as name from ${PLAYGROUND}`,
        z.object({ name: z.number() }),
      ),
    ).rejects.toThrow();
  });
});
