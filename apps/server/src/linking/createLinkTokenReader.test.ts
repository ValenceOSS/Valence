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

    expect(await read(token)).toEqual({ from: 'anime', person: null });
    expect(await read(token)).toBeNull();
  });

  it('believes a token once even when it arrives twice at the same moment', async () => {
    const read = filmsReading();
    const token = await signLinkToken({ from: 'anime', to: 'films', privateKey: ANIME.privateKey });

    const answers = await Promise.all([read(token), read(token), read(token)]);

    expect(answers.filter((one) => one !== null)).toHaveLength(1);
  });

  it('believes a token signed for one request only for that request', async () => {
    const asking = { method: 'GET', route: '/catalogue/films?after=abc' };
    const sign = () =>
      signLinkToken({ from: 'anime', to: 'films', privateKey: ANIME.privateKey, asking });

    expect(
      await filmsReading()(await sign(), { method: 'GET', route: '/catalogue/films' }),
    ).toEqual({ from: 'anime', person: null });
    expect(
      await filmsReading()(await sign(), { method: 'GET', route: '/api/playback/x/file' }),
    ).toBeNull();
    expect(
      await filmsReading()(await sign(), { method: 'POST', route: '/catalogue/films' }),
    ).toBeNull();
    expect(await filmsReading()(await sign())).toBeNull();
  });

  it('believes a token from a server too old to bind it, for any request', async () => {
    const token = await signLinkToken({ from: 'anime', to: 'films', privateKey: ANIME.privateKey });

    expect(await filmsReading()(token, { method: 'POST', route: '/unlink' })).toEqual({
      from: 'anime',
      person: null,
    });
  });

  it('does not spend a token on a request it was not signed for', async () => {
    const read = filmsReading();
    const token = await signLinkToken({
      from: 'anime',
      to: 'films',
      privateKey: ANIME.privateKey,
      asking: { method: 'GET', route: '/libraries' },
    });

    expect(await read(token, { method: 'POST', route: '/unlink' })).toBeNull();
    expect(await read(token, { method: 'GET', route: '/libraries' })).not.toBeNull();
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

  it('says which of the other server’s people a token asks for, by pseudonym and name', async () => {
    const read = filmsReading();
    const sign = (person: { pseudonym: string; name: string | null }) =>
      signLinkToken({ from: 'anime', to: 'films', privateKey: ANIME.privateKey, person });

    expect(await read(await sign({ pseudonym: 'p1', name: 'Sam' }))).toEqual({
      from: 'anime',
      person: { pseudonym: 'p1', name: 'Sam' },
    });
    expect(await read(await sign({ pseudonym: 'p2', name: null }))).toEqual({
      from: 'anime',
      person: { pseudonym: 'p2', name: null },
    });
    expect(await read(await sign({ pseudonym: 'p'.repeat(65), name: null }))).toBeNull();
  });

  it('refuses a token gone stale', async () => {
    const token = await signLinkToken({ from: 'anime', to: 'films', privateKey: ANIME.privateKey });
    const later = Date.now() + 5 * 60 * 1000;

    expect(await filmsReading(() => later)(token)).toBeNull();
  });
});
