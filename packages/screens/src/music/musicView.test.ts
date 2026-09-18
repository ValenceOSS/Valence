import { describe, expect, it } from 'vitest';
import { readMusicView, writeMusicView } from './musicView';
import type { MusicView } from './musicView';

const ID = '00000000-0000-4000-8000-000000000001';

describe('musicView', () => {
  it('opens on the front page where nothing is said', () => {
    expect(readMusicView(null)).toEqual({ kind: 'home' });
    expect(readMusicView('')).toEqual({ kind: 'home' });
  });

  it.each<MusicView>([
    { kind: 'album', id: ID },
    { kind: 'artist', id: ID },
    { kind: 'playlist', id: ID },
    { kind: 'liked' },
    { kind: 'lyrics' },
    { kind: 'search', query: 'sleep token' },
  ])('reads back what it wrote for $kind', (view) => {
    expect(readMusicView(writeMusicView(view))).toEqual(view);
  });

  it('writes nothing for the front page', () => {
    expect(writeMusicView({ kind: 'home' })).toBeNull();
  });

  it('keeps a colon inside what was searched for', () => {
    expect(readMusicView('search:intro: part 1')).toEqual({
      kind: 'search',
      query: 'intro: part 1',
    });
  });

  it('opens the front page for something it does not know', () => {
    expect(readMusicView('podcast:1')).toEqual({ kind: 'home' });
    expect(readMusicView('album:')).toEqual({ kind: 'home' });
  });

  it('reads and writes the pages of the library', () => {
    for (const kind of ['albums', 'artists', 'playlists'] as const) {
      expect(readMusicView(writeMusicView({ kind }))).toEqual({ kind });
    }
  });
});
