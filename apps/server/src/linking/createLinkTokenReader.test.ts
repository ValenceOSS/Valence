import { describe, expect, it } from 'vitest';
import { createLinkTokenReader } from './createLinkTokenReader';
import { makeServerKey } from './makeServerKey';
import { signLinkToken } from './signLinkToken';
import { PublicServerKeySchema } from '@ValenceContracts/schemas/LinkedServer';

const ANIME = makeServerKey();

const OTHER = makeServerKey();

/**
 * A reader for Films, which knows Anime's key.
 *
 * @param now - The clock.
 * @returns The reader.
 */
const filmsReading = (now = Date.now) =>
  createLinkTokenReader({
    me: () => Promise.resolve('films'),
    keyOf: (fingerprint) =>
      Promise.resolve(
        fingerprint === 'anime' ? PublicServerKeySchema.parse(JSON.parse(ANIME.publicKey)) : null,
      ),
    now,
  });

describe('createLinkTokenReader', () => {
  it('believes a token signed by the key it knows, once', async () => {
    const read = filmsReading();
    const token = await signLinkToken({ from: 'anime', to: 'films', privateKey: ANIME.privateKey });

    expect(await read(token)).toBe('anime');
    expect(await read(token)).toBeNull();
  });

  it('refuses a token signed by another key, meant for another server, or from nobody it knows', async () => {
    const read = filmsReading();

    expect(
      await read(await signLinkToken({ from: 'anime', to: 'films', privateKey: OTHER.privateKey })),
    ).toBeNull();
    expect(
      await read(await signLinkToken({ from: 'anime', to: 'music', privateKey: ANIME.privateKey })),
    ).toBeNull();
    expect(
      await read(await signLinkToken({ from: 'music', to: 'films', privateKey: OTHER.privateKey })),
    ).toBeNull();
    expect(await read('not-a-token')).toBeNull();
  });

  it('refuses a token gone stale', async () => {
    const token = await signLinkToken({ from: 'anime', to: 'films', privateKey: ANIME.privateKey });
    const later = Date.now() + 5 * 60 * 1000;

    expect(await filmsReading(() => later)(token)).toBeNull();
  });
});
