import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBitrateMeter } from '@ValenceScreens/playback/engine/createBitrateMeter';

/**
 * A track of a packet every tenth of a second, each so many bytes.
 *
 * @param bytes - Each packet's size.
 * @returns Where its packets are read from.
 */
const aTrack = (bytes: number) => {
  const packetAt = (timestamp: number) => ({ timestamp, byteLength: bytes });

  return {
    getPacket: (timestamp: number) => Promise.resolve(packetAt(Math.floor(timestamp * 10) / 10)),
    packets: async function* (first: { timestamp: number }) {
      await Promise.resolve();

      for (let at = first.timestamp; at < 100; at = Math.round((at + 0.1) * 10) / 10) {
        yield packetAt(at);
      }
    },
  };
};

afterEach(() => {
  vi.useRealTimers();
});

describe('createBitrateMeter', () => {
  it('reads the bitrate of the two seconds before the playhead, across every track', async () => {
    const meter = createBitrateMeter([aTrack(12_500), aTrack(1250)], () => 10);

    await vi.waitFor(() => {
      expect(meter.read()).toBe(1100);
    });
    meter.stop();
  });

  it('has nothing to say before it has measured', () => {
    const meter = createBitrateMeter([aTrack(100)], () => 0);

    expect(meter.read()).toBeNull();
    meter.stop();
  });
});
