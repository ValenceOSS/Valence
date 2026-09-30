import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { jsonAsText } from './jsonAsText';
import type { AnyDatabase } from './AnyDatabase';

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values({ id: 'a', name: 'Text', tags: ['one'] });
}, 30_000);

describe('jsonAsText', () => {
  it('reads a JSON column as its text', async () => {
    const [row] = await db.select({ text: jsonAsText(PLAYGROUND.tags) }).from(PLAYGROUND);

    expect(JSON.parse(row?.text ?? 'null')).toEqual(['one']);
  });
});
