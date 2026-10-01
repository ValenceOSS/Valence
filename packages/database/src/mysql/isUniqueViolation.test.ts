import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { isUniqueViolation } from './isUniqueViolation';
import type { AnyDatabase } from './AnyDatabase';

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values({ id: 'a', name: 'Taken' });
}, 30_000);

describe('isUniqueViolation', () => {
  it('knows a duplicate refused by a unique key, through Drizzle’s wrapper', async () => {
    const thrown = await db
      .insert(PLAYGROUND)
      .values({ id: 'b', name: 'Taken' })
      .then(
        () => null,
        (error: Error) => error,
      );

    expect(isUniqueViolation(thrown)).toBe(true);
  });

  it('gives up on a chain of causes too deep to be a driver’s', () => {
    const buried = { cause: { cause: { cause: { cause: { cause: { errno: 1062 } } } } } };

    expect(isUniqueViolation({ cause: { errno: 1062 } })).toBe(true);
    expect(isUniqueViolation(buried)).toBe(false);
  });

  it('does not mistake another failure for one', async () => {
    const thrown = await db
      .execute(sql`insert into ${PLAYGROUND} (${sql.identifier('id')}) values ('c')`)
      .then(
        () => null,
        (error: Error) => error,
      );

    expect(thrown).not.toBeNull();
    expect(isUniqueViolation(thrown)).toBe(false);
    expect(isUniqueViolation(new Error('the network went away'))).toBe(false);
    expect(isUniqueViolation({ code: '23503' })).toBe(false);
    expect(isUniqueViolation({ errno: 1452 })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
