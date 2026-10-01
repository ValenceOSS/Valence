import { describe, expect, it } from 'vitest';
import { aVisibilityPlayground } from './aVisibilityPlayground';

const STARTING_POSTGRES_MS = 60_000;

describe('aVisibilityPlayground', () => {
  it(
    'holds every item and library, kept by a condition of nothing',
    async () => {
      const { itemsKeptBy, librariesKeptBy } = await aVisibilityPlayground();

      expect(await itemsKeptBy(() => undefined)).toHaveLength(7);
      expect(await librariesKeptBy(() => undefined)).toStrictEqual([
        'films',
        'kids',
        'locked',
        'music',
      ]);
    },
    STARTING_POSTGRES_MS,
  );
});
