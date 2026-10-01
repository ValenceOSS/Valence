import { eq, sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { jsonLiteral } from './jsonLiteral';
import type { AnyDatabase } from './AnyDatabase';

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values({ id: 'a', name: 'Literal', tags: ['one', 'two'] });
}, 30_000);

describe('jsonLiteral', () => {
  it('is read as JSON, not as a string', async () => {
    await expect(
      db
        .select({ name: PLAYGROUND.name })
        .from(PLAYGROUND)
        .where(sql`json_contains(${PLAYGROUND.tags}, ${jsonLiteral(['two'])})`),
    ).resolves.toEqual([{ name: 'Literal' }]);
  });

  it('writes a value the column reads back as it was', async () => {
    await db
      .update(PLAYGROUND)
      .set({
        tags: sql`case when false then ${PLAYGROUND.tags} else ${jsonLiteral(['three'])} end`,
      })
      .where(eq(PLAYGROUND.id, 'a'));

    await expect(db.select({ tags: PLAYGROUND.tags }).from(PLAYGROUND)).resolves.toEqual([
      { tags: ['three'] },
    ]);
  });
});
