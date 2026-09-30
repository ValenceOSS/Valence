import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { jsonObjectElements } from './jsonObjectElements';
import { readRows } from './readRows';
import type { AnyDatabase } from './AnyDatabase';

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values([
    {
      id: 'a',
      name: 'Cast',
      people: [
        { name: 'Amy', age: 41 },
        { name: 'Jeremy', age: 52 },
      ],
    },
    { id: 'b', name: 'Empty' },
  ]);
}, 30_000);

describe('jsonObjectElements', () => {
  it('reads the named fields of each object as columns', async () => {
    const person = jsonObjectElements(PLAYGROUND.people, 'person', {
      name: 'text',
      age: 'integer',
    });

    await expect(
      readRows(
        db,
        sql`select ${person.field('name')} as name, ${person.field('age')} as age from ${PLAYGROUND} cross join ${person.rows} order by age`,
        z.object({ name: z.string(), age: z.number() }),
      ),
    ).resolves.toEqual([
      { name: 'Amy', age: 41 },
      { name: 'Jeremy', age: 52 },
    ]);
  });
});
