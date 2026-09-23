import { songItem } from '@ValenceTv/music/songItem';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

const ALBUM_ID = '00000000-0000-4000-8000-000000000002';

const TRACK: MusicTrack = {
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-000000000003',
  title: 'The Summoning',
  artists: [
    { id: '00000000-0000-4000-8000-000000000004', name: 'Sleep Token' },
    { id: '00000000-0000-4000-8000-000000000005', name: 'Vessel' },
  ],
  album: { id: ALBUM_ID, title: 'Take Me Back To Eden', hasArtwork: true },
  discNumber: 1,
  trackNumber: 3,
  durationSeconds: 395,
  codec: 'flac',
  isLossless: true,
  isExplicit: false,
  bitDepth: 16,
  sampleRate: 44_100,
  bitrateKbps: null,
  hasLyrics: false,
  videoKey: null,
  isFavourite: false,
};

describe('songItem', () => {
  it('names the song and everybody on it, and opens its album', () => {
    expect(songItem(TRACK)).toEqual({
      kind: 'song',
      id: TRACK.id,
      title: 'The Summoning',
      detail: 'Sleep Token, Vessel',
      art: `/api/music/albums/${ALBUM_ID}/artwork`,
      view: { kind: 'album', id: ALBUM_ID },
    });
  });

  it('has no picture where its album has no cover', () => {
    expect(songItem({ ...TRACK, album: { ...TRACK.album, hasArtwork: false } }).art).toBeNull();
  });
});
