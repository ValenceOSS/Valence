import { describe, expect, it, vi } from 'vitest';
import {
  combineCredits,
  createCreditsSegmentProvider,
  endWindowFor,
} from './createCreditsSegmentProvider';
import { aTranscoder } from '@ValenceServer/testing/aTranscoder';
import type { SegmentCandidate } from './SegmentProvider';
import type { CreditFrame, CreditFramesRequest } from '@ValenceServer/transcoder/TranscoderClient';
import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';

const RUNS = 2195;

const scene = (seconds: number): CreditFrame => ({
  seconds,
  blackPercent: 20,
  yMin: 16,
  yLow: 24,
  yHigh: 120,
  yMax: 230,
  saturation: 9,
});

const lettering = (seconds: number): CreditFrame => ({
  seconds,
  blackPercent: 98,
  yMin: 16,
  yLow: 16,
  yHigh: 16,
  yMax: 245,
  saturation: 0.3,
});

const candidate = (
  mediaId: string,
  chapters: VideoChapter[] = [],
  isCreditsComplete = false,
): SegmentCandidate => ({
  mediaId,
  path: `/media/${mediaId}.mkv`,
  durationSeconds: RUNS,
  isComplete: true,
  isCreditsComplete,
  probe: {
    container: 'mkv',
    durationSeconds: RUNS,
    bitrateKbps: 4000,
    video: null,
    audioStreams: [],
    subtitleStreams: [],
    chapters,
  },
});

/**
 * Reads frames as a film whose credits roll from a second on, keyframes every ten seconds, and
 * every frame of the stretch before them black from half a second after its cut.
 *
 * @param rollsFrom - Where the credits' first keyframe sits.
 * @param cutAt - Where black begins between the keyframes.
 * @returns The frames asked for.
 */
const framesOf =
  (rollsFrom: number, cutAt: number) =>
  (request: CreditFramesRequest): Promise<CreditFrame[]> => {
    if (request.everyFrame === true) {
      const until = request.startSeconds + (request.durationSeconds ?? 0);
      const frames = Array.from(
        { length: Math.floor((until - request.startSeconds) * 2) },
        (_, index) => request.startSeconds + index / 2,
      );

      return Promise.resolve(
        frames.map((seconds) => (seconds >= cutAt ? lettering(seconds) : scene(seconds))),
      );
    }

    const keyframes = Array.from(
      { length: Math.floor((RUNS - request.startSeconds) / 10) },
      (_, index) => request.startSeconds + index * 10,
    );

    return Promise.resolve(
      keyframes.map((seconds) => (seconds >= rollsFrom ? lettering(seconds) : scene(seconds))),
    );
  };

describe('combineCredits', () => {
  it('puts stretches a moment apart together', () => {
    expect(
      combineCredits(
        [
          { startSeconds: 2000, endSeconds: 2100, isChapter: false },
          { startSeconds: 2110, endSeconds: 2190, isChapter: false },
        ],
        RUNS,
      ),
    ).toEqual({ startSeconds: 2000, endSeconds: RUNS });
  });

  it('takes the stretch ending last where two are far apart', () => {
    expect(
      combineCredits(
        [
          { startSeconds: 1500, endSeconds: 1600, isChapter: false },
          { startSeconds: 2100, endSeconds: 2150, isChapter: false },
        ],
        RUNS,
      ),
    ).toEqual({ startSeconds: 2100, endSeconds: 2150 });
  });

  it('never runs past the end of a chapter named for the credits', () => {
    expect(
      combineCredits(
        [
          { startSeconds: 2000, endSeconds: 2100, isChapter: true },
          { startSeconds: 2010, endSeconds: RUNS, isChapter: false },
        ],
        RUNS,
      ),
    ).toEqual({ startSeconds: 2000, endSeconds: 2100 });
  });

  it('finds nothing in nothing, or in a stretch too short to be credits', () => {
    expect(combineCredits([], RUNS)).toBeNull();
    expect(
      combineCredits([{ startSeconds: 1000, endSeconds: 1010, isChapter: false }], RUNS),
    ).toBeNull();
  });
});

describe('endWindowFor', () => {
  it('looks through the last fifteen minutes of a long film', () => {
    expect(endWindowFor(6000, 900)).toEqual({ startSeconds: 5100, durationSeconds: 900 });
  });

  it('looks through no more than the last two fifths of something short', () => {
    expect(endWindowFor(1200, 900)).toEqual({ startSeconds: 720, durationSeconds: 480 });
  });
});

