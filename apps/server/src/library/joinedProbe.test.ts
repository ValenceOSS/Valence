import { describe, expect, it } from 'vitest';
import { joinedProbe } from './joinedProbe';
import type { MediaProbe } from '@ValenceServer/transcoder/TranscoderClient';

const aPart = (durationSeconds: number, change: Partial<MediaProbe> = {}): MediaProbe => ({
  container: 'mkv',
  durationSeconds,
  bitrateKbps: 4000,
  video: {
    index: 0,
    codec: 'h264',
    codecTag: null,
    width: 1280,
    height: 720,
    range: 'SDR',
    rangeBase: null,
    bitrateKbps: null,
    bitDepth: 8,
    level: null,
    frameRate: 23.976,
    isInterlaced: false,
    refFrames: null,
    pixelAspect: null,
    rotationDegrees: null,
  },
  audioStreams: [
    {
      index: 1,
      codec: 'aac',
      channels: 2,
      sampleRate: 48000,
      profile: null,
      language: 'eng',
      title: null,
      isDefault: true,
      isAtmos: false,
    },
  ],
  chapters: [{ title: 'Opening', startSeconds: 0, endSeconds: 60 }],
  subtitleStreams: [],
  ...change,
});

describe('joinedProbe', () => {
  it('adds the parts’ lengths up and moves each part’s chapters on past the parts before it', () => {
    const joined = joinedProbe([aPart(3000), aPart(2400)]);

    expect(joined?.durationSeconds).toBe(5400);
    expect(joined?.chapters).toEqual([
      { title: 'Opening', startSeconds: 0, endSeconds: 60 },
      { title: 'Opening', startSeconds: 3000, endSeconds: 3060 },
    ]);
    expect(joined?.video?.codec).toBe('h264');
  });

  it('joins nothing whose parts have different pictures or tracks', () => {
    const first = aPart(3000);

    expect(
      joinedProbe([first, aPart(2400, { video: first.video && { ...first.video, width: 1920 } })]),
    ).toBeNull();
    expect(joinedProbe([first, aPart(2400, { audioStreams: [] })])).toBeNull();
    expect(
      joinedProbe([
        first,
        aPart(2400, {
          subtitleStreams: [
            {
              index: 2,
              format: 'subrip',
              language: 'eng',
              title: null,
              isDefault: false,
              isForced: false,
              isImageBased: false,
            },
          ],
        }),
      ]),
    ).toBeNull();
  });

  it('joins nothing whose parts run at different speeds or have their tracks in other languages', () => {
    const first = aPart(3000);

    expect(
      joinedProbe([
        first,
        aPart(2400, { video: first.video && { ...first.video, frameRate: 25 } }),
      ]),
    ).toBeNull();
    expect(
      joinedProbe([
        first,
        aPart(2400, {
          audioStreams: first.audioStreams.map((stream) => ({ ...stream, language: 'fre' })),
        }),
      ]),
    ).toBeNull();
    expect(
      joinedProbe([
        first,
        aPart(2400, {
          video: first.video && { ...first.video, frameRate: (first.video.frameRate ?? 0) + 1e-6 },
        }),
      ])?.durationSeconds,
    ).toBe(5400);
  });

  it('joins parts whose tracks differ only in what they are called', () => {
    const first = aPart(3000);
    const renamed = aPart(2400, {
      audioStreams: first.audioStreams.map((stream) => ({ ...stream, title: 'Stereo' })),
    });

    expect(joinedProbe([first, renamed])?.durationSeconds).toBe(5400);
  });

  it('describes nothing where there is no part', () => {
    expect(joinedProbe([])).toBeNull();
  });
});
