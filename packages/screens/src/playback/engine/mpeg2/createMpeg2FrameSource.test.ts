import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMpeg2FrameSource } from '@ValenceScreens/playback/engine/mpeg2/createMpeg2FrameSource';
import { splitPictures } from '@ValenceScreens/playback/engine/mpeg2/splitPictures';
import { EncodedPacket } from 'mediabunny';

/**
 * A packet of one picture, of a coding type, at a time.
 *
 * @param type - 1 for I, 2 for P, 3 for B.
 * @param timestamp - Its time.
 * @param withHeader - Whether a sequence header leads it.
 * @returns The packet.
 */
const aPicture = (type: number, timestamp: number, withHeader = false): EncodedPacket =>
  new EncodedPacket(
    Uint8Array.from([
      ...(withHeader ? [0, 0, 1, 0xb3, 0x2d] : []),
      0,
      0,
      1,
      0x00,
      0x00,
      type << 3,
      0,
      0,
      1,
      0x01,
      0xaa,
    ]),
    type === 1 ? 'key' : 'delta',
    timestamp,
    0.04,
  );

const PACKETS = [
  aPicture(1, 0, true),
  aPicture(2, 0.08),
  aPicture(3, 0.04),
  aPicture(1, 0.12, true),
  aPicture(3, 0.1),
];

const decoded: Uint8Array[] = [];

const decoder = {
  decode: (stream: Uint8Array) => {
    decoded.push(stream);

    const count = splitPictures(stream).filter((unit) => unit.isPicture).length;

    return Promise.resolve({ frames: new Uint8Array(count * 6), count, width: 2, height: 2 });
  },
  reset: vi.fn(),
};

afterEach(() => {
  vi.unstubAllGlobals();
  decoded.length = 0;
});

describe('createMpeg2FrameSource', () => {
  it('decodes a group at a time, keeps its own frames in display order, and leans on the group before', async () => {
    vi.stubGlobal(
      'VideoFrame',
      class {
        timestamp: number;
        duration: number;
        close = vi.fn();
        constructor(_: Uint8Array, init: { timestamp: number; duration: number }) {
          this.timestamp = init.timestamp;
          this.duration = init.duration;
        }
      },
    );

    const source = createMpeg2FrameSource(
      {
        getKeyPacket: () => Promise.resolve(null),
        getFirstKeyPacket: () => Promise.resolve(PACKETS[0] ?? null),
        packets: async function* () {
          await Promise.resolve();
          yield* PACKETS;
        },
      },
      decoder,
      { matrix: 'smpte170m' },
    );
    const times: number[] = [];

    for await (const frame of source.samples(0)) {
      times.push(frame.timestamp);
    }

    expect(times).toEqual([0, 0.04, 0.08, 0.1, 0.12]);
    expect(
      splitPictures(decoded[1] ?? new Uint8Array()).filter((unit) => unit.isPicture),
    ).toHaveLength(4);
  });

  it('closes the frames it decoded but never handed over when a seek stops it', async () => {
    const closed = vi.fn();

    vi.stubGlobal(
      'VideoFrame',
      class {
        timestamp: number;
        duration: number;
        close = closed;
        constructor(_: Uint8Array, init: { timestamp: number; duration: number }) {
          this.timestamp = init.timestamp;
          this.duration = init.duration;
        }
      },
    );

    const source = createMpeg2FrameSource(
      {
        getKeyPacket: () => Promise.resolve(null),
        getFirstKeyPacket: () => Promise.resolve(PACKETS[0] ?? null),
        packets: async function* () {
          await Promise.resolve();
          yield* PACKETS;
        },
      },
      decoder,
      { matrix: 'smpte170m' },
    );

    for await (const frame of source.samples(0)) {
      frame.close();

      break;
    }

    expect(closed).toHaveBeenCalledTimes(3);
  });
});
