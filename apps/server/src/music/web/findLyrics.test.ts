import { describe, expect, it, vi } from 'vitest';
import { findLyrics } from './findLyrics';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from './createMusicWeb';

const SONG = {
  title: 'Caramel',
  artistName: 'Sleep Token',
  albumTitle: 'Even In Arcadia',
  durationSeconds: 290.4,
};

const answering = (answer: JsonValue | null) => {
  const web = {
    json: vi.fn((): Promise<JsonValue | null> => Promise.resolve(answer)),
    bytes: vi.fn((): Promise<Uint8Array | null> => Promise.resolve(null)),
  };

  return web satisfies MusicWeb;
};

describe('findLyrics', () => {
  it('takes the timed words over the plain ones', async () => {
    const web = answering({ syncedLyrics: '[00:01.00]Hello', plainLyrics: 'Hello' });

    expect(await findLyrics(web, SONG)).toBe('[00:01.00]Hello');
    expect(web.json).toHaveBeenCalledWith(
      'https://lrclib.net/api/get?artist_name=Sleep+Token&track_name=Caramel&album_name=Even+In+Arcadia&duration=290',
    );
  });

  it('takes plain words where nobody has timed them', async () => {
    expect(await findLyrics(answering({ syncedLyrics: null, plainLyrics: 'Hello' }), SONG)).toBe(
      'Hello',
    );
  });

  it('finds nothing for a song it does not know', async () => {
    expect(await findLyrics(answering(null), SONG)).toBeNull();
    expect(await findLyrics(answering({ syncedLyrics: null, plainLyrics: ' ' }), SONG)).toBeNull();
  });
});
