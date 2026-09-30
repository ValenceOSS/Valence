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

  it('reads numbers and yes-or-no fields too', async () => {
    const person = jsonObjectElements(
      sql`json_array(json_object('rating', 7.5, 'lead', true))`,
      'person',
      {
        rating: 'number',
        lead: 'boolean',
      },
    );

    await expect(
      readRows(
        db,
        sql`select ${person.field('rating')} as rating, ${person.field('lead')} as ${sql.identifier('lead')} from ${person.rows}`,
        z.object({ rating: z.number(), lead: z.number() }),
      ),
    ).resolves.toEqual([{ rating: 7.5, lead: 1 }]);
  });

  it('answers whether any row matches through a count', async () => {
    const person = jsonObjectElements(PLAYGROUND.people, 'person', { name: 'text' });

    await expect(
      db
        .select({ name: PLAYGROUND.name })
        .from(PLAYGROUND)
        .where(
          sql`(select count(*) from ${person.rows} where ${person.field('name')} like '%Jer%') > 0`,
        ),
    ).resolves.toEqual([{ name: 'Cast' }]);
  });
});
