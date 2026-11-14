import { describe, expect, it } from 'vitest';
import { createJellyfinBrowsing } from './createJellyfinBrowsing';
import { createJellyfinIds } from './createJellyfinIds';
import { ItemsQuerySchema } from './JellyfinRequests';
import { aJellyfinBackend } from './testing/aJellyfinBackend';
import { aJellyfinCaller } from './testing/aJellyfinCaller';

/**
 * Browsing over the stand-in for Valence.
 *
 * @returns Browsing and the stand-in.
 */
const browsingOf = () => {
  const made = aJellyfinBackend();

  return {
    ...made,
    browsing: createJellyfinBrowsing(made.backend, createJellyfinIds(made.backend)),
  };
};

describe('createJellyfinBrowsing', () => {
  it('lists the views when nothing narrower is asked for', async () => {
    const { browsing } = browsingOf();
    const listed = await browsing.items(aJellyfinCaller(), ItemsQuerySchema.parse({}));

    expect(listed.Items.map((one) => one.Type)).toEqual(['CollectionFolder', 'CollectionFolder']);
  });

  it('keeps only what a filter asks for', async () => {
    const { browsing, backend, film } = browsingOf();
    const caller = aJellyfinCaller();

    await backend.recordProgress(caller, film.id, { positionSeconds: 7000, durationSeconds: 7560 });

    const played = await browsing.items(
      caller,
      ItemsQuerySchema.parse({
        recursive: 'true',
        includeitemtypes: 'Movie,Episode',
        isplayed: 'true',
      }),
    );
    const unplayed = await browsing.items(
      caller,
      ItemsQuerySchema.parse({
        recursive: 'true',
        includeitemtypes: 'Movie,Episode',
        filters: 'IsUnplayed',
      }),
    );

    expect(played.Items.map((one) => one.Name)).toEqual(['Sneakers']);
    expect(unplayed.TotalRecordCount).toBe(2);
  });

  it('orders newest first where asked', async () => {
    const { browsing } = browsingOf();
    const listed = await browsing.items(
      aJellyfinCaller(),
      ItemsQuerySchema.parse({
        recursive: 'true',
        includeitemtypes: 'Movie,Series',
        sortby: 'DateCreated',
        sortorder: 'Descending',
      }),
    );

    expect(listed.Items.map((one) => one.Name)).toEqual(['Twin Peaks', 'Sneakers']);
  });

  it('reads nothing under an identifier that is nothing here', async () => {
    const { browsing } = browsingOf();

    expect(
      (
        await browsing.items(
          aJellyfinCaller(),
          ItemsQuerySchema.parse({ parentid: 'f'.repeat(32) }),
        )
      ).TotalRecordCount,
    ).toBe(0);
    expect(await browsing.seasons(aJellyfinCaller(), 'f'.repeat(32))).toBeNull();
  });
});
