import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { aStreamOffer } from '@ValenceClient/testing/aStreamOffer';
import { fetchStreamOffers } from './fetchStreamOffers';
import { fetchStreamedLibrary } from './fetchStreamedLibrary';
import { playStream } from './playStream';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('reading and playing streams', () => {
  it('reads what can play a film, asking every source again when told to', async () => {
    const fetchMock = aServerAnswering({ offers: [aStreamOffer()], problems: [] });

    expect((await fetchStreamOffers(603)).offers).toHaveLength(1);
    await fetchStreamOffers(603, true);
    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      '/api/streams/films/603',
      '/api/streams/films/603?fresh=true',
    ]);
  });

  it('reads the hidden library streamed films are kept in', async () => {
    aServerAnswering({ libraryId: 'streamed-library' });

    expect(await fetchStreamedLibrary()).toBe('streamed-library');
  });

  it('plays an offer, or says how far its source has got', async () => {
    const fetchMock = aServerAnswering({ kind: 'ready', mediaId: 'm1' });

    expect(await playStream('offer-1')).toEqual({ kind: 'ready', mediaId: 'm1' });
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ streamId: 'offer-1' }));

    aServerAnswering({ kind: 'preparing', progress: 0.4 });

    expect(await playStream('offer-1')).toEqual({ kind: 'preparing', progress: 0.4 });
  });

  it('reads why an offer would not play, the problem a player shows, and whether it has gone', async () => {
    aServerAnswering(
      {
        error: 'Example files says its account has reached a limit.',
        code: 'x',
        values: {},
        problem: 'sourceLimit',
      },
      409,
    );

    expect(await playStream('offer-1')).toEqual({
      kind: 'refused',
      message: 'Example files says its account has reached a limit.',
      problem: 'sourceLimit',
      isGone: false,
      isForbidden: false,
    });

    aServerAnswering({ error: 'That stream is no longer offered.', code: 'x', values: {} }, 410);

    expect(await playStream('offer-1')).toMatchObject({ problem: null, isGone: true });

    aServerAnswering({ error: 'This film is above your age.', code: 'x', values: {} }, 403);

    expect(await playStream('offer-1')).toMatchObject({ isGone: false, isForbidden: true });
  });

  it('says the server could not be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    expect(await playStream('offer-1')).toMatchObject({ kind: 'refused', problem: 'unreachable' });
  });
});