describe('createCreditsSegmentProvider', () => {
  it('finds lettering on black, to the frame the cut falls on', async () => {
    const creditFrames = vi.fn(framesOf(2110, 2112.5));
    const provider = createCreditsSegmentProvider({ transcoder: aTranscoder({ creditFrames }) });

    const found = await provider.detect([candidate('a')]);

    expect(found.get('a')).toEqual([
      { kind: 'credits', startSeconds: 2112.5, endSeconds: RUNS, source: 'fingerprint' },
    ]);
    expect(creditFrames).toHaveBeenCalledWith(
      expect.objectContaining({ startSeconds: 2107, everyFrame: true }),
    );
  });

  it('starts the credits where a chapter named for them begins', async () => {
    const creditFrames = vi.fn(() => Promise.resolve([]));
    const provider = createCreditsSegmentProvider({ transcoder: aTranscoder({ creditFrames }) });

    const found = await provider.detect([
      candidate('a', [
        { title: 'Story', startSeconds: 0, endSeconds: 2050 },
        { title: 'Credits', startSeconds: 2050, endSeconds: RUNS },
      ]),
    ]);

    expect(found.get('a')).toEqual([
      { kind: 'credits', startSeconds: 2050, endSeconds: RUNS, source: 'fingerprint' },
    ]);
  });

  it('starts them a moment before the chapter where the picture shows the cut sooner', async () => {
    const provider = createCreditsSegmentProvider({
      transcoder: aTranscoder({ creditFrames: framesOf(2110, 2112.5) }),
    });

    const found = await provider.detect([
      candidate('a', [
        { title: 'Story', startSeconds: 0, endSeconds: 2117 },
        { title: 'Credits', startSeconds: 2117, endSeconds: RUNS },
      ]),
    ]);

    expect(found.get('a')?.[0]).toMatchObject({ startSeconds: 2112.5, endSeconds: RUNS });
  });

  it('leaves alone what it has looked at before', async () => {
    const creditFrames = vi.fn(framesOf(2110, 2104.5));
    const provider = createCreditsSegmentProvider({ transcoder: aTranscoder({ creditFrames }) });

    await expect(provider.detect([candidate('a', [], true)])).resolves.toEqual(new Map());
    expect(creditFrames).not.toHaveBeenCalled();
  });

  it('says what went wrong with a file and carries on with the rest', async () => {
    const onProblem = vi.fn();
    const creditFrames = vi.fn((request: CreditFramesRequest) =>
      request.inputPath.includes('broken')
        ? Promise.reject(new Error('unreadable'))
        : framesOf(2110, 2104.5)(request),
    );
    const provider = createCreditsSegmentProvider({
      transcoder: aTranscoder({ creditFrames }),
      onProblem,
    });

    const found = await provider.detect([candidate('broken'), candidate('fine')]);

    expect(found.has('fine')).toBe(true);
    expect(found.has('broken')).toBe(false);
    expect(onProblem).toHaveBeenCalledWith(
      '/media/broken.mkv',
      expect.objectContaining({ message: 'unreadable' }),
    );
  });

  it('says it could not answer where no file of the group could be read', async () => {
    const provider = createCreditsSegmentProvider({
      transcoder: aTranscoder({
        creditFrames: () => Promise.reject(new Error('the media service is too old')),
      }),
    });

    await expect(provider.detect([candidate('a'), candidate('b')])).rejects.toThrow('too old');
  });

  it('leaves alone something with no runtime, rather than reading the whole file', async () => {
    const creditFrames = vi.fn(framesOf(2110, 2112.5));
    const provider = createCreditsSegmentProvider({ transcoder: aTranscoder({ creditFrames }) });

    await expect(provider.detect([{ ...candidate('a'), durationSeconds: 0 }])).resolves.toEqual(
      new Map(),
    );
    expect(creditFrames).not.toHaveBeenCalled();
  });

  it('reads every frame of no more than half a minute before the credits to find the cut', async () => {
    const creditFrames = vi.fn((request: CreditFramesRequest) => {
      if (request.everyFrame === true) {
        return framesOf(2190, 2150)(request);
      }

      return Promise.resolve([
        scene(1400),
        lettering(2150),
        lettering(2160),
        lettering(2170),
        lettering(2180),
      ]);
    });
    const provider = createCreditsSegmentProvider({ transcoder: aTranscoder({ creditFrames }) });

    await provider.detect([candidate('a')]);

    expect(creditFrames).toHaveBeenCalledWith(
      expect.objectContaining({ startSeconds: 2120, everyFrame: true }),
    );
  });

  it('listens for an ending a season shares where the picture finds none', async () => {
    const theme = Array.from({ length: 800 }, (_, index) => (index * 2654435761) >>> 0);
    const noise = (seed: number) =>
      Array.from({ length: 6000 }, (_, index) => ((index + seed) * 40503 * (seed + 7)) >>> 0);
    const fingerprint = vi.fn(({ inputPath }: { inputPath: string }) => {
      const seed = Number(inputPath.replace(/\D/gu, ''));

      return Promise.resolve({
        framesPerSecond: 15.625,
        startSeconds: 0,
        hashes: [...noise(seed).slice(0, 4000), ...theme, ...noise(seed + 50).slice(0, 2000)],
      });
    });
    const provider = createCreditsSegmentProvider({
      transcoder: aTranscoder({ creditFrames: () => Promise.resolve([]), fingerprint }),
    });

    const found = await provider.detect([candidate('e1'), candidate('e2'), candidate('e3')]);

    expect(found.get('e1')?.[0]).toMatchObject({ kind: 'credits' });
    expect(fingerprint).toHaveBeenCalled();
  });
});
