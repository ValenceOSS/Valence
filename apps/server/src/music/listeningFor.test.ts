import { describe, expect, it } from 'vitest';
import { listeningFor } from './listeningFor';
import type { MusicNowPlaying } from '@ValenceContracts/schemas/MusicRemote';

const NOW_PLAYING: MusicNowPlaying = {
  trackId: '00000000-0000-4000-8000-000000000001',
  title: 'Caramel',
  artists: ['Sleep Token'],
  albumId: '00000000-0000-4000-8000-000000000002',
  hasArtwork: true,
  positionSeconds: 42,
  durationSeconds: 290,
  isPlaying: true,
  volume: 0.8,
  isMuted: false,
  quality: 'lossless',
  upNext: [],
  reportedAtMs: 1,
};

const FLAC = {
  path: '/music/caramel.flac',
  codec: 'flac',
  container: 'flac',
  isLossless: true,
  bitrateKbps: 1492,
};

describe('listeningFor', () => {
  it('says a lossless song is going to the device as the file it is', () => {
    expect(listeningFor(NOW_PLAYING, FLAC)).toMatchObject({
      title: 'Caramel',
      delivery: 'direct',
      codec: 'flac',
      kbps: 1492,
      positionSeconds: 42,
    });
  });

  it('says a lower quality is an encode, at the bitrate it is made at', () => {
    expect(listeningFor({ ...NOW_PLAYING, quality: 'low' }, FLAC)).toMatchObject({
      quality: 'low',
      delivery: 'encoded',
      codec: 'aac',
      kbps: 96,
    });
  });

  it('says what it can where the file could not be read', () => {
    expect(listeningFor(NOW_PLAYING, null)).toMatchObject({
      delivery: 'direct',
      codec: null,
      kbps: null,
    });
  });
});
