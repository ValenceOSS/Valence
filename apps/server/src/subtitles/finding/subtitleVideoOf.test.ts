import { describe, expect, it } from 'vitest';
import { subtitleVideoOf } from './subtitleVideoOf';

const FILE = {
  path: '/films/A Film (2020)/A Film (2020) WEBDL-1080p.mkv',
  isEpisode: false,
  season: null,
  episode: null,
  frameRate: 23.976,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  audioCodec: 'eac3',
  audioProfile: null,
};

describe('subtitleVideoOf', () => {
  it('reads the release from the file’s name, and what it leaves out from the probe', () => {
    expect(subtitleVideoOf(FILE)).toMatchObject({
      kind: 'movie',
      parts: { source: 'webdl', resolution: '1080p', videoCodec: 'h264', audioCodec: 'eac3' },
      frameRate: 23.976,
    });
  });

  it('keeps what the name says over the probe', () => {
    expect(
      subtitleVideoOf({ ...FILE, path: '/films/A.Film.2020.720p.WEB.x265-GROUP.mkv' }).parts,
    ).toMatchObject({ resolution: '720p', videoCodec: 'h265', group: 'group' });
  });

  it('names a widescreen picture by its width, and the probe’s codecs as release names do', () => {
    expect(
      subtitleVideoOf({
        ...FILE,
        path: '/films/A Film.mkv',
        width: 3840,
        height: 1608,
        videoCodec: 'hevc',
        audioCodec: 'dts',
        audioProfile: 'DTS-HD MA',
      }).parts,
    ).toMatchObject({ resolution: '2160p', videoCodec: 'h265', audioCodec: 'dtsHdMa' });
  });

  it('reads the release the file came from first, where it is known', () => {
    expect(
      subtitleVideoOf({ ...FILE, release: 'A.Film.2020.1080p.WEB-DL.DDP5.1.H.264-EGEN' }).parts,
    ).toMatchObject({ group: 'egen', source: 'webdl', audioCodec: 'eac3' });
  });

  it('is an episode where the file is one', () => {
    expect(subtitleVideoOf({ ...FILE, isEpisode: true, season: 1, episode: 2 })).toMatchObject({
      kind: 'episode',
      season: 1,
      episode: 2,
    });
  });
});
