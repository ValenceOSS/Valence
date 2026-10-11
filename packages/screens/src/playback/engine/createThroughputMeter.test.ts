import { describe, expect, it } from 'vitest';
import { createThroughputMeter } from '@ValenceScreens/playback/engine/createThroughputMeter';

/**
 * A server answering every request with so many bytes.
 *
 * @param bytes - How many.
 * @returns How requests are sent to it.
 */
const aServer =
  (bytes: number): typeof fetch =>
  () =>
    Promise.resolve(new Response(new Uint8Array(bytes)));

describe('createThroughputMeter', () => {
  it('estimates the connection from a response large enough to say something about it', async () => {
    const meter = createThroughputMeter(aServer(1024 * 1024));

    await (await meter.fetchFn('/film')).arrayBuffer();

    expect(meter.readKbps()).toBeGreaterThan(0);
  });

  it('says nothing from a small response', async () => {
    const meter = createThroughputMeter(aServer(1024));

    await (await meter.fetchFn('/film')).arrayBuffer();

    expect(meter.readKbps()).toBeNull();
  });

  it('hands the player every byte it was sent', async () => {
    const meter = createThroughputMeter(aServer(4096));

    expect((await (await meter.fetchFn('/film')).arrayBuffer()).byteLength).toBe(4096);
  });
});
