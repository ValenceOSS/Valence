import { describe, expect, it, vi } from 'vitest';
import { findArtistLooks, youtubeIdIn } from './findArtistLooks';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from './createMusicWeb';

const FACE = new Uint8Array([1]);

const aWeb = (answers: Record<string, JsonValue>) => {
  const web = {
    json: vi.fn((url: string) =>
      Promise.resolve(Object.entries(answers).find(([part]) => url.includes(part))?.[1] ?? null),
    ),
    bytes: vi.fn((): Promise<Uint8Array | null> => Promise.resolve(FACE)),
  };

  return web satisfies MusicWeb;
};

describe('findArtistLooks', () => {
  it('finds the artist’s photograph and their videos', async () => {
    const web = aWeb({
      'search.php': {
        artists: [
          { idArtist: '111', strArtist: 'Sleep Token', strArtistThumb: 'https://img/1.jpg' },
        ],
      },
      'mvid.php': {
        mvids: [
          { strTrack: 'Caramel', strMusicVid: 'https://www.youtube.com/watch?v=abcdefghijk' },
          { strTrack: 'Nothing', strMusicVid: null },
        ],
      },
    });

    expect(await findArtistLooks(web, '123', 'Sleep Token')).toEqual({
      picture: FACE,
      videos: [{ title: 'Caramel', youtubeId: 'abcdefghijk' }],
    });
    expect(web.bytes).toHaveBeenCalledWith('https://img/1.jpg');
  });

  it('takes nobody whose name is not the one asked for', async () => {
    const web = aWeb({
      'search.php': {
        artists: [{ idArtist: '1', strArtist: 'Sleep Token Tribute', strArtistThumb: 'x' }],
      },
    });

    expect(await findArtistLooks(web, '123', 'Sleep Token')).toEqual({ picture: null, videos: [] });
  });

  it('finds nothing for an artist the site has never heard of', async () => {
    expect(await findArtistLooks(aWeb({ 'search.php': { artists: null } }), '123', 'x')).toEqual({
      picture: null,
      videos: [],
    });
  });
});

describe('youtubeIdIn', () => {
  it('reads a video however the link is written', () => {
    expect(youtubeIdIn('https://www.youtube.com/watch?v=abcdefghijk')).toBe('abcdefghijk');
    expect(youtubeIdIn('https://youtu.be/abcdefghijk')).toBe('abcdefghijk');
    expect(youtubeIdIn('https://www.youtube.com/embed/abcdefghijk')).toBe('abcdefghijk');
    expect(youtubeIdIn('https://vimeo.com/1')).toBeNull();
  });
});
