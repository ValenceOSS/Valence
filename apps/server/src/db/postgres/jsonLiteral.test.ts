import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { jsonLiteral } from './jsonLiteral';
import type { AnyValenceDatabase } from './AnyValenceDatabase';

let db: AnyValenceDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values({ id: 'a', name: 'Literal', tags: ['one', 'two'] });
}, 30_000);

describe('jsonLiteral', () => {
  it('compares as JSON, not as text', async () => {
    await expect(
      db
        .select({ name: PLAYGROUND.name })
        .from(PLAYGROUND)
        .where(eq(PLAYGROUND.tags, jsonLiteral(['one', 'two']))),
    ).resolves.toEqual([{ name: 'Literal' }]);
  });
});
