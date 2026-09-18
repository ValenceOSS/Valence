import { describe, expect, it } from 'vitest';
import { renditionFor } from './renditionFor';
import type { TrackFile } from './MusicService';

const FLAC: TrackFile = {
  path: '/music/a.flac',
  codec: 'flac',
  container: 'flac',
  isLossless: true,
  bitrateKbps: 1492,
};

const MP3: TrackFile = {
  path: '/music/a.mp3',
  codec: 'mpeg 1 layer 3',
  container: 'mpeg',
  isLossless: false,
  bitrateKbps: 192,
};

describe('renditionFor', () => {
  it('sends the file as it is for lossless', () => {
    expect(renditionFor(FLAC, 'lossless')).toEqual({ kind: 'original' });
  });

  it('encodes a lossless file down to the bitrate chosen', () => {
    expect(renditionFor(FLAC, 'high')).toEqual({ kind: 'encoded', kbps: 320 });
    expect(renditionFor(FLAC, 'normal')).toEqual({ kind: 'encoded', kbps: 160 });
    expect(renditionFor(FLAC, 'low')).toEqual({ kind: 'encoded', kbps: 96 });
  });

  it('does not encode a lossy file again to a bitrate no smaller than it already is', () => {
    expect(renditionFor(MP3, 'high')).toEqual({ kind: 'original' });
  });

  it('encodes a lossy file down where that saves something', () => {
    expect(renditionFor(MP3, 'low')).toEqual({ kind: 'encoded', kbps: 96 });
  });

  it('encodes a lossy file of unknown bitrate rather than guess it is small', () => {
    expect(renditionFor({ ...MP3, bitrateKbps: null }, 'high')).toEqual({
      kind: 'encoded',
      kbps: 320,
    });
  });
});
