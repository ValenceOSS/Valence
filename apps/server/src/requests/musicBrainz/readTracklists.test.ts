import { describe, expect, it, vi } from 'vitest';
import { readTracklists } from './readTracklists';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

/**
 * A release with discs of the recordings given, in the release group given.
 */
const aRelease = (group: string, ...discs: string[][]) => ({
  id: `${group}-${discs.flat().length.toString()}`,
  'release-group': { id: group },
  media: discs.map((recordings) => ({
    'track-count': recordings.length,
    tracks: recordings.map((id) => ({ title: `Track ${id}`, length: 61_000, recording: { id } })),
  })),
});

/**
 * A way out to the web that answers each page from the list given, in turn.
 */
const aWeb = (pages: readonly JsonValue[]) => {
  const json = vi.fn((_url: string): Promise<JsonValue | null> => Promise.resolve(null));

  for (const page of pages) {
    json.mockResolvedValueOnce(page);
  }

  return { json, bytes: vi.fn(), text: vi.fn() } satisfies MusicWeb;
};

describe('readTracklists', () => {
  it('keeps the longest edition of each release group, across pages', async () => {
    const web = aWeb([
      {
        'release-count': 101,
        releases: [aRelease('album', ['a', 'b']), aRelease('single', ['a'])],
      },
      { 'release-count': 101, releases: [aRelease('album', ['a', 'b'], ['c'])] },
    ]);

    const read = await readTracklists(web, { artist: 'an-artist' });

    expect(read.get('album')).toEqual({
      trackCount: 3,
      recordings: ['a', 'b', 'c'],
      tracks: [
        { title: 'Track a', seconds: 61 },
        { title: 'Track b', seconds: 61 },
        { title: 'Track c', seconds: 61 },
      ],
    });
    expect(read.get('single')).toEqual({
      trackCount: 1,
      recordings: ['a'],
      tracks: [{ title: 'Track a', seconds: 61 }],
    });
    expect(web.json.mock.calls[0]?.[0]).toContain('release?artist=an-artist&status=official');
    expect(web.json.mock.calls[1]?.[0]).toContain('offset=100');
  });

  it('reads one release group, and nothing where MusicBrainz does not answer', async () => {
    expect(
      (
        await readTracklists(aWeb([{ 'release-count': 1, releases: [aRelease('g', ['x'])] }]), {
          releaseGroup: 'g',
        })
      ).get('g')?.trackCount,
    ).toBe(1);
    expect((await readTracklists(aWeb([]), { releaseGroup: 'g' })).size).toBe(0);
  });
});
