import { describe, expect, it } from 'vitest';
import { mediaItem } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aLibraryToImportInto } from './aLibraryToImportInto';

describe('aLibraryToImportInto', { timeout: 60_000 }, () => {
  it('holds the films, episodes and song the recorded sources hold', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const items = await db.select({ id: mediaItem.id }).from(mediaItem);

    expect(items.map((item) => item.id).sort()).toEqual([
      'film',
      'heat',
      'unfinished',
      'wire-101',
      'wire-102',
    ]);
  });
});
