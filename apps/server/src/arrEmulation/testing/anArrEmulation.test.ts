import { describe, expect, it } from 'vitest';
import { anArrEmulation, SEERR_KEY } from './anArrEmulation';

describe('anArrEmulation', () => {
  it('is turned on, with a known key', async () => {
    await expect(anArrEmulation().emulation.readLink()).resolves.toMatchObject({
      isEnabled: true,
      apiKey: SEERR_KEY,
    });
  });

  it('keeps every ask made of it', async () => {
    const { emulation, asks } = anArrEmulation({
      ask: () => Promise.resolve({ kind: 'refused', status: 400, message: 'No.' }),
    });
    const asked = {
      kind: 'film',
      tmdbId: 1,
      seasons: null,
      profileId: undefined,
      libraryId: undefined,
    } as const;

    await emulation.ask(asked);

    expect(asks).toEqual([asked]);
  });
});
