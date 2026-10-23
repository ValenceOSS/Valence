import { describe, expect, it, vi } from 'vitest';
import { aTranscoder } from '@ValenceServer/testing/aTranscoder';
import { withJoinedInputs } from './withJoinedInputs';
import type { MediaInput, SessionSpec } from '@ValenceServer/transcoder/TranscoderClient';

const FIRST = '/films/Film - cd1.mkv';

const PARTS = [
  { path: FIRST, durationSeconds: 3000 },
  { path: '/films/Film - cd2.mkv', durationSeconds: 2400 },
];

const partsOf = (path: string) => Promise.resolve(path === FIRST ? PARTS : null);

const partsOfMany = (paths: readonly string[]) =>
  Promise.resolve(new Map(paths.includes(FIRST) ? [[FIRST, PARTS] as const] : []));

const SPEC: SessionSpec = {
  inputPath: FIRST,
  startSeconds: 0,
  segmentSeconds: 4,
  hardwareAccel: 'none',
  video: { kind: 'copy' },
  audio: { kind: 'copy' },
};

describe('withJoinedInputs', () => {
  it('asks for every part of a film wherever its first part is asked for', async () => {
    const asked: MediaInput[] = [];
    const transcoder = withJoinedInputs(
      aTranscoder({
        startSession: (spec, _device, variants) => {
          asked.push(spec.inputPath, ...(variants ?? []).map((variant) => variant.inputPath));

          return Promise.resolve({ id: 's', manifest: 'm', encodesVideo: false, reuse: 'none' });
        },
        readFrame: (request) => {
          asked.push(request.inputPath);

          return Promise.resolve(new ArrayBuffer(0));
        },
        sweepTrickplay: (keep) => {
          asked.push(...keep.map((one) => one.inputPath));

          return Promise.resolve({ removed: 0, freedBytes: 0, kept: 0, tooNew: 0 });
        },
      }),
      partsOf,
      partsOfMany,
    );

    await transcoder.startSession(SPEC, 'device', [SPEC]);
    await transcoder.readFrame({ inputPath: FIRST, atSeconds: 10, width: 320 });
    await transcoder.sweepTrickplay([
      {
        inputPath: FIRST,
        generation: 1,
        intervalSeconds: 10,
        tileWidth: 320,
        columns: 10,
        rows: 10,
      },
    ]);

    expect(asked).toEqual([PARTS, PARTS, PARTS, PARTS]);
  });

  it('finds the parts of everything a sweep keeps at once, rather than one film at a time', async () => {
    const one = vi.fn(partsOf);
    const many = vi.fn(partsOfMany);
    const kept: MediaInput[] = [];
    const transcoder = withJoinedInputs(
      aTranscoder({
        sweepPreviews: (keep) => {
          kept.push(...keep.map((request) => request.inputPath));

          return Promise.resolve({ removed: 0, freedBytes: 0, kept: 0, tooNew: 0 });
        },
      }),
      one,
      many,
    );

    await transcoder.sweepPreviews(
      [FIRST, '/films/Other.mkv'].map((inputPath) => ({
        inputPath,
        generation: 1,
        quality: 'high' as const,
      })),
    );

    expect(kept).toEqual([PARTS, '/films/Other.mkv']);
    expect(many).toHaveBeenCalledTimes(1);
    expect(one).not.toHaveBeenCalled();
  });

  it('asks for any other file as it was asked for', async () => {
    const fingerprint = vi.fn(() =>
      Promise.resolve({ framesPerSecond: 1, startSeconds: 0, hashes: [] }),
    );
    const transcoder = withJoinedInputs(aTranscoder({ fingerprint }), partsOf, partsOfMany);

    await transcoder.fingerprint({
      inputPath: '/films/Other.mkv',
      startSeconds: 0,
      durationSeconds: 60,
    });

    expect(fingerprint).toHaveBeenCalledWith({
      inputPath: '/films/Other.mkv',
      startSeconds: 0,
      durationSeconds: 60,
    });
  });

  it('leaves a transcoder that cannot read credits or pictures as it was', () => {
    const transcoder = withJoinedInputs(aTranscoder(), partsOf, partsOfMany);

    expect(transcoder.creditFrames).toBeUndefined();
    expect(transcoder.readPictureSubtitle).toBeUndefined();
  });
});
