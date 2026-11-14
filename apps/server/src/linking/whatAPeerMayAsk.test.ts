import { describe, expect, it } from 'vitest';
import { MediaRequestAskSchema } from '@ValenceContracts/schemas/MediaRequest';
import { whatAPeerMayAsk } from './whatAPeerMayAsk';

describe('whatAPeerMayAsk', () => {
  it('keeps the title and its seasons, asked for plainly', () => {
    const asked = MediaRequestAskSchema.parse({
      kind: 'series',
      tmdbId: 1399,
      seasons: [1, 2],
      followsNewSeasons: false,
      origin: 'monitored',
      isPickedByHand: true,
      libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
      profileId: '3f2504e0-4f89-41d3-9a0c-0305e82c3302',
    });

    expect(whatAPeerMayAsk(asked)).toEqual({
      kind: 'series',
      tmdbId: 1399,
      seasons: [1, 2],
      followsNewSeasons: false,
      isPickedByHand: false,
      origin: 'asked',
    });
  });
});
