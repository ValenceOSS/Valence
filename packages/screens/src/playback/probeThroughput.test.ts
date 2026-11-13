import { afterEach, describe, expect, it, vi } from 'vitest';
import { probeThroughput } from '@ValenceScreens/playback/probeThroughput';

afterEach(() => {
  vi.useRealTimers();
});

describe('probeThroughput', () => {
  it('reads a slice of the file, uncached, and estimates the connection from it', async () => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(new Uint8Array(1024 * 1024))),
    );
    const probe = probeThroughput('/api/playback/media-1/file', fetcher);

    await vi.waitFor(() => {
      expect(probe.readKbps()).toBeGreaterThan(0);
    });

    const [address, init] = fetcher.mock.calls[0] ?? [];

    expect(address).toBe('/api/playback/media-1/file');
    expect(init?.cache).toBe('no-store');
    expect(new Headers(init?.headers).get('Range')).toBe('bytes=0-4194303');

    probe.stop();
  });

  it('reads again every few seconds until stopped', async () => {
    vi.useFakeTimers();

    const fetcher = vi.fn<typeof fetch>(() => Promise.resolve(new Response(new Uint8Array(16))));
    const probe = probeThroughput('/film', fetcher);

    await vi.advanceTimersByTimeAsync(4000);
    expect(fetcher).toHaveBeenCalledTimes(2);

    probe.stop();
    await vi.advanceTimersByTimeAsync(8000);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('says nothing when the file cannot be reached', async () => {
    const probe = probeThroughput('/film', () => Promise.reject(new Error('offline')));

    await Promise.resolve();

    expect(probe.readKbps()).toBeNull();
    probe.stop();
  });
});
