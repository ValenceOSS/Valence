import { describe, expect, it, vi } from 'vitest';
import { aLinkedAskerAnswering } from '@ValenceServer/testing/aLinkedAskerAnswering';
import { NO_SUBTITLE_FINDER } from '@ValenceServer/subtitles/finding/NO_SUBTITLE_FINDER';
import { createLinkedSubtitleFinder } from './createLinkedSubtitleFinder';
import type { SubtitleFinder } from '@ValenceServer/subtitles/finding/SubtitleFinder';

const READY = { state: 'ready', sites: ['subdl'], languages: ['en'], server: null };

const aLocal = (): SubtitleFinder => ({
  ...NO_SUBTITLE_FINDER,
  finding: vi.fn(() =>
    Promise.resolve({ state: 'ready' as const, sites: [], languages: [], server: null }),
  ),
  search: vi.fn(() => Promise.resolve({ subtitles: [], isSetUp: true })),
  fetch: vi.fn(() => Promise.resolve({ kind: 'fetched' as const, name: 'here.srt' })),
});

const linkedTitleOf = (mediaId: string) =>
  Promise.resolve(mediaId === 'theirs' ? { serverId: 'films', remoteId: 'r1' } : null);

const nameOf = () => Promise.resolve('Films');

/**
 * A finder over a linked server that answers every question the same way.
 *
 * @param answer - What the linked server answers, or nothing where it cannot be reached.
 * @returns The finder, and what was asked of the linked server.
 */
const answering = (answer: () => Response | null) => {
  const asker = aLinkedAskerAnswering(answer);

  return { asker, finder: createLinkedSubtitleFinder(aLocal(), linkedTitleOf, asker, nameOf) };
};

describe('createLinkedSubtitleFinder', () => {
  it('finds this server’s own titles’ subtitles as it always has', async () => {
    const local = aLocal();
    const { asker } = answering(() => null);
    const finder = createLinkedSubtitleFinder(local, linkedTitleOf, asker, nameOf);

    await finder.search('mine', 'en');
    await finder.fetch('mine', { source: 'subdl', id: 'x', language: 'en' });

    expect(local.search).toHaveBeenCalledWith('mine', 'en');
    expect(local.fetch).toHaveBeenCalled();
    expect(asker.asked).toEqual([]);
  });

  it('asks the server with the file whether it can search, and names it', async () => {
    const { asker, finder } = answering(() => Response.json(READY));

    expect(await finder.finding('theirs')).toEqual({ ...READY, server: 'Films' });
    expect(asker.asked[0]?.route).toBe('/api/media/r1/subtitles/finding');
  });

  it.each([
    ['refuses it', 403, 'notAllowed'],
    ['is too old to know the question', 404, 'notSupported'],
    ['cannot be reached', null, 'unreachable'],
    ['fails in itself', 502, 'unreachable'],
    ['is being asked too often', 429, 'unreachable'],
  ] as const)('says why not where the linked server %s', async (_, status, state) => {
    const { finder } = answering(() =>
      status === null ? null : Response.json({ error: 'no', code: null }, { status }),
    );

    expect(await finder.finding('theirs')).toEqual({
      state,
      sites: [],
      languages: [],
      server: 'Films',
    });
  });

  it('searches on the server with the file, in the language asked for', async () => {
    const { asker, finder } = answering(() => Response.json({ subtitles: [], isSetUp: true }));

    expect(await finder.search('theirs', 'fr')).toEqual({ subtitles: [], isSetUp: true });
    expect(asker.asked[0]?.route).toBe('/api/media/r1/subtitles/found?language=fr');
  });

  it('fetches on the server with the file, which keeps it', async () => {
    const { asker, finder } = answering(() => Response.json({ name: 'Arrival.fr.srt' }));
    const choice = { source: 'subdl' as const, id: 'x', language: 'fr' };

    expect(await finder.fetch('theirs', choice)).toEqual({
      kind: 'fetched',
      name: 'Arrival.fr.srt',
    });
    expect(asker.asked[0]?.asking.method).toBe('POST');
    expect(asker.asked[0]?.route).toBe('/api/media/r1/subtitles/found');
  });

  it('says a fetch was not allowed where the linked server turned it off', async () => {
    const { finder } = answering(() =>
      Response.json(
        { error: 'no', code: 'error.linking.yourServerMayNotFindSubtitlesHere' },
        { status: 403 },
      ),
    );

    expect(await finder.fetch('theirs', { source: 'subdl', id: 'x', language: 'fr' })).toEqual({
      kind: 'notAllowed',
    });
  });
});
